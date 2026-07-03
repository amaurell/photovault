import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { api } from '@/services/api';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { LgpdBanner } from '@/components/layout/lgpd-banner';
import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { DashboardPage } from '@/pages/Dashboard';
import { AlbumsPage } from '@/pages/Albums';
import { AlbumDetailPage } from '@/pages/AlbumDetail';
import { PhotosPage } from '@/pages/Photos';
import { PhotoDetailPage } from '@/pages/PhotoDetail';
import { FavoritesPage } from '@/pages/Favorites';
import { TagsPage } from '@/pages/Tags';
import { ProfilePage } from '@/pages/Profile';
import { SharedPage } from '@/pages/Shared';
import { SharedViewPage } from '@/pages/SharedView';
import { AdminPage } from '@/pages/Admin';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function ProtectedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const { data: access } = useQuery({
    queryKey: ['access-check'],
    queryFn: () => api.get<{ blocked: boolean }>('/auth/access-check'),
    refetchInterval: 60_000,
  });

  const isBlocked = access?.blocked === true;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      {isBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
          <div className="max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <Clock className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Acesso Bloqueado</h2>
            <p className="text-muted-foreground">
              O administrador restringiu o acesso ao aplicativo neste horário. Tente novamente mais tarde.
            </p>
          </div>
        </div>
      )}
      <Sidebar />
      <Topbar />
      <main className="pl-64 pt-14">
        <div className="p-6 pb-20">
          <Outlet />
        </div>
      </main>
      <LgpdBanner />
    </div>
  );
}

function PublicLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const setTokens = useAuthStore((s) => s.setTokens);

  useEffect(() => {
    (async () => {
      try {
        const refreshed = await api.refreshOnInit();
        if (refreshed) {
          const user = await api.get<{ id: string; name: string; email: string; avatarUrl?: string; role: string }>('/auth/me');
          setUser(user);
        }
      } catch {
        setTokens(null as any);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route path="/shared/token/:token" element={<SharedViewPage />} />

            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/albums" element={<AlbumsPage />} />
              <Route path="/albums/:id" element={<AlbumDetailPage />} />
              <Route path="/photos" element={<PhotosPage />} />
              <Route path="/photos/:id" element={<PhotoDetailPage />} />
              <Route path="/tags" element={<TagsPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/shared" element={<SharedPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
