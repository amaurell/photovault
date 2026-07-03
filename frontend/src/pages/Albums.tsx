import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, FolderOpen, Image, ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const albumSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().optional(),
});

type AlbumForm = z.infer<typeof albumSchema>;

export function AlbumsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const adminUserId = searchParams.get('userId') || '';
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AlbumForm>({
    resolver: zodResolver(albumSchema),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['albums', adminUserId],
    queryFn: () => {
      const params = adminUserId ? `?userId=${adminUserId}` : '';
      return api.get<any>(`/albums${params}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (d: AlbumForm) => api.post('/albums', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setOpen(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (albumId: string) => api.delete(`/albums/${albumId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {adminUserId && (
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Álbuns</h1>
            <p className="text-muted-foreground">
              {adminUserId ? 'Álbuns do usuário' : 'Gerencie seus álbuns de fotos'}
            </p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Álbum
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Álbum</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" placeholder="Nome do álbum" {...register('title')} />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input id="description" placeholder="Descrição..." {...register('description')} />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Criando...' : 'Criar Álbum'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FolderOpen className="h-16 w-16 mb-4" />
          <p className="text-lg">Nenhum álbum ainda</p>
          <p className="text-sm">Crie seu primeiro álbum para começar</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.data?.map((album: any) => (
              <div key={album.id} className="relative group">
                <Card
                  className="cursor-pointer transition-colors hover:bg-secondary/50"
                  onClick={() => navigate(`/albums/${album.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      {album.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {album.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{album.description}</p>
                    )}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Image className="h-4 w-4" />
                      <span>{album._count?.photos || 0} fotos</span>
                    </div>
                  </CardContent>
                </Card>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(album.id); }}
                  className="absolute top-3 right-3 z-10 rounded-full bg-background/80 p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 shadow-sm border"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <Dialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Excluir Álbum</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir este álbum e todas as suas fotos? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline" size="sm">Cancelar</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (confirmDelete) {
                      deleteMutation.mutate(confirmDelete);
                      setConfirmDelete(null);
                    }
                  }}
                >
                  {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
