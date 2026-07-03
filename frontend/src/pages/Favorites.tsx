import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function FavoritesPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.get<any>('/photos?favorite=true&limit=50'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Favoritos</h1>
        <p className="text-muted-foreground">Suas fotos favoritas</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="h-48" /></Card>
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Heart className="h-16 w-16 mb-4" />
          <p className="text-lg">Nenhuma foto favorita</p>
          <p className="text-sm">Favorita suas fotos para vê-las aqui</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data?.data?.map((photo: any) => (
            <Card
              key={photo.id}
              className="overflow-hidden cursor-pointer group relative"
              onClick={() => navigate(`/photos/${photo.id}`)}
            >
              <CardContent className="p-0">
                <img src={photo.thumbnailUrl} alt={photo.originalName} className="h-48 w-full object-cover" />
                {photo.caption && (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                    {photo.caption}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
