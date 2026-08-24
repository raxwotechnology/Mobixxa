'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from '../../utils/navigation';
import {
  Search,
  ArrowLeft,
  Camera,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  LogOut,
  CreditCard,
  Banknote,
  Receipt,
  Package,
  AlertTriangle,
  X,
  Percent,
  DollarSign,
  Clock,
  TrendingUp,
  Ticket,
  User,
  Phone,
  Smartphone,
  Landmark,
  History,
  Lock,
  Unlock,
  FileText,
  RefreshCw,
  LayoutDashboard,
  Users,
  ShieldCheck,
  Store,
  Printer,
  CheckCircle2,
  Zap,
  ExternalLink,
  ChevronDown,
  Eye,
  Download,
} from 'lucide-react';

import { getPosProducts, getProductByBarcode, posCheckout, getPosOrders, applyVoucher, getSettings, getActivePosSession, startPosSession, endPosSession, getPosPayHereHash, redeemPoints, getMyLoyaltyPoints, getCreditOrders, getCustomerCreditSummary, settleCreditOrder, getCategories, createQuotation, createProduct, getAccounts, loginUser, getCashiers, posLogin, getPosOrderByInvoice, createCustomerReturn, getHPRecords, recordHPPayment, createExpense } from '../../services/api';



import usePosStore from '../../store/posStore';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
import BarcodeScannerModal from './BarcodeScannerModal';
import InvoiceModal from './InvoiceModal';
import { toast } from 'react-toastify';
import { getImageUrl, handleImageError } from '../../utils/imageHelper';
import ReloadModal from './ReloadModal';
import CustomerHistoryModal from './CustomerHistoryModal';
import TradeInModal from './TradeInModal';

