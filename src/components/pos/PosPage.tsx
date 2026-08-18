'use client';

import { useState, useId, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Percent,
  DollarSign,
  CreditCard,
  Banknote,
  Calendar,
  Building2,
  CheckCircle2,
  X,
  Printer,
  Sparkles,
  User,
  Phone,
  FileText,
  Clock,
  ShieldCheck,
  Tag,
  ChevronRight,
  ArrowRight,
  Info,
  AlertTriangle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  emoji: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'cash' | 'card' | 'installment' | 'bank' | 'koko_cheque';

export interface DiscountState {
  type: 'percentage' | 'fixed';
  value: number;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  nic: string;
  address: string;
}

export interface InstallmentPlan {
  months: number; // 0, 3, 6, 9, 12, 18, 24
  downPayment: number;
  interestRate: number; // e.g. 5%
}

// ── Mock Catalog Products ─────────────────────────────────────────────────────

const mockProducts: Product[] = [
  { id: 'pos-1', code: 'PX-10A', name: 'Google Pixel 10A 128GB', category: 'SMART PHONE', brand: 'Google', price: 189900, stock: 12, emoji: '📱' },
  { id: 'pos-2', code: 'PX-10P', name: 'Google Pixel 10 Pro 256GB', category: 'SMART PHONE', brand: 'Google', price: 289999, stock: 8, emoji: '📱' },
  { id: 'pos-3', code: 'AP-IP16', name: 'iPhone 16 Pro Max 256GB', category: 'SMART PHONE', brand: 'Apple', price: 449900, stock: 5, emoji: '📱' },
  { id: 'pos-4', code: 'SM-S25', name: 'Samsung Galaxy S25 Ultra', category: 'SMART PHONE', brand: 'Samsung', price: 419900, stock: 7, emoji: '📱' },
  { id: 'pos-5', code: 'AP-MBA', name: 'MacBook Air M4 15-inch', category: 'LAPTOPS', brand: 'Apple', price: 549000, stock: 4, emoji: '💻' },
  { id: 'pos-6', code: 'AP-APP4', name: 'AirPods Pro 4 Active ANC', category: 'EARBUDS', brand: 'Apple', price: 89900, stock: 15, emoji: '🎧' },
  { id: 'pos-7', code: 'MS-MON', name: 'Marshall Monitor II ANC', category: 'EARBUDS', brand: 'Marshall', price: 119900, stock: 9, emoji: '🎧' },
  { id: 'pos-8', code: 'PS5-PRO', name: 'PlayStation 5 Pro 2TB', category: 'ACCESSORIES', brand: 'Sony', price: 319900, stock: 6, emoji: '🎮' },
  { id: 'pos-9', code: 'FIT-AIR', name: 'Google Fitbit Air Watch', category: 'SMART WATCHES', brand: 'Google', price: 74900, stock: 11, emoji: '⌚' },
  { id: 'pos-10', code: 'INF-N60', name: 'Infinix Note 60 Ultra', category: 'SMART PHONE', brand: 'Infinix', price: 99900, stock: 14, emoji: '📱' },
  { id: 'pos-11', code: 'ANK-65W', name: 'Anker GaN 65W Fast Charger', category: 'CHARGERS', brand: 'Anker', price: 14500, stock: 25, emoji: '🔌' },
  { id: 'pos-12', code: 'AP-CASE', name: 'MagSafe Leather Case', category: 'PHONE CASES', brand: 'Apple', price: 18900, stock: 30, emoji: '🛡️' },
];

const posCategories = [
  'ALL',
  'SMART PHONE',
  'LAPTOPS',
  'SMART WATCHES',
  'EARBUDS',
  'ACCESSORIES',
  'CHARGERS',
  'PHONE CASES',
];

// Helper to sanitize numeric input strings (e.g. "05000" -> "5000", "" -> "0")
function sanitizeNumberInput(val: string): number {
  const cleaned = val.replace(/^0+(?=\d)/, '').replace(/[^0-9.]/g, '');
  if (cleaned === '' || cleaned === '.') return 0;
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export default function PosPage() {
  const discountInputId = useId();
  const searchInputId = useId();

  // State
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountTenderedStr, setAmountTenderedStr] = useState('');
  const [discount, setDiscount] = useState<DiscountState>({ type: 'percentage', value: 0 });
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountInputStr, setDiscountInputStr] = useState('0');
  const [discountTypeInput, setDiscountTypeInput] = useState<'percentage' | 'fixed'>('percentage');

  // Customer details for HP / Checkout
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: '',
    phone: '',
    nic: '',
    address: '',
  });

  // Hire Purchase / Installment State
  const [installment, setInstallment] = useState<InstallmentPlan>({
    months: 12,
    downPayment: 50000,
    interestRate: 5,
  });

  // Form string states for sanitization (Down payment & Interest)
  const [downPaymentStr, setDownPaymentStr] = useState('50000');
  const [interestRateStr, setInterestRateStr] = useState('5');

  // Receipt / Success Modal State
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // Modern Toast Feedback State
  const [toast, setToast] = useState<{ type: 'error' | 'success' | 'info'; title: string; message: string } | null>(null);

  const showToast = (type: 'error' | 'success' | 'info', title: string, message: string) => {
    setToast({ type, title, message });
  };

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Cart calculations
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const discountAmount =
    discount.type === 'percentage'
      ? Math.round((subtotal * discount.value) / 100)
      : Math.min(subtotal, discount.value);

  const finalTotal = Math.max(0, subtotal - discountAmount);

  // 1. AUTO-FILL EXACT CASH AMOUNT WHEN ITEMS ARE IN CART & CASH IS SELECTED
  useEffect(() => {
    if (paymentMethod === 'cash' && finalTotal > 0) {
      setAmountTenderedStr(finalTotal.toString());
    }
  }, [finalTotal, paymentMethod]);

  // Cash change calculation
  const amountTenderedNum = sanitizeNumberInput(amountTenderedStr);
  const cashChange = Math.max(0, amountTenderedNum - finalTotal);

  // Installment calculations
  const hpDownPayment = sanitizeNumberInput(downPaymentStr);
  const hpInterestRate = sanitizeNumberInput(interestRateStr);
  const hpMonths = installment.months;

  const hpOriginalPrice = finalTotal;
  const hpRemainingBalance = Math.max(0, hpOriginalPrice - hpDownPayment);
  const hpInterestAmount = Math.round(hpRemainingBalance * (hpInterestRate / 100));
  const hpTotalPayable = hpRemainingBalance + hpInterestAmount;
  const hpMonthlyAmount = hpMonths > 0 ? Math.round(hpTotalPayable / hpMonths) : 0;

  // Add item on Double Click
  const handleProductDoubleClick = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const openDiscountModal = () => {
    setDiscountTypeInput(discount.type);
    setDiscountInputStr(discount.value.toString());
    setShowDiscountModal(true);
  };

  const applyDiscountModal = () => {
    const val = sanitizeNumberInput(discountInputStr);
    setDiscount({
      type: discountTypeInput,
      value: discountTypeInput === 'percentage' ? Math.min(100, val) : val,
    });
    setShowDiscountModal(false);
  };

  const removeDiscount = () => {
    setDiscount({ type: 'percentage', value: 0 });
    setShowDiscountModal(false);
  };

  // Process Checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      showToast('error', 'Cart is Empty', 'Please add products by double-clicking on them.');
      return;
    }

    if (paymentMethod === 'cash' && amountTenderedNum < finalTotal) {
      showToast(
        'error',
        'Insufficient Cash Tendered',
        `Amount tendered (Rs. ${amountTenderedNum.toLocaleString()}) is less than total payable (Rs. ${finalTotal.toLocaleString()}).`
      );
      return;
    }

    if (paymentMethod === 'installment') {
      if (!customer.name || !customer.phone || !customer.nic) {
        showToast('error', 'Missing Customer Info', 'Please fill in Customer Name, Phone, and NIC for Installment sale.');
        return;
      }
      if (hpDownPayment > hpOriginalPrice) {
        showToast('error', 'Invalid Down Payment', 'Down payment cannot exceed total purchase price!');
        return;
      }
    }

    const orderId = 'MOB-' + Math.floor(100000 + Math.random() * 900000);
    const orderData = {
      orderId,
      date: new Date().toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' }),
      cart: [...cart],
      subtotal,
      discountAmount,
      finalTotal,
      paymentMethod,
      amountTendered: amountTenderedNum,
      cashChange,
      customer: { ...customer },
      installment:
        paymentMethod === 'installment'
          ? {
              months: hpMonths,
              downPayment: hpDownPayment,
              remainingBalance: hpRemainingBalance,
              interestRate: hpInterestRate,
              interestAmount: hpInterestAmount,
              totalPayable: hpTotalPayable,
              monthlyAmount: hpMonthlyAmount,
            }
          : null,
    };

    setCompletedOrder(orderData);
    showToast('success', 'Sale Processed Successfully!', `Order #${orderId} - Rs. ${finalTotal.toLocaleString()} billed.`);
  };

  const resetPos = () => {
    setCart([]);
    setDiscount({ type: 'percentage', value: 0 });
    setAmountTenderedStr('');
    setCustomer({ name: '', phone: '', nic: '', address: '' });
    setDownPaymentStr('50000');
    setInterestRateStr('5');
    setCompletedOrder(null);
  };

  // Filter products
  const filteredProducts = mockProducts.filter((p) => {
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchQuery =
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="w-full min-h-screen bg-slate-100 flex flex-col">
      {/* ── POS Header Bar ── */}
      <div className="w-full bg-slate-900 text-white px-6 sm:px-10 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center bg-blue-600 rounded-xl shadow-md">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white leading-none">
              Mobixa POS <span className="text-blue-400 font-bold text-xs uppercase ml-1">Terminal v2.6</span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Colombo Flagship Boutique · Register 01</p>
          </div>
        </div>

        {/* Tip badge */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-blue-300">
          <Sparkles size={13} className="text-yellow-400 animate-pulse" />
          <span>Double-click product card to add to bill</span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">ONLINE</span>
        </div>
      </div>

      {/* ── POS Main Layout (Two Panel Widescreen Split) ── */}
      <div className="flex-1 w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT PANEL: Product Catalog (7 cols) ── */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden">
          {/* Search + Category toolbar */}
          <div className="flex flex-col gap-4 mb-5">
            {/* Search */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all duration-200">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                id={searchInputId}
                type="text"
                placeholder="Search products by name, code (PX-10), or brand..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none font-medium"
              />
              {catalogSearch && (
                <button onClick={() => setCatalogSearch('')} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {posCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all duration-200
                    ${selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid (Double Click to Add) */}
          <div className="flex-1 overflow-y-auto max-h-[600px] pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onDoubleClick={() => handleProductDoubleClick(p)}
                  title="Double click to add to cart"
                  className="group relative bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-4 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer select-none flex flex-col justify-between"
                >
                  {/* Stock badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{p.code}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                      In Stock: {p.stock}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="h-20 bg-slate-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200">
                    <span className="text-4xl">{p.emoji}</span>
                  </div>

                  {/* Details */}
                  <div>
                    <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-0.5">{p.brand}</p>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 mb-2">{p.name}</h3>
                    <p className="font-extrabold text-slate-900 text-sm">Rs. {p.price.toLocaleString()}</p>
                  </div>

                  {/* Hover prompt */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-blue-600">
                    <span>Double-click to add</span>
                    <Plus size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Search size={40} className="mb-3 text-slate-300" />
                <p className="text-base font-bold text-slate-600">No matching hardware found</p>
                <p className="text-xs">Try another search keyword or category filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Billing Cart & Fast Checkout (5 cols) ── */}
        <div className="lg:col-span-5 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden">
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-blue-600" />
              <h2 className="font-extrabold text-slate-900 text-base">Current Cart Bill</h2>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                {cart.reduce((a, b) => a + b.quantity, 0)} items
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors"
              >
                <Trash2 size={13} />
                Clear All
              </button>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 space-y-3 mb-4">
            {cart.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                  <span className="text-2xl shrink-0">{product.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-xs truncate">{product.name}</p>
                    <p className="text-[11px] text-slate-500">Rs. {product.price.toLocaleString()} each</p>
                  </div>
                </div>

                {/* Qty Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateQuantity(product.id, -1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-6 text-center font-bold text-xs text-slate-900">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 ml-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <ShoppingCart size={32} className="mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-500">Cart is empty</p>
                <p className="text-[11px] text-slate-400">Double-click any item from catalog to add</p>
              </div>
            )}
          </div>

          {/* Subtotal & Discount Row */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold">Rs. {subtotal.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Discount</span>
                {discount.value > 0 && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {discount.type === 'percentage' ? `${discount.value}% OFF` : `Rs. ${discount.value.toLocaleString()} OFF`}
                  </span>
                )}
              </div>
              <button
                onClick={openDiscountModal}
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 text-xs"
              >
                <Tag size={12} />
                {discount.value > 0 ? 'Edit Discount' : 'Apply Discount'}
              </button>
            </div>

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold">
                <span>Discount Savings</span>
                <span>- Rs. {discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-extrabold text-slate-900">
              <span>Final Total</span>
              <span className="text-blue-600">Rs. {finalTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* ── 3. PAYMENT METHOD SELECTION (Exact Requested Order) ── */}
          {/* Order: 1. Cash  2. Card  3. Installment  4. Bank  5. Koko / Cheque */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'card', label: 'Card', icon: CreditCard },
                { id: 'installment', label: 'Installment', icon: Calendar },
                { id: 'bank', label: 'Bank', icon: Building2 },
                { id: 'koko_cheque', label: 'Koko/Cheque', icon: FileText },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setPaymentMethod(id as PaymentMethod)}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl border text-[11px] font-bold transition-all duration-150
                    ${paymentMethod === id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-white'
                    }`}
                >
                  <Icon size={16} />
                  <span className="truncate w-full text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Dynamic Input according to Payment Method ── */}

          {/* 1. CASH PAYMENT MODE (Fast Billing with Enter key trigger) */}
          {paymentMethod === 'cash' && (
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="amount-tendered-input" className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Amount Tendered (Cash)
                </label>
                <span className="text-[10px] text-blue-600 font-medium">Press <kbd className="px-1.5 py-0.5 rounded bg-blue-100 font-mono text-[10px] border border-blue-200">Enter ↵</kbd> to Checkout</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">Rs.</span>
                <input
                  id="amount-tendered-input"
                  type="number"
                  placeholder="0.00"
                  value={amountTenderedStr}
                  onChange={(e) => setAmountTenderedStr(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCheckout();
                    }
                  }}
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-blue-200 bg-white font-extrabold text-slate-900 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex gap-2 mt-2">
                {[1000, 5000, 10000, finalTotal].map((amt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAmountTenderedStr(amt.toString())}
                    className="flex-1 py-1 px-2 rounded-lg bg-white border border-blue-200 text-blue-700 font-bold text-[10px] hover:bg-blue-100 transition-colors"
                  >
                    {amt === finalTotal ? 'Exact' : `+${amt.toLocaleString()}`}
                  </button>
                ))}
              </div>

              {amountTenderedNum > 0 && (
                <div className="mt-3 pt-2 border-t border-blue-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Change to Return:</span>
                  <span className={`font-extrabold text-base ${amountTenderedNum >= finalTotal ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Rs. {cashChange.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 2. HIRE PURCHASE / INSTALLMENT PAYMENT MODE */}
          {paymentMethod === 'installment' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 border-b border-slate-200 pb-2">
                <ShieldCheck size={16} className="text-blue-600" />
                <span>Hire Purchase Agreement Terms</span>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Customer Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kasun Kalhara"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">NIC Number *</label>
                  <input
                    type="text"
                    placeholder="19928374928V"
                    value={customer.nic}
                    onChange={(e) => setCustomer({ ...customer, nic: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Phone *</label>
                  <input
                    type="text"
                    placeholder="0771234567"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Address</label>
                  <input
                    type="text"
                    placeholder="Colombo 03"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Installment Duration Dropdown (Including 0 Months) */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">No. of Installments</label>
                <select
                  value={installment.months}
                  onChange={(e) => setInstallment({ ...installment, months: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500"
                >
                  <option value={0}>0 Months (0% Interest / Full Cash Payment)</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={9}>9 Months</option>
                  <option value={12}>12 Months</option>
                  <option value={18}>18 Months</option>
                  <option value={24}>24 Months</option>
                </select>
              </div>

              {/* Down Payment & Interest Inputs with Leading Zero Sanitization */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Down Payment (Rs.)</label>
                  <input
                    type="number"
                    value={downPaymentStr}
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(/^0+(?=\d)/, '');
                      setDownPaymentStr(sanitized);
                    }}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Interest Rate (%)</label>
                  <input
                    type="number"
                    value={interestRateStr}
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(/^0+(?=\d)/, '');
                      setInterestRateStr(sanitized);
                    }}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Dynamic Live Calculations */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs space-y-1 font-medium text-slate-700">
                <div className="flex justify-between">
                  <span>Remaining Balance:</span>
                  <span className="font-bold">Rs. {hpRemainingBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Interest ({hpInterestRate}%):</span>
                  <span className="font-bold text-amber-600">+ Rs. {hpInterestAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Credit Payable:</span>
                  <span className="font-extrabold text-slate-900">Rs. {hpTotalPayable.toLocaleString()}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center text-sm font-extrabold text-blue-600">
                  <span>Monthly Installment:</span>
                  <span>
                    {hpMonths > 0 ? `Rs. ${hpMonthlyAmount.toLocaleString()} / mo` : 'Rs. 0'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Other Payment Methods Info */}
          {(paymentMethod === 'card' || paymentMethod === 'bank' || paymentMethod === 'koko_cheque') && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-900 uppercase">
                {paymentMethod === 'card' && '💳 POS Card Terminal Swipe'}
                {paymentMethod === 'bank' && '🏦 Direct Bank Transfer / Online Wire'}
                {paymentMethod === 'koko_cheque' && '📄 Koko Pay Later / Post-dated Cheque'}
              </p>
              <p>Verify payment approval on gateway terminal before confirming transaction.</p>
            </div>
          )}

          {/* ── Process Sale Button ── */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <span>Process Sale &amp; Print Bill</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* ── APPLY DISCOUNT MODAL (Fixed Layout & Non-Truncated) ── */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowDiscountModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Tag size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Apply Cart Discount</h3>
                <p className="text-xs text-slate-500">Configure percentage or fixed amount reduction</p>
              </div>
            </div>

            {/* Discount Type Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-5">
              <button
                onClick={() => setDiscountTypeInput('percentage')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5
                  ${discountTypeInput === 'percentage'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <Percent size={14} />
                Percentage (%)
              </button>
              <button
                onClick={() => setDiscountTypeInput('fixed')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5
                  ${discountTypeInput === 'fixed'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <DollarSign size={14} />
                Fixed Amount (Rs.)
              </button>
            </div>

            {/* Input Field (Fully Visible & Focused) */}
            <div className="mb-5">
              <label htmlFor={discountInputId} className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                {discountTypeInput === 'percentage' ? 'Discount Percentage (%)' : 'Discount Fixed Value (Rs.)'}
              </label>
              <div className="relative">
                <input
                  id={discountInputId}
                  type="number"
                  autoFocus
                  placeholder="0"
                  value={discountInputStr}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/^0+(?=\d)/, '');
                    setDiscountInputStr(sanitized);
                  }}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 font-extrabold text-lg text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                  {discountTypeInput === 'percentage' ? '%' : 'Rs.'}
                </span>
              </div>
            </div>

            {/* Live Preview */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Original Subtotal:</span>
                <span className="font-semibold text-slate-700">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount Deduction:</span>
                <span>
                  - Rs.{' '}
                  {(discountTypeInput === 'percentage'
                    ? Math.round((subtotal * sanitizeNumberInput(discountInputStr)) / 100)
                    : Math.min(subtotal, sanitizeNumberInput(discountInputStr))
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {discount.value > 0 && (
                <button
                  onClick={removeDiscount}
                  className="px-4 py-3 bg-rose-50 text-rose-600 font-bold text-sm rounded-2xl hover:bg-rose-100 transition-colors"
                >
                  Remove
                </button>
              )}
              <button
                onClick={applyDiscountModal}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition-colors"
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPLETED SALE / RECEIPT MODAL ── */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-200 my-8">
            {/* Header */}
            <div className="text-center pb-5 border-b border-dashed border-slate-200">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="font-extrabold text-slate-900 text-xl">Mobixa Receipt</h3>
              <p className="text-xs text-slate-500 font-mono">Invoice #{completedOrder.orderId}</p>
              <p className="text-[11px] text-slate-400">{completedOrder.date}</p>
            </div>

            {/* Items */}
            <div className="py-4 border-b border-dashed border-slate-200 space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Itemized Products</p>
              {completedOrder.cart.map((item: CartItem) => (
                <div key={item.product.id} className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="font-bold text-slate-900">
                    Rs. {(item.product.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Payment Summary */}
            <div className="py-4 border-b border-dashed border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>Rs. {completedOrder.subtotal.toLocaleString()}</span>
              </div>
              {completedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount Savings</span>
                  <span>- Rs. {completedOrder.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1">
                <span>Total Paid / Billed</span>
                <span className="text-blue-600">Rs. {completedOrder.finalTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>Payment Method</span>
                <span className="font-bold uppercase text-blue-600">{completedOrder.paymentMethod}</span>
              </div>

              {completedOrder.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Cash Tendered</span>
                    <span>Rs. {completedOrder.amountTendered.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>Change Returned</span>
                    <span>Rs. {completedOrder.cashChange.toLocaleString()}</span>
                  </div>
                </>
              )}

              {completedOrder.installment && (
                <div className="mt-3 bg-blue-50 rounded-2xl p-3 border border-blue-100 space-y-1 text-[11px] text-blue-900">
                  <p className="font-bold uppercase text-blue-800">Hire Purchase Terms Summary</p>
                  <p>Customer: {completedOrder.customer.name} (NIC: {completedOrder.customer.nic})</p>
                  <p>Down Payment Paid: Rs. {completedOrder.installment.downPayment.toLocaleString()}</p>
                  <p>Duration: {completedOrder.installment.months} Months @ {completedOrder.installment.interestRate}% Interest</p>
                  <p className="font-extrabold text-blue-700 text-xs">
                    Monthly Installment: Rs. {completedOrder.installment.monthlyAmount.toLocaleString()} / mo
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-5 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors"
              >
                <Printer size={16} />
                Print Bill
              </button>
              <button
                onClick={resetPos}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition-colors"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODERN FLOATING TOAST NOTIFICATION ── */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] max-w-sm w-full animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md transition-all ${
              toast.type === 'error'
                ? 'bg-slate-900/95 border-rose-500/80 text-white shadow-rose-900/30'
                : toast.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/80 text-white shadow-emerald-900/30'
                : 'bg-slate-900/95 border-blue-500/80 text-white shadow-blue-900/30'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                toast.type === 'error'
                  ? 'bg-rose-500/20 text-rose-400'
                  : toast.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {toast.type === 'error' && <AlertTriangle size={18} />}
              {toast.type === 'success' && <CheckCircle2 size={18} />}
              {toast.type === 'info' && <Info size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-sm leading-tight text-white">{toast.title}</p>
              <p className="text-xs text-slate-300 mt-1 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
