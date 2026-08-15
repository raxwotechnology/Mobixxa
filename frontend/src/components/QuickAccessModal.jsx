'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from '../utils/navigation';
import {
  Zap, Search, X, ShoppingCart, Package, ShoppingBag, Barcode, Clock,
  Users, Building, DollarSign, BarChart2, Wrench, Tag, Settings, ArrowRight,
  Truck, RotateCcw, User, FileText, ChevronRight
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const QuickAccessModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const role = user?.role || 'customer';

  // Role-specific quick access links
  const allShortcuts = useMemo(() => {
    const items = [];

    // Admin Shortcuts
    if (role === 'admin') {
      items.push(
        { id: 'pos', title: 'Open POS Counter', desc: 'Point of sale billing system', path: '/cashier/pos', icon: ShoppingCart, category: 'Sales & POS', badge: 'Fast Billing', color: 'bg-blue-600 text-white' },
        { id: 'admin-inventory', title: 'Products & Inventory', desc: 'Manage stock items & categories', path: '/admin/products', icon: Package, category: 'Inventory', color: 'bg-emerald-600 text-white' },
        { id: 'admin-orders', title: 'All Orders & Invoices', desc: 'Customer sales & order list', path: '/admin/orders', icon: ShoppingBag, category: 'Sales & POS', color: 'bg-violet-600 text-white' },
        { id: 'barcode', title: 'Barcode Generator', desc: 'Print barcode labels for products', path: '/barcode-generator', icon: Barcode, category: 'Tools', color: 'bg-amber-600 text-white' },
        { id: 'admin-attendance', title: 'My Attendance & Clocking', desc: 'Live clock in, breaks & stats', path: '/admin/attendance', icon: Clock, category: 'HR & Staff', color: 'bg-sky-600 text-white' },
        { id: 'admin-users', title: 'Staff & User Permissions', desc: 'Add employees and assign roles', path: '/admin/users', icon: Users, category: 'HR & Staff', color: 'bg-purple-600 text-white' },
        { id: 'admin-stores', title: 'Branch Stores', desc: 'Multi-store setup & managers', path: '/admin/stores', icon: Building, category: 'Management', color: 'bg-indigo-600 text-white' },
        { id: 'admin-payroll', title: 'Payroll & Salaries', desc: 'Employee salary calculations', path: '/admin/payroll', icon: DollarSign, category: 'Finance', color: 'bg-teal-600 text-white' },
        { id: 'admin-profit', title: 'Profit & Loss Reports', desc: 'Revenue, margin & expense analytics', path: '/admin/profit-reports', icon: BarChart2, category: 'Reports', color: 'bg-rose-600 text-white' },
        { id: 'admin-repairs', title: 'Repairs & Warranties', desc: 'Mobile repair tracking & claims', path: '/admin/warranty', icon: Wrench, category: 'Services', color: 'bg-orange-600 text-white' },
        { id: 'admin-vouchers', title: 'Vouchers & Coupons', desc: 'Discount promos and gift cards', path: '/admin/vouchers', icon: Tag, category: 'Marketing', color: 'bg-pink-600 text-white' },
        { id: 'admin-settings', title: 'Store Settings', desc: 'Shop logo, receipts & configuration', path: '/admin/settings', icon: Settings, category: 'Management', color: 'bg-slate-700 text-white' }
      );
    }
    // Manager Shortcuts
    else if (role === 'manager') {
      items.push(
        { id: 'pos', title: 'Open POS Counter', desc: 'Point of sale billing counter', path: '/cashier/pos', icon: ShoppingCart, category: 'Sales & POS', badge: 'Billing', color: 'bg-blue-600 text-white' },
        { id: 'manager-inventory', title: 'Store Inventory', desc: 'Manage branch product stock', path: '/manager/inventory', icon: Package, category: 'Inventory', color: 'bg-emerald-600 text-white' },
        { id: 'manager-orders', title: 'Store Orders', desc: 'Branch sales transactions', path: '/manager/orders', icon: ShoppingBag, category: 'Sales & POS', color: 'bg-violet-600 text-white' },
        { id: 'barcode', title: 'Barcode Generator', desc: 'Generate barcode labels', path: '/barcode-generator', icon: Barcode, category: 'Tools', color: 'bg-amber-600 text-white' },
        { id: 'manager-attendance', title: 'My Attendance & Team', desc: 'Clock in, break & employee logs', path: '/manager/attendance', icon: Clock, category: 'HR & Team', color: 'bg-sky-600 text-white' },
        { id: 'manager-employees', title: 'Store Employees', desc: 'View staff members & performance', path: '/manager/employees', icon: Users, category: 'HR & Team', color: 'bg-purple-600 text-white' },
        { id: 'manager-repairs', title: 'Customer Repairs', desc: 'Track device repair jobs', path: '/manager/repairs', icon: Wrench, category: 'Services', color: 'bg-orange-600 text-white' },
        { id: 'manager-payroll', title: 'Store Payroll', desc: 'Staff salary overview', path: '/manager/payroll', icon: DollarSign, category: 'Finance', color: 'bg-teal-600 text-white' }
      );
    }
    // Cashier Shortcuts
    else if (role === 'cashier') {
      items.push(
        { id: 'pos', title: 'POS Billing Counter', desc: 'Create sales receipts and checkout', path: '/cashier/pos', icon: ShoppingCart, category: 'Billing', badge: 'Main Workstation', color: 'bg-blue-600 text-white' },
        { id: 'employee-orders', title: 'Recent Orders', desc: 'Search and view past receipts', path: '/employee/orders', icon: ShoppingBag, category: 'Sales', color: 'bg-violet-600 text-white' },
        { id: 'employee-stock', title: 'Stock & Price Lookup', desc: 'Search available phones & accessories', path: '/employee/stock', icon: Package, category: 'Inventory', color: 'bg-emerald-600 text-white' },
        { id: 'barcode', title: 'Barcode Generator', desc: 'Generate and print labels', path: '/barcode-generator', icon: Barcode, category: 'Tools', color: 'bg-amber-600 text-white' },
        { id: 'employee-attendance', title: 'Clock In & Attendance', desc: 'Track daily attendance & breaks', path: '/employee/attendance', icon: Clock, category: 'HR', color: 'bg-sky-600 text-white' },
        { id: 'employee-returns', title: 'Item Returns & Refunds', desc: 'Process customer returns', path: '/employee/returns', icon: RotateCcw, category: 'Sales', color: 'bg-rose-600 text-white' },
        { id: 'employee-profile', title: 'My Profile & Paysheet', desc: 'View employee details', path: '/employee/profile', icon: User, category: 'Account', color: 'bg-slate-700 text-white' }
      );
    }
    // Stock Employee Shortcuts
    else if (role === 'stockEmployee') {
      items.push(
        { id: 'employee-stock', title: 'Inventory Stock Room', desc: 'Check quantities, IMEI & prices', path: '/employee/stock', icon: Package, category: 'Inventory', badge: 'Main Workstation', color: 'bg-emerald-600 text-white' },
        { id: 'barcode', title: 'Barcode Generator', desc: 'Print barcode tags for new stock', path: '/barcode-generator', icon: Barcode, category: 'Tools', color: 'bg-amber-600 text-white' },
        { id: 'employee-attendance', title: 'Clock In & Attendance', desc: 'Live clock in & break tracking', path: '/employee/attendance', icon: Clock, category: 'HR', color: 'bg-sky-600 text-white' },
        { id: 'employee-orders', title: 'View Orders', desc: 'Sales order history', path: '/employee/orders', icon: ShoppingBag, category: 'Orders', color: 'bg-violet-600 text-white' },
        { id: 'employee-returns', title: 'Stock Returns', desc: 'Process returned inventory', path: '/employee/returns', icon: RotateCcw, category: 'Inventory', color: 'bg-rose-600 text-white' },
        { id: 'employee-profile', title: 'My Staff Profile', desc: 'View profile details', path: '/employee/profile', icon: User, category: 'Account', color: 'bg-slate-700 text-white' }
      );
    }
    // Delivery Guy Shortcuts
    else if (role === 'deliveryGuy') {
      items.push(
        { id: 'delivery-dash', title: 'Delivery Dashboard', desc: 'Active dispatch orders', path: '/delivery', icon: Truck, category: 'Deliveries', badge: 'Main Console', color: 'bg-indigo-600 text-white' },
        { id: 'employee-attendance', title: 'Clock In & Attendance', desc: 'Record daily attendance', path: '/employee/attendance', icon: Clock, category: 'HR', color: 'bg-sky-600 text-white' },
        { id: 'employee-profile', title: 'My Delivery Profile', desc: 'View profile & earnings', path: '/employee/profile', icon: User, category: 'Account', color: 'bg-slate-700 text-white' }
      );
    }
    // Customer Shortcuts
    else {
      items.push(
        { id: 'cart', title: 'Shopping Cart', desc: 'View cart items and checkout', path: '/cart', icon: ShoppingCart, category: 'Shopping', color: 'bg-blue-600 text-white' },
        { id: 'my-orders', title: 'My Orders & Invoices', desc: 'Track current and past purchases', path: '/my-orders', icon: ShoppingBag, category: 'Shopping', color: 'bg-violet-600 text-white' },
        { id: 'phones', title: 'Browse Mobile Phones', desc: 'Explore smartphones and deals', path: '/category/phones', icon: Package, category: 'Catalog', color: 'bg-emerald-600 text-white' },
        { id: 'profile', title: 'My Customer Profile', desc: 'Manage shipping address and profile', path: '/profile', icon: User, category: 'Account', color: 'bg-slate-700 text-white' }
      );
    }

    return items;
  }, [role]);

  // Filtered shortcuts based on search
  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return allShortcuts;
    const q = searchQuery.toLowerCase();
    return allShortcuts.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [allShortcuts, searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
        {/* Search Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <Zap size={22} className="text-blue-600 flex-shrink-0 animate-pulse" />
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quick access shortcuts (e.g. POS, Attendance, Barcode, Orders)..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-0 bg-transparent cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 custom-scrollbar flex-1">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {role.toUpperCase()} • QUICK ACCESS SHORTCUTS ({filteredShortcuts.length})
            </span>
            <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">Press Esc to close</span>
          </div>

          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Search size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold m-0">No quick access shortcuts found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredShortcuts.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.path)}
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group cursor-pointer bg-white shadow-xs"
                  >
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                      <IconComponent size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 flex-shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500 truncate m-0 mt-0.5">{item.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickAccessModal;
