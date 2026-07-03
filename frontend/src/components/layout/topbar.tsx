import { useAuthStore } from '@/store/auth';
import { api } from '@/services/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Topbar() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // cookie will be cleared on next request anyway
    }
    logout();
    navigate('/login');
  }

  return (
    <header className="fixed left-64 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <User className="mr-2 h-4 w-4" /> Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
