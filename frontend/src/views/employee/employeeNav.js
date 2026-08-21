import {
  LayoutDashboard, User, Clock, Calendar, CreditCard,
  Monitor, Truck, Package, Barcode, Timer, Globe, Wrench,
  Smartphone, DollarSign, FileText, Landmark, ShoppingBag, RotateCcw, ShieldCheck, Tag
} from 'lucide-react';

import useAuthStore from '../../store/authStore';

const getEmployeeNavGroups = (role, user) => {
  const currentUser = user || (typeof window !== 'undefined' ? useAuthStore.getState()?.user : null);
  const p = currentUser?.permissions || {};
  const currentRole = role || currentUser?.role || 'cashier';

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
  if (currentRole === 'cashier') {
    const cashierFinanceItems = [
      { path: '/pos',            label: 'POS Terminal',           icon: Monitor,    key: 'pos' },
      { path: '/admin/reloads',  label: 'Reload & Card Stock',   icon: Smartphone, key: 'reloads' },
      { path: '/admin/expenses', label: 'Petty Cash & Expenses', icon: DollarSign, key: 'expenses' },
      { path: '/admin/hp',       label: 'Installments (HP)',      icon: CreditCard, key: 'hp' },
      { path: '/admin/cheques',  label: 'Cheque Management',      icon: FileText,   key: 'cheques' },
    ].filter(item => p[item.key] !== false);

    if (cashierFinanceItems.length > 0) {
      groups.push({
        label: 'Cashier Finance Suite',
        items: cashierFinanceItems,
      });
    }

    const cashierStoreItems = [
      { path: '/employee/repairs',  label: 'Device Repairs',    icon: Wrench,  key: 'repairs' },
      { path: '/employee/stock',    label: 'Stock View',        icon: Package, key: 'inventory' },
      { path: '/barcode-generator', label: 'Barcode Generator', icon: Barcode, key: 'barcodes' },
    ].filter(item => p[item.key] !== false);

    if (cashierStoreItems.length > 0) {
      groups.push({
        label: 'Store Operations',
        items: cashierStoreItems,
      });
    }
  } else if (currentRole === 'stockEmployee') {
    const stockItems = [
      { path: '/employee/stock',    label: 'Stock & Inventory', icon: Package, key: 'inventory' },
      { path: '/barcode-generator', label: 'Barcode Generator', icon: Barcode, key: 'barcodes' },
      { path: '/employee/repairs',  label: 'Device Repairs',    icon: Wrench,  key: 'repairs' },
    ].filter(item => p[item.key] !== false);

    if (stockItems.length > 0) {
      groups.push({ label: 'Stock Operations', items: stockItems });
    }
  } else if (currentRole === 'deliveryGuy') {
    const deliveryItems = [
      { path: '/delivery', label: 'Deliveries Hub', icon: Truck, key: 'deliveries' },
    ].filter(item => p[item.key] !== false);

    if (deliveryItems.length > 0) {
      groups.push({ label: 'Delivery Suite', items: deliveryItems });
    }
  }

  // Check for any extra explicitly granted permissions by Admin
  const extraPermittedItems = [];
  if (p.products && !groups.some(g => g.items.some(i => i.path === '/admin/products'))) {
    extraPermittedItems.push({ path: '/admin/products', label: 'Products Catalog', icon: Package });
  }
  if (p.orders && !groups.some(g => g.items.some(i => i.path === '/admin/orders'))) {
    extraPermittedItems.push({ path: '/admin/orders', label: 'Orders & Sales', icon: ShoppingBag });
  }
  if (p.warranty && !groups.some(g => g.items.some(i => i.path === '/admin/warranty'))) {
    extraPermittedItems.push({ path: '/admin/warranty', label: 'IMEI Warranty', icon: ShieldCheck });
  }
  if (p.returns && !groups.some(g => g.items.some(i => i.path === '/admin/returns'))) {
    extraPermittedItems.push({ path: '/admin/returns', label: 'Returns & RMA', icon: RotateCcw });
  }
  if (p.vouchers && !groups.some(g => g.items.some(i => i.path === '/admin/vouchers'))) {
    extraPermittedItems.push({ path: '/admin/vouchers', label: 'Vouchers & Deals', icon: Tag });
  }

  if (extraPermittedItems.length > 0) {
    groups.push({
      label: 'Admin Granted Modules',
      items: extraPermittedItems,
    });
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
