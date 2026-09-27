import { create } from 'zustand';
import { logoutUser } from '../services/api';

// Safely parse userInfo from localStorage
const getSavedUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('userInfo');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?._id && parsed.role) {
      return parsed;
    }
    localStorage.removeItem('userInfo');
    return null;
  } catch (e) {
    localStorage.removeItem('userInfo');
    return null;
  }
};

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  initAuth: () => {
    const user = getSavedUser();
    set({ user, isAuthenticated: !!user, isHydrated: true });
  },

  login: (userData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userInfo', JSON.stringify(userData));
      if (userData?.token) {
        localStorage.setItem('token', userData.token);
      }
    }
    set({ user: userData, isAuthenticated: true, isHydrated: true });
  },

  setUser: (userData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userInfo', JSON.stringify(userData));
      if (userData?.token) {
        localStorage.setItem('token', userData.token);
      }
    }
    set({ user: userData });
  },

  logout: async () => {
    try {
      await logoutUser();
    } catch (error) {
      // Local logout still completes if the API is unavailable.
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userInfo');
      localStorage.removeItem('token');
      localStorage.removeItem('mobixa_user');
      sessionStorage.clear();
    }
    set({ user: null, isAuthenticated: false, isHydrated: true });
  },
}));

export default useAuthStore;
