import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { ChevronLeft, ChevronRight, Search, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const CARD_W = 750;
const GAP = 12;
const STEP = CARD_W + GAP;

export function PhotosPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const adminUserId = searchParams.get('userId') || '';

  const params = new URLSearchParams({ limit: '50' });
  if (adminUserId) params.set('userId', adminUserId);

  const { data: carouselData } = useQuery({
    queryKey: ['photos-carousel', adminUserId],
    queryFn: () => api.get<any>(`/photos?${params.toString()}`),
  });

  const carouselPhotos = carouselData?.data || [];

  const filteredPhotos = search
    ? carouselPhotos.filter((p: any) =>
        p.originalName?.toLowerCase().includes(search.toLowerCase()) ||
        p.caption?.toLowerCase().includes(search.toLowerCase())
      )
    : carouselPhotos;

  const currentIndex = Math.min(
    parseInt(searchParams.get('foto') || '0', 10),
    Math.max(filteredPhotos.length - 1, 0),
  );

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next);
  }

  function prev() {
    const idx = currentIndex === 0 ? filteredPhotos.length - 1 : currentIndex - 1;
    updateParam('foto', String(idx));
  }

  function next() {
    const idx = currentIndex === filteredPhotos.length - 1 ? 0 : currentIndex + 1;
    updateParam('foto', String(idx));
  }

  const offset = -currentIndex * STEP;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {adminUserId && (
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fotos</h1>
          <p className="text-muted-foreground">{adminUserId ? 'Fotos do usuário' : 'Todas as suas fotos'}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar fotos..."
          className="pl-10"
          value={search}
          onChange={(e) => { setSearch(e.target.value); updateParam('foto', '0'); }}
        />
      </div>

      {filteredPhotos.length > 0 ? (
        <div className="flex items-center justify-center">
          <Button variant="ghost" size="icon" onClick={prev}>
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="overflow-hidden mx-2" style={{ width: CARD_W }}>
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ gap: GAP, transform: `translateX(${offset}px)` }}
            >
              {filteredPhotos.map((photo: any) => (
                <div
                  key={photo.id}
                  className="flex-shrink-0 cursor-pointer"
                  style={{ width: CARD_W }}
                  onClick={() => navigate(`/photos/${photo.id}`)}
                >
                  <img
                    src={photo.previewUrl}
                    alt={photo.originalName}
                    className="h-auto w-full rounded-[36px] shadow"
                  />
                  {photo.caption && (
                    <p className="mt-1.5 text-xs text-center text-muted-foreground truncate">
                      {photo.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={next}>
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-16">Nenhuma foto encontrada</p>
      )}
    </div>
  );
}
