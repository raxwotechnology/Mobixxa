import {
  LayoutDashboard, Package, ShoppingBag, Users, UsersRound, Clock,
  Calendar, Target, BarChart3, RotateCcw, Barcode,
  Wallet, Monitor, Globe, TrendingUp, Wrench, ShieldCheck, Smartphone,
  Building2, Receipt, DollarSign, PieChart, Coins, SmartphoneCharging
} from 'lucide-react';

const managerNavGroups = [
  {
    label: 'Dashboard',
    items: [
      { path: '/manager', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Employee Management',
    items: [
      { path: '/manager/employees',  label: 'Employees',  icon: UsersRound },
      { path: '/manager/attendance', label: 'Attendance', icon: Clock },
      { path: '/manager/leaves',     label: 'Leaves',     icon: Calendar },
      { path: '/manager/targets',    label: 'Targets',    icon: Target },
      { path: '/manager/performance',label: 'Performance',icon: BarChart3 },
    ],
  },
  {
    label: 'Store Operations',
    items: [
      { path: '/manager/products', label: 'Products',  icon: Package },
      { path: '/manager/orders',   label: 'Orders',    icon: ShoppingBag },
      { path: '/manager/warranty', label: 'IMEI Warranty', icon: ShieldCheck },
      { path: '/manager/returns',  label: 'Returns',   icon: RotateCcw },
      { path: '/manager/repairs',  label: 'Device Repairs', icon: Wrench },
      { path: '/admin/hp',         label: 'Hire Purchase & Credit', icon: Wallet },
    ],
  },
  {
    label: 'Financial Management',
    items: [
      { path: '/admin/accounts',       label: 'Manage Accounts',    icon: Building2 },
      { path: '/admin/cheques',        label: 'Cheque Management',  icon: Receipt },
      { path: '/admin/expenses',       label: 'Expenses & Income',  icon: DollarSign },
      { path: '/admin/financials',     label: 'Financials & P&L',   icon: TrendingUp },
      { path: '/admin/profit-reports', label: 'Profit Reports',     icon: PieChart },
      { path: '/admin/reloads',        label: 'Reload & Card Stock',icon: SmartphoneCharging },
    ],
  },
  {
    label: 'Payroll & Compensation',
    items: [
      { path: '/admin/payroll',  label: 'Payroll',       icon: Coins },
      { path: '/admin/overtime', label: 'Overtime Pay',  icon: Clock },
    ],
  },
  {
    label: 'Trade-In & Pre-Owned',
    items: [
      { path: '/admin/trade-in',   label: 'Phone Trade-In', icon: Smartphone },
    ],
  },
  {
    label: 'Suppliers & Payments',
    items: [
      { path: '/manager/supplier-payments', label: 'Supplier Payments', icon: Wallet },
    ],
  },
  {
    label: 'Tools',
    items: [
      { path: '/pos',              label: 'POS Terminal',      icon: Monitor },
      { path: '/barcode-generator',label: 'Barcode Generator', icon: Barcode },
    ],
  },
  {
    label: 'Customer View',
    items: [
      { path: '/', label: 'Customer View', icon: Globe },
    ],
  },
];

import useAuthStore from '../../store/authStore';

const getFilteredManagerNavGroups = (user) => {
  const currentUser = user || (typeof window !== 'undefined' ? useAuthStore.getState()?.user : null);
  if (!currentUser) return managerNavGroups;
  if (currentUser.role === 'admin' || currentUser.isSuperAdmin || currentUser.role === 'manager') return managerNavGroups;

  const p = currentUser.permissions || {};

  const permissionMap = {
    '/manager': true,
    '/manager/employees': p.employees,
    '/manager/attendance': p.employees,
    '/manager/leaves': p.employees,
    '/manager/targets': p.employees,
    '/manager/performance': p.employees,
    '/manager/products': p.products || p.inventory,
    '/manager/orders': p.sales,
    '/manager/warranty': p.products || p.inventory,
    '/manager/returns': p.sales || p.inventory,
    '/manager/repairs': p.repairs || p.products,
    '/admin/hp': p.customers || p.sales,
    '/admin/accounts': p.finance,
    '/admin/cheques': p.finance,
    '/admin/expenses': p.expenses || p.finance,
    '/admin/financials': p.finance,
    '/admin/profit-reports': p.reports || p.finance,
    '/admin/reloads': p.reloads || p.sales,
    '/admin/payroll': p.employees,
    '/admin/overtime': p.employees,
    '/admin/trade-in': p.products || p.sales,
    '/manager/supplier-payments': p.suppliers,
    '/pos': p.sales,
    '/barcode-generator': p.products,
    '/': true,
  };

  return managerNavGroups
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        const allowed = permissionMap[item.path];
        return allowed === undefined ? true : allowed === true;
      });
      return { ...group, items: filteredItems };
    })
    .filter((group) => group.items.length > 0);
};

const managerNavItems = managerNavGroups.flatMap(g => g.items);

export { managerNavGroups, getFilteredManagerNavGroups };
export default managerNavItems;
