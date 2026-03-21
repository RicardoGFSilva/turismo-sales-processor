import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, TrendingUp } from 'lucide-react';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export default function MetricsDashboard() {
  const [, setLocation] = useLocation();
  const [daysBack, setDaysBack] = useState(30);

  // Queries
  const { data: agencyStats, isLoading: agencyLoading } = trpc.dashboard.getAgencySuccessRates.useQuery({
    daysBack,
  });

  const { data: processingTrends, isLoading: trendsLoading } = trpc.dashboard.getProcessingTrendsByAgency.useQuery({
    daysBack,
  });

  const isLoading = agencyLoading || trendsLoading;

  const handleDaysChange = (days: number) => {
    setDaysBack(days);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a1930] to-[#1a2a4a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffc107] mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const agencySuccessData = agencyStats?.agencyStats || [];
  
  // Transform processing trends for line chart
  const processingData: any[] = [];
  const trendsByDate: { [key: string]: { [key: string]: number } } = {};
  
  (processingTrends?.trends || []).forEach((trend: any) => {
    if (!trendsByDate[trend.date]) {
      trendsByDate[trend.date] = {};
    }
    trendsByDate[trend.date][trend.agencyName] = trend.count;
  });

  // Convert to array format for chart
  Object.entries(trendsByDate).forEach(([date, agencies]) => {
    processingData.push({
      date: new Date(date).toLocaleDateString('pt-BR'),
      ...agencies,
    });
  });

  // Get unique agencies for colors
  const uniqueAgencies = Array.from(new Set(processingTrends?.trends?.map((t: any) => t.agencyName) || []));

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
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-[#ffc107]" />
              Dashboard de Métricas
            </h1>
            <p className="text-gray-300 mt-1">Tendências de processamento e desempenho por agência</p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                variant={daysBack === days ? 'default' : 'outline'}
                onClick={() => handleDaysChange(days)}
                size="sm"
                className={daysBack === days ? 'bg-[#ffc107] text-[#0a1930] hover:bg-[#ffb300]' : 'border-white/20 text-white hover:bg-white/10'}
              >
                {days}d
              </Button>
            ))}
          </div>
        </div>

        {/* Agency Success Rates */}
        <Card className="bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Taxa de Sucesso por Agência</CardTitle>
            <CardDescription className="text-gray-300">Percentual de faturas válidas por agência</CardDescription>
          </CardHeader>
          <CardContent>
            {agencySuccessData.length > 0 ? (
              <div className="overflow-x-auto">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agencySuccessData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="agencyName" stroke="rgba(255,255,255,0.5)" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a1930', border: '1px solid rgba(255,255,255,0.1)' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="successRate" fill="#10b981" name="Taxa de Sucesso (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agency Stats Table */}
        <Card className="bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Detalhes por Agência</CardTitle>
            <CardDescription className="text-gray-300">Estatísticas completas de processamento</CardDescription>
          </CardHeader>
          <CardContent>
            {agencySuccessData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-gray-300">Agência</th>
                      <th className="text-right py-3 px-4 text-gray-300">Total</th>
                      <th className="text-right py-3 px-4 text-green-400">Válidas</th>
                      <th className="text-right py-3 px-4 text-yellow-400">Avisos</th>
                      <th className="text-right py-3 px-4 text-red-400">Erros</th>
                      <th className="text-right py-3 px-4 text-gray-400">Pendentes</th>
                      <th className="text-right py-3 px-4 text-[#00bcd4]">Taxa de Sucesso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agencySuccessData.map((agency: any, idx: number) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-white">{agency.agencyName}</td>
                        <td className="text-right py-3 px-4 text-gray-300">{agency.total}</td>
                        <td className="text-right py-3 px-4 text-green-400">{agency.valid}</td>
                        <td className="text-right py-3 px-4 text-yellow-400">{agency.warning}</td>
                        <td className="text-right py-3 px-4 text-red-400">{agency.error}</td>
                        <td className="text-right py-3 px-4 text-gray-400">{agency.pending}</td>
                        <td className="text-right py-3 px-4 font-semibold text-[#00bcd4]">{agency.successRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processing Trends by Agency */}
        <Card className="bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Tendência de Processamento por Agência</CardTitle>
            <CardDescription className="text-gray-300">Número de faturas processadas por dia e agência</CardDescription>
          </CardHeader>
          <CardContent>
            {processingData.length > 0 ? (
              <div className="overflow-x-auto">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={processingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a1930', border: '1px solid rgba(255,255,255,0.1)' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    {uniqueAgencies.map((agency: any, idx: number) => (
                      <Line
                        key={idx}
                        type="monotone"
                        dataKey={agency}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        name={agency}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-gray-400">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#1a2a4a] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total de Agências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{agencySuccessData.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a2a4a] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Taxa Média de Sucesso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {agencySuccessData.length > 0
                  ? Math.round(
                      agencySuccessData.reduce((sum: number, a: any) => sum + a.successRate, 0) /
                        agencySuccessData.length
                    )
                  : 0}
                %
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a2a4a] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total de Faturas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#00bcd4]">
                {agencySuccessData.reduce((sum: number, a: any) => sum + a.total, 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
