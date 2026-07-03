import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useParams } from 'react-router-dom';

export function SharedViewPage() {
  const { token } = useParams<{ token: string }>();

  const { data: link, isLoading, error } = useQuery({
    queryKey: ['shared-view', token],
    queryFn: () => api.get<any>(`/shared/token/${token}`),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-bold">Link inválido ou expirado</h1>
        <p className="text-muted-foreground">Este link de compartilhamento não existe ou expirou.</p>
      </div>
    );
  }

  const albumData = link.album;
  const photos = albumData?.photos || [];
  const userName = link.user?.name;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1 className="text-2xl font-bold">{albumData?.title || 'Álbum Compartilhado'}</h1>
          {albumData?.description && (
            <p className="text-muted-foreground mt-1">{albumData.description}</p>
          )}
          {userName && (
            <p className="text-xs text-muted-foreground mt-2">Compartilhado por {userName}</p>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        {photos.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Nenhuma foto neste álbum</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo: any) => (
              <div key={photo.id} className="overflow-hidden rounded-lg border border-border">
                <img
                  src={photo.previewUrl || photo.url}
                  alt={photo.originalName}
                  className="h-48 w-full object-cover"
                />
                {photo.caption && (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground truncate">{photo.caption}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
