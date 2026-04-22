import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import { supabase } from '../lib/supabase';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password });
          const { token, refreshToken, user } = res.data;

          localStorage.setItem('ebms_token', token);
          localStorage.setItem('ebms_refresh', refreshToken);

          set({ user, token, isAuthenticated: true, isLoading: false });
          return { success: true, user };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, error: err.message || 'Login failed' };
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {}
        localStorage.removeItem('ebms_token');
        localStorage.removeItem('ebms_refresh');
        await supabase.auth.signOut();
        set({ user: null, token: null, isAuthenticated: false });
      },

      refreshUser: async () => {
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data });
        } catch {
          get().logout();
        }
      },

      updateUser: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),
    }),
    {
      name: 'ebms-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;
