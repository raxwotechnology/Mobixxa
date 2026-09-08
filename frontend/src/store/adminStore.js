import { create } from 'zustand';

const getInitialStore = () => {
  if (typeof window === 'undefined') return 'all';
  return localStorage.getItem('admin_selected_store') || 'all';
};

const useAdminStore = create((set) => ({
  selectedStoreId: getInitialStore(),
  setSelectedStoreId: (id) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_selected_store', id);
    }
    set({ selectedStoreId: id });
  },
}));

export default useAdminStore;
