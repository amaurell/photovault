import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Image, Heart, Tags } from 'lucide-react';

interface Stats {
  albums: number;
  photos: number;
  favorites: number;
  tags: number;
}

export function DashboardPage() {
  const { data: albums } = useQuery({
    queryKey: ['dashboard-albums'],
    queryFn: () => api.get<any>('/albums?limit=1'),
  });

  const { data: photos } = useQuery({
    queryKey: ['dashboard-photos'],
    queryFn: () => api.get<any>('/photos?limit=1'),
  });

  const { data: favorites } = useQuery({
    queryKey: ['dashboard-favorites'],
    queryFn: () => api.get<any>('/photos?favorite=true&limit=1'),
  });

  const { data: tags } = useQuery({
    queryKey: ['dashboard-tags'],
    queryFn: () => api.get<any[]>('/tags'),
  });

  const stats: Stats = {
    albums: albums?.meta?.total || 0,
    photos: photos?.meta?.total || 0,
    favorites: favorites?.meta?.total || 0,
    tags: tags?.length || 0,
  };

  const items = [
    { title: 'Álbuns', value: stats.albums, icon: FolderOpen, color: 'text-blue-500' },
    { title: 'Fotos', value: stats.photos, icon: Image, color: 'text-green-500' },
    { title: 'Favoritos', value: stats.favorites, icon: Heart, color: 'text-red-500' },
    { title: 'Tags', value: stats.tags, icon: Tags, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua biblioteca</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
