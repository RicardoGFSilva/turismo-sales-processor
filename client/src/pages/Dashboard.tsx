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
    try {
      const buffer = await uploadFile.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      uploadPDFMutation.mutate({
        file: uint8Array,
        filename: uploadFile.name,
      });
    } catch (error) {
      toast.error('Failed to read file');
    }
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
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt="Logo" className="h-12 w-12 rounded-full" />
            <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
          <div className="text-sm text-gray-600">
            Conectado como: <span className="text-gray-900 font-semibold">{user?.name}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Upload Section */}
        <Card className="mb-8 bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Upload className="h-5 w-5 text-amber-500" />
              Enviar Fatura em PDF
            </CardTitle>
            <CardDescription className="text-gray-600">Envie um arquivo PDF para extrair dados de vendas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-amber-500/50 transition">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-amber-500" />
                    <p className="text-gray-900">
                      {uploadFile ? uploadFile.name : 'Clique para selecionar ou arraste e solte um arquivo PDF'}
                    </p>
                    <p className="text-xs text-gray-500">Apenas arquivos PDF</p>
                  </div>
                </label>
              </div>
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || uploading || uploadPDFMutation.isPending}
                className="w-full bg-amber-500 text-white hover:bg-amber-600"
              >
                {uploading || uploadPDFMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Enviar e Processar'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Section */}
        <Card className="mb-8 bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Search className="h-5 w-5 text-blue-500" />
              Pesquisar Faturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Pesquise por nome do cliente ou CNPJ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
            />
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Faturas Processadas</CardTitle>
            <CardDescription className="text-gray-600">{invoices?.length || 0} faturas encontradas</CardDescription>
          </CardHeader>
          <CardContent>
            {listLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin h-8 w-8 text-amber-500" />
              </div>
            ) : invoices && invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 hover:bg-transparent">
                      <TableHead className="text-gray-900">ID da Fatura</TableHead>
                      <TableHead className="text-gray-900">Cliente</TableHead>
                      <TableHead className="text-gray-900">Agência</TableHead>
                      <TableHead className="text-gray-900 text-right">Valor Líquido</TableHead>
                      <TableHead className="text-gray-900">Status</TableHead>
                      <TableHead className="text-gray-900 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id} className="border-gray-200 hover:bg-gray-50">
                        <TableCell className="font-mono text-amber-600">{invoice.invoiceId}</TableCell>
                        <TableCell className="text-gray-900">{invoice.clientName}</TableCell>
                        <TableCell className="text-sm text-gray-600">{invoice.agencyName}</TableCell>
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
                            className="text-blue-600 hover:bg-gray-100"
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
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma fatura ainda. Envie um PDF para começar.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-2 text-gray-900">Contato</h3>
              <p className="text-sm text-gray-600">contato@masterprojectbusiness.com.br</p>
              <p className="text-sm text-gray-600">+55 (11) 98765-4321</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-900">Localização</h3>
              <p className="text-sm text-gray-600">São Paulo, SP - Brasil</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-900">Sistema</h3>
              <p className="text-sm text-gray-600">Tourism Sales Processor v1.0</p>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2025 Master Project Business. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
