import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Upload } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface InvoiceDetailProps {
  invoiceId: string;
}

export default function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [finalClientName, setFinalClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [billetFile, setBilletFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Queries
  const { data: invoiceDetails, isLoading, refetch } = trpc.invoice.getInvoice.useQuery({
    invoiceId,
  });

  // Mutations
  const updateDetailsMutation = trpc.invoice.updateDetails.useMutation({
    onSuccess: () => {
      toast.success('Invoice details updated successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const uploadAttachmentMutation = trpc.invoice.uploadAttachment.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.type} uploaded successfully`);
      setVoucherFile(null);
      setBilletFile(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleUpdateDetails = async () => {
    if (!finalClientName.trim()) {
      toast.error('Please enter a client name');
      return;
    }

    updateDetailsMutation.mutate({
      invoiceId,
      finalClientName,
      notes,
    });
  };

  const handleUploadAttachment = async (file: File | null, type: 'voucher' | 'billet') => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    const buffer = await file.arrayBuffer();
    uploadAttachmentMutation.mutate({
      invoiceId,
      file: new Uint8Array(buffer) as any,
      filename: file.name,
      type,
    });
    setUploading(false);
  };

  const formatCurrency = (cents: number | null | undefined) => {
    if (!cents) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!invoiceDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1930] to-[#1a2a4a] text-white p-8">
        <div className="text-center">
          <p>Invoice not found</p>
          <Button onClick={() => setLocation('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1930] to-[#1a2a4a] text-white p-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="text-[#00bcd4] hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Invoice: {invoiceDetails.invoice?.invoiceId}</h1>
        </div>

        {/* Invoice Summary */}
        <Card className="mb-8 bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400">Client Name</p>
                <p className="font-semibold">{invoiceDetails.invoice?.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Client CNPJ</p>
                <p className="font-semibold font-mono">{invoiceDetails.invoice?.clientCNPJ}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Agency</p>
                <p className="font-semibold">{invoiceDetails.invoice?.agencyName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Net Amount</p>
                <p className="font-semibold text-[#ffc107]">
                  {formatCurrency(invoiceDetails.invoice?.totalNetAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Details Form */}
        <Card className="mb-8 bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
            <CardDescription>Add additional information about the final client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Final Client Name</label>
                <Input
                  placeholder="Enter final client name"
                  value={finalClientName || invoiceDetails.details?.finalClientName || ''}
                  onChange={(e) => setFinalClientName(e.target.value)}
                  className="bg-[#0a1930] border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <Textarea
                  placeholder="Add any notes or observations"
                  value={notes || invoiceDetails.details?.notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-[#0a1930] border-white/20 text-white placeholder:text-gray-500"
                  rows={4}
                />
              </div>
              <Button
                onClick={handleUpdateDetails}
                disabled={updateDetailsMutation.isPending}
                className="w-full bg-[#ffc107] text-[#0a1930] hover:bg-[#ffb300]"
              >
                {updateDetailsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Details'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card className="mb-8 bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
            <CardDescription>Upload vouchers and billets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Voucher Upload */}
              <div className="space-y-4">
                <h3 className="font-semibold">Voucher</h3>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-[#00bcd4]/50 transition">
                  <input
                    type="file"
                    onChange={(e) => setVoucherFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="voucher-upload"
                  />
                  <label htmlFor="voucher-upload" className="cursor-pointer">
                    <Upload className="h-6 w-6 mx-auto text-[#00bcd4] mb-2" />
                    <p className="text-sm">
                      {voucherFile ? voucherFile.name : 'Click to select file'}
                    </p>
                  </label>
                </div>
                <Button
                  onClick={() => handleUploadAttachment(voucherFile, 'voucher')}
                  disabled={!voucherFile || uploading || uploadAttachmentMutation.isPending}
                  className="w-full bg-[#00bcd4] text-[#0a1930] hover:bg-[#00a8b8]"
                >
                  {uploading || uploadAttachmentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Voucher'
                  )}
                </Button>
                {invoiceDetails.details?.voucherPath && (
                  <p className="text-xs text-green-400">✓ Voucher uploaded</p>
                )}
              </div>

              {/* Billet Upload */}
              <div className="space-y-4">
                <h3 className="font-semibold">Billet</h3>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-[#00bcd4]/50 transition">
                  <input
                    type="file"
                    onChange={(e) => setBilletFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="billet-upload"
                  />
                  <label htmlFor="billet-upload" className="cursor-pointer">
                    <Upload className="h-6 w-6 mx-auto text-[#00bcd4] mb-2" />
                    <p className="text-sm">
                      {billetFile ? billetFile.name : 'Click to select file'}
                    </p>
                  </label>
                </div>
                <Button
                  onClick={() => handleUploadAttachment(billetFile, 'billet')}
                  disabled={!billetFile || uploading || uploadAttachmentMutation.isPending}
                  className="w-full bg-[#00bcd4] text-[#0a1930] hover:bg-[#00a8b8]"
                >
                  {uploading || uploadAttachmentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Billet'
                  )}
                </Button>
                {invoiceDetails.details?.billetPath && (
                  <p className="text-xs text-green-400">✓ Billet uploaded</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card className="bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle>Tickets ({invoiceDetails.tickets?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white">Passenger</TableHead>
                    <TableHead className="text-white">Airline</TableHead>
                    <TableHead className="text-white">Route</TableHead>
                    <TableHead className="text-white text-right">Tariff</TableHead>
                    <TableHead className="text-white text-right">Tax</TableHead>
                    <TableHead className="text-white text-right">Net Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceDetails.tickets?.map((ticket) => (
                    <TableRow key={ticket.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>{ticket.passengerName}</TableCell>
                      <TableCell>{ticket.airline}</TableCell>
                      <TableCell>{ticket.route}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ticket.tariff)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ticket.tax)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(ticket.netAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
