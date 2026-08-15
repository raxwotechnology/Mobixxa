import { create } from 'zustand';

const getInitialStoreId = () => {
  if (typeof window === 'undefined') return 'all';
  return localStorage.getItem('adminStoreId') || 'all';
};

const useAdminStoreStore = create((set) => ({
  selectedStoreId: getInitialStoreId(),
  setSelectedStoreId: (id) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminStoreId', id);
    }
    set({ selectedStoreId: id });
  },
}));

export default useAdminStoreStore;
