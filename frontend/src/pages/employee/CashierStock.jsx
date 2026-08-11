import AdminInventory from '../admin/AdminInventory';
import { getEmployeeNavGroups } from './employeeNav';
import useAuthStore from '../../store/authStore';

const CashierStock = () => {
  const { user } = useAuthStore();
  return <AdminInventory navItems={getEmployeeNavGroups(user?.role)} />;
};

export default CashierStock;
