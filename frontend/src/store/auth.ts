import { create } from 'zustand';
import { setAccessToken } from '@/services/api';

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
  setTokens: (accessToken: string) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  hasConsent: boolean;
  setHasConsent: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  hasConsent: false,
  setUser: (user) => {
    set({ user, isAuthenticated: true });
  },
  setTokens: (token) => {
    setAccessToken(token);
  },
  refreshUser: async () => {
    if (!get().user) {
      try {
        const { api } = await import('@/services/api');
        const user = await api.get<User>('/auth/me');
        set({ user, isAuthenticated: true });
      } catch {
        set({ user: null, isAuthenticated: false });
      }
    }
  },
  logout: () => {
    setAccessToken(null);
    set({ user: null, isAuthenticated: false });
  },
  setHasConsent: (v) => set({ hasConsent: v }),
}));
