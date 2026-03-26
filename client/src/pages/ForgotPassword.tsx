import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { APP_LOGO, APP_TITLE } from '@/const';

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation();
  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const result = await requestResetMutation.mutateAsync({ email });
      setSuccess(result.message);
      setEmail('');
      // In a real app, user would receive email with token
      // For now, show token input field
      setTimeout(() => setStep('reset'), 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar recuperação de senha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não correspondem');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPasswordMutation.mutateAsync({
        token,
        newPassword,
      });
      setSuccess(result.message);
      setTimeout(() => setLocation('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050505] to-[#121212] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#121212] border-[#D4AF37]/30 border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={APP_LOGO} alt="Logo" className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl text-[#D4AF37] font-cinzel">Recuperar Senha</CardTitle>
          <CardDescription className="text-[#D4AF37]/70">
            {step === 'email' ? 'Digite seu email para receber um link de recuperação' : 'Digite o token e sua nova senha'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Success Message */}
          {success && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <p className="text-sm text-green-300">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
              <label className="block text-sm font-medium text-[#D4AF37] mb-2">Email</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-[#050505] border-[#D4AF37]/30 text-white placeholder:text-gray-600"
                required
              />
              </div>

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-[#D4AF37] text-[#050505] hover:bg-[#F1D476] font-semibold transition-all"
            >
              {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
              <label className="block text-sm font-medium text-[#D4AF37] mb-2">Token de Recuperação</label>
              <Input
                type="text"
                placeholder="Cole o token recebido por email"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isLoading}
                className="bg-[#050505] border-[#D4AF37]/30 text-white placeholder:text-gray-600"
                required
              />
              </div>

              <div>
              <label className="block text-sm font-medium text-[#D4AF37] mb-2">Nova Senha</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                className="bg-[#050505] border-[#D4AF37]/30 text-white placeholder:text-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#D4AF37] mb-2">Confirmar Senha</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="bg-[#050505] border-[#D4AF37]/30 text-white placeholder:text-gray-600"
                required
              />
              </div>

            <Button
              type="submit"
              disabled={isLoading || !token || !newPassword || !confirmPassword}
              className="w-full bg-[#D4AF37] text-[#050505] hover:bg-[#F1D476] font-semibold transition-all"
            >
              {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
            </Button>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setLocation('/login')}
              className="flex items-center justify-center gap-2 text-sm text-[#D4AF37] hover:text-[#F1D476] underline mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
