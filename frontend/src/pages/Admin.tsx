import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Users, Clock, CheckCircle2, XCircle, Trash2, Key } from 'lucide-react';
import { formatDate } from '@/lib/utils';

type Tab = 'users' | 'schedule';

export function AdminPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('users');
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; userId: string; userName: string }>({ open: false, userId: '', userName: '' });
  const [newPassword, setNewPassword] = useState('');
  const [schedule, setSchedule] = useState({ startTime: '00:00', endTime: '00:00', enabled: false });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<any[]>('/admin/users'),
  });

  const { data: accessSchedule } = useQuery({
    queryKey: ['admin-schedule'],
    queryFn: () => api.get<any>('/admin/schedule'),
  });

  useEffect(() => {
    if (accessSchedule) {
      setSchedule({ startTime: accessSchedule.startTime, endTime: accessSchedule.endTime, enabled: accessSchedule.enabled });
    }
  }, [accessSchedule]);

  const toggleBlockMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`/admin/users/${userId}/toggle-block`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/admin/users/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      api.patch(`/admin/users/${userId}/reset-password`, { password }),
    onSuccess: () => {
      setPasswordDialog({ open: false, userId: '', userName: '' });
      setNewPassword('');
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: (data: { startTime: string; endTime: string; enabled: boolean }) =>
      api.put('/admin/schedule', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-schedule'] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Shield className="h-7 w-7" /> Administração
        </h1>
        <p className="text-muted-foreground">Gerenciar usuários e regras de acesso</p>
      </div>

      <div className="flex gap-2 border-b border-border pb-2">
        <Button
          variant={tab === 'users' ? 'default' : 'ghost'}
          onClick={() => setTab('users')}
          className="gap-2"
        >
          <Users className="h-4 w-4" /> Usuários
        </Button>
        <Button
          variant={tab === 'schedule' ? 'default' : 'ghost'}
          onClick={() => setTab('schedule')}
          className="gap-2"
        >
          <Clock className="h-4 w-4" /> Horário de Bloqueio
        </Button>
      </div>

      {tab === 'users' && (
        <div className="space-y-4">
          {usersLoading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          ) : (
            users?.map((u: any) => (
              <Card key={u.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <button className="hover:text-primary hover:underline" onClick={() => navigate(`/albums?userId=${u.id}`)}>
                        {u._count?.albums || 0} álbuns
                      </button>
                      <button className="hover:text-primary hover:underline" onClick={() => navigate(`/photos?userId=${u.id}`)}>
                        {u._count?.photos || 0} fotos
                      </button>
                      <span>{u.role?.name}</span>
                      <span>Cadastro: {u.createdAt ? formatDate(u.createdAt) : '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.active ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    {u.role?.slug !== 'admin' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleBlockMutation.mutate(u.id)}
                        >
                          {u.active ? 'Bloquear' : 'Desbloquear'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => setPasswordDialog({ open: true, userId: u.id, userName: u.name })}
                        >
                          <Key className="h-3 w-3" /> Senha
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => { if (confirm(`Excluir usuário "${u.name}" e todos os seus dados?`)) deleteUserMutation.mutate(u.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'schedule' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Regra de Bloqueio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Quando ativo, o aplicativo ficará bloqueado no período definido abaixo. Usuários verão um modal informando o bloqueio.
            </p>
            <div className="flex items-center gap-2">
              <Label htmlFor="enabled">Bloqueio ativo</Label>
              <input
                id="enabled"
                type="checkbox"
                checked={schedule.enabled}
                onChange={(e) => setSchedule((s) => ({ ...s, enabled: e.target.checked }))}
                className="rounded border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Bloquear a partir de</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={schedule.startTime}
                  onChange={(e) => setSchedule((s) => ({ ...s, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Até</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={schedule.endTime}
                  onChange={(e) => setSchedule((s) => ({ ...s, endTime: e.target.value }))}
                />
              </div>
            </div>
            <Button
              onClick={() => updateScheduleMutation.mutate(schedule)}
              disabled={updateScheduleMutation.isPending}
            >
              Salvar Regra
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={passwordDialog.open} onOpenChange={(o) => { if (!o) { setPasswordDialog({ open: false, userId: '', userName: '' }); setNewPassword(''); }}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha - {passwordDialog.userName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha temporária</Label>
              <Input
                id="newPassword"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <Button
              onClick={() => resetPasswordMutation.mutate({ userId: passwordDialog.userId, password: newPassword })}
              disabled={newPassword.length < 6}
            >
              Redefinir Senha
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
