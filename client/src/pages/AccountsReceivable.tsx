import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function AccountsReceivable() {
  const [, setLocation] = useLocation();
  const [daysBack, setDaysBack] = useState(30);

  // Queries
  const { data: arData, isLoading: arLoading } = trpc.financial.getAccountsReceivable.useQuery({
    daysBack,
  });

  const { data: arSummary, isLoading: summaryLoading } = trpc.financial.getARSummary.useQuery();

  const isLoading = arLoading || summaryLoading;

  const formatCurrency = (cents: number | null | undefined) => {
    if (!cents) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-400 bg-green-400/10';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'overdue':
        return 'text-red-400 bg-red-400/10';
      case 'cancelled':
        return 'text-gray-400 bg-gray-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Recebido';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Vencido';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a1930] to-[#1a2a4a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffc107] mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando contas a receber...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1930] to-[#1a2a4a] text-white p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <Button
              variant="ghost"
              onClick={() => setLocation('/dashboard')}
              className="text-[#00bcd4] hover:bg-white/10 mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-white">Contas a Receber</h1>
            <p className="text-gray-300 mt-1">Gestão de pagamentos de clientes e agências</p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                variant={daysBack === days ? 'default' : 'outline'}
                onClick={() => setDaysBack(days)}
                size="sm"
                className={daysBack === days ? 'bg-[#ffc107] text-[#0a1930] hover:bg-[#ffb300]' : 'border-white/20 text-white hover:bg-white/10'}
              >
                {days}d
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#1a2a4a] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-400" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{arSummary?.pendingCount || 0}</div>
              <p className="text-xs text-gray-400 mt-1">{formatCurrency(arSummary?.totalPending)}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a2a4a] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                Vencidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{arSummary?.overdueCount || 0}</div>
              <p className="text-xs text-gray-400 mt-1">{formatCurrency(arSummary?.totalOverdue)}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a2a4a] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Recebidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{arSummary?.paidCount || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a2a4a] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#00bcd4]">{arSummary?.totalRecords || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Receivable Table */}
        <Card className="bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Registros de Contas a Receber</CardTitle>
            <CardDescription className="text-gray-300">Últimos {daysBack} dias</CardDescription>
          </CardHeader>
          <CardContent>
            {arData && arData.records && arData.records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-gray-300">Fatura</th>
                      <th className="text-left py-3 px-4 text-gray-300">Agência</th>
                      <th className="text-left py-3 px-4 text-gray-300">CNPJ</th>
                      <th className="text-right py-3 px-4 text-gray-300">Valor</th>
                      <th className="text-center py-3 px-4 text-gray-300">Vencimento</th>
                      <th className="text-center py-3 px-4 text-gray-300">Dias</th>
                      <th className="text-center py-3 px-4 text-gray-300">Status</th>
                      <th className="text-center py-3 px-4 text-gray-300">Recebimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arData.records.map((record: any, idx: number) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-white font-mono text-xs">{record.invoiceId}</td>
                        <td className="py-3 px-4 text-gray-300">{record.agencyName}</td>
                        <td className="py-3 px-4 text-gray-400 font-mono text-xs">{record.agencyCNPJ}</td>
                        <td className="text-right py-3 px-4 text-white font-semibold">{formatCurrency(record.amount)}</td>
                        <td className="text-center py-3 px-4 text-gray-300">{formatDate(record.dueDate)}</td>
                        <td className="text-center py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            record.daysUntilDue < 0 ? 'bg-red-400/20 text-red-400' :
                            record.daysUntilDue < 7 ? 'bg-yellow-400/20 text-yellow-400' :
                            'bg-green-400/20 text-green-400'
                          }`}>
                            {record.daysUntilDue}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(record.status)}`}>
                            {getStatusLabel(record.status)}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4 text-gray-300">{formatDate(record.paymentDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Nenhum registro de contas a receber encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
