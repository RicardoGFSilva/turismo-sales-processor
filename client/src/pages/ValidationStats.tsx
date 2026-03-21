import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle, AlertTriangle, Clock, ArrowLeft } from 'lucide-react';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export default function ValidationStats() {
  const [, setLocation] = useLocation();
  const [daysBack, setDaysBack] = useState(30);

  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getValidationStats.useQuery({
    daysBack,
  });

  const { data: trends, isLoading: trendsLoading } = trpc.dashboard.getValidationTrends.useQuery({
    daysBack,
  });

  const isLoading = statsLoading || trendsLoading;

  const handleDaysChange = (days: number) => {
    setDaysBack(days);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1930] to-[#1a2a4a] text-white p-8">
      <div className="container mx-auto max-w-6xl space-y-8">
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
          <h1 className="text-3xl font-bold text-white">Estatísticas de Validação</h1>
          <p className="text-gray-300 mt-1">Análise de processamento de faturas</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              variant={daysBack === days ? 'default' : 'outline'}
              onClick={() => handleDaysChange(days)}
              size="sm"
            >
              {days}d
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a2a4a] border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total de Faturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{stats?.totalInvoices || 0}</div>
              <Clock className="h-8 w-8 text-[#00bcd4]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2a4a] border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Taxa de Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-400">{stats?.successRate || 0}%</div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2a4a] border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Taxa de Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-red-400">{stats?.errorRate || 0}%</div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2a4a] border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Avisos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-yellow-400">{(stats as any)?.warningCount || 0}</div>
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Distribuição por Status</CardTitle>
            <CardDescription className="text-gray-300">Faturas processadas por status de validação</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.invoicesByStatus && stats.invoicesByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.invoicesByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {stats.invoicesByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation Logs by Severity */}
        <Card className="bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Logs de Validação por Severidade</CardTitle>
            <CardDescription className="text-gray-300">Distribuição de erros, avisos e informações</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.validationLogsByType && stats.validationLogsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.validationLogsByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="severity" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 gap-6">
        {/* Daily Invoices */}
        <Card className="bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Tendência de Faturas Diárias</CardTitle>
            <CardDescription className="text-gray-300">Número de faturas processadas por dia</CardDescription>
          </CardHeader>
          <CardContent>
            {trends?.dailyInvoices && trends.dailyInvoices.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends.dailyInvoices}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#10b981" name="Faturas" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Errors */}
        <Card className="bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Tendência de Erros Diários</CardTitle>
            <CardDescription className="text-gray-300">Número de erros de validação por dia</CardDescription>
          </CardHeader>
          <CardContent>
            {trends?.dailyErrors && trends.dailyErrors.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends.dailyErrors}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#ef4444" name="Erros" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Common Errors and Fields with Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Common Errors */}
        <Card className="bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Erros Mais Comuns</CardTitle>
            <CardDescription className="text-gray-300">Top 10 erros de validação</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.commonErrors && stats.commonErrors.length > 0 ? (
              <div className="space-y-3">
                {stats.commonErrors.map((error, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{error.errorCode}</p>
                      <p className="text-xs text-muted-foreground">{error.errorMessage}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{error.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fields with Most Errors */}
        <Card className="bg-[#1a2a4a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Campos com Mais Erros</CardTitle>
            <CardDescription className="text-gray-300">Campos que mais causam erros de validação</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.errorsByField && stats.errorsByField.length > 0 ? (
              <div className="space-y-3">
                {stats.errorsByField.map((field, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <p className="font-medium text-sm">{field.fieldName || 'Desconhecido'}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-background rounded h-2">
                        <div
                          className="bg-red-500 h-2 rounded"
                          style={{
                            width: `${Math.min(100, (field.count / (stats.errorsByField[0]?.count || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="font-bold text-sm w-8 text-right">{field.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
