import ManagerPayroll from '../storeOwner/ManagerPayroll';
import { adminNavGroups as navItems } from './adminNavItems';

const AdminPayroll = () => {
  return <ManagerPayroll navItems={navItems} title="Payroll" />;
};

export default AdminPayroll;
