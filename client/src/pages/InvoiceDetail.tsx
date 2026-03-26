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
  const { data: invoiceDetails, isLoading, refetch } = trpc.invoice.getInvoice.useQuery(
    { invoiceId: invoiceId || '' },
    { enabled: !!invoiceId } // Only run query if invoiceId exists
  );

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
    try {
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      uploadAttachmentMutation.mutate({
        invoiceId,
        file: uint8Array,
        filename: file.name,
        type,
      });
    } catch (error) {
      toast.error('Failed to read file');
    }
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
      <div className="min-h-screen bg-background bg-gradient-to-br from-[#050505] to-[#121212] text-white p-8">
        <div className="text-center">
          <p>Fatura não encontrada</p>
          <Button onClick={() => setLocation('/dashboard')} className="mt-4 bg-[#ffc107] text-[#050505] hover:bg-[#ffb300]">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-gradient-to-br from-[#050505] to-[#121212] text-white p-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="text-[#D4AF37] hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Fatura: {invoiceDetails.invoice?.invoiceId}</h1>
        </div>

        {/* Invoice Summary */}
        <Card className="card mb-8 bg-[#121212] border-[#D4AF37]/30">
          <CardHeader>
            <CardTitle className="text-white">Resumo da Fatura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400">Nome do Cliente</p>
                <p className="font-semibold text-white">{invoiceDetails.invoice?.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">CNPJ do Cliente</p>
                <p className="font-semibold font-mono text-white">{invoiceDetails.invoice?.clientCNPJ}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Agência</p>
                <p className="font-semibold text-white">{invoiceDetails.invoice?.agencyName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Valor Líquido Total</p>
                <p className="font-semibold text-[#ffc107]">
                  {formatCurrency(invoiceDetails.invoice?.totalNetAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Details Form */}
        <Card className="card mb-8 bg-[#121212] border-[#D4AF37]/30">
          <CardHeader>
            <CardTitle className="text-white">Detalhes do Cliente</CardTitle>
            <CardDescription className="text-gray-300">Adicione informações adicionais sobre o cliente final</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Nome do Cliente Final</label>
                <Input
                  placeholder="Digite o nome do cliente final"
                  value={finalClientName || invoiceDetails.details?.finalClientName || ''}
                  onChange={(e) => setFinalClientName(e.target.value)}
                  className="bg-[#050505] border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Observações</label>
                <Textarea
                  placeholder="Adicione observações ou anotações"
                  value={notes || invoiceDetails.details?.notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-[#050505] border-white/20 text-white placeholder:text-gray-500"
                  rows={4}
                />
              </div>
              <Button
                onClick={handleUpdateDetails}
                disabled={updateDetailsMutation.isPending}
                className="w-full bg-[#ffc107] text-[#050505] hover:bg-[#ffb300] font-semibold"
              >
                {updateDetailsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#050505]" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Detalhes'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card className="card mb-8 bg-[#121212] border-[#D4AF37]/30">
          <CardHeader>
            <CardTitle className="text-white">Anexos</CardTitle>
            <CardDescription className="text-gray-300">Envie vouchers e bilhetes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Voucher Upload */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white">Voucher</h3>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-[#D4AF37]/50 transition">
                  <input
                    type="file"
                    onChange={(e) => setVoucherFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="voucher-upload"
                  />
                  <label htmlFor="voucher-upload" className="cursor-pointer">
                    <Upload className="h-6 w-6 mx-auto text-[#D4AF37] mb-2" />
                    <p className="text-sm text-white">
                      {voucherFile ? voucherFile.name : 'Clique para selecionar arquivo'}
                    </p>
                  </label>
                </div>
                <Button
                  onClick={() => handleUploadAttachment(voucherFile, 'voucher')}
                  disabled={!voucherFile || uploading || uploadAttachmentMutation.isPending}
                  className="w-full bg-[#D4AF37] hover:shadow-lg hover:scale-105 active:scale-95 text-[#050505] hover:bg-[#F1D476] font-semibold"
                >
                  {uploading || uploadAttachmentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#050505]" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Voucher'
                  )}
                </Button>
                {invoiceDetails.details?.voucherPath && (
                  <p className="text-xs text-green-400">✓ Voucher enviado</p>
                )}
              </div>

              {/* Billet Upload */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white">Bilhete</h3>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-[#D4AF37]/50 transition">
                  <input
                    type="file"
                    onChange={(e) => setBilletFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="billet-upload"
                  />
                  <label htmlFor="billet-upload" className="cursor-pointer">
                    <Upload className="h-6 w-6 mx-auto text-[#D4AF37] mb-2" />
                    <p className="text-sm text-white">
                      {billetFile ? billetFile.name : 'Clique para selecionar arquivo'}
                    </p>
                  </label>
                </div>
                <Button
                  onClick={() => handleUploadAttachment(billetFile, 'billet')}
                  disabled={!billetFile || uploading || uploadAttachmentMutation.isPending}
                  className="w-full bg-[#D4AF37] hover:shadow-lg hover:scale-105 active:scale-95 text-[#050505] hover:bg-[#F1D476] font-semibold"
                >
                  {uploading || uploadAttachmentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#050505]" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Bilhete'
                  )}
                </Button>
                {invoiceDetails.details?.billetPath && (
                  <p className="text-xs text-green-400">✓ Bilhete enviado</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Airline Operations */}
        {invoiceDetails.operations && invoiceDetails.operations.length > 0 && (
          <Card className="card mb-8 bg-[#121212] border-[#D4AF37]/30">
            <CardHeader>
              <CardTitle className="text-white">Operações Aéreas ({invoiceDetails.operations.length})</CardTitle>
              <CardDescription className="text-gray-300">Detalhes das operações por companhia aérea</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#D4AF37]/30">
                      <TableHead className="text-white">Passageiro</TableHead>
                      <TableHead className="text-white">Rota</TableHead>
                      <TableHead className="text-white">Companhia</TableHead>
                      <TableHead className="text-white">Emissão</TableHead>
                      <TableHead className="text-white">TKT/LOC</TableHead>
                      <TableHead className="text-white text-right">Tarifa</TableHead>
                      <TableHead className="text-white text-right">Taxa</TableHead>
                      <TableHead className="text-white text-right">Líquido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceDetails.operations.map((op, idx) => (
                      <TableRow key={idx} className="border-[#D4AF37]/30 hover:bg-white/5">
                        <TableCell className="text-white">{op.passengerName}</TableCell>
                        <TableCell className="text-white">{op.route}</TableCell>
                        <TableCell className="text-white font-semibold text-[#D4AF37]">{op.airline}</TableCell>
                        <TableCell className="text-white">{op.emissionDate}</TableCell>
                        <TableCell className="text-white font-mono text-sm">{op.ticketNumber}</TableCell>
                        <TableCell className="text-right text-white">{formatCurrency(op.tariff)}</TableCell>
                        <TableCell className="text-right text-white">{formatCurrency(op.tax)}</TableCell>
                        <TableCell className="text-right font-semibold text-white">
                          {formatCurrency(op.netAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tickets List */}
        <Card className="card bg-[#121212] border-[#D4AF37]/30">
          <CardHeader>
            <CardTitle className="text-white">Bilhetes ({invoiceDetails.tickets?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#D4AF37]/30">
                    <TableHead className="text-white">Passageiro</TableHead>
                    <TableHead className="text-white">Companhia Aérea</TableHead>
                    <TableHead className="text-white">Rota</TableHead>
                    <TableHead className="text-white text-right">Tarifa</TableHead>
                    <TableHead className="text-white text-right">Imposto</TableHead>
                    <TableHead className="text-white text-right">Valor Líquido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceDetails.tickets?.map((ticket) => (
                    <TableRow key={ticket.id} className="border-[#D4AF37]/30 hover:bg-white/5">
                      <TableCell className="text-white">{ticket.passengerName}</TableCell>
                      <TableCell className="text-white">{ticket.airline}</TableCell>
                      <TableCell className="text-white">{ticket.route}</TableCell>
                      <TableCell className="text-right text-white">{formatCurrency(ticket.tariff)}</TableCell>
                      <TableCell className="text-right text-white">{formatCurrency(ticket.tax)}</TableCell>
                      <TableCell className="text-right font-semibold text-white">
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
