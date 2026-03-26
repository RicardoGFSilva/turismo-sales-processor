import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { APP_LOGO, APP_TITLE } from '@/const';

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await loginMutation.mutateAsync({ email, password });
      
      // Store user info and redirect to dashboard
      localStorage.setItem('user', JSON.stringify(result));
      setLocation('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Falha ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in bg-gradient-to-br from-[#050505] to-[#121212] flex items-center justify-center p-4">
      <Card className="card w-full animate-scale-in max-w-md bg-[#121212] border-[#D4AF37]/30 border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={APP_LOGO} alt="Logo" className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl text-[#D4AF37] font-cinzel">{APP_TITLE}</CardTitle>
          <CardDescription className="text-[#D4AF37]/70">Faça login para continuar</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Email Input */}
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

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-[#D4AF37] mb-2">Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-[#050505] border-[#D4AF37]/30 text-white placeholder:text-gray-600 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/70 hover:text-[#D4AF37]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-[#D4AF37] hover:shadow-lg hover:scale-105 active:scale-95 text-[#050505] hover:bg-[#F1D476] font-semibold transition-all"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setLocation('/forgot-password')}
                className="text-sm text-[#D4AF37] hover:text-[#F1D476] transition-colors hover:text-[#F1D476] underline"
              >
                Esqueceu a senha?
              </button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg">
            <p className="text-xs text-[#D4AF37] font-semibold mb-2">Credenciais de Demonstração:</p>
            <p className="text-xs text-[#D4AF37]/80">Admin: admin@example.com / senha123</p>
            <p className="text-xs text-[#D4AF37]/80">Usuário: user@example.com / senha123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
