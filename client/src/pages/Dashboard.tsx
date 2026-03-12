import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, Search, Eye, Trash2, BarChart3 } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a1930] to-[#1a2a4a] text-white">
      {/* Header */}
      <header className="border-b border-[#ffc107]/20 bg-[#0a1930] p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt="Logo" className="h-10 w-10" />
            <h1 className="text-xl font-bold text-white">Sistema de Processamento de Vendas de Turismo</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation('/validation-stats')}
              className="flex items-center gap-2 bg-[#00bcd4] text-[#0a1930] hover:bg-[#00a8b8]"
            >
              <BarChart3 className="h-4 w-4" />
              Estatísticas
            </Button>
            <div className="text-sm text-gray-300">
              Conectado como: <span className="font-semibold text-[#00bcd4]">{user?.name || 'Usuário'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Upload Section */}
        <Card className="mb-8 bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Upload className="h-5 w-5 text-[#ffc107]" />
              Enviar Fatura em PDF
            </CardTitle>
            <CardDescription className="text-gray-300">Envie um arquivo PDF para extrair dados de vendas</CardDescription>
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
                      {uploadFile ? uploadFile.name : 'Clique para selecionar ou arraste e solte um arquivo PDF'}
                    </p>
                    <p className="text-xs text-gray-400">Apenas arquivos PDF</p>
                  </div>
                </label>
              </div>
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || uploading || uploadPDFMutation.isPending}
                className="w-full bg-[#ffc107] text-[#0a1930] hover:bg-[#ffb300] font-semibold"
              >
                {uploading || uploadPDFMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#0a1930]" />
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
        <Card className="mb-8 bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Search className="h-5 w-5 text-[#00bcd4]" />
              Pesquisar Faturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Pesquise por nome do cliente ou CNPJ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0a1930] border-white/20 text-white placeholder:text-gray-500"
            />
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card className="bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Faturas Processadas</CardTitle>
            <CardDescription className="text-gray-300">{invoices?.length || 0} faturas encontradas</CardDescription>
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
                      <TableHead className="text-white">ID da Fatura</TableHead>
                      <TableHead className="text-white">Cliente</TableHead>
                      <TableHead className="text-white">Agência</TableHead>
                      <TableHead className="text-white text-right">Valor Líquido</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice: any) => (
                      <TableRow key={invoice.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="font-mono text-[#ffc107]">{invoice.invoiceId}</TableCell>
                        <TableCell className="text-white">{invoice.clientName}</TableCell>
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
                <p>Nenhuma fatura ainda. Envie um PDF para começar.</p>
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
              <h3 className="font-semibold mb-2 text-white">Contato</h3>
              <p className="text-sm text-gray-400">contato@masterprojectbusiness.com.br</p>
              <p className="text-sm text-gray-400">+55 (11) 98765-4321</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-white">Localização</h3>
              <p className="text-sm text-gray-400">São Paulo, SP - Brasil</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-white">Sistema</h3>
              <p className="text-sm text-gray-400">Tourism Sales Processor v1.0</p>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2025 Master Project Business. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