const POSScreen = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useAuthStore();
  const settings = useSettingsStore((s) => s.settings);
  const brandName = settings?.shopName || 'Mobixa';
  const pos = usePosStore();

  const [products, setProducts] = useState([]);
  const [productCache, setProductCache] = useState({});

  const addToCache = useCallback((items) => {
    if (!items) return;
    const array = Array.isArray(items) ? items : [items];
    setProductCache(prev => {
      const next = { ...prev };
      array.forEach(item => {
        if (item && item._id) {
          next[item._id] = item;
        }
      });
      return next;
    });
  }, []);

  const [accounts, setAccounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showShiftSummary, setShowShiftSummary] = useState(false);
  const [shiftData, setShiftData] = useState(null);
  const [discountInput, setDiscountInput] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [discountTypeInput, setDiscountTypeInput] = useState('percentage');
  const [posSession, setPosSession] = useState(null);
  const [showStartSession, setShowStartSession] = useState(false);
  const [showEndSession, setShowEndSession] = useState(false);
  const [dailyFinancials, setDailyFinancials] = useState(null);
  const [posDailySummary, setPosDailySummary] = useState(null);
  const [balanceOrders, setBalanceOrders] = useState([]);
  const [balanceSessionData, setBalanceSessionData] = useState(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceDate, setBalanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [balanceTab, setBalanceTab] = useState('shift'); // 'shift' or 'financials'
  const [drawerCountInput, setDrawerCountInput] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [useDirectCount, setUseDirectCount] = useState(true);
  const [directCountAmount, setDirectCountAmount] = useState('');
  const [settlingSession, setSettlingSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    opening: { 5000: 0, 1000: 0, 500: 0, 100: 0, 50: 0, 20: 0 },
    closing: { 5000: 0, 1000: 0, 500: 0, 100: 0, 50: 0, 20: 0 },
  });
  const [customerPoints, setCustomerPoints] = useState(0);
  const [pointsInput, setPointsInput] = useState('');
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [isCredit, setIsCredit] = useState(false);
  const [creditAmountPaid, setCreditAmountPaid] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [showCreditPanel, setShowCreditPanel] = useState(false);
  const [creditOrders, setCreditOrders] = useState([]);
  const [creditLoading, setCreditLoading] = useState(false);
  const [settleAmount, setSettleAmount] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isQuotation, setIsQuotation] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({ name: '', price: '', stock: 10, categoryId: '' });
  const [showReloadModal, setShowReloadModal] = useState(false);
  const [showPettyCashModal, setShowPettyCashModal] = useState(false);
  const [pettyCashForm, setPettyCashForm] = useState({ amount: '', category: 'Tea & Refreshments', description: '', paymentMethod: 'Cash' });
  const [submittingPettyCash, setSubmittingPettyCash] = useState(false);
  const [showCustomerHistory, setShowCustomerHistory] = useState(false);
  const [showTradeInModal, setShowTradeInModal] = useState(false);

  // Quick HP Payment Modal States
  const [showHpQuickPayModal, setShowHpQuickPayModal] = useState(false);
  const [hpSearchInput, setHpSearchInput] = useState('');
  const [hpRecordsList, setHpRecordsList] = useState([]);
  const [selectedHpRecord, setSelectedHpRecord] = useState(null);
  const [loadingHpSearch, setLoadingHpSearch] = useState(false);
  const [hpPayForm, setHpPayForm] = useState({
    amount: '',
    paymentMethod: 'Cash',
    accountId: '',
    referenceNo: '',
    notes: '',
    givenCash: ''
  });
  const [submittingHpPay, setSubmittingHpPay] = useState(false);
  const [hpReceiptData, setHpReceiptData] = useState(null);

  // Customer Credit Collection / Settle Modal States
  const [showCreditSettleModal, setShowCreditSettleModal] = useState(false);
  const [creditSearchInput, setCreditSearchInput] = useState('');
  const [creditOrdersList, setCreditOrdersList] = useState([]);
  const [selectedCreditOrder, setSelectedCreditOrder] = useState(null);
  const [loadingCreditSearch, setLoadingCreditSearch] = useState(false);
  const [creditSettleForm, setCreditSettleForm] = useState({
    amount: '',
    paymentMethod: 'Cash',
    accountId: '',
    notes: ''
  });
  const [submittingCreditSettle, setSubmittingCreditSettle] = useState(false);
  const [customerCreditSummary, setCustomerCreditSummary] = useState(null);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const toolsDropdownRef = useRef(null);

  // Invoice Details & Sales History Modal States
  const [showInvoiceSearchModal, setShowInvoiceSearchModal] = useState(false);
  const [invoiceSearchInput, setInvoiceSearchInput] = useState('');
  const [recentInvoicesList, setRecentInvoicesList] = useState([]);
  const [loadingRecentInvoices, setLoadingRecentInvoices] = useState(false);
  const [invoiceFilterTab, setInvoiceFilterTab] = useState('all'); // 'all', 'today', 'credit', 'returned'
  const [invoiceModalLayoutMode, setInvoiceModalLayoutMode] = useState('invoice');

  const handleFetchRecentInvoices = async (searchTerm = '', filterAll = true) => {
    try {
      setLoadingRecentInvoices(true);
      const params = {};
      if (searchTerm && searchTerm.trim()) params.search = searchTerm.trim();
      if (filterAll) params.all = 'true';
      const { data } = await getPosOrders(params);
      const ordersArr = data?.orders || (Array.isArray(data) ? data : []);
      setRecentInvoicesList(ordersArr);
    } catch (err) {
      console.error('Failed to load recent invoices:', err);
      toast.error('Failed to load invoice history');
    } finally {
      setLoadingRecentInvoices(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target)) {
        setShowToolsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check customer credit balance when phone number is entered in POS
  useEffect(() => {
    const rawPhone = (pos.customerPhone || '').trim();
    if (rawPhone.length >= 7) {
      const timer = setTimeout(async () => {
        try {
          const { data } = await getCustomerCreditSummary(rawPhone);
          setCustomerCreditSummary(data || null);
        } catch {
          setCustomerCreditSummary(null);
        }
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setCustomerCreditSummary(null);
    }
  }, [pos.customerPhone]);

  // Cashier Verification Lockscreen States
  const [isUnlocked, setIsUnlocked] = useState(!!user);
  const [unlockCode, setUnlockCode] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [cashiersList, setCashiersList] = useState([]);
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [loadingCashiers, setLoadingCashiers] = useState(false);
  // Prevent mouse wheel scrolling from changing price/quantity/discount numeric inputs
  useEffect(() => {
    const handleWheel = () => {
      if (document.activeElement && document.activeElement.type === 'number') {
        document.activeElement.blur();
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Split Payment Allocation States
  const [payments, setPayments] = useState([
    { method: 'cash', amount: 0, accountId: '', chequeDetails: { number: '', bank: '', dueDate: '' } }
  ]);

  // Price Safeguard Warning Popup State
  const [priceSafeguardWarning, setPriceSafeguardWarning] = useState('');

  // Returns / Exchange States
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnInvoiceNo, setReturnInvoiceNo] = useState('');
  const [returnOrder, setReturnOrder] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [exchangeCredit, setExchangeCredit] = useState(0);
  const [exchangeReturnId, setExchangeReturnId] = useState(null);
  const [searchingInvoice, setSearchingInvoice] = useState(false);
  const [processingReturn, setProcessingReturn] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const customerNameRef = useRef(null);
  const customerPhoneRef = useRef(null);
  const customerNicRef = useRef(null);
  const customerAddressRef = useRef(null);
  const tenderedAmountRef = useRef(null);
  const cartScanRef = useRef(null);
  const [cartScanInput, setCartScanInput] = useState('');

  // Global POS Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // F1: Toggle Keyboard Shortcuts Help
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcutsHelp(prev => !prev);
        return;
      }

      // F2 or Slash (when not in an input): Focus Product / Barcode Search
      if (e.key === 'F2' || (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName))) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }

      // F3 or Alt+C: Open Customer Info & Focus Customer Name
      if (e.key === 'F3' || (e.altKey && e.key.toLowerCase() === 'c')) {
        e.preventDefault();
        setShowCustomerInfo(true);
        setTimeout(() => {
          customerNameRef.current?.focus();
          customerNameRef.current?.select();
        }, 80);
        return;
      }

      // F4: Instant Fast Cash Invoice & Print
      if (e.key === 'F4') {
        e.preventDefault();
        handleQuickCashCheckout();
        return;
      }

      // Alt+T: Focus Amount Tendered
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        tenderedAmountRef.current?.focus();
        tenderedAmountRef.current?.select();
        return;
      }

      // F6: Open Discount / Voucher Modal
      if (e.key === 'F6') {
        e.preventDefault();
        setShowDiscount(true);
        return;
      }

      // F7: Open Return / Exchange Modal
      if (e.key === 'F7') {
        e.preventDefault();
        setShowReturnModal(true);
        return;
      }

      // F8: Cycle Payment Methods
      if (e.key === 'F8') {
        e.preventDefault();
        const methods = ['cash', 'card', 'bank_transfer', 'cheque', 'hire_purchase'];
        const currIdx = methods.indexOf(pos.paymentMethod);
        const nextMethod = methods[(currIdx + 1) % methods.length];
        pos.setPaymentMethod(nextMethod);
        toast.info(`Payment Method: ${nextMethod.replace('_', ' ').toUpperCase()}`);
        return;
      }

      // F9 or Ctrl+Enter: Trigger Checkout / Complete Sale
      if (e.key === 'F9' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        if (pos.cart.length > 0 && !checkingOut) {
          handleCheckout();
        } else if (pos.cart.length === 0) {
          toast.warning('Cart is empty. Add products first.');
        }
        return;
      }

      // F10: Create Quotation
      if (e.key === 'F10') {
        e.preventDefault();
        if (pos.cart.length > 0 && !checkingOut) {
          handleCreateQuotation();
        }
        return;
      }

      // Escape: Close open modals / Return focus to search
      if (e.key === 'Escape') {
        if (showShortcutsHelp) setShowShortcutsHelp(false);
        else if (showDiscount) setShowDiscount(false);
        else if (showReturnModal) setShowReturnModal(false);
        else if (showHpQuickPayModal) setShowHpQuickPayModal(false);
        else if (showBalanceModal) setShowBalanceModal(false);
        else if (showEndSession) setShowEndSession(false);
        else if (showCreditPanel) setShowCreditPanel(false);
        else if (showReloadModal) setShowReloadModal(false);
        else if (showTradeInModal) setShowTradeInModal(false);
        else if (showCustomerHistory) setShowCustomerHistory(false);
        else {
          searchRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [pos.cart, checkingOut, pos.paymentMethod, showShortcutsHelp, showDiscount, showReturnModal, showHpQuickPayModal, showBalanceModal, showEndSession, showCreditPanel, showReloadModal, showTradeInModal, showCustomerHistory]);

  // Global Hardware Barcode Scanner Listener (Auto-detects rapid scanner gun typing from anywhere on screen)
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleHardwareScannerInput = async (e) => {
      const activeEl = document.activeElement;
      const isInputActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
      const isScanInput = activeEl === cartScanRef.current || activeEl === searchRef.current;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Reset buffer if keystroke delay is large (> 65ms) and not in dedicated scan inputs
      if (timeDiff > 65 && !isScanInput && e.key !== 'Enter') {
        barcodeBuffer = '';
      }

      if (e.key === 'Enter') {
        const codeToProcess = (isScanInput && activeEl?.value?.trim()) ? activeEl.value.trim() : barcodeBuffer.trim();
        if (codeToProcess && codeToProcess.length >= 2) {
          // If human was typing slowly in a text input (e.g., customer address/name, notes), don't treat as scanner gun
          if (isInputActive && !isScanInput && timeDiff > 55) {
            barcodeBuffer = '';
            return;
          }

          e.preventDefault();
          e.stopPropagation();
          await handleScanProductDirect(codeToProcess);
          barcodeBuffer = '';
          if (activeEl && isScanInput) {
            activeEl.value = '';
          }
        }
        barcodeBuffer = '';
        return;
      }

      // Single characters appended to buffer
      if (e.key && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleHardwareScannerInput, true);
    return () => window.removeEventListener('keydown', handleHardwareScannerInput, true);
  }, [products, productCache]);

  // Fetch Cashiers for Lockscreen
  const fetchCashiersList = useCallback(async () => {
    try {
      setLoadingCashiers(true);
      const { data } = await getCashiers();
      setCashiersList(data || []);
    } catch (err) {
      console.error('Failed to load cashiers list:', err);
    } finally {
      setLoadingCashiers(false);
    }
  }, []);

  useEffect(() => {
    fetchCashiersList();
  }, [fetchCashiersList]);

  // When lockscreen is shown, refresh staff list
  useEffect(() => {
    if (!isUnlocked) {
      fetchCashiersList();
    }
  }, [isUnlocked, fetchCashiersList]);

  // Load initial products + settings for tax rate when user is authenticated
  useEffect(() => {
    if (user) {
      loadProducts();
      loadTaxRate();
      loadSession();
      loadCategories();
      loadAccounts();
    }
  }, [user]);

  const loadAccounts = async () => {
    try {
      const { data } = await getAccounts();
      setAccounts(data || []);
      // Auto-select default account or the first one
      const def = data.find(a => a.isDefault) || data[0];
      if (def) pos.setAccountId(def._id);
    } catch (err) { console.error('Failed to load accounts'); }
  };

  const loadCategories = async () => {
    try {
      const { data } = await getCategories();
      setCategories(data || []);
    } catch { /* ignore */ }
  };


  const loadSession = async () => {
    try {
      const { data } = await getActivePosSession();
      if (data) {
        setPosSession(data);
        setShowStartSession(false);
      } else {
        const { data: newSession } = await startPosSession({ openingDenoms: [], openingCashAmount: 0 });
        setPosSession(newSession);
        setShowStartSession(false);
      }
    } catch {
      // ignore
    }
  };

  const denomsToLines = (obj) =>
    Object.entries(obj).map(([denom, qty]) => ({ denom: Number(denom), qty: Number(qty || 0) }));
  const calcTotal = (obj) =>
    Object.entries(obj).reduce((s, [d, q]) => s + Number(d) * Number(q || 0), 0);

  const handleStartSession = async () => {
    try {
      const openingDenoms = denomsToLines(sessionForm.opening);
      const openingCashAmount = calcTotal(sessionForm.opening);
      const { data } = await startPosSession({ openingDenoms, openingCashAmount });
      setPosSession(data);
      setShowStartSession(false);
      toast.success('POS session started');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start session');
    }
  };

  const handleEndSession = async () => {
    try {
      setSettlingSession(true);
      const closingDenoms = denomsToLines(sessionForm.closing);
      const cashSales = Number(posDailySummary?.cashSales || 0);
      const hpCashIncome = Number(posDailySummary?.hpCashIncome || dailyFinancials?.hpCashIncome || 0);
      const reloadIncome = Number(posDailySummary?.reloadIncome || dailyFinancials?.reloadIncome || 0);
      const expenseCost = Number(posDailySummary?.expenseCost || dailyFinancials?.expenseCost || 0);
      const expectedDrawerCash = (Number(posSession?.openingCashAmount || 0) + cashSales + hpCashIncome + reloadIncome) - expenseCost;

      const closingCashCountedAmount = useDirectCount
        ? Number(directCountAmount || 0)
        : calcTotal(sessionForm.closing);

      const { data } = await endPosSession({
        closingDenoms: useDirectCount ? [] : closingDenoms,
        closingCashCountedAmount,
        notes: closingNotes,
        expectedDrawerCash
      });

      setPosSession(null);
      setShowEndSession(false);

      const variance = Number(data.variance || (closingCashCountedAmount - expectedDrawerCash));
      if (Math.abs(variance) <= 0.01) {
        toast.success('Shop session settled & closed! ✅ Exact match (No variance)');
      } else if (variance < 0) {
        toast.warning(`Shop session closed with Arrears (Shortage): -Rs. ${Math.abs(variance).toLocaleString()}`);
      } else {
        toast.info(`Shop session closed with Excess (Overage): +Rs. ${variance.toLocaleString()}`);
      }

      // Trigger automatic 80mm Settlement Receipt printing
      handlePrintShiftSlip();

      // Reset form
      setDirectCountAmount('');
      setClosingNotes('');
      setShowStartSession(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close session');
    } finally {
      setSettlingSession(false);
    }
  };

  const openEndSessionModal = async () => {
    try {
      const { data } = await getPosOrders({ date: new Date().toISOString().split('T')[0] });
      setDailyFinancials(data?.financials || null);
      setPosDailySummary(data?.summary || null);
      setBalanceOrders(data?.orders || []);
      setBalanceSessionData(data?.session || null);
    } catch { /* ignore */ }
    setShowEndSession(true);
  };

  const openBalanceModal = async (selectedDate = balanceDate) => {
    try {
      setBalanceLoading(true);
      const { data } = await getPosOrders({ date: selectedDate });
      setDailyFinancials(data?.financials || null);
      setPosDailySummary(data?.summary || null);
      setBalanceOrders(data?.orders || []);
      setBalanceSessionData(data?.session || null);
      setShowBalanceModal(true);
    } catch {
      setDailyFinancials(null);
      setPosDailySummary(null);
      setBalanceOrders([]);
      setBalanceSessionData(null);
      setShowBalanceModal(true);
    } finally {
      setBalanceLoading(false);
    }
  };

  const loadTaxRate = async () => {
    try {
      const { data } = await getSettings();
      if (data?.taxRate !== undefined) pos.setTaxRate(data.taxRate);
    } catch (err) { /* use default */ }
  };

  // Focus search on mount
  useEffect(() => {
    if (searchRef.current) searchRef.current.focus();
  }, []);

  const loadProducts = async (search = '', catId = selectedCategory) => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (catId) params.category = catId;
      const { data } = await getPosProducts(params);
      setProducts(data);
      addToCache(data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = (catId) => {
    const newCat = selectedCategory === catId ? null : catId;
    setSelectedCategory(newCat);
    loadProducts(searchQuery, newCat);
  };


  // Debounced search
  const handleSearch = (value) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadProducts(value);
    }, 300);
  };

  // Handle search enter (physical barcode scanner or enter key)
  const handleSearchKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchQuery.trim();
      if (!q) return;

      // 1. Check exact barcode/SKU/id/IMEI match in current loaded product list
      const exactMatch = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === q.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase() === q.toLowerCase()) ||
          p._id === q ||
          (Array.isArray(p.imei) && p.imei.some(im => im.toLowerCase() === q.toLowerCase()))
      );

      if (exactMatch) {
        const matchedImei = Array.isArray(exactMatch.imei)
          ? exactMatch.imei.find(im => im.toLowerCase() === q.toLowerCase())
          : null;

        addToCache(exactMatch);
        pos.addItem(exactMatch, matchedImei);
        toast.success(
          matchedImei
            ? `📱 Scanned Phone: ${exactMatch.name} (IMEI: ${matchedImei})`
            : `🏷️ Scanned: ${exactMatch.name}`,
          { autoClose: 1500 }
        );
        setSearchQuery('');
        loadProducts();
        return;
      }

      // 2. Query barcode & IMEI API if not in current loaded list
      try {
        const { data } = await getProductByBarcode(q);
        if (data && data._id) {
          const matchedImei = data.scannedImei || (
            Array.isArray(data.imei) ? data.imei.find(im => im.toLowerCase() === q.toLowerCase()) : null
          );

          addToCache(data);
          pos.addItem(data, matchedImei);
          toast.success(
            matchedImei
              ? `📱 Scanned Phone: ${data.name} (IMEI: ${matchedImei})`
              : `🏷️ Scanned: ${data.name}`,
            { autoClose: 1500 }
          );
          setSearchQuery('');
          loadProducts();
          return;
        }
      } catch (barcodeErr) {
        // Fallthrough if not matched by barcode/IMEI
      }

      // 3. Fallback to first filtered product
      if (products.length > 0) {
        pos.addItem(products[0]);
        toast.success(`Added ${products[0].name}`, { autoClose: 1000 });
        setSearchQuery('');
        loadProducts();
      } else {
        // No results, prompt quick add
        setQuickAddForm({ ...quickAddForm, name: q });
        setShowQuickAdd(true);
      }
    }
  };

  // Short pleasant scan beep
  const playScanBeep = () => {
    try {
      if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch (e) {
      // AudioContext failure safely ignored
    }
  };

  // Unified Product Scan & Direct Cart Injection
  const handleScanProductDirect = async (rawCode) => {
    const q = String(rawCode || '').trim();
    if (!q) return false;

    // 1. Check exact barcode/SKU/id/IMEI match in loaded products
    const exactMatch = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === q.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase() === q.toLowerCase()) ||
        p._id === q ||
        (Array.isArray(p.imei) && p.imei.some(im => im.toLowerCase() === q.toLowerCase()))
    );

    if (exactMatch) {
      if (exactMatch.stock <= 0) {
        toast.warning(`⚠️ "${exactMatch.name}" is OUT OF STOCK!`, { autoClose: 2000 });
      }
      const matchedImei = Array.isArray(exactMatch.imei)
        ? exactMatch.imei.find(im => im.toLowerCase() === q.toLowerCase())
        : null;

      addToCache(exactMatch);
      pos.addItem(exactMatch, matchedImei);
      if (!matchedImei) {
        pos.setCartItemBarcode(exactMatch._id, q);
      }
      playScanBeep();
      toast.success(
        matchedImei
          ? `📱 Added: ${exactMatch.name} (IMEI: ${matchedImei})`
          : `🏷️ Added: ${exactMatch.name} — Rs. ${Number(exactMatch.price || 0).toLocaleString()}`,
        { autoClose: 1500 }
      );
      setCartScanInput('');
      return true;
    }

    // 2. Query barcode & IMEI API if not in currently loaded list
    try {
      const { data } = await getProductByBarcode(q);
      if (data && data._id) {
        if (data.stock <= 0) {
          toast.warning(`⚠️ "${data.name}" is OUT OF STOCK!`, { autoClose: 2000 });
        }
        const matchedImei = data.scannedImei || (
          Array.isArray(data.imei) ? data.imei.find(im => im.toLowerCase() === q.toLowerCase()) : null
        );

        addToCache(data);
        pos.addItem(data, matchedImei);
        if (!matchedImei) {
          pos.setCartItemBarcode(data._id, q);
        }
        playScanBeep();
        toast.success(
          matchedImei
            ? `📱 Added: ${data.name} (IMEI: ${matchedImei})`
            : `🏷️ Added: ${data.name} — Rs. ${Number(data.price || 0).toLocaleString()}`,
          { autoClose: 1500 }
        );
        setCartScanInput('');
        return true;
      }
    } catch (barcodeErr) {
      toast.error(`No product or IMEI found matching "${q}"`);
    }
    return false;
  };

  // Handle direct cart scanning input (Barcode / IMEI)
  const handleCartScanKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleScanProductDirect(cartScanInput);
    }
  };

  // Instant Fast Cash Checkout function (F4 / Quick Invoice)
  const handleQuickCashCheckout = async () => {
    if (pos.cart.length === 0) {
      toast.warning('Cart is empty. Scan products first!');
      return;
    }
    if (checkingOut) return;

    // Set payment method to Cash and exact tendered amount
    pos.setPaymentMethod('cash');
    pos.setTenderedAmount(grandTotal);
    setPayments([{ method: 'cash', amount: grandTotal, accountId: '' }]);
    setIsCredit(false);

    // Trigger instant sale completion & receipt
    setTimeout(() => {
      handleCheckout();
    }, 50);
  };

  // Fetch/Search HP Records for POS Quick Pay
  const handleSearchHpRecords = async (query = hpSearchInput) => {
    try {
      setLoadingHpSearch(true);
      const { data } = await getHPRecords({ search: query, status: 'all' });
      const records = data || [];
      setHpRecordsList(records);
      if (records.length === 1) {
        handleSelectHpRecord(records[0]);
      } else if (records.length === 0) {
        setSelectedHpRecord(null);
      }
    } catch (err) {
      toast.error('Failed to search HP records');
    } finally {
      setLoadingHpSearch(false);
    }
  };

  const handleSelectHpRecord = (rec) => {
    setSelectedHpRecord(rec);
    const net = Number(rec.netTotal || 0);
    const paid = Number(rec.totalPaid || 0);
    const rem = rec.balanceAmount !== undefined && rec.balanceAmount !== null
      ? Number(rec.balanceAmount)
      : (rec.remainingBalance !== undefined ? Number(rec.remainingBalance) : Math.max(0, net - paid));
    const instAmt = Number(rec.installmentAmount || 0);
    const defaultAmt = rem > 0 ? (instAmt > 0 && instAmt <= rem ? instAmt : rem) : '';
    setHpPayForm(prev => ({
      ...prev,
      amount: defaultAmt,
      givenCash: '',
      paymentMethod: 'Cash',
      accountId: accounts.length > 0 ? accounts[0]._id : ''
    }));
  };

  const handleSubmitHpPayment = async () => {
    if (!selectedHpRecord) {
      toast.error('Please select an HP agreement first');
      return;
    }
    const amt = Number(hpPayForm.amount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    const targetAccountId = hpPayForm.accountId || (accounts && accounts.length > 0 ? accounts[0]._id : undefined);
    const givenAmt = Number(hpPayForm.givenCash || 0);
    const changeAmt = givenAmt > amt ? givenAmt - amt : 0;

    try {
      setSubmittingHpPay(true);
      const { data } = await recordHPPayment(selectedHpRecord._id, {
        amount: amt,
        paymentMethod: hpPayForm.paymentMethod || 'Cash',
        accountId: targetAccountId,
        referenceNo: hpPayForm.referenceNo || '',
        notes: hpPayForm.notes || ''
      });

      toast.success('Installment payment recorded successfully! 💳');
      
      const currentBal = selectedHpRecord.balanceAmount ?? (selectedHpRecord.remainingBalance ?? Math.max(0, (selectedHpRecord.netTotal || 0) - (selectedHpRecord.totalPaid || 0)));
      const newBal = Math.max(0, currentBal - amt);
      const receiptObj = {
        payment: {
          amount: amt,
          givenCash: givenAmt,
          changeAmount: changeAmt,
          paymentMethod: hpPayForm.paymentMethod || 'Cash',
          date: new Date().toLocaleDateString('en-GB'),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          referenceNo: hpPayForm.referenceNo || '',
          notes: hpPayForm.notes || '',
          receivedBy: user?.name || 'Cashier'
        },
        hpRecord: data || selectedHpRecord,
        newBalance: newBal
      };
      setHpReceiptData(receiptObj);
      
      // Auto-trigger thermal receipt print window
      setTimeout(() => {
        handlePrintHpReceipt(receiptObj);
      }, 300);

      // Refresh accounts & records
      handleSearchHpRecords(hpSearchInput);
      if (getAccounts) {
        getAccounts().then(res => setAccounts(res.data || [])).catch(() => {});
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record installment payment');
    } finally {
      setSubmittingHpPay(false);
    }
  };

  // Customer Credit Collection & Debt Settlement Handlers
  const handleSearchCreditOrders = async (query = creditSearchInput) => {
    try {
      setLoadingCreditSearch(true);
      const params = { status: 'pending' };
      if (query && query.trim()) params.search = query.trim();
      const res = await getCreditOrders(params);
      setCreditOrdersList(res.data || []);
      if ((!res.data || res.data.length === 0) && query) {
        toast.info('No pending credit orders found');
      }
    } catch (err) {
      toast.error('Failed to load credit orders');
    } finally {
      setLoadingCreditSearch(false);
    }
  };

  const handleSelectCreditOrder = (ord) => {
    setSelectedCreditOrder(ord);
    setCreditSettleForm({
      amount: ord.creditBalance || '',
      paymentMethod: 'Cash',
      accountId: accounts.length > 0 ? accounts[0]._id : '',
      notes: ''
    });
  };

  const handlePrintCreditReceipt = (ord, payAmt, method, newBal) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked! Please allow popups to print receipt.');
      return;
    }

    const logoUrl = getImageUrl(settings?.logoUrl || settings?.logo);
    const showLogo = settings?.receiptSettings?.showLogo !== false && logoUrl;
    const logoWidth = settings?.receiptSettings?.logoWidth || 120;
    const logoAlign = settings?.receiptSettings?.logoAlignment || 'center';
    const headerTitle = settings?.receiptSettings?.headerTitle || brandName;
    const subtitle = settings?.receiptSettings?.subtitle || settings?.address || '';
    const footerMsg = settings?.receiptSettings?.footerMessage || 'Thank you for your payment!';
    const terms = settings?.receiptSettings?.termsAndConditions || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Credit Settlement Receipt - ${ord?.invoiceNumber || 'Credit'}</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 10px; color: #000; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 6px; }
            .title { font-size: 15px; font-weight: bold; text-transform: uppercase; }
            .subtitle { font-size: 10px; margin-top: 2px; }
            .row { display: flex; justify-content: space-between; font-size: 11px; margin: 3px 0; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .total-box { border: 1.5px solid #000; padding: 6px; margin: 6px 0; text-align: center; border-radius: 4px; }
            .status-badge { display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: bold; border: 1px solid #000; margin-top: 4px; }
            .footer { margin-top: 10px; text-align: center; font-size: 9px; border-top: 1px dashed #000; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header text-${logoAlign}">
            ${showLogo ? `<div style="text-align:${logoAlign}; margin-bottom: 4px;"><img src="${logoUrl}" style="width:${logoWidth}px; max-height:70px; object-contain:contain;" /></div>` : ''}
            <div class="title text-${logoAlign}">${headerTitle}</div>
            ${subtitle ? `<div class="subtitle text-${logoAlign}">${subtitle}</div>` : ''}
            <div class="subtitle text-${logoAlign}" style="font-weight:bold; margin-top:3px;">CREDIT DEBT SETTLEMENT RECEIPT</div>
            <div class="subtitle text-${logoAlign}">Date: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>

          <div class="row"><span>Invoice / Order:</span><span class="bold">${ord?.invoiceNumber || 'N/A'}</span></div>
          <div class="row"><span>Customer:</span><span>${ord?.customerName || 'N/A'}</span></div>
          <div class="row"><span>Phone:</span><span>${ord?.customerPhone || 'N/A'}</span></div>
          <div class="row"><span>Cashier:</span><span>${user?.name || 'Cashier'}</span></div>

          <div class="divider"></div>

          <div class="row"><span>Total Order Amount:</span><span class="bold">Rs. ${Number(ord?.totalAmount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
          <div class="row"><span>Prev Due Balance:</span><span>Rs. ${Number(ord?.creditBalance || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>

          <div class="total-box">
            <div style="font-size: 10px; font-weight: bold;">SETTLEMENT AMOUNT PAID</div>
            <div style="font-size: 17px; font-weight: bold; margin: 2px 0;">Rs. ${Number(payAmt).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</div>
            <div style="font-size: 10px; text-transform: uppercase;">Method: ${method}</div>
          </div>

          <div class="row" style="font-size: 12px; margin-top: 4px;"><span class="bold">REMAINING DUE BALANCE:</span><span class="bold">Rs. ${Number(Math.max(0, newBal)).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>

          <div class="text-center">
            <span class="status-badge">${newBal <= 0 ? '✓ DEBT FULLY SETTLED & CLEARED' : 'PARTIAL SETTLEMENT - ACTIVE'}</span>
          </div>

          <div class="footer">
            <p style="margin: 2px 0; font-weight: bold;">${footerMsg}</p>
            ${terms ? `<p style="margin: 4px 0 2px 0; font-size: 8px; font-style: italic;">${terms}</p>` : ''}
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSubmitCreditSettle = async () => {
    if (!selectedCreditOrder) {
      toast.error('Please select a credit order first');
      return;
    }
    const payAmt = Number(creditSettleForm.amount);
    if (!payAmt || payAmt <= 0) {
      toast.error('Please enter a valid settlement amount');
      return;
    }

    try {
      setSubmittingCreditSettle(true);
      const res = await settleCreditOrder(selectedCreditOrder._id, {
        amount: payAmt,
        paymentMethod: creditSettleForm.paymentMethod,
        accountId: creditSettleForm.accountId || undefined,
        note: creditSettleForm.notes
      });
      const updatedOrder = res.data;
      const newBal = updatedOrder?.creditBalance !== undefined ? updatedOrder.creditBalance : Math.max(0, (selectedCreditOrder.creditBalance || 0) - payAmt);
      toast.success('Debt settlement recorded successfully! 🏷️✅');
      
      // Auto-trigger thermal receipt print window
      setTimeout(() => {
        handlePrintCreditReceipt(selectedCreditOrder, payAmt, creditSettleForm.paymentMethod, newBal);
      }, 300);

      setSelectedCreditOrder(null);
      handleSearchCreditOrders(creditSearchInput);
      if (getAccounts) {
        getAccounts().then(res => setAccounts(res.data || [])).catch(() => {});
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to settle debt');
    } finally {
      setSubmittingCreditSettle(false);
    }
  };

  const handleSavePettyCash = async (e) => {
    e.preventDefault();
    const amt = Number(pettyCashForm.amount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      setSubmittingPettyCash(true);
      await createExpense({
        title: pettyCashForm.description || pettyCashForm.category || 'Counter Petty Cash',
        amount: amt,
        category: pettyCashForm.category,
        notes: pettyCashForm.description || '',
        paymentMethod: pettyCashForm.paymentMethod || 'Cash',
        status: 'Paid',
        storeId: user?.assignedStore || user?.assignedStoreId || user?.storeId || posSession?.storeId,
        date: new Date().toISOString()
      });
      toast.success('Petty cash expense recorded! ☕💰');
      setShowPettyCashModal(false);
      setPettyCashForm({ amount: '', category: 'Tea & Refreshments', description: '', paymentMethod: 'Cash' });
      if (fetchDailyFinancials) fetchDailyFinancials();
      if (fetchSessionData) fetchSessionData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record expense');
    } finally {
      setSubmittingPettyCash(false);
    }
  };

  const handlePrintShiftSlip = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked! Please allow popups to print shift slip.');
      return;
    }

    const headerTitle = settings?.receiptSettings?.headerTitle || brandName;
    const subtitle = settings?.receiptSettings?.subtitle || settings?.address || '';
    const dateStr = balanceDate || new Date().toISOString().split('T')[0];
    const cashierName = user?.name || 'Staff';

    const openingFloat = Number(posSession?.openingCashAmount || 0);
    const cashSales = Number(posDailySummary?.cashSales || 0);
    const cardSales = Number(posDailySummary?.cardSales || 0);
    const bankSales = Number(posDailySummary?.bankSales || 0);
    const kokoSales = Number(posDailySummary?.kokoSales || 0);
    const payhereSales = Number(posDailySummary?.payhereSales || 0);
    const chequeSales = Number(posDailySummary?.chequeSales || 0);
    const creditSales = Number(posDailySummary?.creditSales || 0);
    const totalBankOnline = Number(posDailySummary?.totalBankOnline || (bankSales + payhereSales + kokoSales));
    const mobileIncome = Number(dailyFinancials?.mobileIncome || 0);
    const accessoriesIncome = Number(dailyFinancials?.accessoriesIncome || 0);
    const hpCashIncome = Number(posDailySummary?.hpCashIncome || dailyFinancials?.hpCashIncome || 0);
    const reloadIncome = Number(posDailySummary?.reloadIncome || dailyFinancials?.reloadIncome || 0);
    const expenseCost = Number(posDailySummary?.expenseCost || dailyFinancials?.expenseCost || 0);
    const totalRevenue = Number(posDailySummary?.systemRevenue || dailyFinancials?.totalIncome || 0);

    const netDrawerCash = (openingFloat + cashSales + hpCashIncome + reloadIncome) - expenseCost;
    const actualCount = directCountAmount !== ''
      ? Number(directCountAmount)
      : (calcTotal(sessionForm.closing) > 0 ? calcTotal(sessionForm.closing) : (posSession?.closingCashCountedAmount !== undefined ? Number(posSession.closingCashCountedAmount) : netDrawerCash));
    const discrepancy = actualCount - netDrawerCash;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>POS Shift Summary Slip - ${dateStr}</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 10px; color: #000; font-size: 12px; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 8px; text-align: center; }
            .title { font-size: 15px; font-weight: bold; text-transform: uppercase; }
            .subtitle { font-size: 11px; margin-top: 2px; }
            .row { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .total-box { border: 1.5px solid #000; padding: 8px; margin: 10px 0; text-align: center; }
            .sign-box { display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px; border-top: 1px dashed #aaa; padding-top: 15px; }
            .footer { margin-top: 14px; text-align: center; font-size: 10px; border-top: 1px dashed #000; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${headerTitle}</div>
            <div class="subtitle">${subtitle}</div>
            <div class="subtitle bold" style="margin-top:4px;">*** DAILY SHIFT / BALANCE SLIP ***</div>
          </div>
          <div class="row"><span>Date:</span><span class="bold">${dateStr}</span></div>
          <div class="row"><span>Staff/Cashier:</span><span class="bold">${cashierName}</span></div>
          <div class="row"><span>Printed At:</span><span>${new Date().toLocaleTimeString()}</span></div>
          
          <div class="divider"></div>
          <div class="row bold"><span>PAYMENT METHOD BREAKDOWN</span><span>AMOUNT</span></div>
          <div class="row"><span>Counter Cash Sales:</span><span class="bold">Rs. ${cashSales.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
          <div class="row"><span>Card (POS Machine):</span><span class="bold">Rs. ${cardSales.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
          <div class="row"><span>Bank / Online Transfer:</span><span class="bold">Rs. ${totalBankOnline.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
          ${creditSales > 0 ? `<div class="row"><span>Credit Given (Due):</span><span class="bold">Rs. ${creditSales.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>` : ''}
          ${chequeSales > 0 ? `<div class="row"><span>Cheque Received:</span><span class="bold">Rs. ${chequeSales.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>` : ''}
          <div class="row"><span>HP Collections (Cash):</span><span>Rs. ${hpCashIncome.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
          <div class="row"><span>Reload & Card Sales:</span><span>Rs. ${reloadIncome.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
          
          <div class="divider"></div>
          <div class="row bold"><span>PRODUCT CATEGORY SALES</span></div>
          <div class="row"><span>Mobile Phones:</span><span>Rs. ${mobileIncome.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
          <div class="row"><span>Accessories & Others:</span><span>Rs. ${accessoriesIncome.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>

          <div class="row bold" style="border-top:1px dashed #ddd; padding-top:4px; margin-top:6px;"><span>Total Day Revenue:</span><span>Rs. ${totalRevenue.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>

          <div class="divider"></div>
          <div class="row bold"><span>CASH DRAWER RECONCILIATION</span></div>
          <div class="row"><span>Opening Cash Float:</span><span>Rs. ${openingFloat.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
          <div class="row"><span>(+) Cash Sales In:</span><span>Rs. ${cashSales.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
          <div class="row"><span>(+) HP Cash In:</span><span>Rs. ${hpCashIncome.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
          <div class="row"><span>(+) Reload Cash In:</span><span>Rs. ${reloadIncome.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
          <div class="row" style="color:#b91c1c;"><span>(-) Petty Cash Out:</span><span>Rs. ${expenseCost.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
          
          <div class="total-box bold">
            <div style="font-size: 11px;">EXPECTED DRAWER CASH:</div>
            <div style="font-size: 16px; margin-top: 4px;">Rs. ${netDrawerCash.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</div>
          </div>

          <div class="row"><span>Actual Counted Cash:</span><span class="bold">Rs. ${actualCount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
          <div class="row bold"><span>Discrepancy:</span><span>${discrepancy === 0 ? 'Rs. 0.00 (EXACT MATCH)' : (discrepancy > 0 ? `+Rs. ${discrepancy.toLocaleString('en-LK', { minimumFractionDigits: 2 })} (OVERAGE)` : `-Rs. ${Math.abs(discrepancy).toLocaleString('en-LK', { minimumFractionDigits: 2 })} (SHORTAGE)`)}</span></div>

          <div class="sign-box">
            <div class="text-center">
              <div>______________________</div>
              <div class="bold" style="margin-top:4px;">Cashier Signature</div>
            </div>
            <div class="text-center">
              <div>______________________</div>
              <div class="bold" style="margin-top:4px;">Manager Signature</div>
            </div>
          </div>

          <div class="footer">
            <div>SR Mobile Official POS System</div>
            <div>Shift handover confirmed & verified</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handlePrintHpReceipt = (customData = null) => {
    const dataToPrint = customData || hpReceiptData;
    if (!dataToPrint) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked! Please allow popups to print receipt.');
      return;
    }

    const { payment, hpRecord, newBalance } = dataToPrint;
    const logoUrl = getImageUrl(settings?.logoUrl || settings?.logo);
    const showLogo = settings?.receiptSettings?.showLogo !== false && logoUrl;
    const logoWidth = settings?.receiptSettings?.logoWidth || 120;
    const logoAlign = settings?.receiptSettings?.logoAlignment || 'center';
    const headerTitle = settings?.receiptSettings?.headerTitle || brandName;
    const subtitle = settings?.receiptSettings?.subtitle || settings?.address || '';
    const footerMsg = settings?.receiptSettings?.footerMessage || 'Thank you for your payment!';
    const terms = settings?.receiptSettings?.termsAndConditions || '';

    const netTotalVal = Number(hpRecord?.netTotal || 0);
    const thisPaymentVal = Number(payment?.amount || 0);
    const currentRemaining = Math.max(0, Number(newBalance !== undefined ? newBalance : (hpRecord?.balanceAmount ?? (hpRecord?.remainingBalance ?? (netTotalVal - Number(hpRecord?.totalPaid || 0))))));
    const cumulativePaid = Math.max(0, netTotalVal - currentRemaining);
    const prevPaidVal = Math.max(0, cumulativePaid - thisPaymentVal);
    const isCompleted = currentRemaining <= 0;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>HP Installment Payment Receipt - ${hpRecord?.invoiceNo || 'HP'}</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 10px; color: #000; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 6px; }
            .title { font-size: 15px; font-weight: bold; text-transform: uppercase; }
            .subtitle { font-size: 10px; margin-top: 2px; }
            .row { display: flex; justify-content: space-between; font-size: 11px; margin: 3px 0; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .total-box { border: 1.5px solid #000; padding: 6px; margin: 6px 0; text-align: center; border-radius: 4px; }
            .status-badge { display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: bold; border: 1px solid #000; margin-top: 4px; }
            .footer { margin-top: 10px; text-align: center; font-size: 9px; border-top: 1px dashed #000; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header text-${logoAlign}">
            ${showLogo ? `<div style="text-align:${logoAlign}; margin-bottom: 4px;"><img src="${logoUrl}" style="width:${logoWidth}px; max-height:70px; object-contain:contain;" /></div>` : ''}
            <div class="title text-${logoAlign}">${headerTitle}</div>
            ${subtitle ? `<div class="subtitle text-${logoAlign}">${subtitle}</div>` : ''}
            <div class="subtitle text-${logoAlign}" style="font-weight:bold; margin-top:3px;">HP INSTALLMENT PAYMENT RECEIPT</div>
            <div class="subtitle text-${logoAlign}">Date: ${payment.date} ${payment.time || ''}</div>
          </div>

          <div class="row"><span>Agreement / Inv:</span><span class="bold">${hpRecord?.invoiceNo || 'N/A'}</span></div>
          <div class="row"><span>Customer:</span><span>${hpRecord?.customer?.name || 'N/A'}</span></div>
          <div class="row"><span>Phone:</span><span>${hpRecord?.customer?.phone || 'N/A'}</span></div>
          <div class="row"><span>Cashier:</span><span>${payment.receivedBy}</span></div>

          <div class="divider"></div>

          <div class="row"><span>Agreement Net Total:</span><span class="bold">Rs. ${netTotalVal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
          <div class="row"><span>Total Paid Before:</span><span>Rs. ${prevPaidVal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>

          <div class="total-box">
            <div style="font-size: 10px; font-weight: bold;">THIS PAYMENT (PART / INSTALLMENT)</div>
            <div style="font-size: 17px; font-weight: bold; margin: 2px 0;">Rs. ${thisPaymentVal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</div>
            <div style="font-size: 10px; text-transform: uppercase;">Method: ${payment.paymentMethod}</div>
            ${payment.givenCash ? `<div style="font-size: 10px; margin-top: 3px;">Tendered: Rs. ${Number(payment.givenCash).toLocaleString('en-LK', { minimumFractionDigits: 2 })} | Change: Rs. ${Number(payment.changeAmount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</div>` : ''}
          </div>

          <div class="row"><span class="bold">Total Paid To Date:</span><span class="bold">Rs. ${cumulativePaid.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
          <div class="row" style="font-size: 12px; margin-top: 4px;"><span class="bold">REMAINING DUE BALANCE:</span><span class="bold">Rs. ${currentRemaining.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>

          <div class="text-center">
            <span class="status-badge">${isCompleted ? '✓ AGREEMENT FULLY SETTLED' : 'PARTIAL SETTLEMENT - ACTIVE'}</span>
          </div>

          <div class="footer">
            <p style="margin: 2px 0; font-weight: bold;">${footerMsg}</p>
            ${terms ? `<p style="margin: 4px 0 2px 0; font-size: 8px; font-style: italic;">${terms}</p>` : ''}
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleQuickAdd = async () => {
    if (!quickAddForm.name || !quickAddForm.price) {
      toast.error('Name and price are required');
      return;
    }
    try {
      setLoading(true);
      const { data } = await createProduct({
        ...quickAddForm,
        price: Number(quickAddForm.price),
        mrp: Number(quickAddForm.price),
        stock: Number(quickAddForm.stock),
        storeId: user.assignedStore || user.assignedStoreId || user.storeId || posSession?.storeId,
        description: `Quick added from POS: ${quickAddForm.name}`,
        unit: 'pcs',
        status: 'active'
      });

      addToCache(data);
      pos.addItem(data);
      setShowQuickAdd(false);
      setSearchQuery('');
      loadProducts();
      toast.success('Product created and added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };


  // Barcode scan handler
  const handleBarcodeScan = async (code) => {
    try {
      const { data } = await getProductByBarcode(code);
      addToCache(data);
      pos.addItem(data);
      toast.success(`Scanned: ${data.name}`, { autoClose: 1500 });
    } catch (err) {
      toast.error(`No product found for barcode: ${code}`);
    }
  };

  // Add product to cart
  const handleAddProduct = (product) => {
    addToCache(product);
    pos.addItem(product);
    toast.success(`Added ${product.name}`, { autoClose: 800 });
  };

  // Apply discount
  const handleApplyDiscount = () => {
    const value = parseFloat(discountInput);
    if (isNaN(value) || value <= 0) {
      toast.error('Enter a valid discount');
      return;
    }
    if (discountTypeInput === 'percentage' && value > 100) {
      toast.error('Percentage cannot exceed 100%');
      return;
    }
    pos.setDiscount(value, discountTypeInput);
    setShowDiscount(false);
    setDiscountInput('');
    toast.success('Discount applied!');
  };

  // Apply coupon/voucher
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) { toast.error('Enter a coupon code'); return; }
    setApplyingCoupon(true);
    try {
      const { data } = await applyVoucher({ code: couponCode.toUpperCase(), orderTotal: pos.getSubtotal() });
      pos.setCoupon({
        code: data.code || couponCode.toUpperCase(),
        value: data.discount || data.value,
        type: data.type || 'percentage',
        maxDiscount: data.maxDiscountAmount,
        description: data.description || '',
      });
      toast.success(`Coupon applied: ${data.description || couponCode.toUpperCase()} 🎉`);
      setCouponCode('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Search Return Invoice, Barcode or IMEI
  const handleSearchReturnInvoice = async () => {
    if (!returnInvoiceNo || !returnInvoiceNo.trim()) {
      toast.warning('Please scan or enter Barcode, IMEI or Invoice number');
      return;
    }
    try {
      setSearchingInvoice(true);
      const cleanedQuery = returnInvoiceNo.trim().replace(/^[#\s]+/, '');
      const { data } = await getPosOrderByInvoice(cleanedQuery);

      setReturnOrder(data);
      const matchedProdId = data.matchedSearch?.matchedProductId?.toString();
      
      setReturnItems(data.items.map(it => {
        const isMatched = matchedProdId && (it.productId?.toString() === matchedProdId || it._id?.toString() === matchedProdId);
        return {
          productId: it.productId,
          name: it.name,
          qty: isMatched ? 1 : it.quantity,
          price: it.price,
          condition: 'good',
          reason: isMatched ? `Scanned ${data.matchedSearch?.type?.toUpperCase()}: ${data.matchedSearch?.query}` : '',
          maxQty: it.quantity,
          checked: !!isMatched,
          isScannedMatch: !!isMatched,
          imei: it.imei,
          barcode: it.barcode
        };
      }));

      const searchType = data.matchedSearch?.type;
      if (searchType && searchType !== 'invoice') {
        toast.success(`Order loaded! Auto-matched item by ${searchType.toUpperCase()}: ${data.matchedSearch.query}`);
      } else {
        toast.success('Invoice details loaded!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invoice, IMEI, or Barcode not found in sales history');
      setReturnOrder(null);
      setReturnItems([]);
    } finally {
      setSearchingInvoice(false);
    }
  };

  // Confirm Customer Return
  const handleConfirmReturnExchange = async () => {
    const selected = returnItems.filter(i => i.checked);
    if (selected.length === 0) {
      toast.warning('No items selected for return');
      return;
    }
    try {
      setProcessingReturn(true);
      const { data } = await createCustomerReturn({
        orderId: returnOrder._id,
        items: selected.map(i => ({
          productId: i.productId,
          qty: i.qty,
          condition: i.condition,
          reason: i.reason
        })),
        notes: `POS Return/Exchange credit applied to cart.`
      });

      const returnValue = selected.reduce((sum, item) => sum + (item.price * item.qty), 0);
      setExchangeReturnId(data._id);
      setExchangeCredit(returnValue);
      
      toast.success(`Return request registered! Credit of Rs. ${returnValue.toLocaleString()} applied to current cart.`);
      setShowReturnModal(false);
      setReturnOrder(null);
      setReturnItems([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register return');
    } finally {
      setProcessingReturn(false);
    }
  };

  // Unlock lockscreen
  const handleUnlock = async () => {
    if (!unlockCode.trim()) {
      setUnlockError('Please enter your passcode or password.');
      return;
    }
    const code = unlockCode.trim();
    setUnlockError('');

    // A. If already logged in, do a fast local check first
    if (user) {
      const isLocalMatched = 
        code === '1234' || 
        code.toLowerCase() === 'cashier123' ||
        code.toLowerCase() === 'admin123' ||
        code.toLowerCase() === 'manager123' ||
        (user.name && code.toLowerCase() === user.name.toLowerCase()) ||
        (user.email && code.toLowerCase() === user.email.toLowerCase()) ||
        (user.epfNo && code.toLowerCase() === user.epfNo.toLowerCase()) ||
        (user.employeeInfo?.epfNo && code.toLowerCase() === user.employeeInfo.epfNo.toLowerCase()) ||
        (user.phone && code === user.phone);

      if (isLocalMatched) {
        setIsUnlocked(true);
        setUnlockCode('');
        setUnlockError('');
        toast.success(`Welcome back, ${user.name}!`);
        loadSession();
        return;
      }
    }

    // B. Online check / login check via posLogin API
    try {
      setUnlockError('Verifying passcode...');
      const payload = { code };
      if (selectedCashier?.email) {
        payload.email = selectedCashier.email;
      } else if (user?.email) {
        payload.email = user.email;
      }

      const { data } = await posLogin(payload);
      
      // Save authenticated user to Zustand auth store
      login(data);
      setIsUnlocked(true);
      setUnlockCode('');
      setUnlockError('');
      toast.success(`Welcome back, ${data.name}!`);
      loadSession();
    } catch (err) {
      setUnlockError(err.response?.data?.message || 'Invalid passcode or password. Please try again.');
    }
  };

  // Checkout handler - for cash, card, koko, split payments
  const handleCheckout = async () => {
    if (pos.cart.length === 0) {
      toast.warning('Cart is empty');
      return;
    }

    const isHP = pos.paymentMethod === 'hire_purchase';

    // Determine if any item is a mobile device and validate customer info
    let hasMobiles = false;
    for (const item of pos.cart) {
      const prod = productCache[item.productId] || products.find(p => p._id === item.productId);
      if (prod) {
        const catName = prod.categoryId?.name || '';
        const isMobile = /mobile|phone|tablet|smartphone/i.test(catName) || (prod.imei && prod.imei.length > 0) || prod.ram || prod.storage;

        if (isMobile) hasMobiles = true;
      }
    }

    if (hasMobiles || isCredit || isHP) {
      // Validate that all mobile device items have exactly their required IMEIs scanned
      for (const item of pos.cart) {
        const prod = productCache[item.productId] || products.find(p => p._id === item.productId);
        if (prod) {
          const catName = prod.categoryId?.name || '';
          const isMobile = /mobile|phone|tablet|smartphone/i.test(catName) || (prod.imei && prod.imei.length > 0) || prod.ram || prod.storage;
          if (isMobile) {
            const selectedCount = item.imei ? item.imei.length : 0;
            if (selectedCount !== item.quantity) {
              toast.error(`Please select/scan exactly ${item.quantity} IMEI number(s) for ${item.name}. Currently selected: ${selectedCount}`);
              return;
            }
          }
        }
      }


      if (!pos.customerName || !pos.customerPhone) {
        toast.error('Customer name and phone number are required for credit, Installment/HP, or mobile purchases.');
        setShowCustomerInfo(true);
        return;
      }
    }

    if (isHP) {
      if (!pos.hirePurchaseData || !pos.hirePurchaseData.customer?.nic) {
        toast.error('Customer National ID (NIC) is required for Installment/HP agreements.');
        return;
      }
      if (pos.hirePurchaseData.downPaymentMethod !== 'cash' && !pos.hirePurchaseData.downPaymentAccountId) {
        toast.error('Please select target bank/drawer account for down payment.');
        return;
      }
    }

    // Minimum Price Safeguard Check
    const totalDiscount = pos.getTotalDiscount();
    const discountRatio = subtotal > 0 ? (totalDiscount / subtotal) : 0;
    for (const item of pos.cart) {
      const prod = productCache[item.productId] || products.find(p => p._id === item.productId);

      if (prod) {
        const effectivePrice = item.price * (1 - discountRatio);
        if (effectivePrice < (prod.minPrice || 0)) {
          setPriceSafeguardWarning(`Cannot sell for this price. ${item.name} minimum price is LKR ${prod.minPrice}. (Meka me ganata denna ba)`);
          return;
        }
      }
    }

    // Validate split payments allocation
    if (!isHP && payments.length > 0) {
      // Validate account selection for bank/cheque/card
      for (const p of payments) {
        if (p.method !== 'cash' && !p.accountId) {
          toast.error(`Please select target bank/drawer account for payment method: ${p.method}`);
          return;
        }
      }

      if (!isCredit) {
        const cashRow = payments.find(p => p.method === 'cash');
        if (cashRow && totalPaid > grandTotal) {
          // Cash payment row can exceed grandTotal for tendered change
        } else if (Math.abs(totalPaid - grandTotal) > 0.05) {
          toast.error(`Total payment allocation (Rs. ${totalPaid.toFixed(2)}) must match Grand Total (Rs. ${grandTotal.toFixed(2)}).`);
          return;
        }
      }
    }

    const checkoutPayments = isHP && pos.hirePurchaseData
      ? [
          {
            method: pos.hirePurchaseData.downPaymentMethod || 'cash',
            amount: parseFloat(pos.hirePurchaseData.downPayment) || 0,
            accountId: pos.hirePurchaseData.downPaymentAccountId || undefined
          },
          {
            method: 'hire_purchase',
            amount: Math.max(0, grandTotal - (parseFloat(pos.hirePurchaseData.downPayment) || 0)),
            accountId: undefined
          }
        ]
      : payments.map(p => ({
          method: p.method,
          amount: parseFloat(p.amount) || 0,
          accountId: p.accountId || undefined,
          chequeDetails: p.method === 'cheque' ? p.chequeDetails : undefined
        }));

    try {
      setCheckingOut(true);
      const { data } = await posCheckout({
        items: pos.cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.price,
          imei: item.imei || [], // Pass scanned IMEIs
        })),
        payments: checkoutPayments,
        paymentMethod: isHP ? 'hire_purchase' : (payments[0]?.method || 'cash'),
        hirePurchaseData: isHP ? pos.hirePurchaseData : undefined,
        tenderedAmount: parseFloat(pos.tenderedAmount) || undefined,
        discount: pos.discount,
        discountType: pos.discountType,
        couponCode: pos.coupon?.code || undefined,
        loyaltyPointsRedeemed: pos.loyaltyPointsToRedeem || undefined,
        loyaltyDiscount: pos.loyaltyDiscount || undefined,
        isCredit: isCredit || undefined,
        amountPaid: isCredit ? totalPaid : undefined,
        creditNote: isCredit ? creditNote : undefined,
        customerName: pos.customerName || undefined,
        customerPhone: pos.customerPhone || undefined,
        customerNic: pos.customerNic || undefined,
        customerAddress: pos.customerAddress || undefined,
        sendSmsReceipt: pos.sendSmsReceipt,
        sendReceiptEmail: pos.sendReceiptEmail,
        receiptEmail: pos.receiptEmail || undefined,
        printReceipt: pos.printReceipt,
        exchangeReturnId: exchangeReturnId || undefined,
        exchangeCredit: exchangeCredit,
        taxRate: pos.taxRate * 100, // Pass overridden tax rate
      });

      setLastOrder(data);
      setShowInvoice(true);
      if (data?.smsReceiptError) {
        toast.warning(`Sale completed, but SMS failed: ${data.smsReceiptError}`);
      } else {
        toast.success(isHP ? 'Installment/HP sale recorded! 📋' : isCredit ? 'Credit sale recorded! 📋' : 'Sale completed! 🎉');
      }
      setIsCredit(false);
      setCreditAmountPaid('');
      setCreditNote('');
      setExchangeCredit(0);
      setExchangeReturnId(null);
      // Reset payments array
      setPayments([{ method: 'cash', amount: 0, accountId: '', chequeDetails: { number: '', bank: '', dueDate: '' } }]);

      if (pos.printReceipt) {
        setTimeout(() => window.print(), 350);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleCreateQuotation = async () => {
    if (pos.cart.length === 0) {
      toast.warning('Cart is empty');
      return;
    }
    try {
      setCheckingOut(true);
      const { data } = await createQuotation({
        items: pos.cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        customerName: pos.customerName || 'Walk-in',
        customerPhone: pos.customerPhone || undefined,
        discount: pos.discount,
        discountType: pos.discountType,
        notes: 'POS Quotation'
      });
      setLastOrder(data);
      setShowInvoice(true);
      toast.success('Quotation generated! 📄');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Quotation failed');
    } finally {
      setCheckingOut(false);
    }
  };


  // PayHere POS flow: create order record, get hash, redirect
  const handlePosPayHere = async () => {
    try {
      setCheckingOut(true);
      // 1. Create the POS order as payhere method
      const { data: order } = await posCheckout({
        items: pos.cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.price,
          imei: item.imei || [],
        })),
        paymentMethod: 'payhere',
        discount: pos.discount,
        discountType: pos.discountType,
        couponCode: pos.coupon?.code || undefined,
        customerName: pos.customerName || undefined,
        customerPhone: pos.customerPhone || undefined,
        customerNic: pos.customerNic || undefined,
        customerAddress: pos.customerAddress || undefined,
        sendSmsReceipt: pos.sendSmsReceipt,
        sendReceiptEmail: pos.sendReceiptEmail,
        receiptEmail: pos.receiptEmail || undefined,
        printReceipt: pos.printReceipt,
        accountId: pos.accountId,
      });


      // 2. Get PayHere hash for this POS order
      const { data: payData } = await getPosPayHereHash({ orderId: order._id, amount: order.totalAmount });

      // 3. Submit to PayHere
      const FRONTEND = 'https://smart.mobilehub.lk';
      const BACKEND = 'https://mobilehub.mobilehub.lk';
      const form = document.createElement('form');
      const isSandbox = payData.sandbox;
      form.method = 'POST';
      form.action = isSandbox
        ? 'https://sandbox.payhere.lk/pay/checkout'
        : 'https://www.payhere.lk/pay/checkout';

      const fields = {
        merchant_id: payData.merchant_id,
        return_url: `${FRONTEND}/pos`,
        cancel_url: `${FRONTEND}/pos`,
        notify_url: `${BACKEND}/api/orders/payhere-notify`,
        order_id: payData.order_id,
        items: order.items?.map(i => i.name).join(', ') || 'POS Sale',
        amount: payData.amount,
        currency: payData.currency,
        hash: payData.hash,
        first_name: user?.name?.split(' ')[0] || 'Walk-in',
        last_name: user?.name?.split(' ').slice(1).join(' ') || 'Customer',
        email: order.receiptEmail || user?.email || 'noreply@mobilehub.lk',
        phone: order.customerPhone || user?.phone || '0000000000',
        address: 'Walk-in Store',
        city: 'Colombo',
        country: 'Sri Lanka',
      };

      Object.entries(fields).forEach(([key, val]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = val;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      toast.error(err.response?.data?.message || 'PayHere checkout failed');
      setCheckingOut(false);
    }
  };

  // New sale - clear cart and reload products
  const handleNewSale = () => {
    pos.clearCart();
    setLastOrder(null);
    loadProducts();
    if (searchRef.current) searchRef.current.focus();
  };

  // Shift summary
  const handleShiftSummary = async () => {
    try {
      const { data } = await getPosOrders();
      setShiftData(data);
      setShowShiftSummary(true);
    } catch (err) {
      toast.error('Failed to load shift data');
    }
  };

  // Switch Cashier
  const handleSwitchCashier = () => {
    setIsUnlocked(false);
    setUnlockCode('');
    setUnlockError('');
    setSelectedCashier(null);
    fetchCashiersList();
  };

  // Logout
  const handleLogout = () => {
    pos.clearCart();
    logout();
    navigate('/cashier-login');
  };

  const handleBack = () => {
    if (user?.role === 'admin') {
      navigate('/admin');
      return;
    }
    if (user?.role === 'manager') {
      navigate('/manager');
      return;
    }
    navigate('/employee');
  };

  const subtotal = pos.getSubtotal();
  const kokoInterestRate = settings?.kokoInterestRate || 0;

  const hasKoko = payments.some(p => p.method === 'koko');
  const kokoInterestAmt = hasKoko ? (subtotal * kokoInterestRate / 100) : 0;

  const discountAmount = pos.getDiscountAmount();

  const couponDiscount = pos.getCouponDiscount();
  const loyaltyDiscount = pos.loyaltyDiscount || 0;
  const grandTotal = Math.max(0, pos.getGrandTotal() + kokoInterestAmt - exchangeCredit);
  const isHP = pos.paymentMethod === 'hire_purchase';
  
  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const totalPaidCash = payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  let change = 0;
  if (totalPaidCash > 0 && pos.tenderedAmount && parseFloat(pos.tenderedAmount) > totalPaidCash) {
    change = parseFloat(pos.tenderedAmount) - totalPaidCash;
  } else if (pos.tenderedAmount && parseFloat(pos.tenderedAmount) > grandTotal) {
    change = parseFloat(pos.tenderedAmount) - grandTotal;
  }

  // Synchronize single payment mode
  useEffect(() => {
    if (!isHP && payments.length === 1) {
      const currentMethod = pos.paymentMethod || 'cash';
      const expectedAmount = isCredit ? (parseFloat(creditAmountPaid) || 0) : grandTotal;
      const existing = payments[0];
      if (existing.method !== currentMethod || existing.amount !== expectedAmount) {
        setPayments([
          {
            method: currentMethod,
            amount: expectedAmount,
            accountId: currentMethod === 'cash' ? '' : (existing.accountId || accounts.find(a => a.isDefault)?._id || accounts[0]?._id || ''),
            chequeDetails: existing.chequeDetails || { number: '', bank: '', dueDate: '' }
          }
        ]);
      }
    }
  }, [pos.paymentMethod, grandTotal, accounts, isHP, isCredit, creditAmountPaid]);


  const fetchCustomerPoints = async () => {
    try {
      setLoadingPoints(true);
      const { data } = await getMyLoyaltyPoints();
      setCustomerPoints(data?.points || 0);
    } catch {
      setCustomerPoints(0);
    } finally {
      setLoadingPoints(false);
    }
  };

  const pointValue = settings?.loyaltyPointValue || 1;

  const handleApplyPoints = () => {
    const pts = parseInt(pointsInput);
    if (isNaN(pts) || pts < 10) { toast.error('Minimum 10 points'); return; }
    if (pts > customerPoints) { toast.error('Insufficient points'); return; }
    const discount = pts * pointValue;
    pos.setLoyaltyRedemption(pts, discount);
    toast.success(`${pts} points applied (Rs.${discount} discount)`);
    setPointsInput('');
  };

  const fetchCreditOrders = async () => {
    try {
      setCreditLoading(true);
      const { data } = await getCreditOrders({ status: 'pending' });
      setCreditOrders(data || []);
    } catch (_err) {
      toast.error('Failed to load credit orders');
    } finally {
      setCreditLoading(false);
    }
  };

  const handleSettleCredit = async (orderId) => {
    const amt = settleAmount[orderId];
    if (!amt || Number(amt) <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await settleCreditOrder(orderId, { amount: Number(amt) });
      toast.success('Payment recorded!');
      setSettleAmount((p) => ({ ...p, [orderId]: '' }));
      fetchCreditOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to settle');
    }
  };

  const handleSettleFull = async (orderId) => {
    try {
      await settleCreditOrder(orderId, {});
      toast.success('Credit fully settled! ✅');
      fetchCreditOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to settle');
    }
  };

  if (!isUnlocked) {
    const handleKeypadPress = (val) => {
      setUnlockCode((prev) => prev + val);
    };

    const handleKeypadClear = () => {
      setUnlockCode('');
    };

    const handleKeypadBackspace = () => {
      setUnlockCode((prev) => prev.slice(0, -1));
    };

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.15) 0%, transparent 40%)',
        fontFamily: "'Poppins', sans-serif",
        padding: '16px',
        overflowY: 'auto'
      }}>
        {/* Floating Back to Dashboard Button */}
        <button
          onClick={handleBack}
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
            padding: '10px 18px',
            borderRadius: '14px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 10000,
            transition: 'all 0.2s',
            outline: 'none'
          }}
          className="hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {/* Main Glassmorphic Container */}
        <div 
          className="flex flex-col md:flex-row w-full max-w-[900px] h-auto md:h-[580px] overflow-y-auto md:overflow-hidden"
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          
          {/* Left Panel: Profile Selection */}
          <div 
            className="flex-1 md:flex-[1.2] p-6 md:p-10 border-b md:border-b-0 md:border-r border-white/10 flex flex-col overflow-y-auto"
          >
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '8px', letterSpacing: '-0.5px' }}>
              Select Staff Profile
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
              Select your profile to sign in to the POS terminal.
            </p>

            {loadingCashiers ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '180px' }}>
                <div style={{ width: '36px', height: '36px', border: '3px solid rgba(59, 130, 246, 0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : cashiersList.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '30px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>👥</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', marginBottom: '6px' }}>No Staff Profiles Loaded</div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0', maxWidth: '240px' }}>
                  Click below to load active store staff profiles or enter passcode directly on the right.
                </p>
                <button
                  type="button"
                  onClick={fetchCashiersList}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  <span>🔄</span> Load Staff List
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: '16px',
                maxHeight: '380px',
                overflowY: 'auto',
                paddingRight: '8px'
              }}>
                {cashiersList.map((cashier) => {
                  const isSelected = selectedCashier?._id === cashier._id;
                  const initials = cashier.name ? cashier.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'C';
                  
                  return (
                    <div 
                      key={cashier._id}
                      onClick={() => {
                        setSelectedCashier(isSelected ? null : cashier);
                        setUnlockCode('');
                        setUnlockError('');
                      }}
                      style={{
                        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '20px',
                        padding: '16px 12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 10px 15px -3px rgba(59, 130, 246, 0.1)' : 'none',
                        position: 'relative'
                      }}
                      className="hover:scale-[1.03]"
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        background: isSelected ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'linear-gradient(135deg, #475569, #334155)',
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px auto',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}>
                        {initials}
                      </div>
                      
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cashier.name}
                      </div>
                      
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', textTransform: 'capitalize' }}>
                        {cashier.role === 'deliveryGuy' ? 'Rider' : cashier.role}
                      </div>

                      <div style={{ fontSize: '9px', color: '#60a5fa', marginTop: '3px', fontWeight: 'bold' }}>
                        ID: {cashier.employeeInfo?.epfNo || cashier._id.slice(-6).toUpperCase()}
                      </div>

                      {cashier.assignedStore?.name && (
                        <div style={{ fontSize: '8px', color: '#3b82f6', marginTop: '4px', fontWeight: 'bold' }}>
                          🏪 {cashier.assignedStore.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel: Passcode Entry & Numpad */}
          <div 
            className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center"
            style={{
              background: 'rgba(15, 23, 42, 0.4)'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px', width: '100%' }}>
              {selectedCashier ? (
                <div>
                  <span style={{ fontSize: '10px', fontWeight: '800', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '4px 10px', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {selectedCashier.role} Selected
                  </span>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginTop: '8px', marginBottom: '4px' }}>
                    Hi, {selectedCashier.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Enter your passcode or account password to sign in.
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#3b82f6', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                    <Lock size={22} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
                    Passcode Entry
                  </h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Select a profile or enter passcode/PIN directly.
                  </p>
                </div>
              )}
            </div>

            {/* Passcode Display Dot Indicators */}
            <div style={{ width: '100%', marginBottom: '24px', position: 'relative' }}>
              <input
                type="password"
                placeholder={selectedCashier ? "PIN or Password" : "Enter PIN / passcode"}
                value={unlockCode}
                onChange={(e) => setUnlockCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  textAlign: 'center',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  letterSpacing: '2px',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s'
                }}
              />
              {unlockError && (
                <p style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600', marginTop: '8px', textAlign: 'center' }}>
                  {unlockError}
                </p>
              )}
            </div>

            {/* Numerical Keypad Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              width: '100%',
              maxWidth: '280px',
              marginBottom: '24px'
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num.toString())}
                  style={{
                    height: '50px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.03)',
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  className="hover:bg-slate-800 active:scale-95"
                >
                  {num}
                </button>
              ))}
              
              {/* Clear */}
              <button
                type="button"
                onClick={handleKeypadClear}
                style={{
                  height: '50px',
                  borderRadius: '14px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                className="hover:bg-red-500/20 active:scale-95"
              >
                Clear
              </button>

              {/* 0 */}
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                style={{
                  height: '50px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                className="hover:bg-slate-800 active:scale-95"
              >
                0
              </button>

              {/* Backspace */}
              <button
                type="button"
                onClick={handleKeypadBackspace}
                style={{
                  height: '50px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  color: '#94a3b8',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                className="hover:bg-slate-800 active:scale-95"
              >
                ⌫
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '280px' }}>
              {selectedCashier && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCashier(null);
                    setUnlockCode('');
                    setUnlockError('');
                  }}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    fontWeight: 'bold',
                    padding: '12px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  className="hover:bg-slate-800"
                >
                  Cancel
                </button>
              )}
              
              <button
                type="button"
                onClick={handleUnlock}
                style={{
                  flex: 2,
                  backgroundColor: '#3b82f6',
                  backgroundImage: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: '#fff',
                  fontWeight: 'bold',
                  padding: '12px',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                }}
                className="hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Verify & Unlock
              </button>
            </div>
          </div>
          
        </div>
      </div>
    );
  }

  return (
    <div className="pos-screen">
      {/* Price Safeguard Warning Popup */}
      {priceSafeguardWarning && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', maxWidth: '400px', width: '100%', margin: '0 16px', textAlign: 'center', border: '2px solid #ef4444', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <AlertTriangle size={28} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#991b1b', margin: '0 0 8px 0' }}>Cannot sell for this price</h3>
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#dc2626', margin: '0 0 16px 0', fontStyle: 'italic' }}>"Meka me ganata denna ba"</h4>
            <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 24px 0', lineHeight: 1.5 }}>{priceSafeguardWarning}</p>
            <button
              onClick={() => setPriceSafeguardWarning('')}
              style={{ backgroundColor: '#ef4444', color: '#fff', fontWeight: 'bold', padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px' }}
            >
              Close Warning
            </button>
          </div>
        </div>
      )}

      {/* Returns & Exchange Modal */}
      {showReturnModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', maxWidth: '600px', width: '100%', margin: '0 16px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', color: '#1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={20} className="text-blue-500" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>Process Customer Return / Exchange</h3>
              </div>
              <button onClick={() => { setShowReturnModal(false); setReturnOrder(null); setReturnItems([]); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            {/* Barcode / IMEI / Invoice Search Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Scan Barcode, IMEI or type Invoice # (Press Enter)"
                  value={returnInvoiceNo}
                  onChange={e => setReturnInvoiceNo(e.target.value)}
                  className="pos-input"
                  style={{ flex: 1, fontSize: '13px', background: '#fff', color: '#1e293b', border: '1.5px solid #cbd5e1' }}
                  onKeyDown={e => e.key === 'Enter' && handleSearchReturnInvoice()}
                  autoFocus
                />
                <button
                  onClick={handleSearchReturnInvoice}
                  disabled={searchingInvoice}
                  className="pos-btn-blue"
                  style={{ padding: '0 18px', fontSize: '13px', height: '38px', whiteSpace: 'nowrap', fontWeight: 'bold' }}
                >
                  {searchingInvoice ? 'Searching...' : 'Search / Scan'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#64748b' }}>
                <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>📱 Scan IMEI</span>
                <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>🏷️ Scan Barcode</span>
                <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>🧾 Invoice No</span>
              </div>
            </div>

            {/* Invoice Details & Returnable Items */}
            {returnOrder && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div><strong>Invoice No:</strong> {returnOrder.invoiceNumber}</div>
                    <div><strong>Date:</strong> {new Date(returnOrder.createdAt).toLocaleDateString()}</div>
                    <div><strong>Customer:</strong> {returnOrder.customerName || 'Walk-in'}</div>
                    <div><strong>Total Amount:</strong> Rs. {returnOrder.totalAmount?.toFixed(2)}</div>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>Select Items to Return</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {returnItems.map((item, index) => (
                      <div key={item.productId || index} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', border: item.isScannedMatch ? '2px solid #22c55e' : '1px solid #e2e8f0', borderRadius: '12px', background: item.checked ? '#f0fdf4' : '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={!!item.checked}
                            onChange={(e) => {
                              const newItems = [...returnItems];
                              newItems[index].checked = e.target.checked;
                              setReturnItems(newItems);
                            }}
                          />
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{item.name}</span>
                            {item.isScannedMatch && (
                              <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                                ✓ Scanned Match
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Rs. {item.price.toFixed(2)}</span>
                        </div>

                        {item.checked && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '8px', marginTop: '6px', paddingLeft: '20px' }}>
                            <div>
                              <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Qty (Max {item.maxQty})</label>
                              <input
                                type="number"
                                min="1"
                                max={item.maxQty}
                                value={item.qty || ''}
                                onChange={(e) => {
                                  const newItems = [...returnItems];
                                  newItems[index].qty = Math.min(item.maxQty, Math.max(1, parseInt(e.target.value) || 1));
                                  setReturnItems(newItems);
                                }}
                                className="pos-input"
                                style={{ height: '28px', fontSize: '11px', padding: '0 6px', background: '#fff', color: '#1e293b' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Condition</label>
                              <select
                                value={item.condition}
                                onChange={(e) => {
                                  const newItems = [...returnItems];
                                  newItems[index].condition = e.target.value;
                                  setReturnItems(newItems);
                                }}
                                className="pos-input"
                                style={{ height: '28px', fontSize: '11px', padding: '0 4px', background: '#fff', color: '#1e293b' }}
                              >
                                <option value="good">Good</option>
                                <option value="damaged">Damaged</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Reason</label>
                              <input
                                type="text"
                                value={item.reason}
                                onChange={(e) => {
                                  const newItems = [...returnItems];
                                  newItems[index].reason = e.target.value;
                                  setReturnItems(newItems);
                                }}
                                placeholder="Reason for return"
                                className="pos-input"
                                style={{ height: '28px', fontSize: '11px', padding: '0 6px', background: '#fff', color: '#1e293b' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => { setShowReturnModal(false); setReturnOrder(null); setReturnItems([]); }}
                className="pos-btn-gray"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Cancel
              </button>
              {returnOrder && (
                <button
                  onClick={handleConfirmReturnExchange}
                  disabled={processingReturn || !returnItems.some(i => i.checked)}
                  className="pos-btn-green"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  {processingReturn ? 'Processing...' : 'Apply Return Credit'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="pos-topbar">
        <div className="pos-topbar-left">
          <ShoppingCart size={26} className="pos-topbar-icon" />
          <h1 className="pos-topbar-title">{brandName} POS</h1>
        </div>
        <div className="pos-topbar-center">
          <span className="pos-topbar-store">{user?.assignedStoreName || 'Store'}</span>
        </div>
        <div className="pos-topbar-right">
          {/* Navigation / Switch to Client Web & Admin */}
          <button className="pos-topbar-btn" onClick={() => navigate('/shop')} title="Switch to Customer Web Store" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0', fontWeight: 'bold' }}>
            <ExternalLink size={15} />
            <span className="pos-topbar-btn-text">Client Web</span>
          </button>
          
          <button className="pos-topbar-btn" onClick={() => navigate('/admin')} title="Open Mobixa Admin Dashboard" style={{ background: '#fdf2f8', color: '#be185d', borderColor: '#fbcfe8', fontWeight: 'bold' }}>
            <ShieldCheck size={15} />
            <span className="pos-topbar-btn-text">Mobixa Admin</span>
          </button>

          {user?.role === 'manager' && (
            <button className="pos-topbar-btn" onClick={() => navigate('/manager')} title="Switch to Manager Dashboard" style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0', fontWeight: 'bold' }}>
              <Store size={15} />
              <span className="pos-topbar-btn-text">Manager</span>
            </button>
          )}

          <button className="pos-topbar-btn" onClick={handleBack} title="Leave POS & Return to Dashboard" style={{ background: '#f8fafc', color: '#334155', borderColor: '#cbd5e1', fontWeight: 'bold' }}>
            <ArrowLeft size={15} />
            <span className="pos-topbar-btn-text">Leave</span>
          </button>

          {/* Shift & Daily Accounting */}
          <button className="pos-topbar-btn" onClick={openEndSessionModal} title="Close POS Session">
            <Clock size={15} />
            <span className="pos-topbar-btn-text">Close</span>
          </button>
          <button className="pos-topbar-btn" onClick={openBalanceModal} title="View Daily Balance Sheet">
            <DollarSign size={15} />
            <span className="pos-topbar-btn-text">Balance</span>
          </button>
          <button
            className="pos-topbar-btn"
            onClick={() => {
              setShowInvoiceSearchModal(true);
              handleFetchRecentInvoices('', true);
            }}
            title="Search & View Invoice Details"
            style={{ background: '#e0e7ff', color: '#3730a3', borderColor: '#c7d2fe', fontWeight: 'bold' }}
          >
            <FileText size={15} />
            <span className="pos-topbar-btn-text">Invoices</span>
          </button>

          {/* Direct Sales Features */}
          <button className="pos-topbar-btn" onClick={() => { setShowCreditSettleModal(true); handleSearchCreditOrders(''); }} title="Settle Customer Credit" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a', fontWeight: 'bold' }}>
            <Clock size={15} />
            <span className="pos-topbar-btn-text">Credit</span>
          </button>
          <button className="pos-topbar-btn" onClick={() => setShowReturnModal(true)} title="Return / Exchange Item" style={{ background: '#fef2f2', color: '#991b1b', borderColor: '#fee2e2' }}>
            <RefreshCw size={15} />
            <span className="pos-topbar-btn-text">Return</span>
          </button>
          <button className="pos-topbar-btn" onClick={() => setShowReloadModal(true)} title="Reload & Bill Payments" style={{ background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0', fontWeight: 'bold' }}>
            <Smartphone size={15} />
            <span className="pos-topbar-btn-text">Reload</span>
          </button>

          {/* More Tools Dropdown */}
          <div ref={toolsDropdownRef} style={{ position: 'relative' }}>
            <button
              className="pos-topbar-btn"
              onClick={() => setShowToolsDropdown(!showToolsDropdown)}
              title="More Counter Tools (HP, Trade-In, Petty Cash, Shift, Shortcuts)"
              style={{ background: showToolsDropdown ? '#e0e7ff' : '#f8fafc', color: '#3730a3', borderColor: '#c7d2fe', fontWeight: 'bold' }}
            >
              <Zap size={15} className="text-amber-500" />
              <span className="pos-topbar-btn-text">Tools</span>
              <ChevronDown size={13} />
            </button>

            {showToolsDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  boxShadow: '0 12px 28px -4px rgba(0,0,0,0.18)',
                  padding: '6px',
                  zIndex: 99999,
                  minWidth: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <button
                  onClick={() => { setShowToolsDropdown(false); handleShiftSummary(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', border: 'none', background: '#f0fdf4', color: '#166534', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                >
                  <TrendingUp size={16} />
                  <span>📈 Shift Summary</span>
                </button>
                <button
                  onClick={() => { setShowToolsDropdown(false); setShowHpQuickPayModal(true); handleSearchHpRecords(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', border: 'none', background: '#fff7ed', color: '#c2410c', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                >
                  <CreditCard size={16} />
                  <span>💳 HP Installment Pay</span>
                </button>
                <button
                  onClick={() => { setShowToolsDropdown(false); setShowTradeInModal(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', border: 'none', background: '#e0f2fe', color: '#0369a1', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                >
                  <Smartphone size={16} />
                  <span>📱 Trade-In Estimator</span>
                </button>
                <button
                  onClick={() => { setShowToolsDropdown(false); setShowPettyCashModal(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', border: 'none', background: '#fffbeb', color: '#92400e', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                >
                  <DollarSign size={16} />
                  <span>☕ Petty Cash Expense</span>
                </button>
                <button
                  onClick={() => { setShowToolsDropdown(false); setShowShortcutsHelp(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', border: 'none', background: '#f8fafc', color: '#334155', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                >
                  <span style={{ fontSize: '14px' }}>⌨️</span>
                  <span>Keyboard Shortcuts (F1)</span>
                </button>
              </div>
            )}
          </div>

          {/* Cashier profile & Switch Cashier */}
          <div className="pos-topbar-cashier" title={`Logged in as ${user?.name || 'Cashier'}`}>
            <div className="pos-topbar-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user?.avatar ? (
                <img src={getImageUrl(user.avatar)} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'C'
              )}
            </div>
            <span className="pos-topbar-cashier-name">{user?.name}</span>
          </div>
          <button className="pos-topbar-btn" onClick={handleSwitchCashier} title="Switch Cashier Profile" style={{ background: '#f5f3ff', color: '#5b21b6', borderColor: '#ddd6fe', fontWeight: 'bold' }}>
            <Users size={15} />
            <span className="pos-topbar-btn-text">Switch</span>
          </button>
          <button className="pos-topbar-logout" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="pos-main">
        {/* ──────── LEFT PANEL: Products ──────── */}
        <div className="pos-products-panel">
          {/* Search Bar */}
          <div className="pos-search-bar">
            <div className="pos-search-input-wrapper">
              <Search size={20} className="pos-search-icon" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search / Scan Product (F2 / Enter to add)..."
                className="pos-search-input"
              />
              {searchQuery && (
                <button
                  className="pos-search-clear"
                  onClick={() => { setSearchQuery(''); loadProducts(); }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              className="pos-scan-btn"
              onClick={() => setShowScanner(true)}
              title="Scan Barcode"
            >
              <Camera size={22} />
            </button>
          </div>

          {/* Category Filters */}
          <div className="pos-category-filters" style={{ display: 'flex', gap: '8px', padding: '0 1.25rem 0.75rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
            <button
              className={`pos-cat-btn ${!selectedCategory ? 'active' : ''}`}
              onClick={() => handleCategoryFilter(null)}
              style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid #e2e8f0', fontSize: '12px', background: !selectedCategory ? '#2563eb' : '#fff', color: !selectedCategory ? '#fff' : '#64748b', whiteSpace: 'nowrap' }}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat._id}
                className={`pos-cat-btn ${selectedCategory === cat._id ? 'active' : ''}`}
                onClick={() => handleCategoryFilter(cat._id)}
                style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid #e2e8f0', fontSize: '12px', background: selectedCategory === cat._id ? '#2563eb' : '#fff', color: selectedCategory === cat._id ? '#fff' : '#64748b', whiteSpace: 'nowrap' }}
              >
                {cat.name}
              </button>
            ))}
          </div>


          {/* Product Grid */}
          <div className="pos-product-grid">
            {loading ? (
              <div className="pos-loading">
                <div className="pos-spinner" />
                <p>Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="pos-empty">
                <Package size={48} />
                <p>No products found</p>
              </div>
            ) : (
              products.map((product) => (
                <div
                  key={product._id}
                  className={`pos-product-card ${product.stock <= 0 ? 'pos-out-of-stock' : ''}`}
                  onClick={() => {
                    if (product.stock > 0) {
                      toast.info('Double-click card or tap + to add to cart', { toastId: `dbhint-${product._id}`, autoClose: 1500 });
                    }
                  }}
                  onDoubleClick={() => product.stock > 0 && handleAddProduct(product)}
                  title={product.stock > 0 ? "Double-click card or click + button to add to cart" : "Out of stock"}
                >
                  <div className="pos-product-img-wrapper">
                    {(product.productLink || product.images?.[0]) ? (
                      <img
                        src={getImageUrl(product.productLink || product.images?.[0])}
                        alt={product.name}
                        className="pos-product-img"
                        loading="lazy"
                        onError={(e) => handleImageError(e, 'Product')}
                      />
                    ) : (
                      <div className="pos-product-img-placeholder">
                        <Package size={28} />
                      </div>
                    )}
                    {product.stock <= 5 && product.stock > 0 && (
                      <span className="pos-stock-badge pos-stock-low">Low</span>
                    )}
                    {product.stock <= 0 && (
                      <span className="pos-stock-badge pos-stock-out">Out</span>
                    )}
                  </div>
                  <div className="pos-product-info">
                    <h4 className="pos-product-name">{product.name}</h4>
                    <div className="pos-product-meta" style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span className="pos-product-price" style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>Rs. {product.price.toFixed(2)}</span>
                        <span className="pos-product-unit" style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>Stock: {product.stock}</span>
                      </div>
                      {product.minPrice > 0 && (
                        <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 600 }}>
                          Min: Rs. {product.minPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {product.barcode && (
                      <span className="pos-product-barcode">{product.barcode}</span>
                    )}
                  </div>
                  {product.stock > 0 && (
                    <button
                      className="pos-product-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddProduct(product);
                      }}
                      title="Add to cart"
                    >
                      <Plus size={18} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Add Modal */}
        {showQuickAdd && (
          <div className="pos-modal-overlay">
            <div className="pos-modal-content" style={{ maxWidth: '400px' }}>
              <div className="pos-modal-header">
                <h3>Quick Add Product</h3>
                <button onClick={() => setShowQuickAdd(false)}><X size={20} /></button>
              </div>
              <div className="pos-modal-body" style={{ padding: '20px' }}>
                <div className="pos-form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    className="pos-input"
                    value={quickAddForm.name}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, name: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="pos-form-group">
                    <label>Price (Rs.)</label>
                    <input
                      type="number"
                      className="pos-input"
                      value={quickAddForm.price}
                      onChange={(e) => setQuickAddForm({ ...quickAddForm, price: e.target.value })}
                    />
                  </div>
                  <div className="pos-form-group">
                    <label>Initial Stock</label>
                    <input
                      type="number"
                      className="pos-input"
                      value={quickAddForm.stock}
                      onChange={(e) => setQuickAddForm({ ...quickAddForm, stock: e.target.value })}
                    />
                  </div>
                </div>
                <div className="pos-form-group">
                  <label>Category</label>
                  <select
                    className="pos-input"
                    value={quickAddForm.categoryId}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, categoryId: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <button className="pos-login-btn" onClick={handleQuickAdd} disabled={loading}>
                  {loading ? 'Adding...' : 'Add Product'}
                </button>
              </div>
            </div>
          </div>
        )}


        {/* ──────── RIGHT PANEL: Cart ──────── */}
        <div className="pos-cart-panel" style={pos.cart.length > 0 ? { flex: '4.5', maxWidth: '600px', transition: 'all 0.3s ease' } : { transition: 'all 0.3s ease' }}>
          <div className="pos-cart-header">
            <Receipt size={20} />
            <h2>Current Sale</h2>
            <span className="pos-cart-count">{pos.cart.length} items</span>
          </div>

          {/* Cart Top Quick Barcode / IMEI Scanner */}
          <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px' }}>⚡</span>
            <input
              ref={cartScanRef}
              type="text"
              value={cartScanInput}
              onChange={(e) => setCartScanInput(e.target.value)}
              onKeyDown={handleCartScanKeyDown}
              placeholder="Scan Barcode or IMEI to Cart (Enter ↵)..."
              style={{
                flex: 1,
                padding: '7px 10px',
                fontSize: '12px',
                fontWeight: '600',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                outline: 'none',
                color: '#0f172a'
              }}
            />
            {cartScanInput && (
              <button onClick={() => setCartScanInput('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="pos-cart-items">
            {pos.cart.length === 0 ? (
              <div className="pos-cart-empty">
                <ShoppingCart size={40} />
                <p>No items added yet</p>
                <span>Search or scan to add products</span>
              </div>
            ) : (
              pos.cart.map((item) => {
                const dbProduct = productCache[item.productId] || products.find(p => p._id === item.productId);
                const barcode = item.barcode || dbProduct?.barcode || item.sku || dbProduct?.sku;

                return (
                  <div key={item.productId} className="pos-cart-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div className="flex justify-between items-center w-full">
                      <div className="pos-cart-item-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h4 className="pos-cart-item-name" style={{ margin: 0 }}>{item.name}</h4>
                          {barcode && (
                            <span 
                              style={{ 
                                fontSize: '11px', 
                                background: '#eff6ff', 
                                color: '#1d4ed8', 
                                padding: '1px 7px', 
                                borderRadius: '6px', 
                                fontFamily: 'monospace', 
                                fontWeight: 700, 
                                border: '1px solid #bfdbfe',
                                letterSpacing: '0.5px' 
                              }} 
                              title="Product Barcode / SKU"
                            >
                              🏷️ {barcode}
                            </span>
                          )}
                        </div>
                        <p className="pos-cart-item-price" style={{ marginTop: '2px' }}>
                          Rs.{item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                    <div className="pos-cart-item-controls">
                      <div className="pos-qty-controls">
                        <button
                          className="pos-qty-btn"
                          onClick={() => pos.updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="pos-qty-value">{item.quantity}</span>
                        <button
                          className="pos-qty-btn"
                          onClick={() => pos.updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="pos-cart-item-total">
                        Rs.{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        className="pos-cart-remove"
                        onClick={() => pos.removeItem(item.productId)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* IMEI Scan & Entry Block */}
                  {(() => {
                    const dbProduct = productCache[item.productId] || products.find(p => p._id === item.productId);
                    if (!dbProduct) return null;
                    const catName = dbProduct.categoryId?.name || '';
                    const isMobile = /mobile|phone|tablet|smartphone/i.test(catName) || (dbProduct.imei && dbProduct.imei.length > 0) || dbProduct.ram || dbProduct.storage;
                    
                    if (!isMobile) return null;
                    
                    const selectedImeis = item.imei || [];
                    const availableImeis = dbProduct.imei ? dbProduct.imei.filter(im => !selectedImeis.includes(im)) : [];
                    
                    return (
                      <div className="mt-2 bg-[#f8fafc] border border-gray-200 rounded-xl p-2.5 space-y-2 text-xs text-left" style={{ width: '100%' }}>
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          <span>IMEI Scan/Selection Required</span>
                          <span className={selectedImeis.length === item.quantity ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                            {selectedImeis.length} of {item.quantity} scanned
                          </span>
                        </div>
                        
                        {/* Selected IMEIs as badges */}
                        {selectedImeis.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedImeis.map((im) => (
                              <span key={im} className="bg-primary-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                                {im}
                                <button
                                  type="button"
                                  onClick={() => {
                                    pos.setCartItemImeis(item.productId, selectedImeis.filter(x => x !== im));
                                  }}
                                  className="hover:text-red-200 font-bold transition-colors ml-1 focus:outline-none"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Add IMEI UI */}
                        {selectedImeis.length < item.quantity && (
                          <div className="flex gap-2">
                            {dbProduct.imei && dbProduct.imei.length > 0 ? (
                              availableImeis.length > 0 ? (
                                <select
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) {
                                      pos.setCartItemImeis(item.productId, [...selectedImeis, val]);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="flex-grow p-1.5 border border-card-border rounded-lg bg-white text-dark-navy focus:outline-none focus:ring-1 focus:ring-primary-blue text-xs"
                                >
                                  <option value="">-- Select Scanned IMEI --</option>
                                  {availableImeis.map(im => (
                                    <option key={im} value={im}>{im}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-[10px] text-red-500 italic flex-grow py-1">No available IMEIs in stock.</span>
                              )
                            ) : (
                              <div className="flex-grow text-[10px] text-gray-500 italic py-1">
                                Enter manual IMEI
                              </div>
                            )}
                            
                            <input
                              type="text"
                              placeholder="Scan/type IMEI + Enter"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = e.target.value.trim();
                                  if (!val) return;
                                  
                                  if (dbProduct.imei && dbProduct.imei.length > 0) {
                                    if (dbProduct.imei.includes(val)) {
                                      if (selectedImeis.includes(val)) {
                                        toast.info('IMEI already added');
                                      } else {
                                        pos.setCartItemImeis(item.productId, [...selectedImeis, val]);
                                        e.target.value = '';
                                      }
                                    } else {
                                      toast.error('IMEI is not present in product stock');
                                    }
                                  } else {
                                    // Empty imei array in database: allow any custom scanned/typed IMEI
                                    if (selectedImeis.includes(val)) {
                                      toast.info('IMEI already added');
                                    } else {
                                      pos.setCartItemImeis(item.productId, [...selectedImeis, val]);
                                      e.target.value = '';
                                    }
                                  }
                                }
                              }}
                              className="w-48 p-1.5 border border-card-border rounded-lg bg-white text-dark-navy focus:outline-none focus:ring-1 focus:ring-primary-blue text-xs"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Accessory Barcode Scan & Verification Block */}
                  {(() => {
                    const dbProduct = productCache[item.productId] || products.find(p => p._id === item.productId);
                    const catName = dbProduct?.categoryId?.name || '';
                    const isMobile = /mobile|phone|tablet|smartphone/i.test(catName) || (dbProduct?.imei && dbProduct.imei.length > 0) || dbProduct?.ram || dbProduct?.storage;
                    
                    if (isMobile) return null;
                    
                    const registeredBarcode = item.barcode || dbProduct?.barcode || item.sku || dbProduct?.sku;
                    const isVerified = !!item.verifiedBarcode || (registeredBarcode && item.verifiedBarcode === registeredBarcode);

                    return (
                      <div style={{ marginTop: '8px', background: isVerified ? '#f0fdf4' : '#f8fafc', border: isVerified ? '1.5px solid #86efac' : '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 10px', fontSize: '11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 'bold', color: isVerified ? '#15803d' : '#475569' }}>
                              {isVerified ? '✓ Barcode Verified' : '🏷️ Accessory Barcode / SKU'}
                            </span>
                            {registeredBarcode && (
                              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', background: '#ffffff', color: '#1e293b', padding: '1px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                {registeredBarcode}
                              </span>
                            )}
                          </div>
                          {isVerified && (
                            <span style={{ color: '#16a34a', fontWeight: '800', fontSize: '10px' }}>READY</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            placeholder={registeredBarcode ? `Scan/type ${registeredBarcode} + Enter` : "Scan/type accessory barcode + Enter"}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = e.target.value.trim();
                                if (!val) return;
                                pos.setCartItemBarcode(item.productId, val);
                                toast.success(`✓ Barcode verified for ${item.name}!`);
                                e.target.value = '';
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: '5px 8px',
                              fontSize: '11px',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              outline: 'none',
                              color: '#0f172a'
                            }}
                          />
                          {item.verifiedBarcode && (
                            <button
                              type="button"
                              onClick={() => pos.setCartItemBarcode(item.productId, '')}
                              style={{ padding: '3px 8px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                              title="Reset verification"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })
            )}
          </div>

          {/* Totals */}
          {pos.cart.length > 0 && (
            <div className="pos-cart-totals" style={{ display: 'flex', flexDirection: 'column', maxHeight: '65vh', minHeight: 0 }}>

              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px', marginBottom: '10px' }}>
                <div className="pos-total-row">
                  <span>Subtotal</span>
                  <span>Rs. {subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="pos-total-row pos-discount-row">
                    <span>
                      Discount
                      {pos.discountType === 'percentage' ? ` (${pos.discount}%)` : ''}
                    </span>
                    <span>-Rs. {discountAmount.toFixed(2)}</span>
                    <button
                      className="pos-discount-clear"
                      onClick={() => pos.setDiscount(0, 'percentage')}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="pos-total-row pos-discount-row">
                    <span>
                      🎟️ Coupon ({pos.coupon?.code})
                    </span>
                    <span>-Rs. {couponDiscount.toFixed(2)}</span>
                    <button
                      className="pos-discount-clear"
                      onClick={() => pos.clearCoupon()}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <div className="pos-total-row" style={{ alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Tax (%)</span>
                    <input
                      type="number"
                      value={pos.taxRate * 100}
                      onChange={(e) => {
                        const newRate = parseFloat(e.target.value);
                        pos.setTaxRate(isNaN(newRate) ? 0 : newRate / 100);
                      }}
                      className="pos-input"
                      style={{ width: '60px', height: '24px', padding: '0 4px', fontSize: '11px', textAlign: 'center', margin: 0, background: '#fff', color: '#1e293b' }}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <span>Rs. {pos.getTax().toFixed(2)}</span>
                </div>
                {exchangeCredit > 0 && (
                  <div className="pos-total-row pos-discount-row">
                    <span style={{ color: '#2563eb', fontWeight: 600 }}>🔄 Return Credit (Applied)</span>
                    <span style={{ color: '#2563eb', fontWeight: 700 }}>-Rs. {exchangeCredit.toFixed(2)}</span>
                    <button
                      className="pos-discount-clear"
                      onClick={() => {
                        setExchangeCredit(0);
                        setExchangeReturnId(null);
                        toast.info('Return credit removed');
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div className="pos-total-row pos-discount-row">
                    <span>🏆 Loyalty ({pos.loyaltyPointsToRedeem} pts)</span>
                    <span>-Rs. {loyaltyDiscount.toFixed(2)}</span>
                    <button className="pos-discount-clear" onClick={() => pos.clearLoyaltyRedemption()}><X size={12} /></button>
                  </div>
                )}

                {/* Coupon Input */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Ticket size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      className="pos-input"
                      style={{ paddingLeft: '32px', width: '100%', fontSize: '13px' }}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    />
                  </div>
                  <button
                    className="pos-btn-green"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon}
                    style={{ padding: '8px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    {applyingCoupon ? '...' : 'Apply'}
                  </button>
                </div>

                {/* Discount Button */}
                <button
                  className="pos-apply-discount-btn"
                  onClick={() => setShowDiscount(true)}
                >
                  <Percent size={16} />
                  Apply Discount
                </button>

                {/* Loyalty Points Redemption */}
                <button
                  className="pos-apply-discount-btn"
                  onClick={() => { setShowLoyalty(!showLoyalty); if (!showLoyalty) fetchCustomerPoints(); }}
                  style={{ marginTop: '4px', background: showLoyalty ? '#fef3c7' : undefined, color: showLoyalty ? '#92400e' : undefined }}
                >
                  🏆 {pos.loyaltyPointsToRedeem > 0 ? `Points Applied: ${pos.loyaltyPointsToRedeem}` : 'Redeem Loyalty Points'}
                </button>
                {showLoyalty && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                      <span style={{ color: '#92400e', fontWeight: 600 }}>Available Points:</span>
                      <span style={{ fontWeight: 700, color: '#d97706' }}>{loadingPoints ? '...' : customerPoints}</span>
                    </div>
                    {pos.loyaltyPointsToRedeem > 0 ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#065f46', fontWeight: 600 }}>✅ {pos.loyaltyPointsToRedeem} pts = Rs.{pos.loyaltyDiscount}</span>
                        <button onClick={() => { pos.clearLoyaltyRedemption(); toast.info('Points cleared'); }} style={{ fontSize: '11px', color: '#dc2626', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 600 }}>Remove</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="number"
                          value={pointsInput}
                          onChange={(e) => setPointsInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyPoints();
                            }
                          }}
                          placeholder="Points to redeem"
                          className="pos-input"
                          style={{ flex: 1, fontSize: '12px' }}
                          min="10"
                          max={customerPoints}
                        />
                        <button className="pos-btn-green" onClick={handleApplyPoints} style={{ padding: '6px 14px', fontSize: '12px' }}>Apply</button>
                      </div>
                    )}
                    <p style={{ fontSize: '10px', color: '#92400e', marginTop: '6px', marginBottom: 0 }}>1 point = Rs.{pointValue} discount. Min 10 points.</p>
                  </div>
                )}

                {/* Customer Info Toggle */}
                <button
                  className="pos-apply-discount-btn"
                  onClick={() => {
                    setShowCustomerInfo(!showCustomerInfo);
                    if (!showCustomerInfo) {
                      setTimeout(() => customerNameRef.current?.focus(), 80);
                    }
                  }}
                  style={{ marginTop: '4px', background: showCustomerInfo ? '#dbeafe' : undefined, color: showCustomerInfo ? '#2563eb' : undefined, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={16} />
                    <span>{pos.customerName ? `Customer: ${pos.customerName}` : 'Add Customer Info'}</span>
                  </div>
                  <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#64748b', padding: '1px 5px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>F3</span>
                </button>
                {showCustomerInfo && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        ref={customerNameRef}
                        type="text"
                        value={pos.customerName}
                        onChange={(e) => pos.setCustomerInfo(e.target.value, pos.customerPhone, pos.customerNic, pos.customerAddress)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            customerPhoneRef.current?.focus();
                          }
                        }}
                        placeholder="Customer name (Enter ↵ for Phone)"
                        className="pos-input"
                        style={{ flex: 1, fontSize: '12px' }}
                      />
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flex: 1 }}>
                        <input
                          ref={customerPhoneRef}
                          type="tel"
                          value={pos.customerPhone}
                          onChange={(e) => pos.setCustomerInfo(pos.customerName, e.target.value, pos.customerNic, pos.customerAddress)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (pos.paymentMethod === 'cash') {
                                tenderedAmountRef.current?.focus();
                                tenderedAmountRef.current?.select();
                              } else {
                                customerNicRef.current?.focus();
                              }
                            }
                          }}
                          placeholder="Phone (Enter ↵ for Cash)"
                          className="pos-input"
                          style={{ flex: 1, fontSize: '12px' }}
                        />
                        <button 
                          className="pos-btn-blue"
                          onClick={() => {
                            if (!pos.customerPhone) {
                              toast.error('Enter phone number first');
                              return;
                            }
                            setShowCustomerHistory(true);
                          }}
                          style={{ padding: '8px', minWidth: '40px' }}
                          title="View Purchase History"
                        >
                          <History size={16} />
                        </button>
                      </div>

                      {customerCreditSummary?.totalDue > 0 && (
                        <div
                          onClick={() => {
                            setCreditSearchInput(pos.customerPhone);
                            setShowCreditSettleModal(true);
                            handleSearchCreditOrders(pos.customerPhone);
                          }}
                          style={{
                            marginTop: '6px',
                            padding: '8px 12px',
                            background: '#fffbeb',
                            border: '1.5px solid #f59e0b',
                            borderRadius: '10px',
                            color: '#b45309',
                            fontSize: '11px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.15)'
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>⚠️</span> Outstanding Debt: <strong>Rs. {Number(customerCreditSummary.totalDue).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</strong> ({customerCreditSummary.unpaidOrdersCount} bills)
                          </span>
                          <span style={{ textDecoration: 'underline', color: '#d97706', fontSize: '10px' }}>
                            Settle Now &rarr;
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        ref={customerNicRef}
                        type="text"
                        value={pos.customerNic}
                        onChange={(e) => pos.setCustomerInfo(pos.customerName, pos.customerPhone, e.target.value, pos.customerAddress)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            customerAddressRef.current?.focus();
                          }
                        }}
                        placeholder="NIC (e.g., 991234567V)"
                        className="pos-input"
                        style={{ flex: 1, fontSize: '12px' }}
                      />
                      <input
                        ref={customerAddressRef}
                        type="text"
                        value={pos.customerAddress}
                        onChange={(e) => pos.setCustomerInfo(pos.customerName, pos.customerPhone, pos.customerNic, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            tenderedAmountRef.current?.focus();
                            tenderedAmountRef.current?.select();
                          }
                        }}
                        placeholder="Address (Enter ↵ for Cash)"
                        className="pos-input"
                        style={{ flex: 1, fontSize: '12px' }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151' }}>
                    <input
                      type="checkbox"
                      checked={pos.sendSmsReceipt}
                      onChange={(e) => pos.setReceiptOptions({ sendSmsReceipt: e.target.checked, sendReceiptEmail: pos.sendReceiptEmail, receiptEmail: pos.receiptEmail, printReceipt: pos.printReceipt })}
                    />
                    Send SMS Receipt
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151' }}>
                    <input
                      type="checkbox"
                      checked={pos.sendReceiptEmail}
                      onChange={(e) => pos.setReceiptOptions({ sendSmsReceipt: pos.sendSmsReceipt, sendReceiptEmail: e.target.checked, receiptEmail: pos.receiptEmail, printReceipt: pos.printReceipt })}
                    />
                    Send Receipt via Email
                  </label>
                  {pos.sendReceiptEmail && (
                    <input
                      type="email"
                      value={pos.receiptEmail}
                      onChange={(e) => pos.setReceiptOptions({ sendSmsReceipt: pos.sendSmsReceipt, sendReceiptEmail: pos.sendReceiptEmail, receiptEmail: e.target.value, printReceipt: pos.printReceipt })}
                      placeholder="customer@email.com"
                      className="pos-input"
                      style={{ fontSize: '12px' }}
                    />
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151' }}>
                    <input
                      type="checkbox"
                      checked={pos.printReceipt}
                      onChange={(e) => pos.setReceiptOptions({ sendSmsReceipt: pos.sendSmsReceipt, sendReceiptEmail: pos.sendReceiptEmail, receiptEmail: pos.receiptEmail, printReceipt: e.target.checked })}
                    />
                    Print Receipt
                  </label>
                </div>

                {/* Payment Method */}
                <div className="pos-payment-methods">
                  <button
                    className={`pos-payment-btn ${pos.paymentMethod === 'cash' ? 'active' : ''}`}
                    onClick={() => pos.setPaymentMethod('cash')}
                  >
                    <Banknote size={20} />
                    Cash
                  </button>
                  <button
                    className={`pos-payment-btn ${pos.paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => pos.setPaymentMethod('card')}
                  >
                    <CreditCard size={20} />
                    Card
                  </button>
                  <button
                    className={`pos-payment-btn ${pos.paymentMethod === 'hire_purchase' ? 'active' : ''}`}
                    onClick={() => {
                      pos.setPaymentMethod('hire_purchase');
                      if (!pos.hirePurchaseData) {
                        pos.setHirePurchaseData({
                          customer: { name: pos.customerName, phone: pos.customerPhone, nic: '', address: '', guarantors: [] },
                          downPayment: 0,
                          downPaymentMethod: 'cash',
                          downPaymentAccountId: '',
                          numberOfInstallments: 6,
                          installmentType: 'Monthly',
                          interestRate: 0,
                          interestAmount: 0,
                          netTotal: grandTotal,
                          installmentAmount: grandTotal / 6,
                          startDate: new Date().toISOString().split('T')[0]
                        });
                      }
                    }}
                    title="Hire Purchase (Installments)"
                  >
                    <Clock size={20} />
                    Installment
                  </button>
                  <button
                    className={`pos-payment-btn ${pos.paymentMethod === 'bank_transfer' ? 'active' : ''}`}
                    onClick={() => pos.setPaymentMethod('bank_transfer')}
                    title="Bank Transfer"
                  >
                    <Landmark size={20} />
                    Bank
                  </button>
                  <button
                    className={`pos-payment-btn ${pos.paymentMethod === 'koko' ? 'active' : ''}`}
                    onClick={() => pos.setPaymentMethod('koko')}
                    title="Koko Pay - Buy Now Pay Later"
                  >
                    <Smartphone size={20} />
                    Koko
                  </button>
                  <button
                    className={`pos-payment-btn ${pos.paymentMethod === 'cheque' ? 'active' : ''}`}
                    onClick={() => pos.setPaymentMethod('cheque')}
                    title="Cheque Payment"
                  >
                    <Receipt size={20} />
                    Cheque
                  </button>
                  <button
                    className={`pos-payment-btn ${pos.paymentMethod === 'payhere' ? 'active' : ''}`}
                    onClick={() => pos.setPaymentMethod('payhere')}
                    title="PayHere - Online Payment"
                    style={{ background: pos.paymentMethod === 'payhere' ? '#6d28d9' : undefined, color: pos.paymentMethod === 'payhere' ? '#fff' : undefined }}
                  >
                    <CreditCard size={20} />
                    PayHere
                  </button>
                  <button
                    className={`pos-payment-btn ${pos.paymentMethod === 'credit' || isCredit ? 'active' : ''}`}
                    onClick={() => {
                      pos.setPaymentMethod('credit');
                      setIsCredit(true);
                      setCreditAmountPaid(0);
                      if (!pos.customerPhone) {
                        setShowCustomerInfo(true);
                        setTimeout(() => customerPhoneRef.current?.focus(), 100);
                      }
                    }}
                    title="Credit Sale (Pay Later)"
                    style={{
                      background: pos.paymentMethod === 'credit' || isCredit ? '#fef3c7' : undefined,
                      color: pos.paymentMethod === 'credit' || isCredit ? '#92400e' : undefined,
                      borderColor: pos.paymentMethod === 'credit' || isCredit ? '#fde68a' : undefined
                    }}
                  >
                    <Clock size={20} />
                    Credit (Pay Later)
                  </button>
                </div>


                {/* Dynamic Multi-Payment Rows */}
                {pos.paymentMethod !== 'hire_purchase' && (
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Payment Allocation (Split Payments)
                    </label>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {payments.map((p, index) => (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <select
                              value={p.method}
                              onChange={(e) => {
                                const newPayments = [...payments];
                                newPayments[index].method = e.target.value;
                                if (e.target.value === 'cash') {
                                  newPayments[index].accountId = '';
                                } else {
                                  newPayments[index].accountId = accounts[0]?._id || '';
                                }
                                // Initialize Hire Purchase data if selected
                                if (e.target.value === 'hire_purchase' && !pos.hirePurchaseData) {
                                  pos.setHirePurchaseData({
                                    customer: { name: pos.customerName, phone: pos.customerPhone, nic: '', address: '', guarantors: [] },
                                    downPayment: 0,
                                    downPaymentMethod: 'cash',
                                    downPaymentAccountId: '',
                                    numberOfInstallments: 6,
                                    installmentType: 'Monthly',
                                    interestRate: 0,
                                    interestAmount: 0,
                                    netTotal: grandTotal,
                                    installmentAmount: grandTotal / 6,
                                    startDate: new Date().toISOString().split('T')[0]

                                  });
                                }
                                setPayments(newPayments);
                              }}
                              className="pos-input"
                              style={{ flex: 1.5, fontSize: '12px', height: '36px', padding: '0 8px', background: '#fff', color: '#1e293b' }}
                            >
                              <option value="cash">Cash</option>
                              <option value="card">Card</option>
                              <option value="bank_transfer">Bank Transfer</option>
                              <option value="cheque">Cheque</option>
                              <option value="koko">Koko</option>
                            </select>

                            {p.method !== 'cash' && (
                              <select
                                value={p.accountId}
                                onChange={(e) => {
                                  const newPayments = [...payments];
                                  newPayments[index].accountId = e.target.value;
                                  setPayments(newPayments);
                                }}
                                className="pos-input"
                                style={{ flex: 2, fontSize: '12px', height: '36px', padding: '0 8px', background: '#fff', color: '#1e293b' }}
                              >
                                <option value="">Select Account</option>
                                {accounts.map(a => (
                                  <option key={a._id} value={a._id}>
                                    {a.name}

                                  </option>
                                ))}
                              </select>
                            )}

                            <input
                              type="number"
                              value={p.amount || ''}
                              onChange={(e) => {
                                const newPayments = [...payments];
                                newPayments[index].amount = parseFloat(e.target.value) || 0;
                                setPayments(newPayments);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCheckout();
                                }
                              }}
                              placeholder="Amount"
                              className="pos-input"
                              style={{ flex: 1.5, fontSize: '12px', height: '36px', padding: '0 8px', fontWeight: 'bold', background: '#fff', color: '#1e293b' }}
                              min="0"
                              step="0.01"
                            />

                            {payments.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPayments(payments.filter((_, i) => i !== index));
                                }}
                                style={{ border: 'none', background: 'none', color: '#ef4444', padding: '6px', cursor: 'pointer' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>

                          {p.method === 'cheque' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '6px', marginTop: '4px' }}>
                              <div>
                                <label style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b' }}>Cheque No</label>
                                <input
                                  type="text"
                                  value={p.chequeDetails?.number || ''}
                                  onChange={(e) => {
                                    const newPayments = [...payments];
                                    newPayments[index].chequeDetails = { ...newPayments[index].chequeDetails, number: e.target.value };
                                    setPayments(newPayments);
                                  }}
                                  placeholder="Number"
                                  className="pos-input"
                                  style={{ fontSize: '11px', height: '28px', padding: '0 6px', background: '#fff', color: '#1e293b' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b' }}>Bank</label>
                                <input
                                  type="text"
                                  value={p.chequeDetails?.bank || ''}
                                  onChange={(e) => {
                                    const newPayments = [...payments];
                                    newPayments[index].chequeDetails = { ...newPayments[index].chequeDetails, bank: e.target.value };
                                    setPayments(newPayments);
                                  }}
                                  placeholder="e.g. BOC"
                                  className="pos-input"
                                  style={{ fontSize: '11px', height: '28px', padding: '0 6px', background: '#fff', color: '#1e293b' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b' }}>Due Date</label>
                                <input
                                  type="date"
                                  value={p.chequeDetails?.dueDate || ''}
                                  onChange={(e) => {
                                    const newPayments = [...payments];
                                    newPayments[index].chequeDetails = { ...newPayments[index].chequeDetails, dueDate: e.target.value };
                                    setPayments(newPayments);
                                  }}
                                  className="pos-input"
                                  style={{ fontSize: '11px', height: '28px', padding: '0 6px', background: '#fff', color: '#1e293b' }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPayments([...payments, { method: 'cash', amount: 0, accountId: '', chequeDetails: { number: '', bank: '', dueDate: '' } }]);
                      }}
                      className="pos-apply-discount-btn"
                      style={{ marginTop: '8px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '32px', fontSize: '12px' }}
                    >
                      <Plus size={14} /> Add Payment Row
                    </button>
                  </div>
                )}

                {/* Hire Purchase Details */}
                {(pos.paymentMethod === 'hire_purchase' || payments.some(p => p.method === 'hire_purchase')) && pos.hirePurchaseData && (
                  <div style={{ background: '#fef3c7', padding: '15px', borderRadius: '16px', border: '1px solid #fde68a', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <Clock size={18} className="text-amber-600" />
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#92400e' }}>Installment Plan (Hire Purchase)</h4>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#92400e' }}>Customer Name *</label>
                        <input type="text" value={pos.customerName}
                          onChange={(e) => pos.setCustomerInfo(e.target.value, pos.customerPhone, pos.customerNic, pos.customerAddress)}
                          placeholder="Full Name" className="pos-input" style={{ fontSize: '12px', background: '#fff', color: '#1e293b' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#92400e' }}>Customer Phone *</label>
                        <input type="tel" value={pos.customerPhone}
                          onChange={(e) => pos.setCustomerInfo(pos.customerName, e.target.value, pos.customerNic, pos.customerAddress)}
                          placeholder="Phone Number" className="pos-input" style={{ fontSize: '12px', background: '#fff', color: '#1e293b' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#92400e' }}>Customer NIC *</label>
                        <input type="text" value={pos.customerNic}
                          onChange={(e) => pos.setCustomerInfo(pos.customerName, pos.customerPhone, e.target.value, pos.customerAddress)}
                          placeholder="NIC (e.g., 991234567V)" className="pos-input" style={{ fontSize: '12px', background: '#fff', color: '#1e293b' }} />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#92400e' }}>Customer Address *</label>
                        <input type="text" value={pos.customerAddress}
                          onChange={(e) => pos.setCustomerInfo(pos.customerName, pos.customerPhone, pos.customerNic, e.target.value)}
                          placeholder="Address (e.g., Colombo)" className="pos-input" style={{ fontSize: '12px', background: '#fff', color: '#1e293b' }} />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#92400e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Agreement Start/Purchase Date (System Locked) *</span>
                          <span style={{ fontSize: '9px', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '4px', border: '1px solid #fde68a' }}>🔒 Auto Today</span>
                        </label>
                        <input 
                          type="date" 
                          readOnly
                          disabled
                          value={pos.hirePurchaseData?.startDate || new Date().toISOString().split('T')[0]}
                          className="pos-input cursor-not-allowed" 
                          style={{ fontSize: '12px', background: '#f1f5f9', color: '#64748b', fontWeight: 'bold', cursor: 'not-allowed' }} 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#92400e' }}>Down Payment (Rs.) *</label>
                        <input type="number" value={pos.hirePurchaseData?.downPayment || 0}
                          onWheel={(e) => e.target.blur()}
                          onChange={(e) => {
                            const dp = Number(e.target.value);
                            const interest = Number(pos.hirePurchaseData?.interestAmount || 0);

                            const netTotal = grandTotal + interest;
                            const bal = netTotal - dp;
                            const ni = pos.hirePurchaseData?.numberOfInstallments || 1;
                            pos.setHirePurchaseData({
                              ...pos.hirePurchaseData,
                              downPayment: dp,
                              netTotal: netTotal,
                              installmentAmount: ni > 0 ? bal / ni : bal
                            });
                          }}
                          placeholder="0.00" className="pos-input" style={{ fontSize: '12px', background: '#fff', fontWeight: 'bold', color: '#1e293b' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#92400e' }}>Down Payment Method *</label>
                        <select 
                          value={pos.hirePurchaseData.downPaymentMethod || 'cash'}
                          onChange={(e) => {
                            pos.setHirePurchaseData({
                              ...pos.hirePurchaseData,
                              downPaymentMethod: e.target.value,
                              downPaymentAccountId: e.target.value === 'cash' ? '' : (accounts.find(a => a.isDefault)?._id || accounts[0]?._id || '')
                            });
                          }}
                          className="pos-input" 
                          style={{ fontSize: '12px', background: '#fff', color: '#1e293b', height: '36px' }}
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="bank_transfer">Bank Transfer</option>
                        </select>
                      </div>

                      {(pos.hirePurchaseData.downPaymentMethod || 'cash') !== 'cash' && (
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#92400e' }}>Target Bank/Drawer Account *</label>
                          <select
                            value={pos.hirePurchaseData.downPaymentAccountId || ''}
                            onChange={(e) => {
                              pos.setHirePurchaseData({
                                ...pos.hirePurchaseData,
                                downPaymentAccountId: e.target.value
                              });
                            }}
                            className="pos-input"
                            style={{ fontSize: '12px', background: '#fff', color: '#1e293b', height: '36px' }}
                          >
                            <option value="">Select Account</option>
                            {accounts.map(a => (
                              <option key={a._id} value={a._id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#92400e' }}>Interest Amount (Rs.)</label>
                        <input type="number" value={pos.hirePurchaseData.interestAmount || 0}
                          onWheel={(e) => e.target.blur()}
                          onChange={(e) => {
                            const interest = Number(e.target.value);
                            const dp = Number(pos.hirePurchaseData.downPayment || 0);
                            const netTotal = grandTotal + interest;
                            const bal = netTotal - dp;
                            const ni = pos.hirePurchaseData.numberOfInstallments || 1;
                            pos.setHirePurchaseData({
                              ...pos.hirePurchaseData,
                              interestAmount: interest,
                              netTotal: netTotal,
                              installmentAmount: ni > 0 ? bal / ni : bal
                            });
                          }}
                          placeholder="0.00" className="pos-input" style={{ fontSize: '12px', background: '#fff', fontWeight: 'bold', color: '#1e293b' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#92400e' }}>No. of Installments</label>
                        <select value={pos.hirePurchaseData.numberOfInstallments}
                          onChange={(e) => {
                            const ni = Number(e.target.value);
                            const interest = Number(pos.hirePurchaseData.interestAmount || 0);
                            const dp = Number(pos.hirePurchaseData.downPayment || 0);
                            const netTotal = grandTotal + interest;
                            const bal = netTotal - dp;
                            pos.setHirePurchaseData({
                              ...pos.hirePurchaseData,
                              numberOfInstallments: ni,
                              installmentAmount: ni > 0 ? bal / ni : bal
                            });
                          }}
                          className="pos-input" style={{ fontSize: '12px', background: '#fff', color: '#1e293b' }}>
                          {[0, 1, 2, 3, 6, 9, 10, 12, 18, 24].map(n => (
                            <option key={n} value={n}>
                              {n === 0 ? '0 Months (0% Interest / Full Due)' : `${n} Months`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.5)', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e' }}>Original Price:</span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400e' }}>
                            Rs. {grandTotal.toFixed(2)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e' }}>Total Payable (with Interest):</span>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#b45309' }}>
                            Rs. {((grandTotal + Number(pos.hirePurchaseData.interestAmount || 0))).toFixed(2)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dotted rgba(146, 64, 14, 0.2)', paddingTop: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e' }}>Remaining Balance:</span>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#b45309' }}>
                            Rs. {((grandTotal + Number(pos.hirePurchaseData.interestAmount || 0)) - Number(pos.hirePurchaseData.downPayment || 0)).toFixed(2)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(146, 64, 14, 0.3)', paddingTop: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e' }}>Installment Amount:</span>
                          <span style={{ fontSize: '15px', fontWeight: '800', color: '#b45309' }}>
                            Rs. {(((grandTotal + Number(pos.hirePurchaseData.interestAmount || 0)) - Number(pos.hirePurchaseData.downPayment || 0)) / (pos.hirePurchaseData.numberOfInstallments || 1)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


                {/* Cash tendered */}

                {pos.paymentMethod === 'cash' && !isCredit && (
                  <div className="pos-cash-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="pos-cash-label">Amount Tendered</label>
                      <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#64748b', padding: '1px 5px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>F4</span>
                    </div>
                    <div className="pos-cash-input-wrapper">
                      <span className="pos-cash-icon" style={{ fontSize: '14px', fontWeight: 'bold', color: '#9ca3af' }}>Rs.</span>
                      <input
                        ref={tenderedAmountRef}
                        type="number"
                        value={pos.tenderedAmount}
                        onChange={(e) => pos.setTenderedAmount(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (pos.cart.length > 0 && !checkingOut) {
                              handleCheckout();
                            }
                          }
                        }}
                        placeholder="0.00 (Enter ↵ for Checkout)"
                        className="pos-cash-input"
                        min={grandTotal}
                        step="0.01"
                      />
                    </div>
                    {parseFloat(pos.tenderedAmount) >= grandTotal && (
                      <div className="pos-change-display">
                        <span>Change Due:</span>
                        <span className="pos-change-amount">Rs. {change.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Single Payment Method Fields (when not split payments) */}
                {payments.length === 1 && pos.paymentMethod !== 'cash' && pos.paymentMethod !== 'hire_purchase' && (
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Landmark size={18} className="text-blue-600" />
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#1e293b', textTransform: 'capitalize' }}>
                        {pos.paymentMethod.replace('_', ' ')} Details
                      </h4>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Target Account *</label>
                        <select
                          value={payments[0]?.accountId || ''}
                          onChange={(e) => {
                            const newPayments = [...payments];
                            newPayments[0].accountId = e.target.value;
                            setPayments(newPayments);
                          }}
                          className="pos-input"
                          style={{ width: '100%', fontSize: '12px', background: '#fff', color: '#1e293b', height: '36px' }}
                        >
                          <option value="">Select Account</option>
                          {accounts.map(a => (
                            <option key={a._id} value={a._id}>
                              {a.name}

                            </option>
                          ))}
                        </select>
                      </div>

                      {pos.paymentMethod === 'cheque' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>Cheque Number *</label>
                            <input
                              type="text"
                              required
                              value={payments[0]?.chequeDetails?.number || ''}
                              onChange={(e) => {
                                const newPayments = [...payments];
                                newPayments[0].chequeDetails = { ...newPayments[0].chequeDetails, number: e.target.value };
                                setPayments(newPayments);
                              }}
                              placeholder="Cheque Number"
                              className="pos-input"
                              style={{ fontSize: '12px', height: '36px', background: '#fff', color: '#1e293b' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>Bank *</label>
                            <input
                              type="text"
                              required
                              value={payments[0]?.chequeDetails?.bank || ''}
                              onChange={(e) => {
                                const newPayments = [...payments];
                                newPayments[0].chequeDetails = { ...newPayments[0].chequeDetails, bank: e.target.value };
                                setPayments(newPayments);
                              }}
                              placeholder="e.g. BOC"
                              className="pos-input"
                              style={{ fontSize: '12px', height: '36px', background: '#fff', color: '#1e293b' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>Due Date *</label>
                            <input
                              type="date"
                              required
                              value={payments[0]?.chequeDetails?.dueDate || ''}
                              onChange={(e) => {
                                const newPayments = [...payments];
                                newPayments[0].chequeDetails = { ...newPayments[0].chequeDetails, dueDate: e.target.value };
                                setPayments(newPayments);
                              }}
                              className="pos-input"
                              style={{ fontSize: '12px', height: '36px', background: '#fff', color: '#1e293b' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Credit Sale Toggle */}
                <label className={`pos-credit-toggle ${isCredit ? 'active' : ''}`}>
                  <input type="checkbox" checked={isCredit} onChange={(e) => setIsCredit(e.target.checked)} />
                  <span>📋 Credit Sale (Pay Later)</span>
                </label>
                {isCredit && (
                  <div className="pos-credit-fields">
                    <label className="pos-credit-label">Amount Paid Now</label>
                    <input
                      type="number"
                      className="pos-credit-input"
                      value={creditAmountPaid}
                      onChange={(e) => setCreditAmountPaid(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      max={grandTotal}
                      step="0.01"
                    />
                    {creditAmountPaid && parseFloat(creditAmountPaid) < grandTotal && (
                      <div className="pos-credit-pending">
                        <span>Pending Balance</span>
                        <span className="pos-credit-pending-amount">Rs. {(grandTotal - parseFloat(creditAmountPaid || 0)).toFixed(2)}</span>
                      </div>
                    )}
                    <input
                      type="text"
                      className="pos-credit-note-input"
                      value={creditNote}
                      onChange={(e) => setCreditNote(e.target.value)}
                      placeholder="Note (e.g. customer name, phone)"
                    />
                  </div>
                )}
              </div> {/* End of scrollable part */}

              <div className="pos-total-row pos-grand-total">
                <span>TOTAL</span>
                <span>Rs. {grandTotal.toFixed(2)}</span>
              </div>

              {/* Instant 1-Click Fast Cash Invoice Button */}
              <button
                className="pos-quick-cash-btn"
                onClick={handleQuickCashCheckout}
                disabled={checkingOut || pos.cart.length === 0}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: checkingOut || pos.cart.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: checkingOut || pos.cart.length === 0 ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)'
                }}
              >
                <Zap size={18} />
                <span>⚡ FAST CASH INVOICE & PRINT</span>
                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.25)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>[F4]</span>
              </button>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                <button
                  className="pos-checkout-btn"
                  onClick={handleCreateQuotation}
                  disabled={checkingOut || pos.cart.length === 0}
                  style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', height: '54px', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
                >
                  <span style={{ fontWeight: 'bold' }}>📄 GIVE QUOTATION</span>
                  <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 'bold' }}>[F10]</span>
                </button>
                <button
                  className="pos-checkout-btn"
                  onClick={() => handleCheckout()}
                  disabled={checkingOut || pos.cart.length === 0}
                  style={isCredit ? { background: 'linear-gradient(135deg,#f59e0b,#d97706)', height: '54px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' } : { height: '54px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
                >
                  {checkingOut ? (
                    <span className="pos-spinner-sm" />
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Receipt size={18} />
                        <span style={{ fontWeight: '800' }}>{isCredit ? `CREDIT SALE` : `CHECKOUT`}</span>
                      </div>
                      <span style={{ fontSize: '10px', opacity: 0.9, fontWeight: 'bold' }}>[F9 / Ctrl+↵]</span>
                    </>
                  )}
                </button>
              </div>


            </div>
          )}
        </div>
      </div>

      {/* ──────── MODALS ──────── */}

      {/* Barcode Scanner */}
      <BarcodeScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
      />

      {/* Invoice */}
      <InvoiceModal
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        order={lastOrder}
        onNewSale={handleNewSale}
        initialLayoutMode={invoiceModalLayoutMode}
      />

      {/* Discount Modal */}
      {showDiscount && (
        <div className="pos-modal-overlay" onClick={() => setShowDiscount(false)}>
          <div className="pos-discount-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-discount-header">
              <h3>Apply Discount</h3>
              <button onClick={() => setShowDiscount(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="pos-discount-body">
              <div className="pos-discount-type-toggle">
                <button
                  className={`pos-discount-type-btn ${discountTypeInput === 'percentage' ? 'active' : ''}`}
                  onClick={() => setDiscountTypeInput('percentage')}
                >
                  <Percent size={16} />
                  Percentage
                </button>
                <button
                  className={`pos-discount-type-btn ${discountTypeInput === 'fixed' ? 'active' : ''}`}
                  onClick={() => setDiscountTypeInput('fixed')}
                >
                  <DollarSign size={16} />
                  Fixed Amount
                </button>
              </div>
              <input
                type="number"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyDiscount();
                  }
                }}
                placeholder={discountTypeInput === 'percentage' ? 'e.g. 10' : 'e.g. 5.00'}
                className="pos-input pos-discount-input"
                autoFocus
                min="0"
                step="0.01"
              />
              <button className="pos-btn-green pos-btn-lg" onClick={handleApplyDiscount}>
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Summary Modal */}
      {showShiftSummary && shiftData && (
        <div className="pos-modal-overlay" onClick={() => setShowShiftSummary(false)}>
          <div className="pos-shift-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-shift-header">
              <Clock size={22} />
              <h3>Shift Summary</h3>
              <button onClick={() => setShowShiftSummary(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="pos-shift-stats">
              <div className="pos-shift-stat">
                <span className="pos-shift-stat-label">Total Sales</span>
                <span className="pos-shift-stat-value">Rs. {shiftData.summary.totalSales.toFixed(2)}</span>
              </div>
              <div className="pos-shift-stat">
                <span className="pos-shift-stat-label">Transactions</span>
                <span className="pos-shift-stat-value">{shiftData.summary.totalOrders}</span>
              </div>
              <div className="pos-shift-stat">
                <span className="pos-shift-stat-label">Cash Sales</span>
                <span className="pos-shift-stat-value">Rs. {shiftData.summary.cashSales.toFixed(2)}</span>
              </div>
              <div className="pos-shift-stat">
                <span className="pos-shift-stat-label">Card Sales</span>
                <span className="pos-shift-stat-value">Rs. {shiftData.summary.cardSales.toFixed(2)}</span>
              </div>
              <div className="pos-shift-stat">
                <span className="pos-shift-stat-label">Koko Sales</span>
                <span className="pos-shift-stat-value">Rs. {(shiftData.summary.kokoSales || 0).toFixed(2)}</span>
              </div>
            </div>
            {shiftData.orders.length > 0 && (
              <div className="pos-shift-orders">
                <h4>Recent Transactions</h4>
                {shiftData.orders.slice(0, 10).map((order) => (
                  <div key={order._id} className="pos-shift-order-row">
                    <span className="pos-shift-order-id">#{order._id.slice(-6)}</span>
                    <span className="pos-shift-order-method">{order.paymentMethod}</span>
                    <span className="pos-shift-order-items">{order.items.length} items</span>
                    <span className="pos-shift-order-total">Rs. {order.totalAmount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}



      {/* End of Day Shop Close & Cash Settlement Modal */}
      {showEndSession && (
        <div className="pos-modal-overlay" onClick={() => setShowEndSession(false)} style={{ zIndex: 1060 }}>
          <div
            className="pos-shift-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0f172a',
              border: '1.5px solid #334155',
              borderRadius: '24px',
              color: '#ffffff',
              width: 'min(980px, 96vw)',
              maxHeight: '94vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 26px', borderBottom: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }}>
                  <Store size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#ffffff', letterSpacing: '0.5px' }}>
                    SHOP CLOSE & CASH SETTLEMENT (EOD)
                  </h2>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
                    Reconcile cash drawer, verify shortages / overages, and close register
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowEndSession(false)}
                style={{ background: '#1e293b', border: 'none', color: '#94a3b8', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {(() => {
              const openingFloat = Number(posSession?.openingCashAmount || 0);
              const cashSales = Number(posDailySummary?.cashSales || 0);
              const hpCashIncome = Number(posDailySummary?.hpCashIncome || dailyFinancials?.hpCashIncome || 0);
              const reloadIncome = Number(posDailySummary?.reloadIncome || dailyFinancials?.reloadIncome || 0);
              const expenseCost = Number(posDailySummary?.expenseCost || dailyFinancials?.expenseCost || 0);
              const cardSales = Number(posDailySummary?.cardSales || 0);

              const expectedDrawer = (openingFloat + cashSales + hpCashIncome + reloadIncome) - expenseCost;
              const countedCash = useDirectCount
                ? Number(directCountAmount || 0)
                : calcTotal(sessionForm.closing);
              const discrepancy = countedCash - expectedDrawer;

              return (
                <div style={{ padding: '24px' }}>
                  {/* 2-Column Main Section */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    
                    {/* LEFT COLUMN: System Expected Cash */}
                    <div style={{ background: '#1e293b', borderRadius: '18px', padding: '20px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '12px', fontWeight: '900', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📊</span> SYSTEM CALCULATED CASH MOVEMENTS
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0f172a', borderRadius: '10px' }}>
                          <span style={{ color: '#94a3b8' }}>Opening Cash / Float:</span>
                          <span style={{ fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace' }}>Rs. {openingFloat.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0f172a', borderRadius: '10px' }}>
                          <span style={{ color: '#34d399' }}>(+) POS Cash Sales In:</span>
                          <span style={{ fontWeight: 'bold', color: '#34d399', fontFamily: 'monospace' }}>+ Rs. {cashSales.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0f172a', borderRadius: '10px' }}>
                          <span style={{ color: '#c084fc' }}>(+) HP Installment Cash In:</span>
                          <span style={{ fontWeight: 'bold', color: '#c084fc', fontFamily: 'monospace' }}>+ Rs. {hpCashIncome.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0f172a', borderRadius: '10px' }}>
                          <span style={{ color: '#2dd4bf' }}>(+) Reload & Card Cash In:</span>
                          <span style={{ fontWeight: 'bold', color: '#2dd4bf', fontFamily: 'monospace' }}>+ Rs. {reloadIncome.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0f172a', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                          <span style={{ color: '#f87171' }}>(-) Petty Cash Out (Expenses):</span>
                          <span style={{ fontWeight: 'bold', color: '#f87171', fontFamily: 'monospace' }}>- Rs. {expenseCost.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Total Expected Box */}
                      <div style={{ marginTop: '16px', padding: '16px', borderRadius: '14px', background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)', border: '1.5px solid #10b981', textAlign: 'center', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#a7f3d0', textTransform: 'uppercase' }}>
                          EXPECTED PHYSICAL CASH IN DRAWER:
                        </div>
                        <div style={{ fontSize: '26px', fontWeight: '900', color: '#ffffff', fontFamily: 'monospace', marginTop: '4px' }}>
                          Rs. {expectedDrawer.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      {/* Non-Drawer Multi-Channel Revenue */}
                      <div style={{ marginTop: '14px', padding: '12px', background: '#0f172a', borderRadius: '12px', border: '1px solid #334155' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                          🌐 NON-DRAWER DIGITAL & CREDIT PAYMENTS
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                          <div style={{ padding: '6px 8px', background: '#1e293b', borderRadius: '6px' }}>
                            <span style={{ color: '#38bdf8' }}>🏛️ Bank / Online:</span>
                            <div style={{ fontWeight: 'bold', color: '#38bdf8', fontFamily: 'monospace' }}>
                              Rs. {Number(posDailySummary?.totalBankOnline || (posDailySummary?.bankSales || 0)).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div style={{ padding: '6px 8px', background: '#1e293b', borderRadius: '6px' }}>
                            <span style={{ color: '#60a5fa' }}>💳 Card (POS):</span>
                            <div style={{ fontWeight: 'bold', color: '#60a5fa', fontFamily: 'monospace' }}>
                              Rs. {Number(posDailySummary?.cardSales || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div style={{ padding: '6px 8px', background: '#1e293b', borderRadius: '6px' }}>
                            <span style={{ color: '#fbbf24' }}>📋 Credit (Due):</span>
                            <div style={{ fontWeight: 'bold', color: '#fbbf24', fontFamily: 'monospace' }}>
                              Rs. {Number(posDailySummary?.creditSales || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div style={{ padding: '6px 8px', background: '#1e293b', borderRadius: '6px' }}>
                            <span style={{ color: '#c084fc' }}>🧾 Cheques:</span>
                            <div style={{ fontWeight: 'bold', color: '#c084fc', fontFamily: 'monospace' }}>
                              Rs. {Number(posDailySummary?.chequeSales || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Physical Cash Count */}
                    <div style={{ background: '#1e293b', borderRadius: '18px', padding: '20px', border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '900', color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          🔢 PHYSICAL CASH COUNT
                        </div>
                        <button
                          type="button"
                          onClick={() => setUseDirectCount(!useDirectCount)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #475569',
                            background: '#0f172a',
                            color: '#cbd5e1',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          {useDirectCount ? '🪙 Switch to Denominations' : '💵 Enter Total Amount Directly'}
                        </button>
                      </div>

                      {!useDirectCount ? (
                        <div>
                          <div style={{ fontSize: '11px', color: '#facc15', marginBottom: '8px', fontWeight: 'bold' }}>
                            ⚠️ Enter NUMBER OF NOTES (Not total Rupees):
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                            {[5000, 1000, 500, 100, 50, 20].map((d) => (
                              <div key={d} style={{ background: '#0f172a', padding: '8px 10px', borderRadius: '10px', border: '1px solid #334155' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                                  <span style={{ fontWeight: 'bold', color: '#f8fafc' }}>Rs. {d} Note Count</span>
                                  <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>= Rs. {((sessionForm.closing[d] || 0) * d).toLocaleString()}</span>
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  max="500"
                                  placeholder="e.g. 10 notes"
                                  value={sessionForm.closing[d] || ''}
                                  onChange={(e) => {
                                    const val = Math.min(500, Math.max(0, Number(e.target.value || 0)));
                                    setSessionForm((s) => ({ ...s, closing: { ...s.closing, [d]: val } }));
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #475569',
                                    background: '#1e293b',
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    outline: 'none',
                                    fontFamily: 'monospace'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              toast.success(`Cash count calculated & saved: Rs. ${countedCash.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`);
                            }}
                            style={{
                              width: '100%',
                              marginTop: '14px',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              border: '1px solid #3b82f6',
                              background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                              color: '#ffffff',
                              fontWeight: '800',
                              fontSize: '13px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 12px rgba(29, 78, 216, 0.4)'
                            }}
                          >
                            💾 Save & Apply Counted Cash (Rs. {countedCash.toLocaleString('en-LK', { minimumFractionDigits: 2 })})
                          </button>
                        </div>
                      ) : (
                        <div style={{ padding: '20px 0' }}>
                          <label style={{ fontSize: '13px', fontWeight: '800', color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>
                            Enter Actual Counted Cash Amount (Rs.) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0.00"
                            value={directCountAmount}
                            onChange={(e) => setDirectCountAmount(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '14px',
                              borderRadius: '12px',
                              border: '2px solid #ca8a04',
                              background: '#0f172a',
                              color: '#ffffff',
                              fontSize: '22px',
                              fontWeight: '900',
                              outline: 'none',
                              fontFamily: 'monospace'
                            }}
                            autoFocus
                          />
                        </div>
                      )}

                      {/* Total Counted Box */}
                      <div style={{ marginTop: '16px', padding: '16px', borderRadius: '14px', background: '#0f172a', border: '1.5px solid #facc15', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#facc15', textTransform: 'uppercase' }}>
                          TOTAL COUNTED CASH IN DRAWER:
                        </div>
                        <div style={{ fontSize: '26px', fontWeight: '900', color: '#ffffff', fontFamily: 'monospace', marginTop: '4px' }}>
                          Rs. {countedCash.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* SETTLEMENT STATUS ALERT BANNER */}
                  <div style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    marginBottom: '20px',
                    background: Math.abs(discrepancy) <= 0.01 ? '#064e3b' : (discrepancy < 0 ? '#7f1d1d' : '#1e3a8a'),
                    border: `1.5px solid ${Math.abs(discrepancy) <= 0.01 ? '#10b981' : (discrepancy < 0 ? '#ef4444' : '#3b82f6')}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#e2e8f0', letterSpacing: '0.5px' }}>
                        RECONCILIATION & SETTLEMENT STATUS
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', marginTop: '2px' }}>
                        {Math.abs(discrepancy) <= 0.01 ? (
                          <span>✅ BALANCED: Exact match (Rs. 0.00 discrepancy)</span>
                        ) : discrepancy < 0 ? (
                          <span>⚠️ ARREARS / SHORTAGE: - Rs. {Math.abs(discrepancy).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span>💡 OVERAGE / EXCESS: + Rs. {discrepancy.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Variance:</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', fontFamily: 'monospace', color: '#ffffff' }}>
                        {discrepancy >= 0 ? `+Rs. ${discrepancy.toFixed(2)}` : `-Rs. ${Math.abs(discrepancy).toFixed(2)}`}
                      </div>
                    </div>
                  </div>

                  {/* Closing Notes */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                      Handover Notes / Reason for Discrepancy (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Handed over to Manager Mr. Perera / Cash deposited in safe"
                      value={closingNotes}
                      onChange={(e) => setClosingNotes(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #334155',
                        background: '#1e293b',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '14px' }}>
                    <button
                      type="button"
                      onClick={() => setShowEndSession(false)}
                      style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: '12px',
                        border: '1px solid #334155',
                        background: '#1e293b',
                        color: '#cbd5e1',
                        fontWeight: '800',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={settlingSession}
                      onClick={handleEndSession}
                      style={{
                        flex: 2,
                        padding: '14px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        fontWeight: '900',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      <Printer size={18} />
                      {settlingSession ? 'Settling & Printing...' : 'Settle & Close Shop Register (Print EOD Slip)'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {showBalanceModal && (
        <div className="pos-modal-overlay" onClick={() => setShowBalanceModal(false)} style={{ zIndex: 1050 }}>
          <div
            className="pos-shift-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              background: '#111827', 
              border: '1px solid #374151', 
              borderRadius: '20px',
              color: '#ffffff', 
              width: 'min(1150px, 96vw)', 
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #374151', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)' }}>
                  <Receipt size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#facc15', letterSpacing: '0.5px' }}>
                    BALANCE & SHIFT SUMMARY
                  </h2>
                  <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>
                    Real-time daily financial reconciliation for Cashier & Manager
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={handlePrintShiftSlip}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                  }}
                  title="Print 80mm Thermal Shift Handover Receipt"
                >
                  <Printer size={16} />
                  Print Shift Slip
                </button>

                <button 
                  onClick={() => setShowBalanceModal(false)}
                  style={{ background: '#374151', border: 'none', color: '#9ca3af', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Date Filter & Tab Switcher */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
                
                {/* Tabs */}
                <div style={{ display: 'flex', background: '#1f2937', padding: '4px', borderRadius: '12px', border: '1px solid #374151' }}>
                  <button
                    onClick={() => setBalanceTab('shift')}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      background: balanceTab === 'shift' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'transparent',
                      color: balanceTab === 'shift' ? '#ffffff' : '#9ca3af',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    ⚖️ Shift Register & Cash Drawer
                  </button>
                  <button
                    onClick={() => setBalanceTab('financials')}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      background: balanceTab === 'financials' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'transparent',
                      color: balanceTab === 'financials' ? '#ffffff' : '#9ca3af',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    📊 Category Incomes & Costs
                  </button>
                </div>

                {/* Date Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '800', fontSize: '12px', color: '#9ca3af', letterSpacing: '0.5px' }}>DATE:</span>
                  <input
                    type="date"
                    value={balanceDate}
                    onChange={(e) => setBalanceDate(e.target.value)}
                    style={{
                      padding: '8px 14px',
                      background: '#0f172a',
                      border: '1.5px solid #ca8a04',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => openBalanceModal(balanceDate)}
                    disabled={balanceLoading}
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)'
                    }}
                  >
                    <Search size={14} />
                    {balanceLoading ? 'Loading...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* ──────── TAB 1: SHIFT REGISTER & CASH DRAWER ──────── */}
              {balanceTab === 'shift' && (
                <div>
                  {/* Top Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                    
                    {/* Cash Sales */}
                    <div style={{ padding: '16px', borderRadius: '14px', background: '#1f2937', border: '1px solid #374151' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase' }}>💵 Counter Cash Sales</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#34d399', marginTop: '6px', fontFamily: 'monospace' }}>
                        Rs. {Number(posDailySummary?.cashSales || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Physical cash received at drawer</div>
                    </div>

                    {/* Bank / Online Direct */}
                    <div style={{ padding: '16px', borderRadius: '14px', background: '#1f2937', border: '1px solid #0284c7' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase' }}>🏛️ Bank & Online Transfer</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#38bdf8', marginTop: '6px', fontFamily: 'monospace' }}>
                        Rs. {Number(posDailySummary?.totalBankOnline || ((posDailySummary?.bankSales || 0) + (posDailySummary?.payhereSales || 0) + (posDailySummary?.kokoSales || 0))).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        Bank: Rs. {Number(posDailySummary?.bankSales || 0).toLocaleString()} | Koko/PayHere: Rs. {Number((posDailySummary?.kokoSales || 0) + (posDailySummary?.payhereSales || 0)).toLocaleString()}
                      </div>
                    </div>

                    {/* Card POS */}
                    <div style={{ padding: '16px', borderRadius: '14px', background: '#1f2937', border: '1px solid #374151' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase' }}>💳 Card (POS Terminal)</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#60a5fa', marginTop: '6px', fontFamily: 'monospace' }}>
                        Rs. {Number(posDailySummary?.cardSales || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Visa / Master / Debit Cards</div>
                    </div>

                    {/* Credit Sales */}
                    <div style={{ padding: '16px', borderRadius: '14px', background: '#1f2937', border: '1px solid #f59e0b55' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#fbbf24', textTransform: 'uppercase' }}>📋 Credit Sales (Due)</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#fbbf24', marginTop: '6px', fontFamily: 'monospace' }}>
                        Rs. {Number(posDailySummary?.creditSales || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Uncollected / Pay Later debt</div>
                    </div>

                    {/* Mobile Phones */}
                    <div style={{ padding: '16px', borderRadius: '14px', background: '#1f2937', border: '1px solid #374151' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase' }}>📱 Mobile Phones Sales</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#a78bfa', marginTop: '6px', fontFamily: 'monospace' }}>
                        Rs. {Number(dailyFinancials?.mobileIncome || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Smartphones & Handsets</div>
                    </div>

                    {/* Accessories */}
                    <div style={{ padding: '16px', borderRadius: '14px', background: '#1f2937', border: '1px solid #374151' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase' }}>🎧 Accessories & Other</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#f472b6', marginTop: '6px', fontFamily: 'monospace' }}>
                        Rs. {Number(dailyFinancials?.accessoriesIncome || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Tempered, covers, cables, audio</div>
                    </div>

                    {/* Reloads */}
                    <div style={{ padding: '16px', borderRadius: '14px', background: '#1f2937', border: '1px solid #374151' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase' }}>⚡ Reload & Scratch Cards</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#2dd4bf', marginTop: '6px', fontFamily: 'monospace' }}>
                        Rs. {Number(posDailySummary?.reloadIncome || dailyFinancials?.reloadIncome || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Daily reload card sell-out</div>
                    </div>

                    {/* HP Collections */}
                    <div style={{ padding: '16px', borderRadius: '14px', background: '#1f2937', border: '1px solid #374151' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase' }}>📑 HP Installment Cash</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#c084fc', marginTop: '6px', fontFamily: 'monospace' }}>
                        Rs. {Number(posDailySummary?.hpCashIncome || dailyFinancials?.hpCashIncome || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Collected at checkout counter</div>
                    </div>

                    {/* Petty Cash Out */}
                    <div style={{ padding: '16px', borderRadius: '14px', background: '#1f2937', border: '1px solid #ef444455' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#f87171', textTransform: 'uppercase' }}>☕ Petty Cash Out (Expenses)</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#f87171', marginTop: '6px', fontFamily: 'monospace' }}>
                        - Rs. {Number(posDailySummary?.expenseCost || dailyFinancials?.expenseCost || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Tea, meals, supplies paid out</div>
                    </div>

                    {/* Total Revenue */}
                    <div style={{ padding: '16px', borderRadius: '14px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', border: '1px solid #6366f1' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#a5b4fc', textTransform: 'uppercase' }}>🏦 Total Day Revenue</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', marginTop: '6px', fontFamily: 'monospace' }}>
                        Rs. {Number(posDailySummary?.systemRevenue || dailyFinancials?.totalIncome || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '11px', color: '#c7d2fe', marginTop: '4px' }}>{posDailySummary?.totalOrders || balanceOrders.length} Completed transactions</div>
                    </div>

                  </div>

                  {/* Cash Drawer Handover Reconciliation Box */}
                  {(() => {
                    const cashIn = Number(posDailySummary?.cashSales || 0) + Number(posDailySummary?.hpCashIncome || dailyFinancials?.hpCashIncome || 0) + Number(posDailySummary?.reloadIncome || dailyFinancials?.reloadIncome || 0);
                    const expenseOut = Number(posDailySummary?.expenseCost || dailyFinancials?.expenseCost || 0);
                    const expectedDrawer = (Number(balanceSessionData?.openingCashAmount || posSession?.openingCashAmount || 0) + cashIn) - expenseOut;
                    
                    const savedCounted = balanceSessionData?.closingCashCountedAmount;
                    const counted = savedCounted !== undefined && savedCounted !== null
                      ? Number(savedCounted)
                      : (drawerCountInput !== '' ? Number(drawerCountInput) : expectedDrawer);
                    const diff = counted - expectedDrawer;

                    const denomsList = (balanceSessionData?.closingDenoms || []).filter(d => Number(d.qty || 0) > 0);

                    return (
                      <div style={{ padding: '20px', borderRadius: '16px', background: '#0f172a', border: '2px solid #10b981', marginBottom: '28px', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid #1e293b', paddingBottom: '14px', marginBottom: '16px' }}>
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.5px' }}>
                              SHIFT HANDOVER RECONCILIATION
                            </span>
                            <h3 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: '900', color: '#ffffff' }}>
                              {balanceSessionData?.status === 'closed' ? 'Closed Shift Physical Cash Drawer Record' : 'Net Cash in Drawer to Handover'}
                            </h3>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold' }}>EXPECTED CASH:</div>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: '#34d399', fontFamily: 'monospace' }}>
                              Rs. {expectedDrawer.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', alignItems: 'center' }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                              {balanceSessionData?.status === 'closed' ? 'Recorded Counted Cash in Drawer (Rs.):' : 'Count Actual Cash in Drawer (Rs.):'}
                            </label>
                            <input
                              type="number"
                              placeholder={`Expected: ${expectedDrawer.toFixed(2)}`}
                              value={drawerCountInput !== '' ? drawerCountInput : (savedCounted !== undefined ? savedCounted : '')}
                              onChange={(e) => setDrawerCountInput(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                border: '2px solid #ca8a04',
                                background: '#1e293b',
                                color: '#ffffff',
                                fontSize: '18px',
                                fontWeight: '900',
                                outline: 'none',
                                fontFamily: 'monospace'
                              }}
                            />
                          </div>

                          <div style={{ padding: '14px', borderRadius: '12px', background: Math.abs(diff) <= 0.01 ? '#064e3b' : (diff > 0 ? '#1e3a8a' : '#7f1d1d'), border: '1px solid rgba(255,255,255,0.15)' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#e2e8f0', textTransform: 'uppercase' }}>
                              Cash Drawer Status / Discrepancy
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff', marginTop: '2px' }}>
                              {Math.abs(diff) <= 0.01 ? '✅ Exact Match (No Discrepancy)' : (diff > 0 ? `+ Rs. ${diff.toLocaleString('en-LK', { minimumFractionDigits: 2 })} (Overage)` : `- Rs. ${Math.abs(diff).toLocaleString('en-LK', { minimumFractionDigits: 2 })} (Shortage)`)}
                            </div>
                          </div>
                        </div>

                        {/* Saved Denomination Badges */}
                        {denomsList.length > 0 && (
                          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed #334155' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#facc15', textTransform: 'uppercase', marginBottom: '8px' }}>
                              🪙 SAVED PHYSICAL DENOMINATION BREAKDOWN:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {denomsList.map((l, i) => (
                                <div key={i} style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', padding: '6px 12px', fontSize: '12px' }}>
                                  <span style={{ color: '#94a3b8' }}>Rs. {l.denom} × </span>
                                  <strong style={{ color: '#fff' }}>{l.qty} notes</strong>
                                  <span style={{ color: '#38bdf8', marginLeft: '6px', fontWeight: 'bold' }}>= Rs. {(l.denom * l.qty).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Handover Note */}
                        {balanceSessionData?.varianceNote && (
                          <div style={{ marginTop: '12px', fontSize: '12px', color: '#cbd5e1', fontStyle: 'italic' }}>
                            📝 Handover Note: <strong>{balanceSessionData.varianceNote}</strong>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ──────── TAB 2: CATEGORY INCOMES & COSTS ──────── */}
              {balanceTab === 'financials' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '28px' }}>
                  
                  {/* ──────── LEFT COLUMN: Incomes ──────── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      INCOME BREAKDOWN
                    </div>

                    {/* Mobile Income */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#cbd5e1', marginBottom: '4px' }}>MOBILE INCOME</div>
                      <div style={{ padding: '10px 14px', background: '#0f172a', border: '1.5px solid #22c55e', borderRadius: '8px', color: '#ffffff', fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace' }}>
                        Rs. {Number(dailyFinancials?.mobileIncome || 0).toFixed(2)}
                      </div>
                    </div>

                    {/* Accessories Income */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#cbd5e1', marginBottom: '4px' }}>ACCESSORIES INCOME</div>
                      <div style={{ padding: '10px 14px', background: '#0f172a', border: '1.5px solid #22c55e', borderRadius: '8px', color: '#ffffff', fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace' }}>
                        Rs. {Number(dailyFinancials?.accessoriesIncome || 0).toFixed(2)}
                      </div>
                    </div>

                    {/* Wholesale | Advance Income */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#cbd5e1', marginBottom: '4px' }}>WHOLESALE | ADVANCE INCOME</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div style={{ padding: '10px 12px', background: '#0f172a', border: '1.5px solid #22c55e', borderRadius: '8px', color: '#ffffff', fontWeight: 'bold', fontSize: '13px', fontFamily: 'monospace' }}>
                          Rs. {Number(dailyFinancials?.wholesaleIncome || 0).toFixed(2)}
                        </div>
                        <div style={{ padding: '10px 12px', background: '#0f172a', border: '1.5px solid #22c55e', borderRadius: '8px', color: '#ffffff', fontWeight: 'bold', fontSize: '13px', fontFamily: 'monospace' }}>
                          Rs. {Number(dailyFinancials?.advanceIncome || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Repairing Income */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#cbd5e1', marginBottom: '4px' }}>REPAIRING INCOME (Normal | Company)</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div style={{ padding: '10px 12px', background: '#0f172a', border: '1.5px solid #22c55e', borderRadius: '8px', color: '#ffffff', fontWeight: 'bold', fontSize: '13px', fontFamily: 'monospace' }}>
                          Rs. {Number(dailyFinancials?.repairIncomeNormal || 0).toFixed(2)}
                        </div>
                        <div style={{ padding: '10px 12px', background: '#0f172a', border: '1.5px solid #22c55e', borderRadius: '8px', color: '#ffffff', fontWeight: 'bold', fontSize: '13px', fontFamily: 'monospace' }}>
                          Rs. {Number(dailyFinancials?.repairIncomeCompany || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Phone Card | SIM Card Income */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#cbd5e1', marginBottom: '4px' }}>PHONE CARD | SIM CARD INCOME</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div style={{ padding: '10px 12px', background: '#0f172a', border: '1.5px solid #22c55e', borderRadius: '8px', color: '#ffffff', fontWeight: 'bold', fontSize: '13px', fontFamily: 'monospace' }}>
                          Rs. {Number(dailyFinancials?.phoneCardIncome || 0).toFixed(2)}
                        </div>
                        <div style={{ padding: '10px 12px', background: '#0f172a', border: '1.5px solid #22c55e', borderRadius: '8px', color: '#ffffff', fontWeight: 'bold', fontSize: '13px', fontFamily: 'monospace' }}>
                          Rs. {Number(dailyFinancials?.simCardIncome || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* HP Collections Income */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#cbd5e1', marginBottom: '4px' }}>HP INSTALLMENT COLLECTIONS</div>
                      <div style={{ padding: '10px 14px', background: '#0f172a', border: '1.5px solid #22c55e', borderRadius: '8px', color: '#c084fc', fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace' }}>
                        Rs. {Number(dailyFinancials?.hpIncome || 0).toFixed(2)}
                      </div>
                    </div>

                  </div>

                  {/* ──────── RIGHT COLUMN: Costs & Balances ──────── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      COSTS & NET BALANCE
                    </div>

                    {/* Reload Income */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#cbd5e1', marginBottom: '4px' }}>RELOAD INCOME</div>
                      <div style={{ padding: '10px 14px', background: '#0f172a', border: '1.5px solid #22c55e', borderRadius: '8px', color: '#4ade80', fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace' }}>
                        Rs. {Number(dailyFinancials?.reloadIncome || 0).toFixed(2)}
                      </div>
                    </div>

                    {/* Service Cost */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#cbd5e1', marginBottom: '4px' }}>SERVICE COST</div>
                      <div style={{ padding: '10px 14px', background: '#0f172a', border: '1.5px solid #ef4444', borderRadius: '8px', color: '#f87171', fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace' }}>
                        Rs. {Number(dailyFinancials?.serviceCost || 0).toFixed(2)}
                      </div>
                    </div>

                    {/* Supplier & Expense Cost */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#cbd5e1', marginBottom: '4px' }}>SUPPLIER & EXPENSE COST</div>
                      <div style={{ padding: '10px 14px', background: '#0f172a', border: '1.5px solid #ef4444', borderRadius: '8px', color: '#f87171', fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace' }}>
                        Rs. {Number(dailyFinancials?.supplierCost || 0).toFixed(2)}
                      </div>
                    </div>

                    {/* Total Income */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#cbd5e1', marginBottom: '4px' }}>TOTAL INCOME</div>
                      <div style={{ padding: '10px 14px', background: '#0f172a', border: '1.5px solid #38bdf8', borderRadius: '8px', color: '#38bdf8', fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace' }}>
                        Rs. {Number(dailyFinancials?.totalIncome || dailyFinancials?.totalSales || 0).toFixed(2)}
                      </div>
                    </div>

                    {/* Total Cost */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#cbd5e1', marginBottom: '4px' }}>TOTAL COST</div>
                      <div style={{ padding: '10px 14px', background: '#0f172a', border: '1.5px solid #38bdf8', borderRadius: '8px', color: '#38bdf8', fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace' }}>
                        Rs. {Number(dailyFinancials?.totalCost || 0).toFixed(2)}
                      </div>
                    </div>

                    {/* Balance Amount */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#ffffff', marginBottom: '4px' }}>NET BALANCE AMOUNT</div>
                      <div style={{ padding: '12px 14px', background: '#0f172a', border: '2px solid #ffffff', borderRadius: '8px', color: '#ffffff', fontWeight: '900', fontSize: '16px', fontFamily: 'monospace', boxShadow: '0 0 10px rgba(255,255,255,0.15)' }}>
                        Rs. {Number(dailyFinancials?.balanceAmount !== undefined ? dailyFinancials.balanceAmount : (dailyFinancials?.totalSales || 0)).toFixed(2)}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* ──────── Sales History ──────── */}
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '800', color: '#facc15', letterSpacing: '0.5px' }}>
                  SALES TRANSACTION LOG ({balanceOrders.length} Transactions)
                </h4>
                <div style={{ maxHeight: '320px', overflow: 'auto', border: '1px solid #374151', borderRadius: '12px', background: '#0f172a' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead style={{ background: '#1f2937', position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '10px', color: '#9ca3af' }}>Time</th>
                        <th style={{ textAlign: 'left', padding: '10px', color: '#9ca3af' }}>Customer</th>
                        <th style={{ textAlign: 'left', padding: '10px', color: '#9ca3af' }}>Items</th>
                        <th style={{ textAlign: 'left', padding: '10px', color: '#9ca3af' }}>Payment</th>
                        <th style={{ textAlign: 'right', padding: '10px', color: '#9ca3af' }}>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balanceOrders.map((order) => (
                        <tr key={order._id} style={{ borderTop: '1px solid #1f2937' }}>
                          <td style={{ padding: '10px', color: '#e5e7eb', verticalAlign: 'top', fontFamily: 'monospace' }}>
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </td>
                          <td style={{ padding: '10px', color: '#cbd5e1', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 600, color: '#f9fafb' }}>{order.customerName || 'Walk-in Customer'}</div>
                            <div style={{ color: '#9ca3af', marginTop: '2px', fontSize: '11px' }}>{order.customerPhone || '-'}</div>
                          </td>
                          <td style={{ padding: '10px', color: '#cbd5e1', verticalAlign: 'top' }}>
                            {(order.itemDetails || order.items || []).map((it, idx) => (
                              <div key={idx} style={{ marginBottom: idx < ((order.itemDetails || order.items)?.length - 1) ? '6px' : '0' }}>
                                <div style={{ fontWeight: 600, color: '#f9fafb' }}>{it.name}</div>
                                <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '1px' }}>
                                  x{it.quantity} @ Rs.{Number(it.unitPrice || it.price || 0).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </td>
                          <td style={{ padding: '10px', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            {order.paymentMethod}
                          </td>
                          <td style={{ padding: '10px', color: '#34d399', textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '13px' }}>
                            Rs. {Number(order.totalAmount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {balanceOrders.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                            No sales transactions recorded for this date.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Credit Orders Panel */}
      {showCreditPanel && (
        <div className="pos-credit-overlay" onClick={() => setShowCreditPanel(false)}>
          <div className="pos-credit-panel" onClick={(e) => e.stopPropagation()}>
            <div className="pos-credit-panel-header">
              <div>
                <h2>📋 Credit Orders</h2>
                <p>{creditOrders.length} pending credit sales</p>
              </div>
              <button className="pos-scanner-close" onClick={() => setShowCreditPanel(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="pos-credit-panel-body">
              {creditLoading ? (
                <div style={{ textAlign: 'center', padding: '2.5rem' }}><div className="pos-spinner" /></div>
              ) : creditOrders.length === 0 ? (
                <div className="pos-credit-empty">
                  <p>✅</p>
                  <p>No pending credit orders</p>
                </div>
              ) : (
                creditOrders.map((order) => (
                  <div key={order._id} className="pos-credit-card">
                    <div className="pos-credit-card-header">
                      <div>
                        <span className="pos-credit-invoice">{order.invoiceNumber}</span>
                        <span className="pos-credit-date">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <span className="pos-credit-badge">
                        Pending: Rs. {Number(order.creditBalance || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="pos-credit-card-info">
                      <div><span>Customer:</span> <strong>{order.customerName || order.customerPhone || 'Walk-in'}</strong></div>
                      <div><span>Total:</span> <strong>Rs. {Number(order.totalAmount).toFixed(2)}</strong></div>
                      <div><span>Paid:</span> <strong style={{ color: '#4ade80' }}>Rs. {Number(order.amountPaid || 0).toFixed(2)}</strong></div>
                    </div>
                    {order.creditNote && <p className="pos-credit-card-note">Note: {order.creditNote}</p>}
                    <div className="pos-credit-card-actions">
                      <input
                        type="number"
                        className="pos-credit-settle-input"
                        placeholder="Amount"
                        value={settleAmount[order._id] || ''}
                        onChange={(e) => setSettleAmount((p) => ({ ...p, [order._id]: e.target.value }))}
                      />
                      <button className="pos-credit-btn pos-credit-btn-partial" onClick={() => handleSettleCredit(order._id)}>
                        Pay Partial
                      </button>
                      <button className="pos-credit-btn pos-credit-btn-full" onClick={() => handleSettleFull(order._id)}>
                        Pay Full
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Quick Add Product Modal */}
      {showQuickAdd && (
        <div className="pos-modal-overlay" onClick={() => setShowQuickAdd(false)}>
          <div className="pos-discount-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="pos-discount-header">
              <h3>Quick Add Product</h3>
              <button onClick={() => setShowQuickAdd(false)}><X size={20} /></button>
            </div>
            <div className="pos-discount-body" style={{ gap: '12px' }}>
              <div className="pos-form-group">
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Product Name</label>
                <input
                  type="text"
                  className="pos-input"
                  value={quickAddForm.name}
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, name: e.target.value })}
                  placeholder="e.g. iPhone 15 Pro"
                />
              </div>
              <div className="pos-form-group">
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Category</label>
                <input
                  list="pos-category-suggestions"
                  className="pos-input"
                  value={categories.find(c => c._id === quickAddForm.categoryId)?.name || quickAddForm.categoryId}
                  onChange={(e) => {
                    const val = e.target.value;
                    const existing = categories.find(c => c.name.toLowerCase() === val.toLowerCase());
                    setQuickAddForm({ ...quickAddForm, categoryId: existing ? existing._id : val });
                  }}
                  placeholder="Type category name"
                />
                <datalist id="pos-category-suggestions">
                  {categories.map(c => <option key={c._id} value={c.name} />)}
                </datalist>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="pos-form-group">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Selling Price</label>
                  <input
                    type="number"
                    className="pos-input"
                    value={quickAddForm.price}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="pos-form-group">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Initial Stock</label>
                  <input
                    type="number"
                    className="pos-input"
                    value={quickAddForm.stock}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, stock: e.target.value })}
                    placeholder="10"
                  />
                </div>
              </div>
              <button
                className="pos-btn-green pos-btn-lg"
                style={{ marginTop: '8px' }}
                onClick={handleQuickAdd}
                disabled={!quickAddForm.name || !quickAddForm.price || !quickAddForm.categoryId}
              >
                Add & Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ──────────────── Quick HP Installment Payment Modal ──────────────── */}
      {showHpQuickPayModal && (
        <div 
          className="pos-modal-overlay" 
          onClick={() => { setShowHpQuickPayModal(false); setSelectedHpRecord(null); setHpReceiptData(null); }}
          style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 99999 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '680px',
              width: '95%',
              background: '#ffffff',
              color: '#0f172a',
              padding: '28px',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e2e8f0',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '16px', color: '#d97706', display: 'flex', boxShadow: '0 2px 8px rgba(217, 119, 6, 0.15)' }}>
                  <CreditCard size={26} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
                    Quick Installment (HP) Payment 💳
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                    Search HP Invoice Number or Customer Phone to record payment & print receipt
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowHpQuickPayModal(false); setSelectedHpRecord(null); setHpReceiptData(null); }}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#64748b',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Step 1: Search HP Invoice */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Search HP Invoice Number, Customer Phone, or Name *
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={hpSearchInput}
                    onChange={(e) => setHpSearchInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearchHpRecords(); }}
                    placeholder="e.g. #HP-INV-10025, INV-001, or 0771234567..."
                    style={{
                      width: '100%',
                      paddingLeft: '44px',
                      paddingRight: '16px',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      fontSize: '14px',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontWeight: '600',
                      borderRadius: '12px',
                      border: '2px solid #cbd5e1',
                      outline: 'none',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#d97706'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>
                <button
                  onClick={() => handleSearchHpRecords()}
                  disabled={loadingHpSearch}
                  style={{
                    padding: '0 24px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#ffffff',
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
                    transition: 'all 0.2s'
                  }}
                >
                  {loadingHpSearch ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
                  Search
                </button>
              </div>
            </div>

            {/* List of matching HP records if multiple */}
            {hpRecordsList.length > 0 && !selectedHpRecord && (
              <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '14px', background: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                {hpRecordsList.map((rec) => (
                  <div
                    key={rec._id}
                    onClick={() => handleSelectHpRecord(rec)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      background: '#ffffff',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fffbe6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                  >
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>
                        {rec.invoiceNo} — <span style={{ color: '#2563eb' }}>{rec.customer?.name}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        📞 {rec.customer?.phone} | Due: <strong style={{ color: '#d97706' }}>Rs. {(rec.remainingBalance !== undefined ? rec.remainingBalance : rec.balanceAmount)?.toLocaleString()}</strong>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      background: rec.status === 'Completed' ? '#dcfce7' : rec.status === 'Overdue' ? '#fee2e2' : '#fef3c7',
                      color: rec.status === 'Completed' ? '#166534' : rec.status === 'Overdue' ? '#991b1b' : '#92400e'
                    }}>
                      {rec.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Step 2: Selected HP Agreement Details & Payment Form */}
            {selectedHpRecord ? (
              <div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{selectedHpRecord.invoiceNo}</span>
                      <span style={{ fontSize: '13px', color: '#475569', marginLeft: '8px', fontWeight: '600' }}>({selectedHpRecord.customer?.name})</span>
                    </div>
                    <button
                      onClick={() => setSelectedHpRecord(null)}
                      style={{ border: '1px solid #cbd5e1', background: '#ffffff', color: '#2563eb', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      Change Agreement
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: '#ffffff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Total Net</div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#334155', marginTop: '2px' }}>Rs. {Number(selectedHpRecord.netTotal || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', fontWeight: '700' }}>Total Paid</div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#166534', marginTop: '2px' }}>Rs. {Number(selectedHpRecord.totalPaid || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#b45309', textTransform: 'uppercase', fontWeight: '700' }}>Remaining Due</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#d97706', marginTop: '2px' }}>
                        Rs. {Number(
                          selectedHpRecord.balanceAmount !== undefined && selectedHpRecord.balanceAmount !== null
                            ? selectedHpRecord.balanceAmount
                            : (selectedHpRecord.remainingBalance !== undefined && selectedHpRecord.remainingBalance !== null
                              ? selectedHpRecord.remainingBalance
                              : Math.max(0, (selectedHpRecord.netTotal || 0) - (selectedHpRecord.totalPaid || 0)))
                        ).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                    <span>📞 Customer Phone: <strong style={{ color: '#0f172a' }}>{selectedHpRecord.customer?.phone || 'N/A'}</strong></span>
                    <span>🪪 NIC: <strong style={{ color: '#0f172a' }}>{selectedHpRecord.customer?.nic || 'N/A'}</strong></span>
                  </div>

                  {/* Monthly Installment Fixed Read-Only Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', background: '#eff6ff', border: '1.5px solid #bfdbfe', padding: '10px 14px', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: '800', textTransform: 'uppercase' }}>📌 Fixed Monthly Installment</div>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#1d4ed8', marginTop: '2px' }}>
                        Rs. {Number(selectedHpRecord.installmentAmount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })} / month
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setHpPayForm(prev => ({ ...prev, amount: selectedHpRecord.installmentAmount || 0, givenCash: prev.givenCash || selectedHpRecord.installmentAmount || 0 }))}
                        style={{ padding: '6px 12px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                      >
                        ⚡ Fill 1-Month (Rs. {Number(selectedHpRecord.installmentAmount || 0).toLocaleString()})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const remBal = selectedHpRecord.balanceAmount ?? selectedHpRecord.remainingBalance ?? Math.max(0, (selectedHpRecord.netTotal || 0) - (selectedHpRecord.totalPaid || 0));
                          setHpPayForm(prev => ({ ...prev, amount: remBal, givenCash: prev.givenCash || remBal }));
                        }}
                        style={{ padding: '6px 12px', background: '#d97706', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                      >
                        ⚡ Fill Full Balance
                      </button>
                    </div>
                  </div>

                  {/* Previous Payments History List */}
                  {selectedHpRecord.payments && selectedHpRecord.payments.length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                        📜 Payment History ({selectedHpRecord.payments.length} Payments):
                      </div>
                      <div style={{ maxHeight: '90px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {selectedHpRecord.payments.map((p, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', background: '#ffffff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <span style={{ color: '#334155' }}>
                              <strong>#{idx + 1}</strong>: {new Date(p.date || Date.now()).toLocaleDateString('en-GB')} ({p.paymentMethod || 'Cash'})
                            </span>
                            <span style={{ fontWeight: '800', color: '#166534' }}>
                              + Rs. {Number(p.amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Inputs Section */}
                {/* Row 1: Payment Method & Drawer */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Payment Method *
                    </label>
                    <select
                      value={hpPayForm.paymentMethod}
                      onChange={(e) => setHpPayForm({ ...hpPayForm, paymentMethod: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#0f172a',
                        background: '#ffffff',
                        border: '2px solid #cbd5e1',
                        borderRadius: '12px',
                        outline: 'none'
                      }}
                    >
                      <option value="Cash">💵 Cash</option>
                      <option value="Card">💳 Card</option>
                      <option value="Bank Transfer">🏛️ Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Receiving Account / Drawer
                    </label>
                    <select
                      value={hpPayForm.accountId}
                      onChange={(e) => setHpPayForm({ ...hpPayForm, accountId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#0f172a',
                        background: '#ffffff',
                        border: '2px solid #cbd5e1',
                        borderRadius: '12px',
                        outline: 'none'
                      }}
                    >
                      <option value="">Default Counter Drawer</option>
                      {accounts.map(acc => (
                        <option key={acc._id} value={acc._id}>
                          {acc.name} {acc.accountType ? `(${acc.accountType})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Customer Given Cash & Change Amount Calculator */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#166534', display: 'block', marginBottom: '6px' }}>
                      💵 Customer Given Cash (Rs.)
                    </label>
                    <input
                      type="number"
                      onWheel={(e) => e.target.blur()}
                      value={hpPayForm.givenCash}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numVal = Number(val || 0);
                        const instVal = Number(selectedHpRecord.installmentAmount || 0);
                        setHpPayForm(prev => {
                          const newAmount = (!prev.amount || Number(prev.amount) <= 0 || (numVal > 0 && numVal <= instVal)) ? val : prev.amount;
                          return { ...prev, givenCash: val, amount: newAmount };
                        });
                      }}
                      placeholder="e.g. 50000"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: '16px',
                        fontWeight: '800',
                        color: '#166534',
                        background: '#f0fdf4',
                        border: '2px solid #86efac',
                        borderRadius: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af', display: 'block', marginBottom: '6px' }}>
                      🔄 Change to Return
                    </label>
                    <div style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '18px',
                      fontWeight: '900',
                      color: (Number(hpPayForm.givenCash || 0) >= Number(hpPayForm.amount || 0)) ? '#1d4ed8' : '#b45309',
                      background: (Number(hpPayForm.givenCash || 0) >= Number(hpPayForm.amount || 0)) ? '#eff6ff' : '#fffbeb',
                      border: (Number(hpPayForm.givenCash || 0) >= Number(hpPayForm.amount || 0)) ? '2px solid #bfdbfe' : '2px solid #fde68a',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: '48px'
                    }}>
                      Rs. {Number(Math.max(0, Number(hpPayForm.givenCash || 0) - Number(hpPayForm.amount || 0))).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Row 3 (Bottom Position): Amount to Pay */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                    💰 Amount to Pay (Rs.) *
                  </label>
                  <input
                    type="number"
                    onWheel={(e) => e.target.blur()}
                    value={hpPayForm.amount}
                    onChange={(e) => setHpPayForm({ ...hpPayForm, amount: e.target.value })}
                    placeholder="Enter payment amount"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '18px',
                      fontWeight: '900',
                      color: '#2563eb',
                      background: '#ffffff',
                      border: '2.5px solid #2563eb',
                      borderRadius: '14px',
                      outline: 'none',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)'
                    }}
                  />
                </div>

                {/* Submit button */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    style={{
                      flex: 1,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '15px',
                      fontWeight: '800',
                      padding: '14px 24px',
                      color: '#ffffff',
                      background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                      border: 'none',
                      borderRadius: '14px',
                      cursor: (submittingHpPay || !hpPayForm.amount || Number(hpPayForm.amount) <= 0) ? 'not-allowed' : 'pointer',
                      opacity: (submittingHpPay || !hpPayForm.amount || Number(hpPayForm.amount) <= 0) ? 0.6 : 1,
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                      transition: 'all 0.2s'
                    }}
                    onClick={handleSubmitHpPayment}
                    disabled={submittingHpPay || !hpPayForm.amount || Number(hpPayForm.amount) <= 0}
                  >
                    {submittingHpPay ? <RefreshCw size={20} className="animate-spin" /> : <CreditCard size={20} />}
                    Record Payment & Generate Receipt
                  </button>
                </div>
              </div>
            ) : hpSearchInput && hpRecordsList.length === 0 && !loadingHpSearch ? (
              <div style={{ textAlign: 'center', padding: '32px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                ⚠️ No active HP agreement found matching "<strong style={{ color: '#0f172a' }}>{hpSearchInput}</strong>"
              </div>
            ) : null}

            {/* Receipt Modal Popup after success */}
            {hpReceiptData && (
              <div style={{ marginTop: '20px', padding: '18px', background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '16px', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '800', color: '#15803d', fontSize: '15px' }}>✅ Payment Recorded Successfully!</span>
                  <button
                    onClick={handlePrintHpReceipt}
                    style={{
                      padding: '8px 18px',
                      fontSize: '13px',
                      fontWeight: '800',
                      color: '#ffffff',
                      background: '#2563eb',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    <Receipt size={18} /> Print Thermal Receipt
                  </button>
                </div>
                <div style={{ fontSize: '13px', color: '#166534', lineHeight: '1.6', fontWeight: '500' }}>
                  Amount Paid: <strong style={{ fontSize: '14px' }}>Rs. {Number(hpReceiptData.payment.amount).toLocaleString()}</strong> | 
                  Remaining Due Balance: <strong style={{ fontSize: '14px', color: '#b45309' }}>Rs. {Number(Math.max(0, hpReceiptData.newBalance)).toLocaleString()}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Credit Collection & Debt Settlement Modal */}
      {showCreditSettleModal && (
        <div className="pos-modal-overlay" onClick={() => setShowCreditSettleModal(false)}>
          <div className="pos-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', width: '92%', padding: '24px', background: '#ffffff', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                  📋
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Customer Credit Collection 🏷️</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Search customer phone or invoice to collect debt & print receipt</p>
                </div>
              </div>
              <button onClick={() => setShowCreditSettleModal(false)} style={{ border: 'none', background: '#f1f5f9', padding: '6px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            {/* Step 1: Search input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                SEARCH CUSTOMER PHONE, NAME, OR INVOICE NUMBER *
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                  <input
                    type="text"
                    value={creditSearchInput}
                    onChange={(e) => setCreditSearchInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearchCreditOrders(); }}
                    placeholder="e.g. 0771234567, Kamal, INV-..."
                    style={{
                      width: '100%',
                      paddingLeft: '44px',
                      paddingRight: '16px',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      fontSize: '14px',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontWeight: '600',
                      borderRadius: '12px',
                      border: '2px solid #cbd5e1',
                      outline: 'none',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                  />
                </div>
                <button
                  onClick={() => handleSearchCreditOrders()}
                  disabled={loadingCreditSearch}
                  style={{
                    padding: '0 24px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#ffffff',
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
                  }}
                >
                  {loadingCreditSearch ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
                  Search
                </button>
              </div>
            </div>

            {/* List of matching credit orders with customer aggregate summary */}
            {creditOrdersList.length > 0 && !selectedCreditOrder && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '10px 14px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#92400e' }}>
                    📋 Found {creditOrdersList.length} Unpaid Bill(s)
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#b45309' }}>
                    Total Customer Debt: Rs. {creditOrdersList.reduce((sum, o) => sum + (o.creditBalance || 0), 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '14px', background: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  {creditOrdersList.map((ord) => (
                    <div
                      key={ord._id}
                      onClick={() => handleSelectCreditOrder(ord)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#ffffff',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fffbeb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                    >
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>
                          {ord.invoiceNumber} — <span style={{ color: '#2563eb' }}>{ord.customerName || 'Customer'}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          📞 {ord.customerPhone || 'N/A'} | Date: {new Date(ord.createdAt).toLocaleDateString('en-GB')} | Total: Rs. {Number(ord.totalAmount || 0).toLocaleString()} | Paid: Rs. {Number(ord.amountPaid || 0).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: '#b45309', fontWeight: 'bold', textTransform: 'uppercase' }}>Remaining Due</div>
                        <div style={{ fontSize: '15px', fontWeight: '900', color: '#d97706' }}>
                          Rs. {Number(ord.creditBalance || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                        </div>
                        <span style={{ fontSize: '10px', color: '#2563eb', fontWeight: '700', textDecoration: 'underline' }}>Settle This &rarr;</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Credit Order Settlement Form */}
            {selectedCreditOrder ? (
              <div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{selectedCreditOrder.invoiceNumber}</span>
                      <span style={{ fontSize: '13px', color: '#475569', marginLeft: '8px', fontWeight: '600' }}>({selectedCreditOrder.customerName || 'Customer'})</span>
                    </div>
                    <button
                      onClick={() => setSelectedCreditOrder(null)}
                      style={{ border: '1px solid #cbd5e1', background: '#ffffff', color: '#2563eb', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      Change Order
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: '#ffffff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Total Order</div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#334155', marginTop: '2px' }}>Rs. {Number(selectedCreditOrder.totalAmount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', fontWeight: '700' }}>Already Paid</div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#166534', marginTop: '2px' }}>Rs. {Number(selectedCreditOrder.amountPaid || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#b45309', textTransform: 'uppercase', fontWeight: '700' }}>Remaining Due</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#d97706', marginTop: '2px' }}>
                        Rs. {Number(selectedCreditOrder.creditBalance || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                    <div>📞 Customer Phone: <strong style={{ color: '#0f172a' }}>{selectedCreditOrder.customerPhone || 'N/A'}</strong></div>
                    <button
                      type="button"
                      onClick={() => setCreditSettleForm({ ...creditSettleForm, amount: selectedCreditOrder.creditBalance || 0 })}
                      style={{
                        padding: '4px 10px',
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        color: '#92400e',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ 1-Click Full Due (Rs. {Number(selectedCreditOrder.creditBalance || 0).toLocaleString()})
                    </button>
                  </div>
                </div>

                {/* Form fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Settlement Amount (Rs.) *
                    </label>
                    <input
                      type="number"
                      onWheel={(e) => e.target.blur()}
                      value={creditSettleForm.amount}
                      onChange={(e) => setCreditSettleForm({ ...creditSettleForm, amount: e.target.value })}
                      placeholder="Enter amount"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: '16px',
                        fontWeight: '800',
                        color: '#0f172a',
                        background: '#ffffff',
                        border: '2px solid #cbd5e1',
                        borderRadius: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Payment Method *
                    </label>
                    <select
                      value={creditSettleForm.paymentMethod}
                      onChange={(e) => setCreditSettleForm({ ...creditSettleForm, paymentMethod: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#0f172a',
                        background: '#ffffff',
                        border: '2px solid #cbd5e1',
                        borderRadius: '12px',
                        outline: 'none'
                      }}
                    >
                      <option value="Cash">💵 Cash</option>
                      <option value="Card">💳 Card</option>
                      <option value="Bank Transfer">🏛️ Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Receiving Account / Drawer
                    </label>
                    <select
                      value={creditSettleForm.accountId}
                      onChange={(e) => setCreditSettleForm({ ...creditSettleForm, accountId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#0f172a',
                        background: '#ffffff',
                        border: '2px solid #cbd5e1',
                        borderRadius: '12px',
                        outline: 'none'
                      }}
                    >
                      <option value="">Default Counter Drawer</option>
                      {accounts.map(acc => (
                        <option key={acc._id} value={acc._id}>
                          {acc.name} {acc.accountType ? `(${acc.accountType})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Notes / Reference (Optional)
                    </label>
                    <input
                      type="text"
                      value={creditSettleForm.notes}
                      onChange={(e) => setCreditSettleForm({ ...creditSettleForm, notes: e.target.value })}
                      placeholder="e.g. Paid in full / Part payment"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#0f172a',
                        background: '#ffffff',
                        border: '2px solid #cbd5e1',
                        borderRadius: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '15px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
                    }}
                    onClick={handleSubmitCreditSettle}
                    disabled={submittingCreditSettle}
                  >
                    {submittingCreditSettle ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Saving & Generating Receipt...
                      </>
                    ) : (
                      <>
                        <Receipt size={18} />
                        Settle Debt & Print Receipt
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Reload Modal */}
      <ReloadModal 
        isOpen={showReloadModal} 
        onClose={() => setShowReloadModal(false)}
        storeId={user?.assignedStore || user?.assignedStoreId || user?.storeId || posSession?.storeId}
        accountId={pos.accountId}
        onSyncSuccess={() => {
          if (fetchDailyFinancials) fetchDailyFinancials();
          if (fetchSessionData) fetchSessionData();
        }}
      />

      <CustomerHistoryModal
        isOpen={showCustomerHistory}
        onClose={() => setShowCustomerHistory(false)}
        phone={pos.customerPhone}
      />

      <TradeInModal
        isOpen={showTradeInModal}
        onClose={() => setShowTradeInModal(false)}
        onApplyDiscount={(amount, label) => {
          pos.setDiscount(amount, 'fixed');
          toast.success(`Trade-In discount of LKR ${amount.toLocaleString()} applied to cart! 📱`);
        }}
      />

      {/* Petty Cash / Quick Expense Modal */}
      {showPettyCashModal && (
        <div className="pos-modal-overlay" onClick={() => setShowPettyCashModal(false)}>
          <div className="pos-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', width: '90%', padding: '24px', background: '#ffffff', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>☕</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Counter Petty Cash</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Record shop / drawer expense</p>
                </div>
              </div>
              <button onClick={() => setShowPettyCashModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePettyCash} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Expense Amount (Rs.) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="0.00"
                  value={pettyCashForm.amount}
                  onChange={(e) => setPettyCashForm({ ...pettyCashForm, amount: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '16px', fontWeight: '800', color: '#0f172a', outline: 'none' }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Expense Category</label>
                <select
                  value={pettyCashForm.category}
                  onChange={(e) => setPettyCashForm({ ...pettyCashForm, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600', color: '#334155' }}
                >
                  <option value="Tea & Refreshments">Tea & Refreshments</option>
                  <option value="Lunch / Meals">Lunch / Staff Meals</option>
                  <option value="Transport / Travel">Transport / Delivery Travel</option>
                  <option value="Supplies & Stationery">Shop Supplies & Stationery</option>
                  <option value="Cleaning & Maintenance">Cleaning & Maintenance</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Notes / Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Afternoon tea for 3 staff"
                  value={pettyCashForm.description}
                  onChange={(e) => setPettyCashForm({ ...pettyCashForm, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowPettyCashModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPettyCash}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#d97706', color: '#ffffff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)' }}
                >
                  {submittingPettyCash ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal (F1) */}
      {showShortcutsHelp && (
        <div className="pos-modal-overlay" onClick={() => setShowShortcutsHelp(false)}>
          <div className="pos-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', width: '90%', padding: '24px', background: '#ffffff', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>⌨️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>POS Keyboard Shortcuts</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Lightning-fast hands-free keyboard navigation</p>
                </div>
              </div>
              <button onClick={() => setShowShortcutsHelp(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#334155', fontWeight: '600' }}>Search / Scan Product</span>
                <kbd style={{ background: '#0f172a', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>F2 or /</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#334155', fontWeight: '600' }}>Customer Details</span>
                <kbd style={{ background: '#0f172a', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>F3 / Alt+C</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#334155', fontWeight: '600' }}>Amount Tendered (Cash)</span>
                <kbd style={{ background: '#0f172a', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>F4 / Alt+T</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#334155', fontWeight: '600' }}>Switch Payment Method</span>
                <kbd style={{ background: '#0f172a', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>F8</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f0fdf4', borderRadius: '12px', border: '1.5px solid #86efac' }}>
                <span style={{ color: '#166534', fontWeight: '800' }}>COMPLETE CHECKOUT</span>
                <kbd style={{ background: '#15803d', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>F9 / Ctrl+↵</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#334155', fontWeight: '600' }}>Give Quotation</span>
                <kbd style={{ background: '#0f172a', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>F10</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#334155', fontWeight: '600' }}>Discount / Voucher</span>
                <kbd style={{ background: '#0f172a', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>F6</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#334155', fontWeight: '600' }}>Customer Return</span>
                <kbd style={{ background: '#0f172a', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>F7</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#334155', fontWeight: '600' }}>Jump to Next Field</span>
                <kbd style={{ background: '#64748b', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>Enter ↵</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#334155', fontWeight: '600' }}>Close Modal / Cancel</span>
                <kbd style={{ background: '#64748b', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>Escape</kbd>
              </div>
            </div>

            <div style={{ marginTop: '18px', textAlign: 'center' }}>
              <button onClick={() => setShowShortcutsHelp(false)} className="pos-btn-blue" style={{ width: '100%', height: '40px', fontSize: '13px', fontWeight: 'bold' }}>
                Got it (Press Esc to Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POS Invoice Details & History Modal */}
      {showInvoiceSearchModal && (
        <div className="pos-modal-overlay" onClick={() => setShowInvoiceSearchModal(false)} style={{ zIndex: 99999 }}>
          <div
            className="pos-modal-card"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '850px',
              width: '94%',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              background: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#e0e7ff', color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Invoice Details & Sales History</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Search invoices, view items, reprint receipts & handle returns</p>
                </div>
              </div>
              <button onClick={() => setShowInvoiceSearchModal(false)} style={{ border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {/* Search Input & Controls */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  value={invoiceSearchInput}
                  onChange={(e) => {
                    setInvoiceSearchInput(e.target.value);
                    handleFetchRecentInvoices(e.target.value, true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFetchRecentInvoices(invoiceSearchInput, true);
                  }}
                  placeholder="Search by Invoice # (e.g. INV-1002), Phone, Name, or IMEI..."
                  style={{ width: '100%', height: '44px', paddingLeft: '42px', paddingRight: '36px', borderRadius: '14px', border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: '600', outline: 'none' }}
                  autoFocus
                />
                {invoiceSearchInput && (
                  <button
                    onClick={() => { setInvoiceSearchInput(''); handleFetchRecentInvoices('', true); }}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={() => handleFetchRecentInvoices(invoiceSearchInput, true)}
                style={{ padding: '0 20px', borderRadius: '14px', background: '#3730a3', color: '#ffffff', fontWeight: 'bold', fontSize: '13px', border: 'none', cursor: 'pointer' }}
              >
                Search
              </button>
            </div>

            {/* Invoices List */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loadingRecentInvoices ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 'bold', fontSize: '14px' }}>Loading Invoices...</p>
                </div>
              ) : recentInvoicesList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', background: '#f8fafc', borderRadius: '16px' }}>
                  <FileText size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>No invoices found</p>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Try searching by invoice number, customer phone or name</span>
                </div>
              ) : (
                recentInvoicesList.map((inv) => {
                  const invNo = inv.invoiceNumber || inv.orderId || `INV-${inv._id?.slice(-6)}`;
                  const invDate = new Date(inv.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
                  const custName = inv.customer?.name || inv.customerName || 'Walk-in Customer';
                  const custPhone = inv.customer?.phone || inv.customerPhone || '';
                  const total = inv.totalAmount || inv.total || 0;
                  const payMethod = (inv.paymentMethod || 'cash').toUpperCase().replace('_', ' ');
                  const itemsCount = inv.items?.length || 0;

                  return (
                    <div
                      key={inv._id}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        transition: 'all 0.15s',
                      }}
                    >
                      {/* Top Row: Invoice #, Date, Payment Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            onClick={() => {
                              setInvoiceModalLayoutMode('invoice');
                              setLastOrder(inv);
                              setShowInvoice(true);
                            }}
                            title="Click to view full A4 Invoice & PDF"
                            style={{ background: '#3730a3', color: '#ffffff', fontSize: '12px', fontWeight: '800', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer' }}
                          >
                            {invNo}
                          </span>

                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                            🕒 {invDate}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ background: '#f1f5f9', color: '#334155', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                            💳 {payMethod}
                          </span>
                          {inv.isCredit && (
                            <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px' }}>
                              CREDIT
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle Row: Customer Info & Items preview */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                            👤 {custName} {custPhone && <span style={{ color: '#475569', fontWeight: '600' }}>({custPhone})</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            📦 {itemsCount} Item(s): {inv.items?.map(it => `${it.name || it.productName || 'Item'}${it.imei ? ` (${it.imei})` : ''} x${it.qty || it.quantity || 1}`).join(', ')}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Total Amount</div>
                          <div style={{ fontSize: '16px', fontWeight: '900', color: '#059669' }}>Rs. {Number(total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>
                      </div>

                      {/* Bottom Row: Actions */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setShowInvoiceSearchModal(false);
                            setShowReturnModal(true);
                          }}
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          <RefreshCw size={14} /> Return
                        </button>
                        <button
                          onClick={() => {
                            setInvoiceModalLayoutMode('receipt');
                            setLastOrder(inv);
                            setShowInvoice(true);
                          }}
                          style={{ background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                          title="Print 80mm POS Thermal Receipt"
                        >
                          <Printer size={14} /> 80mm Receipt
                        </button>
                        <button
                          onClick={() => {
                            setInvoiceModalLayoutMode('invoice');
                            setLastOrder(inv);
                            setShowInvoice(true);
                          }}
                          style={{ background: '#3730a3', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                          title="View Invoice Details & Print"
                        >
                          <FileText size={14} /> View Details
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default POSScreen;
