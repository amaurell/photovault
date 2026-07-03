import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Trash2, Link as LinkIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function SharedPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['shared-links'],
    queryFn: () => api.get<any[]>('/shared/list'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/shared/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-links'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compartilhados</h1>
        <p className="text-muted-foreground">Links compartilhados dos seus álbuns</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="h-24" /></Card>
          ))}
        </div>
      ) : data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Share2 className="h-16 w-16 mb-4" />
          <p className="text-lg">Nenhum link compartilhado</p>
          <p className="text-sm">Compartilhe um álbum para vê-lo aqui</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.map((link: any) => (
            <Card key={link.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{link.album?.title || 'Álbum'}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => revokeMutation.mutate(link.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                <a
                  href={`${window.location.origin}/shared/token/${link.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <LinkIcon className="h-3 w-3" />
                  {window.location.origin}/shared/{link.token.substring(0, 8)}...
                </a>
                <p className="text-xs text-muted-foreground">
                  Criado em {link.createdAt ? formatDate(link.createdAt) : '-'}
                  {link.expiresAt && ` · Expira em ${formatDate(link.expiresAt)}`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
