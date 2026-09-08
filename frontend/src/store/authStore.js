import { create } from 'zustand';

// Safely parse userInfo from localStorage
const getSavedUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('userInfo');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed._id && parsed.token && parsed.role) {
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
    }
    set({ user: userData, isAuthenticated: true });
  },

  setUser: (userData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userInfo', JSON.stringify(userData));
    }
    set({ user: userData });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userInfo');
      sessionStorage.clear();
    }
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
