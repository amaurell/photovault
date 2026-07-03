import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, Download, Trash2 } from 'lucide-react';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatória'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter maiúscula')
    .regex(/[a-z]/, 'Deve conter minúscula')
    .regex(/[0-9]/, 'Deve conter número'),
});

type PasswordForm = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  async function onChangePassword(data: PasswordForm) {
    setError('');
    setMessage('');
    try {
      await api.put('/auth/password', data);
      setMessage('Senha alterada com sucesso');
      reset();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleExport() {
    try {
      const data = await api.get<any>('/lgpd/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'photovault-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua conta</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" /> Informações da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-xs">Nome</Label>
              <p className="text-sm">{user?.name}</p>
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <p className="text-sm">{user?.email}</p>
            </div>
            <div>
              <Label className="text-xs">Função</Label>
              <p className="text-sm capitalize">{user?.role}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4" /> LGPD - Seus Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Exporte seus dados ou exclua sua conta permanentemente.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-1 h-3 w-3" /> Exportar
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-1 h-3 w-3" /> Excluir Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" /> Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onChangePassword)} className="space-y-3">
            {message && <div className="rounded-md bg-green-500/10 p-2 text-xs text-green-500">{message}</div>}
            {error && <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{error}</div>}
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword" className="text-xs">Senha Atual</Label>
              <Input id="currentPassword" type="password" className="h-9" {...register('currentPassword')} />
              {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs">Nova Senha</Label>
              <Input id="newPassword" type="password" className="h-9" {...register('newPassword')} />
              {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
            </div>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
