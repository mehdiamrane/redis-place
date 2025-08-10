import { create } from "zustand";
import AuthService from "../services/authService";

export interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  showAuthModal: boolean;
  authMessage: string;
  loading: boolean;
}

export interface AuthActions {
  setAuthenticated: (isAuthenticated: boolean, username?: string) => void;
  showModal: (message: string) => void;
  hideModal: () => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  // State
  isAuthenticated: false,
  username: null,
  showAuthModal: false,
  authMessage: "",
  loading: false,

  // Actions
  setAuthenticated: (isAuthenticated: boolean, username?: string) => {
    set({ isAuthenticated, username: username || null });
  },

  showModal: (message: string) => {
    set({ showAuthModal: true, authMessage: message });
  },

  hideModal: () => {
    set({ showAuthModal: false, authMessage: "" });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  checkAuth: async () => {
    const storedAuth = AuthService.getStoredAuth();
    if (storedAuth) {
      const authStatus = await AuthService.verifyAuth();
      if (authStatus.valid) {
        set({
          isAuthenticated: true,
          username: authStatus.username || null,
        });
      } else {
        set({
          isAuthenticated: false,
          username: null,
        });
      }
    }
  },

  logout: async () => {
    await AuthService.logout();
    set({
      isAuthenticated: false,
      username: null,
    });
  },
}));
