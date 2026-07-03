import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  hasConsent: boolean;
  setHasConsent: (v: boolean) => void;
}

function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getStoredUser(),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  hasConsent: false,
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },
  refreshUser: async () => {
    if (!get().user && get().isAuthenticated) {
      try {
        const { api } = await import('@/services/api');
        const user = await api.get<User>('/auth/me');
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
      } catch {
        set({ user: null, isAuthenticated: false });
      }
    }
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },
  setHasConsent: (v) => set({ hasConsent: v }),
}));
