import {
  LayoutDashboard, User, Clock, Calendar, CreditCard,
  Monitor, Truck, Package, Barcode, Timer, Globe, Wrench,
  Smartphone, DollarSign, FileText, Landmark
} from 'lucide-react';

import useAuthStore from '../../store/authStore';

const getEmployeeNavGroups = (role, user) => {
  const currentUser = user || (typeof window !== 'undefined' ? useAuthStore.getState()?.user : null);
  const p = currentUser?.permissions || {};

  const groups = [
    {
      label: 'My Dashboard',
      items: [
        { path: '/employee',         label: 'Dashboard',      icon: LayoutDashboard },
        { path: '/employee/profile', label: 'My Profile',     icon: User },
      ],
    },
    {
      label: 'Work & Attendance',
      items: [
        { path: '/employee/attendance', label: 'Attendance',       icon: Clock },
        { path: '/employee/leaves',     label: 'Leave Requests',   icon: Calendar },
        { path: '/employee/overtime',   label: 'Overtime',         icon: Timer },
      ],
    },
    {
      label: 'Payroll',
      items: [
        { path: '/employee/salary', label: 'Salary & EPF/ETF', icon: CreditCard },
      ],
    },
  ];

  // Cashier Tools
  if (role === 'cashier') {
    groups.push({
      label: 'Cashier Finance Suite',
      items: [
        { path: '/pos',                label: 'POS Terminal',               icon: Monitor },
        { path: '/admin/reloads',      label: 'Reload & Card Stock',       icon: Smartphone },
        { path: '/admin/expenses',     label: 'Petty Cash & Expenses',     icon: DollarSign },
        { path: '/admin/hp',           label: 'Installments (HP)',          icon: CreditCard },
        { path: '/admin/cheques',      label: 'Cheque Management',          icon: FileText },
      ],
    });

    groups.push({
      label: 'Store Operations',
      items: [
        { path: '/employee/repairs',   label: 'Device Repairs',     icon: Wrench },
        { path: '/employee/stock',     label: 'Stock View',         icon: Package },
        { path: '/barcode-generator',  label: 'Barcode Generator',  icon: Barcode },
      ],
    });
  } else {
    // Role-specific tools for non-cashiers
    const tools = [];
    if (role === 'stockEmployee') {
      tools.push({ path: '/employee/stock', label: 'Stock View', icon: Package });
    }
    if (role === 'deliveryGuy') {
      tools.push({ path: '/delivery', label: 'Deliveries', icon: Truck });
    }

    if (tools.length > 0) {
      groups.push({ label: 'My Tools', items: tools });
    }
  }

  groups.push({
    label: 'Customer View',
    items: [{ path: '/', label: 'Customer View', icon: Globe }],
  });

  // Filter groups according to permissions if user object has permissions defined
  if (!currentUser || currentUser.role === 'admin' || currentUser.isSuperAdmin) {
    return groups;
  }

  const permissionMap = {
    '/employee': true,
    '/employee/profile': true,
    '/employee/attendance': true,
    '/employee/leaves': true,
    '/employee/overtime': true,
    '/employee/salary': true,
    '/pos': p.sales !== false,
    '/admin/reloads': p.reloads === true || p.sales === true,
    '/admin/expenses': p.expenses === true || p.finance === true,
    '/admin/hp': p.customers === true || p.sales === true,
    '/admin/cheques': p.finance === true,
    '/employee/repairs': p.repairs === true || p.products === true,
    '/employee/stock': p.inventory === true || p.products === true,
    '/barcode-generator': p.products === true,
    '/delivery': true,
    '/': true,
  };

  return groups
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        const allowed = permissionMap[item.path];
        return allowed === undefined ? true : allowed === true;
      });
      return { ...group, items: filteredItems };
    })
    .filter((group) => group.items.length > 0);
};

// Flat list for backward compat
const getEmployeeNavItems = (role) =>
  getEmployeeNavGroups(role).flatMap(g => g.items);

export { getEmployeeNavGroups };
export default getEmployeeNavItems;
