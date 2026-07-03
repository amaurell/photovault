import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, FolderOpen, Image, ArrowLeft } from 'lucide-react';
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.data?.map((album: any) => (
            <Card
              key={album.id}
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
          ))}
        </div>
      )}
    </div>
  );
}
