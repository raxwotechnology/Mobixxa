const THEME_ACCENTS = {
  sapphire: {
    name: 'Sapphire & Royal Blue (Default)',
    primary: '#2563eb',
    secondary: '#3b82f6',
    accent: '#0284c7',
    gradient: 'from-blue-600 via-sky-600 to-cyan-600',
    bgLight: 'bg-blue-50',
    textPrimary: 'text-blue-600',
    borderPrimary: 'border-blue-200',
  },
  indigo: {
    name: 'Indigo & Deep Violet',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    gradient: 'from-indigo-600 via-violet-600 to-fuchsia-600',
    bgLight: 'bg-indigo-50',
    textPrimary: 'text-indigo-600',
    borderPrimary: 'border-indigo-200',
  },
  emerald: {
    name: 'Emerald & Fresh Teal',
    primary: '#0d9488',
    secondary: '#14b8a6',
    accent: '#06b6d4',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    bgLight: 'bg-teal-50',
    textPrimary: 'text-teal-600',
    borderPrimary: 'border-teal-200',
  },
  amber: {
    name: 'Amber & Luxury Gold',
    primary: '#d97706',
    secondary: '#ea580c',
    accent: '#ca8a04',
    gradient: 'from-amber-500 via-orange-600 to-yellow-600',
    bgLight: 'bg-amber-50',
    textPrimary: 'text-amber-600',
    borderPrimary: 'border-amber-200',
  },
  rose: {
    name: 'Rose & Cyberpunk Pink',
    primary: '#e11d48',
    secondary: '#db2777',
    accent: '#c026d3',
    gradient: 'from-rose-600 via-pink-600 to-fuchsia-600',
    bgLight: 'bg-rose-50',
    textPrimary: 'text-rose-600',
    borderPrimary: 'border-rose-200',
  },
  crimson: {
    name: 'Crimson Red & Flame',
    primary: '#dc2626',
    secondary: '#ef4444',
    accent: '#f97316',
    gradient: 'from-red-600 via-rose-600 to-orange-600',
    bgLight: 'bg-red-50',
    textPrimary: 'text-red-600',
    borderPrimary: 'border-red-200',
  },
};

const FONT_OPTIONS = {
  poppins: { name: 'Poppins (Modern Clean)', font: "'Poppins', sans-serif" },
  inter: { name: 'Inter (Sleek Tech)', font: "'Inter', sans-serif" },
  outfit: { name: 'Outfit (Luxury Modern)', font: "'Outfit', sans-serif" },
  jakarta: { name: 'Plus Jakarta Sans (Corporate)', font: "'Plus Jakarta Sans', sans-serif" },
};

// Full spectrum color palette grid (similar to professional color pickers)
const SPECTRUM_GRID = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0891b2', '#0284c7', '#2563eb', '#3b82f6', '#4f46e5', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a', '#059669', '#0d9488', '#0891b2', '#0369a1', '#1d4ed8', '#4338ca', '#6d28d9', '#7e22ce', '#c026d3', '#db2777', '#e11d48', '#991b1b', '#9a3412', '#854d0e',
  '#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#000000'
];

const useThemeStore = create(
  persist(
    (set, get) => ({
      accent: 'sapphire', // 'sapphire' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'crimson' | 'custom'
      customColor: '#2563eb',
      mode: 'light', // 'light' | 'dark'
      fontSize: 'normal',
      fontFamily: 'poppins', // 'poppins' | 'inter' | 'outfit' | 'jakarta'
      notifications: {
        whatsappAlerts: true,
        smsAlerts: true,
        emailInvoices: true,
      },
      setAccent: (accentKey) => {
        set({ accent: accentKey });
        get().applyThemeToDocument();
      },
      setCustomColor: (hexColor) => {
        set({ accent: 'custom', customColor: hexColor });
        get().applyThemeToDocument();
      },
      setMode: (modeKey) => {
        set({ mode: modeKey });
        get().applyThemeToDocument();
      },
      setFontFamily: (fontKey) => {
        set({ fontFamily: fontKey });
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
        const { accent, customColor, mode, fontFamily } = get();
        const root = document.documentElement;

        const fontConfig = FONT_OPTIONS[fontFamily] || FONT_OPTIONS.poppins;
        root.style.setProperty('--font-user', fontConfig.font);

        if (document.body) {
          document.body.style.fontFamily = `${fontConfig.font} !important`;
        }

        if (mode === 'dark') {
          root.classList.add('dark');
          if (document.body) {
            document.body.classList.add('dark');
            document.body.style.backgroundColor = '#0f172a';
            document.body.style.color = '#f8fafc';
          }
        } else {
          root.classList.remove('dark');
          if (document.body) {
            document.body.classList.remove('dark');
            document.body.style.backgroundColor = '#f8fafc';
            document.body.style.color = '#0f172a';
          }
        }

        let primaryHex = '#2563eb';
        let secondaryHex = '#3b82f6';
        let accentHex = '#0284c7';

        if (accent === 'custom' && customColor) {
          primaryHex = customColor;
          secondaryHex = customColor;
          accentHex = customColor;
        } else {
          const themeConfig = THEME_ACCENTS[accent] || THEME_ACCENTS.sapphire;
          primaryHex = themeConfig.primary;
          secondaryHex = themeConfig.secondary || primaryHex;
          accentHex = themeConfig.accent || primaryHex;
        }

        root.style.setProperty('--color-brand-indigo', primaryHex);
        root.style.setProperty('--color-brand-violet', secondaryHex);
        root.style.setProperty('--color-brand-fuchsia', accentHex);
        root.style.setProperty('--user-theme-primary', primaryHex);
        root.style.setProperty('--user-theme-secondary', secondaryHex);
        root.style.setProperty('--user-theme-accent', accentHex);
        root.setAttribute('data-user-accent', accent);
      },
    }),
    {
      name: 'user-theme-preferences',
    }
  )
);

export { THEME_ACCENTS, FONT_OPTIONS, SPECTRUM_GRID };
export default useThemeStore;
