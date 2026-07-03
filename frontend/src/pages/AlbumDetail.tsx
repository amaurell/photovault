import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Trash2, Upload, Image, CheckCircle2, Loader2, Share2, Link, Copy } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useRef, useState, useCallback } from 'react';

export function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [captionOpen, setCaptionOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingCaptions = useRef(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: album, isLoading } = useQuery({
    queryKey: ['album', id],
    queryFn: () => api.get<any>(`/albums/${id}`),
    enabled: !!id,
  });

  const captionMutation = useMutation({
    mutationFn: ({ photoId, caption: c }: { photoId: string; caption: string }) =>
      api.put(`/photos/${photoId}/caption`, { caption: c }),
    onSuccess: () => {
      pendingCaptions.current--;
      if (pendingCaptions.current <= 0) {
        queryClient.invalidateQueries({ queryKey: ['album', id] });
        queryClient.invalidateQueries({ queryKey: ['photos'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        setCaptionOpen(false);
        setCaption('');
        setUploadedPhotos([]);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/albums/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/albums');
    },
  });

  const shareMutation = useMutation({
    mutationFn: () => api.post<any>(`/shared/albums/${id}`, { expiresInDays: 7 }),
    onSuccess: (data) => {
      const token = data?.token || data?.data?.token;
      if (token) {
        setShareLink(`${window.location.origin}/shared/token/${token}`);
        setShareOpen(true);
      }
    },
  });

  const handleFilesSelected = useCallback(async () => {
    const files = fileRef.current?.files;
    if (!files?.length) return;

    setIsUploading(true);
    setUploadedPhotos([]);
    const newPhotos: any[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('albumId', id!);
      formData.append('file', file);
      try {
        const result = await api.upload<any>('/photos/upload', formData);
        newPhotos.push(result);
      } catch (err: any) {
        console.error('Upload failed:', err.message);
        alert('Erro ao fazer upload: ' + err.message);
      }
    }

    setUploadedPhotos(newPhotos);
    setIsUploading(false);

    if (fileRef.current) fileRef.current.value = '';

    if (newPhotos.length > 0) {
      setCaptionOpen(true);
    }
  }, [id]);

  function handleSaveCaption() {
    if (caption.trim() && uploadedPhotos.length > 0) {
      pendingCaptions.current = uploadedPhotos.length;
      uploadedPhotos.forEach((photo) => {
        captionMutation.mutate({ photoId: photo.id, caption: caption.trim() });
      });
    } else {
      queryClient.invalidateQueries({ queryKey: ['album', id] });
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCaptionOpen(false);
      setCaption('');
      setUploadedPhotos([]);
    }
  }

  function handleDialogClose(open: boolean) {
    if (!open && uploadedPhotos.length > 0 && caption.trim()) {
      pendingCaptions.current = uploadedPhotos.length;
      uploadedPhotos.forEach((photo) => {
        captionMutation.mutate({ photoId: photo.id, caption: caption.trim() });
      });
    } else if (!open) {
      queryClient.invalidateQueries({ queryKey: ['album', id] });
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCaption('');
      setUploadedPhotos([]);
    }
    setCaptionOpen(open);
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/albums')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{album?.title}</h1>
            {album?.description && (
              <p className="text-muted-foreground">{album.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Criado em {album?.createdAt ? formatDate(album.createdAt) : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            type="file"
            ref={fileRef}
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFilesSelected}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={isUploading}>
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isUploading ? 'Enviando...' : 'Upload'}
          </Button>
          <Button variant="outline" onClick={() => shareMutation.mutate()} disabled={shareMutation.isPending}>
            <Share2 className="mr-2 h-4 w-4" /> Compartilhar
          </Button>
          <Button variant="destructive" onClick={() => deleteMutation.mutate()}>
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
        </div>
      </div>

      <Dialog open={captionOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Legenda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              {uploadedPhotos.length} foto(s) enviada(s) com sucesso
            </div>
            {uploadedPhotos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {uploadedPhotos.map((p: any) => (
                  <div key={p.id} className="overflow-hidden rounded-lg border">
                    <img
                      src={p.thumbnailUrl}
                      alt={p.originalName}
                      className="h-20 w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="caption">Descrição das fotos (opcional)</Label>
              <Input
                id="caption"
                placeholder="Digite uma descrição para as fotos..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => handleDialogClose(false)}>
                Pular
              </Button>
              <Button onClick={handleSaveCaption}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" /> Link Compartilhado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Qualquer pessoa com este link pode ver as fotos deste álbum (válido por 7 dias).
            </p>
            <div className="flex gap-2">
              <Input value={shareLink} readOnly className="flex-1" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(shareLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <span className="text-xs">OK</span> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {album?.photos?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Image className="h-16 w-16 mb-4" />
            <p className="text-lg">Nenhuma foto neste álbum</p>
            <p className="text-sm">Faça upload das primeiras fotos</p>
          </div>
        ) : (
          album?.photos?.map((photo: any) => (
            <Card
              key={photo.id}
              className="overflow-hidden cursor-pointer group relative"
              onClick={() => navigate(`/photos/${photo.id}`)}
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden">
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.originalName}
                    className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
                {photo.caption && (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                    {photo.caption}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
