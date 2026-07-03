import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Trash2, Download, Tag, X, Pencil } from 'lucide-react';
import { formatDate, formatBytes } from '@/lib/utils';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export function PhotoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tagInput, setTagInput] = useState('');
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState('');

  const { data: photo, isLoading } = useQuery({
    queryKey: ['photo', id],
    queryFn: () => api.get<any>(`/photos/${id}`),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/photos/${id}`),
    onSuccess: async () => {
      const albumId = photo?.album?.id;
      if (albumId) {
        await queryClient.invalidateQueries({ queryKey: ['album', albumId] });
      }
      await queryClient.invalidateQueries({ queryKey: ['photos'] });
      await queryClient.invalidateQueries({ queryKey: ['favorites'] });
      await queryClient.invalidateQueries({ queryKey: ['tags'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate(albumId ? `/albums/${albumId}` : '/photos');
    },
    onError: (err: Error) => {
      console.error('Delete failed:', err.message);
      alert('Erro ao excluir: ' + err.message);
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: () => api.post(`/photos/${id}/favorite`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo', id] });
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: Error) => {
      console.error('Favorite failed:', err.message);
      alert('Erro ao favoritar: ' + err.message);
    },
  });

  const addTagMutation = useMutation({
    mutationFn: (tag: string) => api.post(`/photos/${id}/tags`, { tags: [tag] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo', id] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setTagInput('');
    },
  });

  const captionMutation = useMutation({
    mutationFn: (caption: string) => api.put(`/photos/${id}/caption`, { caption }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo', id] });
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      if (photo?.album?.id) {
        queryClient.invalidateQueries({ queryKey: ['album', photo.album.id] });
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setEditingCaption(false);
    },
  });

  function startEditCaption() {
    setCaptionDraft(photo?.caption || '');
    setEditingCaption(true);
  }

  const removeTagMutation = useMutation({
    mutationFn: (slug: string) => api.delete(`/photos/${id}/tags/${slug}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo', id] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  if (isLoading) return <div className="animate-pulse h-96 bg-muted rounded" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{photo?.originalName}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => favoriteMutation.mutate()}>
            <Heart className={`h-4 w-4 ${photo?.isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <Button variant="outline" size="icon" asChild>
            <a href={photo?.originalUrl} download={photo?.originalName}>
              <Download className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="destructive" size="icon" onClick={() => deleteMutation.mutate()}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <img
            src={photo?.previewUrl}
            alt={photo?.originalName}
            className="w-full rounded-lg object-contain max-h-[70vh] bg-black/5"
          />
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold">Detalhes</h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Tamanho:</span> {photo?.size ? formatBytes(photo.size) : '-'}</p>
              <p><span className="text-muted-foreground">Dimensões:</span> {photo?.width && photo?.height ? `${photo.width}x${photo.height}` : '-'}</p>
              <p><span className="text-muted-foreground">Tipo:</span> {photo?.mimeType}</p>
              <p><span className="text-muted-foreground">Criada em:</span> {photo?.createdAt ? formatDate(photo.createdAt) : '-'}</p>
              <p><span className="text-muted-foreground">Álbum:</span> {photo?.album?.title || '-'}</p>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Descrição</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={startEditCaption}>
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
            {editingCaption ? (
              <div className="flex gap-2">
                <Input
                  value={captionDraft}
                  onChange={(e) => setCaptionDraft(e.target.value)}
                  placeholder="Adicionar descrição..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') captionMutation.mutate(captionDraft);
                    if (e.key === 'Escape') setEditingCaption(false);
                  }}
                />
                <Button size="sm" onClick={() => captionMutation.mutate(captionDraft)}>
                  Salvar
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {photo?.caption || 'Nenhuma descrição'}
              </p>
            )}
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4" /> Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {photo?.tags?.map((tag: any) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-secondary px-3 py-1 text-xs flex items-center gap-1 cursor-pointer hover:bg-secondary/80"
                  onClick={() => navigate(`/photos?tag=${encodeURIComponent(tag.slug)}`)}
                >
                  {tag.name}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeTagMutation.mutate(tag.slug); }}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nova tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    addTagMutation.mutate(tagInput.trim());
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => tagInput.trim() && addTagMutation.mutate(tagInput.trim())}
              >
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
