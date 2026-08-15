'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Printer, Download, Package, Barcode, Plus, Minus, Store, X, Trash2 } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import DashboardLayout from '../../components/DashboardLayout';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

import { getAdminProducts, getAdminStores, logBarcodeGeneration, getSettings, updateSettings } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-toastify';

// Dynamic nav items based on role
import { adminNavGroups } from '../admin/adminNavItems';
import { managerNavGroups } from '../storeOwner/managerNavItems';
import { getEmployeeNavGroups } from '../employee/employeeNav';

const DEFAULT_PRINTERS = [
  { _id: 'p1', name: 'Zebra ZD220 (50mm x 30mm)', layout: '50x30', connection: 'USB', isDefault: true },
  { _id: 'p2', name: 'Xprinter XP-365B (38mm x 25mm)', layout: '38x25', connection: 'USB', isDefault: false },
  { _id: 'p3', name: 'A4 Laser Printer (3-Col Grid)', layout: 'a4_3col', connection: 'System Spooler', isDefault: false }
];

const BarcodeGenerator = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(12);
  const [shopName, setShopName] = useState('Mobixa');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false);
  const modalSvgRef = useRef(null);
  const printRef = useRef(null);

  // Printers Configuration States
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [newPrinter, setNewPrinter] = useState({ name: '', layout: '50x30', connection: 'USB' });
  const [printerAssignments, setPrinterAssignments] = useState({});

  useEffect(() => {
    loadProducts();
    loadStores();
    loadSettings();
  }, []);

  const loadProducts = async () => {
    try {
      const { data } = await getAdminProducts();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (adminErr) {
      try {
        const { data } = await API.get('/products');
        setProducts(Array.isArray(data) ? data : data.products || []);
      } catch (pubErr) {
        try {
          const { data } = await API.get('/pos/products');
          setProducts(Array.isArray(data) ? data : data.products || []);
        } catch (posErr) {
          toast.error('Failed to load products');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const { data } = await getAdminStores();
      setStores(Array.isArray(data) ? data : data.stores || []);
    } catch {
      /* ignore if not admin */
    }
  };

  const loadSettings = async () => {
    try {
      const { data } = await getSettings();
      if (data?.shopName) setShopName(data.shopName);
      if (data?.labelPrinters && data.labelPrinters.length > 0) {
        setPrinters(data.labelPrinters);
        const def = data.labelPrinters.find(p => p.isDefault) || data.labelPrinters[0];
        setSelectedPrinter(def);
      } else {
        setPrinters(DEFAULT_PRINTERS);
        setSelectedPrinter(DEFAULT_PRINTERS[0]);
      }
    } catch {
      setPrinters(DEFAULT_PRINTERS);
      setSelectedPrinter(DEFAULT_PRINTERS[0]);
    }
  };

  const handleSavePrinters = async (updatedPrinters) => {
    try {
      const { data } = await updateSettings({ labelPrinters: updatedPrinters });
      setPrinters(data.labelPrinters || []);
      const def = data.labelPrinters?.find(p => p.isDefault) || data.labelPrinters?.[0] || null;
      setSelectedPrinter(def);
      toast.success('Printers list updated');
    } catch {
      toast.error('Failed to update printers list');
    }
  };

  const handleAddPrinter = (e) => {
    e.preventDefault();
    if (!newPrinter.name.trim()) return toast.warning('Printer name is required');
    const updated = [
      ...printers,
      {
        _id: 'temp_' + Date.now(),
        name: newPrinter.name.trim(),
        layout: newPrinter.layout,
        connection: newPrinter.connection,
        isDefault: printers.length === 0
      }
    ];
    setPrinters(updated);
    setNewPrinter({ name: '', layout: '50x30', connection: 'USB' });
    handleSavePrinters(updated);
  };

  const handleDeleteClick = (printer) => {
    setItemToDelete(printer);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    const updated = printers.filter(p => p._id !== itemToDelete._id);

    if (updated.length > 0 && !updated.some(p => p.isDefault)) {
      updated[0].isDefault = true;
    }
    setPrinters(updated);
    handleSavePrinters(updated);
  };

  const handleSetDefaultPrinter = (id) => {
    const updated = printers.map(p => ({
      ...p,
      isDefault: p._id === id
    }));
    setPrinters(updated);
    handleSavePrinters(updated);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(search.toLowerCase());

    if (selectedStore === 'all' || !selectedStore) return matchesSearch;

    const pStoreId = typeof p.store === 'object' ? p.store?._id : p.store;
    const pStoreName = typeof p.store === 'object' ? p.store?.name : p.storeName;
    const matchesStore = pStoreId === selectedStore || pStoreName === selectedStore;

    return matchesSearch && matchesStore;
  });

  const getBarcodeValue = (product) => {
    return product.barcode || product.sku || `ZFC-${product._id?.slice(-8).toUpperCase()}`;
  };

  const handleGenerate = async () => {
    if (!selectedProduct) {
      toast.warning('Please select a product first');
      return;
    }
    setGenerating(true);
    try {
      await logBarcodeGeneration({
        productId: selectedProduct._id,
        quantity,
        printerName: selectedPrinter?.name || 'Default Printer'
      });
      setGenerated(true);
      setShowLivePreviewModal(true);

      // Initialize printer assignments: default printer gets the full quantity, others get 0
      const initial = {};
      printers.forEach(p => {
        initial[p._id] = p._id === selectedPrinter?._id ? quantity : 0;
      });
      setPrinterAssignments(initial);

      toast.success(`${quantity} barcode labels generated for ${selectedPrinter?.name || 'Default Printer'}`);
      setTimeout(() => renderBarcodes(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate barcodes');
    } finally {
      setGenerating(false);
    }
  };

  const renderBarcodes = useCallback(() => {
    if (!selectedProduct) return;
    const barcodeValue = getBarcodeValue(selectedProduct);
    const svgs = document.querySelectorAll('.barcode-svg');
    svgs.forEach(svg => {
      try {
        JsBarcode(svg, barcodeValue, {
          format: 'CODE128',
          width: selectedPrinter?.layout === '38x25' ? 1.2 : 1.5,
          height: selectedPrinter?.layout === '38x25' ? 22 : 36,
          displayValue: true,
          fontSize: 9,
          margin: 1,
          textMargin: 1,
        });
      } catch { /* ignore invalid */ }
    });
  }, [selectedProduct, selectedPrinter]);

  useEffect(() => {
    if (generated && selectedProduct) {
      setTimeout(() => renderBarcodes(), 50);
    }
  }, [generated, selectedProduct, quantity, selectedPrinter, renderBarcodes]);

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateAssignment = (printerId, val) => {
    const qty = Math.max(0, Math.min(500, parseInt(val) || 0));
    setPrinterAssignments(prev => ({
      ...prev,
      [printerId]: qty
    }));
  };

  const handlePrintForPrinter = async (printer, qty) => {
    if (qty <= 0) {
      toast.warning(`Please assign a quantity greater than 0 to ${printer.name}`);
      return;
    }
    
    // Switch active printer and quantity
    setSelectedPrinter(printer);
    setQuantity(qty);
    
    // Log the print transaction to the backend
    try {
      await logBarcodeGeneration({
        productId: selectedProduct._id,
        quantity: qty,
        printerName: printer.name
      });
    } catch (err) {
      console.error('Failed to log printer assignment:', err);
    }
    
    // Wait for render of layout styles and JSBarcode SVGs to complete, then print
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const getLayoutStyles = () => {
    const layout = selectedPrinter?.layout || '50x30';
    if (layout === '50x30') {
      return `
        @media print {
          body * { visibility: hidden !important; }
          .print-only, .print-only * { visibility: visible !important; }
          .print-only {
            position: fixed !important;
            left: 0; top: 0;
            width: 50mm !important;
            height: 30mm !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            size: 50mm 30mm !important;
            margin: 0 !important;
          }
          .barcode-grid {
            display: block !important;
            width: 50mm !important;
            height: 30mm !important;
          }
          .barcode-label {
            width: 50mm !important;
            height: 30mm !important;
            border: none !important;
            padding: 1.5mm !important;
            page-break-after: always !important;
            break-after: always !important;
            text-align: center !important;
            box-sizing: border-box !important;
          }
        }
      `;
    }
    if (layout === '38x25') {
      return `
        @media print {
          body * { visibility: hidden !important; }
          .print-only, .print-only * { visibility: visible !important; }
          .print-only {
            position: fixed !important;
            left: 0; top: 0;
            width: 78mm !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            size: 78mm 25mm !important;
            margin: 0 !important;
          }
          .barcode-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 2mm !important;
            width: 78mm !important;
          }
          .barcode-label {
            width: 38mm !important;
            height: 25mm !important;
            border: none !important;
            padding: 1mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            text-align: center !important;
            box-sizing: border-box !important;
          }
        }
      `;
    }
    if (layout === '80mm') {
      return `
        @media print {
          body * { visibility: hidden !important; }
          .print-only, .print-only * { visibility: visible !important; }
          .print-only {
            position: fixed !important;
            left: 0; top: 0;
            width: 80mm !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            size: 80mm auto !important;
            margin: 0 !important;
          }
          .barcode-grid {
            display: block !important;
            width: 80mm !important;
          }
          .barcode-label {
            width: 80mm !important;
            border: none !important;
            padding: 2.5mm !important;
            page-break-after: always !important;
            break-after: always !important;
            text-align: center !important;
            box-sizing: border-box !important;
          }
        }
      `;
    }
    // Default / A4 grid
    return `
      @media print {
        body * { visibility: hidden !important; }
        .print-only, .print-only * { visibility: visible !important; }
        .print-only {
          position: fixed !important;
          left: 0; top: 0;
          width: 210mm !important;
          padding: 5mm !important;
        }
        @page {
          size: A4 !important;
          margin: 5mm !important;
        }
        .barcode-grid {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 3mm !important;
        }
        .barcode-label {
          border: 0.5pt solid #ccc !important;
          padding: 3.5mm !important;
          text-align: center !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          box-sizing: border-box !important;
        }
      }
    `;
  };

  const getPreviewDimensions = () => {
    const layout = selectedPrinter?.layout || '50x30';
    if (layout === '50x30') return { width: '180px', minHeight: '110px' };
    if (layout === '38x25') return { width: '160px', minHeight: '95px' };
    if (layout === '80mm') return { width: '220px', minHeight: '130px' };
    return { width: '200px', minHeight: '130px' };
  };

  const getNavItems = () => {
    if (user?.role === 'admin') return adminNavGroups;
    if (user?.role === 'manager') return managerNavGroups || [];
    return getEmployeeNavGroups(user?.role);
  };

  const dashTitle = user?.role === 'admin' ? 'Mobixa Admin Panel' :
    user?.role === 'manager' ? 'Store Dashboard' : 'Employee Portal';

  return (
    <DashboardLayout navItems={getNavItems()} title={dashTitle}>
      <div className="no-print animate-fade-in space-y-6">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-indigo/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                <Barcode size={20} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-black text-slate-900 m-0">Barcode Generator</h1>
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-2 m-0">Generate print-ready barcode labels for products</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left — Product Selection */}
          <div className="space-y-4">
            <div className="glass-card rounded-[2rem] p-6">
              <h2 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Package size={16} /> Select Product
              </h2>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                {stores.length > 0 && (
                  <div className="sm:w-2/5">
                    <select
                      value={selectedStore}
                      onChange={e => setSelectedStore(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all cursor-pointer"
                    >
                      <option value="all">🏪 All Stores ({stores.length})</option>
                      {stores.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.code || s.location || 'Store'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search name, SKU, or barcode..."
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {loading ? (
                  <div className="text-center py-8 text-slate-400 font-bold text-xs uppercase tracking-wider">Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 font-bold text-xs uppercase tracking-wider">No products found</div>
                ) : (
                  filteredProducts.slice(0, 30).map(product => (
                    <div
                      key={product._id}
                      onClick={() => { setSelectedProduct(product); setGenerated(false); }}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                        selectedProduct?._id === product._id
                          ? 'border-brand-indigo/30 bg-brand-indigo/5 shadow-xs'
                          : 'border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package size={16} className="text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate m-0">{product.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold m-0 mt-0.5">
                          SKU: {product.sku || 'N/A'} • Rs. {product.price?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right — Settings & Preview */}
          <div className="space-y-4">
            {/* Label Settings */}
            <div className="glass-card rounded-[2rem] p-6">
              <h2 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Store size={16} /> Label Settings
              </h2>

              {selectedProduct ? (
                <div className="space-y-4">
                  {/* Product Info */}
                  <div className="bg-brand-indigo/5 border border-brand-indigo/10 rounded-2xl p-4">
                    <p className="font-bold text-slate-800 text-sm m-0">{selectedProduct.name}</p>
                    <p className="text-xs text-slate-500 font-semibold m-0 mt-1">
                      SKU: {selectedProduct.sku || 'N/A'} • Price: Rs. {selectedProduct.price?.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase m-0 mt-1">
                      Barcode: {getBarcodeValue(selectedProduct)}
                    </p>
                  </div>

                  {/* Shop Name */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Shop Name on Label</label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={e => setShopName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all bg-white"
                    />
                  </div>

                  {/* Printer Select Dropdown */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-500 block">Link Label Printer</label>
                      <button
                        type="button"
                        onClick={() => setShowPrinterModal(true)}
                        className="text-[10px] font-black uppercase tracking-wider text-brand-indigo hover:text-brand-violet transition-colors flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
                      >
                        ⚙️ Link Printer
                      </button>
                    </div>
                    <select
                      value={selectedPrinter?._id || ''}
                      onChange={e => {
                        const prt = printers.find(p => p._id === e.target.value);
                        setSelectedPrinter(prt);
                      }}
                      className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all cursor-pointer"
                    >
                      {printers.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.layout === '50x30' ? '50x30mm' : p.layout === '38x25' ? '38x25mm' : p.layout === '80mm' ? '80mm Continuous' : 'A4 Grid'} - {p.connection}) {p.isDefault ? '· [Default]' : ''}
                        </option>
                      ))}
                    </select>
                    {selectedPrinter && (
                      <p className="text-[10px] text-teal-600 font-extrabold uppercase mt-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                        Linked to Printer: {selectedPrinter.name}
                      </p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Number of Labels</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 text-slate-500 cursor-pointer"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={quantity}
                          onChange={e => setQuantity(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                          className="w-16 text-center border-0 bg-transparent text-xs font-black text-slate-800 focus:outline-none"
                        />
                        <button
                          onClick={() => setQuantity(Math.min(500, quantity + 1))}
                          className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 text-slate-500 cursor-pointer"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      {/* Quick presets */}
                      <div className="flex gap-1.5 ml-2">
                        {[12, 24, 48].map(n => (
                          <button
                            key={n}
                            onClick={() => setQuantity(n)}
                            className={`px-3 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
                              quantity === n
                                ? 'bg-brand-indigo border-brand-indigo text-white shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full flex items-center justify-center gap-2 bg-brand-indigo hover:bg-brand-violet text-white font-black py-3.5 rounded-xl transition-all shadow-md text-[10px] uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                  >
                    <Barcode size={14} />
                    {generating ? 'Generating...' : `Generate ${quantity} Labels`}
                  </button>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <Package size={36} className="mx-auto mb-3 text-slate-300 animate-pulse" />
                  <p className="text-xs font-black uppercase tracking-wider">Select a product to begin</p>
                </div>
              )}
            </div>

            {/* Single Label Preview & Assignments */}
            {selectedProduct && generated && (
              <div className="space-y-4">
                <div className="glass-card rounded-[2rem] p-6">
                  <h2 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider">Label Preview ({selectedPrinter?.name})</h2>
                  <div 
                    className="border border-slate-100 rounded-2xl p-4 text-center bg-slate-50 transition-all flex flex-col justify-between items-center shadow-xs" 
                    style={{ ...getPreviewDimensions(), margin: '0 auto' }}
                  >
                    <p className="text-[9px] font-black text-slate-400 mb-0.5 uppercase tracking-wider">{shopName}</p>
                    <p className="text-xs font-black text-slate-800 truncate w-full m-0">{selectedProduct.name}</p>
                    <p className="text-xs font-black text-brand-indigo my-0.5">Rs. {selectedProduct.price?.toFixed(2)}</p>
                    <svg className="barcode-svg mx-auto" style={{ maxWidth: '100%', height: '40px' }}></svg>
                    <p className="text-[8px] text-slate-450 mt-0.5 font-bold">SKU: {selectedProduct.sku || 'N/A'}</p>
                  </div>

                  <button
                    onClick={handlePrint}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black py-2.5 rounded-xl transition-all shadow-sm text-[10px] uppercase tracking-wider cursor-pointer"
                  >
                    <Printer size={13} /> Print Active Layout ({quantity} Labels)
                  </button>
                </div>

                {/* Printer Assignments & Routing */}
                <div className="glass-card rounded-[2rem] p-6 space-y-4">
                  <div>
                    <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 m-0 uppercase tracking-wider">
                      <Printer size={16} className="text-brand-indigo" /> Printer Assignment & Routing
                    </h3>
                    <p className="text-xs text-slate-450 font-semibold mt-1 m-0">
                      Distribute and print the generated labels across your connected/linked printers:
                    </p>
                  </div>

                  <div className="space-y-3">
                    {printers.map(p => {
                      const assignedQty = printerAssignments[p._id] || 0;
                      return (
                        <div key={p._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50 gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-800 truncate">{p.name}</span>
                              {p.isDefault && (
                                <span className="text-[9px] bg-brand-indigo/10 text-brand-indigo font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider border border-brand-indigo/10">Default</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-450 font-bold mt-0.5 m-0">
                              Connection: {p.connection} • Layout: {
                                p.layout === '50x30' ? '50x30mm' :
                                p.layout === '38x25' ? '38x25mm' :
                                p.layout === '80mm' ? '80mm Continuous' : 'A4 Label Grid'
                              }
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleUpdateAssignment(p._id, assignedQty - 1)}
                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 cursor-pointer text-slate-550"
                              >
                                <Minus size={12} />
                              </button>
                              <input
                                type="number"
                                value={assignedQty}
                                onChange={e => handleUpdateAssignment(p._id, e.target.value)}
                                className="w-12 text-center border border-slate-200 rounded-lg py-0.5 text-xs font-black text-slate-800 bg-white"
                              />
                              <button
                                onClick={() => handleUpdateAssignment(p._id, assignedQty + 1)}
                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 cursor-pointer text-slate-550"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            
                            <button
                              onClick={() => handlePrintForPrinter(p, assignedQty)}
                              disabled={assignedQty <= 0}
                              className="flex items-center gap-1 px-3 py-1.5 bg-brand-indigo hover:bg-brand-violet disabled:bg-slate-205 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors shadow-sm cursor-pointer"
                            >
                              <Printer size={11} /> Print ({assignedQty})
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Status */}
                  {(() => {
                    const totalAssigned = Object.values(printerAssignments).reduce((a, b) => a + b, 0);
                    const diff = totalAssigned - quantity;
                    return (
                      <div className="flex items-center justify-between text-[11px] pt-3.5 border-t border-slate-105 font-extrabold uppercase tracking-wider">
                        <span className="text-slate-400">
                          Total Assigned: <strong className={diff === 0 ? "text-teal-655" : "text-amber-600"}>{totalAssigned}</strong> / {quantity} labels
                        </span>
                        {diff === 0 ? (
                          <span className="text-teal-600 font-extrabold flex items-center gap-1">
                            ✓ All labels routed
                          </span>
                        ) : diff > 0 ? (
                          <span className="text-amber-650 font-extrabold">
                            ⚠️ Over-assigned (+{diff})
                          </span>
                        ) : (
                          <span className="text-amber-650 font-extrabold">
                            ⚠️ Under-assigned ({Math.abs(diff)} left)
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ PRINT AREA — only visible when printing ═══════ */}
      {generated && selectedProduct && (
        <div className="print-only" ref={printRef}>
          <style>{getLayoutStyles()}</style>
          <div className="barcode-grid">
            {Array.from({ length: quantity }).map((_, i) => (
              <div key={i} className="barcode-label">
                <p className="shop-name-label" style={{ fontSize: '8px', fontWeight: 700, margin: '0 0 1px', color: '#333' }}>{shopName}</p>
                <p className="product-name-label" style={{ fontSize: '10px', fontWeight: 600, margin: '0 0 2px', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedProduct.name}
                </p>
                <p className="price-label" style={{ fontSize: '12px', fontWeight: 700, margin: '2px 0', color: '#c026d3' }}>
                  Rs. {selectedProduct.price?.toFixed(2)}
                </p>
                <svg className="barcode-svg" style={{ maxWidth: '160px', display: 'block', margin: '0 auto' }}></svg>
                <p className="sku-label" style={{ fontSize: '7px', color: '#888', margin: '1px 0 0' }}>SKU: {selectedProduct.sku || 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Printer Manager Modal */}
      {showPrinterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-black text-slate-800 m-0 uppercase tracking-wider flex items-center gap-2">
                ⚙️ Link & Manage Label Printers
              </h2>
              <button onClick={() => setShowPrinterModal(false)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors border-0 cursor-pointer bg-transparent">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Existing Printers List */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Linked Printers</label>
                {printers.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold py-2">No printers configured yet.</p>
                ) : (
                  printers.map(p => (
                    <div key={p._id} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-105 bg-slate-50 text-xs">
                      <div>
                        <p className="font-bold text-slate-800 m-0">{p.name}</p>
                        <p className="text-[10px] text-slate-455 font-bold m-0 mt-0.5">
                          Connection: {p.connection} · Layout: {
                            p.layout === '50x30' ? '50mm x 30mm (Single)' :
                            p.layout === '38x25' ? '38mm x 25mm (Double)' :
                            p.layout === '80mm' ? '80mm Continuous' : 'A4 Label Grid'
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {p.isDefault ? (
                          <span className="text-[9px] bg-teal-50 text-teal-700 border border-teal-100/60 font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Default</span>
                        ) : (
                          <button
                            onClick={() => handleSetDefaultPrinter(p._id)}
                            className="text-[10px] font-black uppercase tracking-wider text-brand-indigo hover:text-brand-violet transition-colors bg-transparent border-0 cursor-pointer"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(p)}
                          className="p-1.5 text-rose-500 hover:bg-rose-55 rounded-lg border-0 cursor-pointer bg-transparent transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Printer Form */}
              <form onSubmit={handleAddPrinter} className="border-t border-slate-100 pt-5 space-y-4">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Link New Label Printer</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-455 block mb-1">Printer Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TSC TTP-244 Pro"
                      value={newPrinter.name}
                      onChange={e => setNewPrinter({ ...newPrinter, name: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-455 block mb-1">Connection Port/Type</label>
                    <input
                      type="text"
                      placeholder="e.g. USB001 or 192.168.1.150"
                      value={newPrinter.connection}
                      onChange={e => setNewPrinter({ ...newPrinter, connection: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-455 block mb-1">Label layout / Roll Size</label>
                  <select
                    value={newPrinter.layout}
                    onChange={e => setNewPrinter({ ...newPrinter, layout: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all cursor-pointer"
                  >
                    <option value="50x30">50mm x 30mm (Single Column)</option>
                    <option value="38x25">38mm x 25mm (Double Column)</option>
                    <option value="80mm">80mm Roll (Thermal Monospace)</option>
                    <option value="a4_3col">Standard A4 Sheet (3-Column Grid)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-brand-indigo hover:bg-brand-violet text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer border-0"
                >
                  <Plus size={13} /> Add & Link Printer
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Live Barcode View Preview Modal */}
      {showLivePreviewModal && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 relative text-center">
            <button
              onClick={() => setShowLivePreviewModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
              <Barcode size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 m-0">Live Barcode Preview</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Generated barcode preview for store labeling
            </p>

            <div className="my-5 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center">
              <p className="text-xs font-black text-slate-900 uppercase tracking-wide mb-1">{shopName}</p>
              <p className="text-sm font-bold text-slate-800 line-clamp-1 max-w-[240px] text-center mb-1">
                {selectedProduct.name}
              </p>
              
              {/* Barcode SVG container */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 my-2 shadow-xs">
                <svg
                  ref={(el) => {
                    if (el && selectedProduct) {
                      try {
                        JsBarcode(el, getBarcodeValue(selectedProduct), {
                          format: 'CODE128',
                          width: 1.5,
                          height: 40,
                          displayValue: true,
                          fontSize: 10,
                          margin: 2
                        });
                      } catch (e) {}
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mt-1">
                <span>SKU: {selectedProduct.sku || 'N/A'}</span>
                <span>•</span>
                <span className="text-emerald-600 font-black">Rs. {selectedProduct.price?.toFixed(2)}</span>
              </div>
              
              {(selectedProduct.store?.name || selectedProduct.storeName) && (
                <span className="mt-2 text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full">
                  🏪 Store: {selectedProduct.store?.name || selectedProduct.storeName}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowLivePreviewModal(false);
                  setTimeout(() => window.print(), 100);
                }}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer border-0"
              >
                <Printer size={15} /> Print {quantity} Labels
              </button>
              <button
                onClick={() => setShowLivePreviewModal(false)}
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.name || 'this printer'}
      />

    </DashboardLayout>
  );
};

export default BarcodeGenerator;
