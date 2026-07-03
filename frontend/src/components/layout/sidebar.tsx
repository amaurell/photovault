import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderOpen,
  Image,
  Heart,
  Tags,
  Share2,
  User,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/albums', icon: FolderOpen, label: 'Álbuns' },
  { to: '/photos', icon: Image, label: 'Fotos' },
  { to: '/favorites', icon: Heart, label: 'Favoritos' },
  { to: '/tags', icon: Tags, label: 'Tags' },
  { to: '/shared', icon: Share2, label: 'Compartilhados' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

export function Sidebar() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-background">
      <div className="flex h-14 items-center border-b border-border px-6">
        <h1 className="text-lg font-bold tracking-tight">PhotoVault</h1>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
              )
            }
          >
            <Shield className="h-4 w-4" />
            Administração
          </NavLink>
        )}
        <button
          onClick={() => { logout(); window.location.href = '/login'; }}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground mt-4"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </nav>
    </aside>
  );
}
