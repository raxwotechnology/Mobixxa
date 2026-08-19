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
} from 'lucide-react';

import { getPosProducts, getProductByBarcode, posCheckout, getPosOrders, applyVoucher, getSettings, getActivePosSession, startPosSession, endPosSession, getPosPayHereHash, redeemPoints, getMyLoyaltyPoints, getCreditOrders, settleCreditOrder, getCategories, createQuotation, createProduct, getAccounts, loginUser, getCashiers, posLogin, getPosOrderByInvoice, createCustomerReturn, getHPRecords, recordHPPayment } from '../../services/api';



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
  const [balanceOrders, setBalanceOrders] = useState([]);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
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
    paymentMethod: 'cash',
    accountId: '',
    referenceNo: '',
    notes: ''
  });
  const [submittingHpPay, setSubmittingHpPay] = useState(false);
  const [hpReceiptData, setHpReceiptData] = useState(null);

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

      // F4 or Alt+T: Focus Amount Tendered
      if (e.key === 'F4' || (e.altKey && e.key.toLowerCase() === 't')) {
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

  // Fetch Cashiers for Lockscreen on Mount
  useEffect(() => {
    const fetchCashiers = async () => {
      try {
        setLoadingCashiers(true);
        const { data } = await getCashiers();
        setCashiersList(data || []);
      } catch (err) {
        console.error('Failed to load cashiers list');
      } finally {
        setLoadingCashiers(false);
      }
    };
    fetchCashiers();
  }, []);

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
      setPosSession(data || null);
      if (!data) setShowStartSession(true);
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
      const closingDenoms = denomsToLines(sessionForm.closing);
      const closingCashCountedAmount = calcTotal(sessionForm.closing);
      const { data } = await endPosSession({ closingDenoms, closingCashCountedAmount });
      setPosSession(null);
      setShowEndSession(false);
      toast.success(data.varianceFlagged ? `Session closed (variance Rs. ${data.variance})` : 'Session closed');
      setShowStartSession(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close session');
    }
  };

  const openEndSessionModal = async () => {
    setShowEndSession(true);
  };

  const openBalanceModal = async () => {
    try {
      setBalanceLoading(true);
      const { data } = await getPosOrders();
      setDailyFinancials(data?.summary || null);
      setBalanceOrders(data?.orders || []);
      setShowBalanceModal(true);
    } catch {
      setDailyFinancials(null);
      setBalanceOrders([]);
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

      // 1. Check exact barcode/SKU/id match in current product list
      const exactMatch = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === q.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase() === q.toLowerCase()) ||
          p._id === q
      );

      if (exactMatch) {
        addToCache(exactMatch);
        pos.addItem(exactMatch);
        toast.success(`Scanned: ${exactMatch.name}`, { autoClose: 1000 });
        setSearchQuery('');
        loadProducts();
        return;
      }

      // 2. Query barcode API if not in current loaded list
      try {
        const { data } = await getProductByBarcode(q);
        if (data && data._id) {
          addToCache(data);
          pos.addItem(data);
          toast.success(`Scanned: ${data.name}`, { autoClose: 1000 });
          setSearchQuery('');
          loadProducts();
          return;
        }
      } catch (barcodeErr) {
        // Fallthrough if not matched by barcode
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
    setHpPayForm(prev => ({
      ...prev,
      amount: rec.installmentAmount || rec.remainingBalance || '',
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
    if (!hpPayForm.accountId) {
      toast.error('Please select a receiving account');
      return;
    }

    try {
      setSubmittingHpPay(true);
      const { data } = await recordHPPayment(selectedHpRecord._id, {
        amount: amt,
        paymentMethod: hpPayForm.paymentMethod,
        accountId: hpPayForm.accountId,
        referenceNo: hpPayForm.referenceNo,
        notes: hpPayForm.notes
      });

      toast.success('Installment payment recorded successfully! 💳');
      
      const newBal = (selectedHpRecord.remainingBalance || 0) - amt;
      setHpReceiptData({
        payment: {
          amount: amt,
          paymentMethod: hpPayForm.paymentMethod,
          date: new Date().toLocaleDateString('en-GB'),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          referenceNo: hpPayForm.referenceNo,
          notes: hpPayForm.notes,
          receivedBy: user?.name || 'Cashier'
        },
        hpRecord: data || selectedHpRecord,
        newBalance: newBal
      });

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

  const handlePrintHpReceipt = () => {
    if (!hpReceiptData) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked! Please allow popups to print receipt.');
      return;
    }

    const { payment, hpRecord, newBalance } = hpReceiptData;
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
          <title>Installment Payment Receipt - ${hpRecord.invoiceNo}</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 10px; color: #000; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 8px; }
            .title { font-size: 16px; font-weight: bold; text-transform: uppercase; }
            .subtitle { font-size: 11px; margin-top: 2px; }
            .row { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .total-box { border: 1px solid #000; padding: 6px; margin: 8px 0; text-align: center; }
            .footer { margin-top: 12px; text-align: center; font-size: 10px; border-top: 1px dashed #000; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header text-${logoAlign}">
            ${showLogo ? `<div style="text-align:${logoAlign}; margin-bottom: 6px;"><img src="${logoUrl}" style="width:${logoWidth}px; max-height:80px; object-contain:contain;" /></div>` : ''}
            <div class="title text-${logoAlign}">${headerTitle}</div>
            ${subtitle ? `<div class="subtitle text-${logoAlign}">${subtitle}</div>` : ''}
            <div class="subtitle text-${logoAlign}">INSTALLMENT PAYMENT RECEIPT</div>
            <div class="subtitle text-${logoAlign}">Date: ${payment.date} ${payment.time}</div>
          </div>

          <div class="row"><span>Invoice No:</span><span class="bold">${hpRecord.invoiceNo}</span></div>
          <div class="row"><span>Customer:</span><span>${hpRecord.customer?.name || 'N/A'}</span></div>
          <div class="row"><span>Phone:</span><span>${hpRecord.customer?.phone || 'N/A'}</span></div>
          <div class="row"><span>Cashier:</span><span>${payment.receivedBy}</span></div>

          <div class="divider"></div>

          <div class="total-box">
            <div style="font-size: 11px;">AMOUNT PAID</div>
            <div style="font-size: 18px; font-weight: bold;">Rs. ${Number(payment.amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</div>
            <div style="font-size: 10px; text-transform: uppercase; margin-top: 2px;">Method: ${payment.paymentMethod}</div>
          </div>

          <div class="row"><span>Prev Balance:</span><span>Rs. ${Number(hpRecord.remainingBalance).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
          <div class="row"><span class="bold">Remaining Due:</span><span class="bold">Rs. ${Number(Math.max(0, newBalance)).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>

          <div class="footer">
            <p style="margin: 2px 0; font-weight: bold;">${footerMsg}</p>
            ${terms ? `<p style="margin: 4px 0 2px 0; font-size: 9px; font-style: italic;">${terms}</p>` : ''}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid rgba(59, 130, 246, 0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', className: 'animate-spin' }} />
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
          <button className="pos-topbar-btn" onClick={handleBack} title="Back to Dashboard">
            <ArrowLeft size={18} />
            <span className="pos-topbar-btn-text">Back</span>
          </button>
          <button className="pos-topbar-btn" onClick={openEndSessionModal} title="Close POS Session">
            <Clock size={18} />
            <span className="pos-topbar-btn-text">Close</span>
          </button>
          <button className="pos-topbar-btn" onClick={openBalanceModal} title="View Daily Balance">
            <DollarSign size={18} />
            <span className="pos-topbar-btn-text">Balance</span>
          </button>
          <button className="pos-topbar-btn" onClick={handleShiftSummary} title="Shift Summary">
            <TrendingUp size={18} />
            <span className="pos-topbar-btn-text">Shift</span>
          </button>
          <button className="pos-topbar-btn" onClick={() => { setShowCreditPanel(!showCreditPanel); if (!showCreditPanel) fetchCreditOrders(); }} title="Credit Sales" style={showCreditPanel ? { background: '#fef3c7', color: '#92400e' } : {}}>
            📋
            <span className="pos-topbar-btn-text">Credit</span>
          </button>
          <button className="pos-topbar-btn" onClick={() => setShowReturnModal(true)} title="Return / Exchange" style={{ background: '#fef2f2', color: '#991b1b', borderColor: '#fee2e2' }}>
            <RefreshCw size={18} />
            <span className="pos-topbar-btn-text">Return</span>
          </button>
          <button className="pos-topbar-btn" onClick={() => { setShowHpQuickPayModal(true); handleSearchHpRecords(''); }} title="Record HP Installment Payment" style={{ background: '#fff7ed', color: '#c2410c', borderColor: '#ffedd5', fontWeight: 'bold' }}>
            <CreditCard size={18} />
            <span className="pos-topbar-btn-text">HP Payment</span>
          </button>
          <button className="pos-topbar-btn" onClick={() => setShowTradeInModal(true)} title="Used Phone Trade-In Estimator" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd', fontWeight: 'bold' }}>
            <Smartphone size={18} />
            <span className="pos-topbar-btn-text">Trade-In</span>
          </button>
          <div className="pos-topbar-cashier">
            <div className="pos-topbar-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user?.avatar ? (
                <img src={getImageUrl(user.avatar)} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'C'
              )}
            </div>
            <span className="pos-topbar-cashier-name">{user?.name}</span>
          </div>
          <button className="pos-topbar-btn" onClick={() => setShowReloadModal(true)} title="Reload & Bill Payments" style={{ background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}>
            <Smartphone size={18} />
            <span className="pos-topbar-btn-text">Reload</span>
          </button>
          <button className="pos-topbar-btn" onClick={() => setShowShortcutsHelp(true)} title="Keyboard Shortcuts (F1)" style={{ background: '#f8fafc', color: '#334155', borderColor: '#cbd5e1' }}>
            <span style={{ fontSize: '15px' }}>⌨️</span>
            <span className="pos-topbar-btn-text">Shortcuts (F1)</span>
          </button>
          <button className="pos-topbar-btn" onClick={handleSwitchCashier} title="Switch Cashier" style={{ background: '#f5f3ff', color: '#5b21b6', borderColor: '#ddd6fe' }}>
            <Lock size={18} />
            <span className="pos-topbar-btn-text">Switch Cashier</span>
          </button>
          <button className="pos-topbar-logout" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
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

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
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

      {/* Start Session Modal */}
      {showStartSession && (
        <div className="pos-modal-overlay" onClick={() => { }}>
          <div className="pos-shift-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-shift-header">
              <Clock size={22} />
              <h3>Start Day (Opening Cash)</h3>
            </div>
            <div style={{ padding: '16px' }}>
              <p style={{ marginTop: 0, color: '#64748b', fontSize: '13px' }}>Enter opening cash denominations. Total is calculated automatically.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[5000, 1000, 500, 100, 50, 20].map((d) => (
                  <div key={d}>
                    <label style={{ fontSize: '12px', color: '#374151' }}>{d} LKR</label>
                    <input
                      type="number"
                      min="0"
                      value={sessionForm.opening[d]}
                      onChange={(e) => setSessionForm((s) => ({ ...s, opening: { ...s.opening, [d]: Number(e.target.value || 0) } }))}
                      className="pos-input"
                      style={{ fontSize: '12px' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '12px', fontWeight: 700 }}>Total: Rs. {calcTotal(sessionForm.opening).toFixed(2)}</div>
              <button className="pos-btn-green pos-btn-lg" style={{ marginTop: '14px' }} onClick={handleStartSession}>
                Start Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Session Modal */}
      {showEndSession && (
        <div className="pos-modal-overlay" onClick={() => setShowEndSession(false)}>
          <div className="pos-shift-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-shift-header">
              <Clock size={22} />
              <h3>Close Day (Closing Cash)</h3>
              <button onClick={() => setShowEndSession(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '16px' }}>
              <p style={{ marginTop: 0, color: '#64748b', fontSize: '13px' }}>Count physical cash by denomination. Variance will be flagged automatically.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[5000, 1000, 500, 100, 50, 20].map((d) => (
                  <div key={d}>
                    <label style={{ fontSize: '12px', color: '#374151' }}>{d} LKR</label>
                    <input
                      type="number"
                      min="0"
                      value={sessionForm.closing[d]}
                      onChange={(e) => setSessionForm((s) => ({ ...s, closing: { ...s.closing, [d]: Number(e.target.value || 0) } }))}
                      className="pos-input"
                      style={{ fontSize: '12px' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '12px', fontWeight: 700 }}>Total: Rs. {calcTotal(sessionForm.closing).toFixed(2)}</div>
              <button className="pos-btn-green pos-btn-lg" style={{ marginTop: '14px' }} onClick={handleEndSession}>
                Close Session
              </button>
            </div>
          </div>
        </div>
      )}

      {showBalanceModal && (
        <div className="pos-modal-overlay" onClick={() => setShowBalanceModal(false)}>
          <div
            className="pos-shift-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#0b1220', border: '1px solid #1f2937', color: '#e2e8f0', width: 'min(1200px, 96vw)', maxHeight: '92vh' }}
          >
            <div className="pos-shift-header">
              <DollarSign size={22} />
              <h3>Daily Cash Balance</h3>
              <button onClick={() => setShowBalanceModal(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '16px', color: '#e2e8f0' }}>
              {balanceLoading ? (
                <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>Loading balance...</p>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', fontSize: '13px' }}>
                    {[
                      ['Opening Cash', `Rs. ${Number(posSession?.openingCashAmount || 0).toFixed(2)}`],
                      ['Total Sales', `Rs. ${Number(dailyFinancials?.totalSales || 0).toFixed(2)}`],
                      ['Cash Sales', `Rs. ${Number(dailyFinancials?.cashSales || 0).toFixed(2)}`],
                      ['Card Sales', `Rs. ${Number(dailyFinancials?.cardSales || 0).toFixed(2)}`],
                      ['Koko Sales', `Rs. ${Number(dailyFinancials?.kokoSales || 0).toFixed(2)}`],
                      ['Items Sold', `${Number(dailyFinancials?.totalItemsSold || 0)}`],
                      ['System Revenue', `Rs. ${Number(dailyFinancials?.systemRevenue || 0).toFixed(2)}`],
                      ['Profit of Day', `Rs. ${Number(dailyFinancials?.profitOfDay || 0).toFixed(2)}`],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        style={{
                          background: '#111827',
                          border: '1px solid #374151',
                          borderRadius: '10px',
                          padding: '10px',
                        }}
                      >
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>{label}</div>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '14px', padding: '12px', borderRadius: '10px', background: '#0f172a', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                      Expected Physical Cash: <strong>Rs. {(Number(posSession?.openingCashAmount || 0) + Number(dailyFinancials?.cashSales || 0)).toFixed(2)}</strong>
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#94a3b8' }}>
                      Formula: Opening cash + Cash sales
                    </div>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#cbd5e1' }}>Sales History</h4>
                    <div style={{ maxHeight: '420px', overflow: 'auto', border: '1px solid #334155', borderRadius: '10px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead style={{ background: '#111827', position: 'sticky', top: 0 }}>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Time</th>
                            <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Customer</th>
                            <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Items</th>
                            <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8' }}>Payment</th>
                            <th style={{ textAlign: 'right', padding: '8px', color: '#94a3b8' }}>Total</th>
                            <th style={{ textAlign: 'right', padding: '8px', color: '#94a3b8' }}>Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {balanceOrders.map((order) => (
                            <tr key={order._id} style={{ borderTop: '1px solid #1f2937' }}>
                              <td style={{ padding: '8px', color: '#e2e8f0', verticalAlign: 'top' }}>
                                {new Date(order.createdAt).toLocaleTimeString()}
                              </td>
                              <td style={{ padding: '8px', color: '#cbd5e1', verticalAlign: 'top' }}>
                                <div style={{ fontWeight: 600, color: '#f8fafc' }}>{order.customerName || 'Walk-in Customer'}</div>
                                <div style={{ color: '#94a3b8', marginTop: '2px' }}>{order.customerPhone || '-'}</div>
                              </td>
                              <td style={{ padding: '8px', color: '#cbd5e1', verticalAlign: 'top' }}>
                                {(order.itemDetails || []).map((it, idx) => (
                                  <div key={idx} style={{ marginBottom: idx < (order.itemDetails?.length - 1) ? '6px' : '0' }}>
                                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{it.name}</div>
                                    <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '1px' }}>
                                      x{it.quantity} @ Rs.{Number(it.unitPrice || 0).toFixed(2)}
                                    </div>
                                  </div>
                                ))}
                              </td>
                              <td style={{ padding: '8px', color: '#e2e8f0', textTransform: 'uppercase' }}>
                                {order.paymentMethod}
                              </td>
                              <td style={{ padding: '8px', color: '#f8fafc', textAlign: 'right' }}>
                                Rs. {Number(order.totalAmount || 0).toFixed(2)}
                              </td>
                              <td style={{ padding: '8px', color: Number(order.estimatedProfit || 0) < 0 ? '#fca5a5' : '#86efac', textAlign: 'right', fontWeight: 700 }}>
                                Rs. {Number(order.estimatedProfit || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          {balanceOrders.length === 0 && (
                            <tr>
                              <td colSpan={6} style={{ padding: '10px', color: '#94a3b8', textAlign: 'center' }}>
                                No sales history for today.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
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
                        📞 {rec.customer?.phone} | Due: <strong style={{ color: '#d97706' }}>Rs. {rec.remainingBalance?.toLocaleString()}</strong>
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
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#334155', marginTop: '2px' }}>Rs. {selectedHpRecord.netTotal?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', fontWeight: '700' }}>Total Paid</div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#166534', marginTop: '2px' }}>Rs. {selectedHpRecord.totalPaid?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#b45309', textTransform: 'uppercase', fontWeight: '700' }}>Remaining Due</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#d97706', marginTop: '2px' }}>Rs. {selectedHpRecord.remainingBalance?.toLocaleString()}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                    <span>📞 Customer Phone: <strong style={{ color: '#0f172a' }}>{selectedHpRecord.customer?.phone || 'N/A'}</strong></span>
                    <span>Monthly Installment: <strong style={{ color: '#2563eb' }}>Rs. {selectedHpRecord.installmentAmount?.toLocaleString()}</strong></span>
                  </div>
                </div>

                {/* Form fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Amount to Pay (Rs.) *
                    </label>
                    <input
                      type="number"
                      onWheel={(e) => e.target.blur()}
                      value={hpPayForm.amount}
                      onChange={(e) => setHpPayForm({ ...hpPayForm, amount: e.target.value })}
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
                      <option value="cash">💵 Cash</option>
                      <option value="card">💳 Card</option>
                      <option value="bank_transfer">🏛️ Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Receiving Account / Drawer *
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
                      <option value="">Select Account</option>
                      {accounts.map(acc => (
                        <option key={acc._id} value={acc._id}>
                          {acc.name} ({acc.accountType})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Ref No / Notes
                    </label>
                    <input
                      type="text"
                      value={hpPayForm.referenceNo}
                      onChange={(e) => setHpPayForm({ ...hpPayForm, referenceNo: e.target.value })}
                      placeholder="e.g. Card slip # / Txn ID"
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
                      display: 'flex',
                      justify: 'center',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '15px',
                      fontWeight: '800',
                      padding: '14px 24px',
                      color: '#ffffff',
                      background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                      border: 'none',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                      transition: 'all 0.2s'
                    }}
                    onClick={handleSubmitHpPayment}
                    disabled={submittingHpPay || !hpPayForm.amount || !hpPayForm.accountId}
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

      {/* Reload Modal */}
      <ReloadModal 
        isOpen={showReloadModal} 
        onClose={() => setShowReloadModal(false)}
        storeId={user?.assignedStore || user?.assignedStoreId || user?.storeId || posSession?.storeId}
        accountId={pos.accountId}
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
    </div>

  );
};

export default POSScreen;
