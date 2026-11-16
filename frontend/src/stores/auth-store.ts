import { create } from "zustand";
import { api, hasAccessToken, setAccessToken } from "../lib/api";
import type { User } from "../types/api";

type AuthState = {
  user: User | null; ready: boolean;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (fullName: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,
  bootstrap: async () => {
    if (!hasAccessToken()) { set({ ready: true }); return; }
    try {
      const { user } = await api.get<{ user: User }>("/auth/me");
      set({ user, ready: true });
    } catch { setAccessToken(null); set({ user: null, ready: true }); }
  },
  login: async (email, password) => {
    const result = await api.post<{ user: User; accessToken: string }>("/auth/login", { email, password });
    setAccessToken(result.accessToken); set({ user: result.user }); return result.user;
  },
  register: async (fullName, email, password) => {
    const result = await api.post<{ user: User; accessToken: string }>("/auth/register", { fullName, email, password });
    setAccessToken(result.accessToken); set({ user: result.user }); return result.user;
  },
  logout: async () => {
    try { await api.post("/auth/logout"); } finally { setAccessToken(null); set({ user: null }); }
  },
}));
