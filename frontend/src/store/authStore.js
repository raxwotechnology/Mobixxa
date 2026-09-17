import { create } from 'zustand';
import { logoutUser } from '../services/api';

const withoutToken = (userData) => {
  if (!userData) return userData;
  const { token, ...safeUserData } = userData;
  return safeUserData;
};

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
    // Invalid persisted data cannot represent an authenticated user.
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
    const safeUserData = withoutToken(userData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('userInfo', JSON.stringify(safeUserData));
    }
    set({ user: safeUserData, isAuthenticated: true });
  },

  setUser: (userData) => {
    const safeUserData = withoutToken(userData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('userInfo', JSON.stringify(safeUserData));
    }
    set({ user: safeUserData });
  },

  logout: async () => {
    try {
      await logoutUser();
    } catch (error) {
      // Local logout still completes if the API is unavailable.
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userInfo');
      sessionStorage.clear();
    }
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
