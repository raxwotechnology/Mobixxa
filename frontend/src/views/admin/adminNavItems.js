import {
  LayoutDashboard, Users, Store, Tag, ShoppingBag, Monitor,
  Ticket, BarChart3, DollarSign, Wallet, Package, Gift,
  CreditCard, UserCog, UsersRound, RotateCcw, Barcode, TrendingUp, Brain,
  Clock, Target, Settings, ChevronRight, Globe, History, Landmark, FileText, Smartphone, Wrench, ShieldCheck,

} from 'lucide-react';



// Groups shape: [{ label: string, items: [{ path, label, icon }] }]
const adminNavGroups = [
  {
    label: 'Dashboard',
    items: [
      { path: '/admin', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    label: 'HR & Staff Management',
    items: [
      { path: '/admin/employees',  label: 'Employees Directory',       icon: UsersRound },
      { path: '/admin/users',      label: 'User Access & Permissions', icon: UserCog },
      { path: '/admin/attendance', label: 'Attendance',                icon: Clock },
      { path: '/admin/leaves',     label: 'Leaves',                    icon: Clock },
      { path: '/admin/payroll',    label: 'Payroll',                   icon: Landmark },
      { path: '/admin/salary-advances', label: 'Salary Advances',       icon: DollarSign },
      { path: '/admin/letters',    label: 'Letters & Documents',       icon: FileText },
      { path: '/admin/targets',    label: 'Targets',                   icon: Target },
    ],
  },
  {
    label: 'Business Management',
    items: [
      { path: '/admin/stores',     label: 'Stores',     icon: Store },
      { path: '/admin/categories', label: 'Categories', icon: Tag },
      { path: '/admin/products',   label: 'Products & Accessories', icon: Package },
      { path: '/admin/phones',     label: 'Mobile Phones', icon: Monitor },
      { path: '/admin/inventory',  label: 'Stock Report',  icon: Package },
    ],


  },
  {
    label: 'Sales & Operations',
    items: [
      { path: '/admin/orders',         label: 'Orders',         icon: ShoppingBag },
      { path: '/admin/warranty',       label: 'IMEI Warranty',  icon: ShieldCheck },
      { path: '/admin/returns',        label: 'Returns',        icon: RotateCcw },
      { path: '/pos',                  label: 'POS Terminal',   icon: Monitor },
      { path: '/admin/repairs',        label: 'Device Repairs', icon: Wrench },
      { path: '/admin/reloads',        label: 'Reloads & Bills', icon: Smartphone },
      { path: '/admin/sales-tracking', label: 'Sales Tracking', icon: TrendingUp },
    ],
  },
  {
    label: 'Trade-In & Pre-Owned',
    items: [
      { path: '/admin/trade-in',       label: 'Phone Trade-In', icon: Smartphone },
    ],
  },
  {
    label: 'Marketing & Promotions',
    items: [
      { path: '/admin/vouchers',    label: 'Vouchers',    icon: Ticket },
      { path: '/admin/promotions',  label: 'Promotions',  icon: Gift },
    ],
  },
  {
    label: 'Barcode System',
    items: [
      { path: '/admin/barcodes',      label: 'Barcodes',          icon: Barcode },
      { path: '/barcode-generator',   label: 'Barcode Generator', icon: Barcode },
    ],
  },
  {
    label: 'Suppliers & Payments',
    items: [
      { path: '/admin/suppliers',         label: 'Suppliers List',    icon: Users },
      { path: '/admin/supplier-payments', label: 'Supplier Payments', icon: Wallet },
    ],


  },
  {
    label: 'Financial Management',
    items: [
      { path: '/admin/accounts',   label: 'Manage Accounts',   icon: Landmark },
      { path: '/admin/cheques',    label: 'Cheque Management', icon: FileText },
      { path: '/admin/hp',         label: 'Installments (HP)', icon: Clock },
      { path: '/admin/expenses',   label: 'Expenses & Income', icon: Wallet },
      { path: '/admin/financials', label: 'Financials',        icon: DollarSign },
      { path: '/admin/profit-reports', label: 'Profit Reports', icon: TrendingUp },
      { path: '/admin/overtime',   label: 'Overtime Pay',      icon: Clock },
    ],
  },
  {
    label: 'Analytics & Reports',
    items: [
      { path: '/admin/reports',          label: 'Reports',          icon: BarChart3 },
      { path: '/admin/customer-history', label: 'Customer History', icon: History },
      { path: '/admin/predictions',      label: 'AI Predictions',   icon: Brain },
    ],
  },
  {
    label: 'System Settings',
    items: [
      { path: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    label: 'Customer View',
    items: [
      { path: '/', label: 'Customer View', icon: Globe },
    ],
  },
];

const pathToPermissionKey = {
  '/admin/employees': 'employees',
  '/admin/users': 'users',
  '/admin/attendance': 'attendance',
  '/admin/leaves': 'leaves',
  '/admin/payroll': 'payroll',
  '/admin/salary-advances': 'salaryAdvances',
  '/admin/letters': 'letters',
  '/admin/targets': 'targets',
  '/admin/stores': 'stores',
  '/admin/categories': 'categories',
  '/admin/products': 'products',
  '/admin/phones': 'phones',
  '/admin/inventory': 'inventory',
  '/admin/orders': 'orders',
  '/admin/warranty': 'warranty',
  '/admin/returns': 'returns',
  '/pos': 'pos',
  '/admin/repairs': 'repairs',
  '/admin/reloads': 'reloads',
  '/admin/sales-tracking': 'salesTracking',
  '/admin/trade-in': 'tradeIn',
  '/admin/vouchers': 'vouchers',
  '/admin/promotions': 'promotions',
  '/admin/barcodes': 'barcodes',
  '/barcode-generator': 'barcodes',
  '/admin/suppliers': 'suppliers',
  '/admin/supplier-payments': 'supplierPayments',
  '/admin/accounts': 'accounts',
  '/admin/cheques': 'cheques',
  '/admin/hp': 'hp',
  '/admin/expenses': 'expenses',
  '/admin/financials': 'financials',
  '/admin/profit-reports': 'profitReports',
  '/admin/overtime': 'overtime',
  '/admin/reports': 'reports',
  '/admin/customer-history': 'customerHistory',
  '/admin/predictions': 'predictions',
  '/admin/settings': 'settings',
  '/': true,
};

// Helper function to filter navigation based on user permissions
export const getAdminNavGroups = (user) => {
  if (!user) return adminNavGroups;

  const isSuperAdmin = user.email === 'admin@mobilehub.com' || user.role === 'admin' || user.isSuperAdmin;
  if (isSuperAdmin) return adminNavGroups;

  const p = user.permissions || {};

  const checkItemAccess = (path) => {
    if (path === '/admin' || path === '/') return true;
    const key = pathToPermissionKey[path];
    if (!key) return true;

    // Check direct granular key
    if (p[key] === true) return true;
    if (p[key] === false) return false;

    // Broad category fallbacks
    if (['employees', 'attendance', 'leaves', 'payroll', 'salaryAdvances', 'letters', 'targets'].includes(key)) {
      return p.employees === true;
    }
    if (['stores', 'categories', 'products', 'phones', 'inventory', 'barcodes'].includes(key)) {
      return p.products === true || p.inventory === true;
    }
    if (['orders', 'warranty', 'returns', 'pos', 'repairs', 'reloads', 'salesTracking', 'tradeIn', 'vouchers', 'promotions'].includes(key)) {
      return p.sales === true || (key === 'reloads' && p.reloads === true) || (key === 'repairs' && p.repairs === true);
    }
    if (['accounts', 'cheques', 'hp', 'expenses', 'financials', 'profitReports', 'overtime'].includes(key)) {
      return p.finance === true || (key === 'expenses' && p.expenses === true);
    }
    if (['suppliers', 'supplierPayments'].includes(key)) {
      return p.suppliers === true;
    }
    if (['reports', 'customerHistory', 'predictions'].includes(key)) {
      return p.reports === true;
    }
    if (key === 'settings' || key === 'users') {
      return p.settings === true || p.users === true;
    }

    return false;
  };

  return adminNavGroups
    .map(group => {
      const filteredItems = group.items.filter(item => checkItemAccess(item.path));
      return { ...group, items: filteredItems };
    })
    .filter(group => group.items.length > 0);
};

export { adminNavGroups };
