import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const THEME_ACCENTS = {
  indigo: {
    name: 'Indigo & Violet (Default)',
    primary: '#6366f1',
    gradient: 'from-indigo-600 via-violet-600 to-fuchsia-600',
    bgLight: 'bg-indigo-50',
    textPrimary: 'text-indigo-600',
    borderPrimary: 'border-indigo-200',
  },
  emerald: {
    name: 'Emerald & Teal (Fresh)',
    primary: '#0d9488',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    bgLight: 'bg-teal-50',
    textPrimary: 'text-teal-600',
    borderPrimary: 'border-teal-200',
  },
  sapphire: {
    name: 'Sapphire & Cyan (Corporate Tech)',
    primary: '#0284c7',
    gradient: 'from-sky-600 via-blue-600 to-indigo-600',
    bgLight: 'bg-sky-50',
    textPrimary: 'text-sky-600',
    borderPrimary: 'border-sky-200',
  },
  amber: {
    name: 'Amber & Luxury Gold (Executive)',
    primary: '#d97706',
    gradient: 'from-amber-500 via-orange-600 to-yellow-600',
    bgLight: 'bg-amber-50',
    textPrimary: 'text-amber-600',
    borderPrimary: 'border-amber-200',
  },
  rose: {
    name: 'Rose & Cyberpunk Pink (Vibrant)',
    primary: '#e11d48',
    gradient: 'from-rose-600 via-pink-600 to-fuchsia-600',
    bgLight: 'bg-rose-50',
    textPrimary: 'text-rose-600',
    borderPrimary: 'border-rose-200',
  },
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      accent: 'indigo',
      mode: 'light', // 'light' | 'dark'
      fontSize: 'normal',
      notifications: {
        whatsappAlerts: true,
        smsAlerts: true,
        emailInvoices: true,
      },
      setAccent: (accentKey) => {
        set({ accent: accentKey });
        get().applyThemeToDocument();
      },
      setMode: (modeKey) => {
        set({ mode: modeKey });
        get().applyThemeToDocument();
      },
      setFontSize: (size) => set({ fontSize: size }),
      toggleNotificationPref: (key) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: !state.notifications[key],
          },
        })),
      applyThemeToDocument: () => {
        const { accent, mode } = get();
        const root = document.documentElement;

        if (mode === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }

        const themeConfig = THEME_ACCENTS[accent] || THEME_ACCENTS.indigo;
        root.style.setProperty('--user-theme-primary', themeConfig.primary);
      },
    }),
    {
      name: 'user-theme-preferences',
    }
  )
);

export { THEME_ACCENTS };
export default useThemeStore;
