import {
  LayoutDashboard, User, Clock, Calendar, CreditCard,
  Monitor, Truck, Package, Barcode, Timer, Globe, Wrench,
  Smartphone, DollarSign, FileText, Landmark
} from 'lucide-react';

const getEmployeeNavGroups = (role) => {
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

  // Cashier Financial & Operating Tools
  if (role === 'cashier') {
    groups.push({
      label: 'Financial & Cashier Tools',
      items: [
        { path: '/pos',                label: 'POS Terminal',               icon: Monitor },
        { path: '/admin/reloads',      label: 'Reload & Card Stock',       icon: Smartphone },
        { path: '/admin/expenses',     label: 'Shop Expenses (Petty Cash)', icon: DollarSign },
        { path: '/admin/hp',           label: 'Installments (HP)',          icon: CreditCard },
        { path: '/admin/cheques',      label: 'Cheque Management',          icon: FileText },
        { path: '/admin/accounts',     label: 'Manage Accounts',            icon: Landmark },
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

  return groups;
};

// Flat list for backward compat
const getEmployeeNavItems = (role) =>
  getEmployeeNavGroups(role).flatMap(g => g.items);

export { getEmployeeNavGroups };
export default getEmployeeNavItems;
