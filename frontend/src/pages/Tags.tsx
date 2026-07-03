import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TagsPage() {
  const navigate = useNavigate();

  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get<any[]>('/tags'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
        <p className="text-muted-foreground">Todas as tags usadas nas suas fotos</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="h-20" /></Card>
          ))}
        </div>
      ) : tags?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Tag className="h-16 w-16 mb-4" />
          <p className="text-lg">Nenhuma tag ainda</p>
          <p className="text-sm">Adicione tags nas suas fotos para vê-las aqui</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {tags?.map((tag: any) => (
            <Card
              key={tag.id}
              className="cursor-pointer transition-colors hover:bg-secondary/50"
              onClick={() => navigate(`/photos?tag=${encodeURIComponent(tag.slug)}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="h-4 w-4 text-primary" />
                  {tag.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {tag._count?.photos || 0} {tag._count?.photos === 1 ? 'foto' : 'fotos'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
