import ManagerEmployees from '../storeOwner/ManagerEmployees';
import { adminNavGroups as navItems } from './adminNavItems';

const AdminEmployees = () => {
  return <ManagerEmployees navItems={navItems} title="Employees" />;
};

export default AdminEmployees;
