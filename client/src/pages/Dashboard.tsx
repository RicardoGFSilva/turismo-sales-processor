import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, Search, Eye, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { toast } from 'sonner';
import { APP_LOGO, APP_TITLE } from '@/const';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  // Queries
  const { data: invoices, isLoading: listLoading, refetch } = trpc.invoice.listInvoices.useQuery({
    limit: 50,
    offset: 0,
  });

  const { data: invoiceDetails, isLoading: detailsLoading } = trpc.invoice.getInvoice.useQuery(
    { invoiceId: selectedInvoice! },
    { enabled: !!selectedInvoice }
  );

  // Mutations
  const uploadPDFMutation = trpc.invoice.uploadPDF.useMutation({
    onSuccess: (data) => {
      toast.success(`Invoice ${data.invoice.invoiceId} processed successfully with ${data.ticketCount} tickets!`);
      setUploadFile(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const deleteInvoiceMutation = trpc.invoice.deleteInvoice.useMutation({
    onSuccess: () => {
      toast.success('Invoice deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    const buffer = await uploadFile.arrayBuffer();
    uploadPDFMutation.mutate({
      file: new Uint8Array(buffer) as any,
      filename: uploadFile.name,
    });
    setUploading(false);
  };

  const handleDelete = (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoiceMutation.mutate({ invoiceId });
    }
  };

  const formatCurrency = (cents: number | null | undefined) => {
    if (!cents) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1930] to-[#1a2a4a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a1930]/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt="Logo" className="h-12 w-12 rounded-full" />
            <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
          </div>
          <div className="text-sm text-gray-400">
            Logged in as: <span className="text-white font-semibold">{user?.name}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Upload Section */}
        <Card className="mb-8 bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#ffc107]" />
              Upload PDF Invoice
            </CardTitle>
            <CardDescription>Upload a PDF file to extract sales data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-[#ffc107]/50 transition">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-[#ffc107]" />
                    <p className="text-white">
                      {uploadFile ? uploadFile.name : 'Click to select or drag and drop a PDF file'}
                    </p>
                    <p className="text-xs text-gray-400">PDF files only</p>
                  </div>
                </label>
              </div>
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || uploading || uploadPDFMutation.isPending}
                className="w-full bg-[#ffc107] text-[#0a1930] hover:bg-[#ffb300]"
              >
                {uploading || uploadPDFMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Upload and Process'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Section */}
        <Card className="mb-8 bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-[#00bcd4]" />
              Search Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by client name or CNPJ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0a1930] border-white/20 text-white placeholder:text-gray-500"
            />
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card className="bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle>Processed Invoices</CardTitle>
            <CardDescription>{invoices?.length || 0} invoices found</CardDescription>
          </CardHeader>
          <CardContent>
            {listLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin h-8 w-8 text-[#ffc107]" />
              </div>
            ) : invoices && invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white">Invoice ID</TableHead>
                      <TableHead className="text-white">Client</TableHead>
                      <TableHead className="text-white">Agency</TableHead>
                      <TableHead className="text-white text-right">Net Amount</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="font-mono text-[#ffc107]">{invoice.invoiceId}</TableCell>
                        <TableCell>{invoice.clientName}</TableCell>
                        <TableCell className="text-sm text-gray-400">{invoice.agencyName}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(invoice.totalNetAmount)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              invoice.validationStatus === 'valid'
                                ? 'bg-green-500/20 text-green-300'
                                : invoice.validationStatus === 'warning'
                                  ? 'bg-yellow-500/20 text-yellow-300'
                                  : invoice.validationStatus === 'error'
                                    ? 'bg-red-500/20 text-red-300'
                                    : 'bg-gray-500/20 text-gray-300'
                            }`}
                          >
                            {invoice.validationStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/invoice/${invoice.invoiceId}`)}
                            className="text-[#00bcd4] hover:bg-white/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(invoice.invoiceId)}
                            className="text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No invoices yet. Upload a PDF to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0a1930]/80 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Contact</h3>
              <p className="text-sm text-gray-400">contato@masterprojectbusiness.com.br</p>
              <p className="text-sm text-gray-400">+55 (11) 98765-4321</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Location</h3>
              <p className="text-sm text-gray-400">São Paulo, SP - Brasil</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">System</h3>
              <p className="text-sm text-gray-400">Tourism Sales Processor v1.0</p>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2025 Master Project Business. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
