'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, ChevronDown, ChevronUp, Package, Eye, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getAdminProducts, getCategories, getStores, createProduct, updateProduct, deleteProduct, getSuppliers } from '../../services/api';
import { toast } from 'react-toastify';
import { adminNavGroups as navItems } from './adminNavItems';
import useAdminStoreStore from '../../store/adminStoreStore';
import SuppliersPanel from '../inventory/SuppliersPanel';
import StockReceivingPanel from '../inventory/StockReceivingPanel';
import SupplierReturnsPanel from '../inventory/SupplierReturnsPanel';
import { getImageUrl, handleImageError, isDirectImageUrl, convertExternalUrl } from '../../utils/imageHelper';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

const emptyForm = {
  name: '', categoryId: '', description: '', price: '', minPrice: '', mrp: '', discount: '', unit: 'kg',
  stock: '', purchasePrice: '', images: '', isFeatured: false, isOnSale: false, allowKokoOnline: true, allowKokoPos: true, status: 'active', storeId: '', productLink: '', supplierId: '', barcode: '',
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('products'); // products | suppliers | receiving | supplierReturns
  const { selectedStoreId, setSelectedStoreId } = useAdminStoreStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expandedProduct, setExpandedProduct] = useState(null);

  // Password confirmation states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const storeParam = selectedStoreId !== 'all' ? selectedStoreId : undefined;
      const [prodRes, catRes, storesRes, suppRes] = await Promise.all([
        getAdminProducts({ storeId: storeParam }), 
        getCategories(), 
        getStores(),
        getSuppliers().catch(() => ({ data: [] }))
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      setStores(storesRes.data.stores || storesRes.data || []);
      setSuppliers(suppRes.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load products';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedStoreId]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, storeId: selectedStoreId !== 'all' ? selectedStoreId : '' });
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name || '',
      categoryId: product.categoryId?._id || '',
      description: product.description || '',
      price: product.price || '',
      minPrice: product.minPrice || '',
      mrp: product.mrp || '',
      discount: product.discount || '',
      unit: product.unit || 'kg',
      stock: product.stock || 0,
      purchasePrice: product.avgCost || product.lastCost || '',
      images: (product.images || []).join(', '),
      isFeatured: !!product.isFeatured,
      isOnSale: !!product.isOnSale,
      allowKokoOnline: product.allowKokoOnline !== false,
      allowKokoPos: product.allowKokoPos !== false,
      status: product.status || 'active',
      storeId: product.storeId?._id || '',
      productLink: product.productLink || '',
      supplierId: product.supplierId?._id || product.supplierId || '',
      barcode: product.barcode || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalImages = form.images ? form.images.split(',').map((s) => {
        const trimmed = s.trim();
        const converted = convertExternalUrl(trimmed);
        if (converted && converted !== trimmed) {
          toast.info('External link auto-converted');
        }
        return converted || trimmed;
      }).filter(Boolean) : [];
      // Ensure productLink is always the first image in the array if it exists
      if (form.productLink) {
        finalImages = finalImages.filter(url => url !== form.productLink);
        finalImages.unshift(form.productLink);
      }

      // Validate store is valid selection
      const storeExists = stores.find(s => s._id === form.storeId);
      if (!storeExists) {
        toast.error('Please select a valid store from the suggestions');
        setSaving(false);
        return;
      }

      // Check minPrice validation
      if (form.minPrice && Number(form.price) < Number(form.minPrice)) {
        toast.error('Selling price cannot be lower than the configured minimum price');
        setSaving(false);
        return;
      }

      const payload = {
        ...form,
        price: Number(form.price),
        minPrice: Number(form.minPrice) || 0,
        mrp: Number(form.mrp) || Number(form.price),
        discount: Number(form.discount) || 0,
        stock: Number(form.stock),
        purchasePrice: Number(form.purchasePrice) || 0,
        images: finalImages,
        supplierId: form.supplierId && form.supplierId !== 'none' ? form.supplierId : null,
      };

      if (editingId) {
        await updateProduct(editingId, payload);
        toast.success('Product updated');
      } else {
        await createProduct(payload);
        toast.success('Product created');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (product) => {
    setItemToDelete({ id: product._id, name: product.name });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await deleteProduct(itemToDelete.id);
      toast.success('Product deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = products.filter((p) => {
    const matchesSearch = (p?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.categoryId?._id === categoryFilter;
    return matchesSearch && matchesCategory;
  });


  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Products">
        <div className="ds-page">
          <div className="ds-loading">
            <div className="ds-spinner" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Products">
      <div className="ds-page">
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display:'flex', gap:'0.25rem', padding:'0.25rem', background:'var(--ds-border-soft)', borderRadius:'var(--ds-r-lg)', width:'fit-content', flexWrap: 'wrap' }}>
            {[
              { id: 'products', label: 'Products' },
              { id: 'suppliers', label: 'Suppliers' },
              { id: 'receiving', label: 'Stock Receiving' },
              { id: 'supplierReturns', label: 'Supplier Returns' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={
                  activeTab === t.id 
                    ? { background:'var(--ds-primary)', color:'#fff', borderRadius:'var(--ds-r-md)', padding:'0.4rem 1rem', fontSize:'var(--ds-text-xs)', fontWeight:600, border: 'none', cursor: 'pointer' } 
                    : { background:'transparent', color:'var(--ds-text-muted)', borderRadius:'var(--ds-r-md)', padding:'0.4rem 1rem', fontSize:'var(--ds-text-xs)', fontWeight:600, border: 'none', cursor: 'pointer' }
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'suppliers' && (
          <SuppliersPanel storeId={selectedStoreId !== 'all' ? selectedStoreId : ''} stores={stores} onStoreChange={(id) => setSelectedStoreId(id)} />
        )}
        {activeTab === 'receiving' && (
          <StockReceivingPanel
            storeId={selectedStoreId !== 'all' ? selectedStoreId : ''}
            products={products}
          />
        )}
        {activeTab === 'supplierReturns' && (
          <SupplierReturnsPanel
            storeId={selectedStoreId !== 'all' ? selectedStoreId : ''}
            products={products}
          />
        )}

        {activeTab === 'products' && (
          <>
            {error && <div style={{ color: 'var(--ds-text-md)', background: 'var(--ds-border-soft)', padding: '1rem', borderRadius: 'var(--ds-r-md)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={16}/> {error}</div>}
            
            <div className="ds-page-header">
              <div className="ds-page-header-left">
                <div className="ds-page-header-icon">
                  <Package size={20} strokeWidth={1.75} />
                </div>
                <div>
                  <h1 className="ds-page-title">Products Catalog</h1>
                  <p className="ds-page-subtitle">{products.length} registered items</p>
                </div>
              </div>
              <div className="ds-page-header-right">
                <button onClick={openCreate} className="ds-btn ds-btn-primary">
                  <Plus size={16} /> Add Product
                </button>
              </div>
            </div>

            <div className="ds-card" style={{ marginBottom: '1.5rem' }}>
              <div className="ds-filter-bar">
                <div className="ds-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px', alignItems: 'center' }}>
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`ds-btn ds-btn-sm ${categoryFilter === 'all' ? 'ds-btn-primary' : 'ds-btn-secondary'}`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => setCategoryFilter(cat._id)}
                      className={`ds-btn ds-btn-sm ${categoryFilter === cat._id ? 'ds-btn-primary' : 'ds-btn-secondary'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="ds-card">
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Store</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((product) => {
                      const isExpanded = expandedProduct === product._id;
                      return (
                        <React.Fragment key={product._id}>
                          <tr>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <button
                                  onClick={() => setExpandedProduct(isExpanded ? null : product._id)}
                                  className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm"
                                  title="Show price rows"
                                >
                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--ds-r-md)', background: 'var(--ds-border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                  {(product.productLink || product.images?.[0]) ? (
                                    <img 
                                      src={getImageUrl(product.productLink || product.images?.[0])} 
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      alt="" 
                                      onError={(e) => handleImageError(e, 'Product')}
                                    />
                                  ) : <Package size={18} style={{ color: 'var(--ds-text-muted)' }} />}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--ds-text-body)' }}>{product.name}</div>
                                  <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)' }}>{product.categoryId?.name || '-'}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="ds-badge ds-badge-slate">
                                {product.storeId?.name || '-'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600, color: 'var(--ds-text-body)' }}>
                                Rs. {Number(product.price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className={`ds-badge ${product.stock > 10 ? 'ds-badge-green' : product.stock > 0 ? 'ds-badge-amber' : 'ds-badge-red'}`}>
                                  {product.stock} in stock
                                </span>
                                {product.priceRows?.length > 0 && (
                                  <span className="ds-badge ds-badge-primary">
                                    {product.priceRows.length} rows
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`ds-badge ${product.status === 'active' ? 'ds-badge-green' : 'ds-badge-slate'}`}>
                                {product.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                <button onClick={() => openEdit(product)} className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm" title="View / Edit Details">
                                  <Edit2 size={15} />
                                </button>
                                <button onClick={() => handleDeleteClick(product)} className="ds-btn ds-btn-danger ds-btn-icon ds-btn-sm" title="Delete">
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Price Rows Expansion */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} style={{ padding: '1rem', background: 'var(--ds-border-soft)' }}>
                                <div className="ds-card">
                                  <div className="ds-card-header">
                                    <div className="ds-card-title" style={{ fontSize: 'var(--ds-text-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <Package size={14} /> Stock Price Rows — {product.name}
                                    </div>
                                  </div>
                                  {!product.priceRows || product.priceRows.length === 0 ? (
                                    <div className="ds-card-body" style={{ color: 'var(--ds-text-muted)', fontSize: 'var(--ds-text-sm)' }}>
                                      No price rows yet. Stock will be tracked by price row when received via GRN.
                                    </div>
                                  ) : (
                                    <div className="ds-table-wrap">
                                      <table className="ds-table">
                                        <thead>
                                          <tr>
                                            <th>#</th>
                                            <th>Cost Price</th>
                                            <th>Qty in Stock</th>
                                            <th>Last Received</th>
                                            <th>Total Value</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {product.priceRows.map((row, idx) => (
                                            <tr key={row._id || idx}>
                                              <td>{idx + 1}</td>
                                              <td style={{ fontWeight: 600 }}>Rs. {Number(row.costPrice).toFixed(2)}</td>
                                              <td>
                                                <span className={`ds-badge ${row.qty > 0 ? 'ds-badge-green' : 'ds-badge-red'}`}>{row.qty}</span>
                                              </td>
                                              <td style={{ color: 'var(--ds-text-muted)' }}>{row.receivedAt ? new Date(row.receivedAt).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'}) : '-'}</td>
                                              <td style={{ fontWeight: 600, color: 'var(--ds-primary)' }}>Rs. {(Number(row.costPrice) * Number(row.qty)).toFixed(2)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                        <tfoot>
                                          <tr>
                                            <td colSpan={2} style={{ fontWeight: 600, color: 'var(--ds-text-muted)' }}>Total Stock Value</td>
                                            <td style={{ fontWeight: 600 }}>{product.priceRows.reduce((s,r) => s + Number(r.qty||0), 0)}</td>
                                            <td />
                                            <td style={{ fontWeight: 600, color: 'var(--ds-primary)' }}>Rs. {product.priceRows.reduce((s,r) => s + Number(r.costPrice||0)*Number(r.qty||0), 0).toFixed(2)}</td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {showModal && (
              <div className="ds-modal-overlay" onClick={() => setShowModal(false)}>
                <div className="ds-modal ds-modal-xl" onClick={(e) => e.stopPropagation()}>
                  <div className="ds-modal-header">
                    <h2 className="ds-modal-title">{editingId ? 'Edit Product Details' : 'Add New Product'}</h2>
                    <button onClick={() => setShowModal(false)} className="ds-btn ds-btn-ghost ds-btn-icon"><X size={18} /></button>
                  </div>
                  <div className="ds-modal-body">
                    <form onSubmit={handleSubmit}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="ds-form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="ds-label">Product Name *</label>
                          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="ds-input" />
                        </div>
                        <div className="ds-form-group">
                          <label className="ds-label">Category *</label>
                          <input 
                            list="category-suggestions"
                            required 
                            value={categories.find(c => c._id === form.categoryId)?.name || form.categoryId} 
                            onChange={(e) => {
                              const val = e.target.value;
                              const existing = categories.find(c => c.name.toLowerCase() === val.toLowerCase());
                              setForm({ ...form, categoryId: existing ? existing._id : val });
                            }} 
                            placeholder="Type or select category"
                            className="ds-input" 
                          />
                          <datalist id="category-suggestions">
                            {categories.map((c) => <option key={c._id} value={c.name} />)}
                          </datalist>
                          <p style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)', marginTop: '0.25rem' }}>If the category doesn't exist, it will be created automatically.</p>
                        </div>

                        <div className="ds-form-group">
                          <label className="ds-label">Store *</label>
                          <input 
                            list="store-suggestions"
                            required
                            placeholder="Type or select Store"
                            value={stores.find(s => s._id === form.storeId)?.name || form.storeId || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const existing = stores.find(s => s.name.toLowerCase() === val.toLowerCase());
                              setForm({ ...form, storeId: existing ? existing._id : val });
                            }}
                            className="ds-input" 
                          />
                          <datalist id="store-suggestions">
                            {stores.map((s) => <option key={s._id} value={s.name} />)}
                          </datalist>
                        </div>
                        <div className="ds-form-group">
                          <label className="ds-label">Barcode / SKU</label>
                          <input type="text" placeholder="Scan or type barcode" value={form.barcode || ''} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="ds-input" />
                        </div>
                        <div className="ds-form-group">
                          <label className="ds-label">Price *</label>
                          <input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="ds-input" />
                        </div>
                        <div className="ds-form-group">
                          <label className="ds-label">MRP</label>
                          <input type="number" step="0.01" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} className="ds-input" />
                        </div>
                        <div className="ds-form-group">
                          <label className="ds-label">Minimum Price</label>
                          <input type="number" step="0.01" value={form.minPrice} onChange={(e) => setForm({ ...form, minPrice: e.target.value })} className="ds-input" placeholder="Minimum Selling Price" />
                        </div>
                        <div className="ds-form-group">
                          <label className="ds-label">Stock *</label>
                          <input type="number" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="ds-input" />
                        </div>
                        <div className="ds-form-group">
                          <label className="ds-label">Purchase Price</label>
                          <input type="number" min="0" step="0.01" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} className="ds-input" />
                        </div>
                        <div className="ds-form-group">
                          <label className="ds-label">Discount %</label>
                          <input type="number" min="0" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="ds-input" />
                        </div>
                        <div className="ds-form-group">
                          <label className="ds-label">Supplier</label>
                          <input 
                            list="supplier-suggestions"
                            placeholder="Search or select supplier"
                            value={form.supplierId === 'none' ? 'None' : (suppliers.find(s => s._id === form.supplierId)?.name || form.supplierId || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.toLowerCase() === 'none' || val === '') {
                                setForm({ ...form, supplierId: 'none' });
                              } else {
                                const existing = suppliers.find(s => s.name.toLowerCase() === val.toLowerCase());
                                setForm({ ...form, supplierId: existing ? existing._id : val });
                              }
                            }}
                            className="ds-input" 
                          />
                          <datalist id="supplier-suggestions">
                            <option value="None" />
                            {suppliers.map((s) => <option key={s._id} value={s.name}>{s.company}</option>)}
                          </datalist>
                        </div>
                        <div className="ds-form-group">
                          <label className="ds-label">Unit</label>
                          <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="ds-input">
                            {['kg', 'g', 'L', 'ml', 'pcs', 'pack', 'dozen', 'bunch'].map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                        <div className="ds-form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="ds-label">Description</label>
                          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="ds-input" style={{ resize: 'vertical' }} />
                        </div>
                        <div className="ds-form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="ds-label">Image URLs (comma separated)</label>
                          <input value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className="ds-input" />
                        </div>
                        <div className="ds-form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="ds-label">Product Image URL (External Link)</label>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                              <input 
                                value={form.productLink} 
                                onChange={(e) => {
                                  let val = e.target.value;
                                  const converted = convertExternalUrl(val);
                                  if (converted && converted !== val) {
                                    val = converted;
                                    toast.info('External link auto-converted to direct image URL');
                                  }
                                  setForm({ ...form, productLink: val });
                                }}
                                className="ds-input" 
                                placeholder="https://example.com/image.jpg" 
                              />
                              {form.productLink && !isDirectImageUrl(form.productLink) ? (
                                <div style={{ background: 'var(--ds-border-soft)', padding: '0.75rem', borderRadius: 'var(--ds-r-md)', marginTop: '0.5rem', fontSize: 'var(--ds-text-xs)' }}>
                                  <p style={{ fontWeight: 600, color: 'var(--ds-text-body)', marginBottom: '0.25rem' }}>Not a Direct Image Link</p>
                                  <p style={{ color: 'var(--ds-text-muted)' }}>This link leads to a web page, not an image file. To fix this:</p>
                                  <ul style={{ marginLeft: '1rem', marginTop: '0.25rem', color: 'var(--ds-text-muted)' }}>
                                    <li>For Unsplash/Websites: Right-click the image and select "Copy image address".</li>
                                    <li>For Google Drive: Share → Change to "Anyone with link" → Copy link.</li>
                                  </ul>
                                </div>
                              ) : (
                                <p style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)', marginTop: '0.25rem' }}>This will be the primary display image.</p>
                              )}
                            </div>
                            {form.productLink && (
                              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--ds-r-md)', overflow: 'hidden', background: 'var(--ds-border-soft)', flexShrink: 0 }}>
                                <img 
                                  src={getImageUrl(form.productLink)} 
                                  alt="Preview" 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => handleImageError(e, 'Product')}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ds-form-group" style={{ flexDirection: 'row', gap: '1.5rem', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--ds-text-sm)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                            Featured
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--ds-text-sm)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.isOnSale} onChange={(e) => setForm({ ...form, isOnSale: e.target.checked })} />
                            On Sale
                          </label>
                        </div>
                        <div className="ds-form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="ds-label">Koko Pay Availability</label>
                          <div style={{ display: 'flex', gap: '1.5rem', padding: '1rem', background: 'var(--ds-border-soft)', borderRadius: 'var(--ds-r-md)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--ds-text-sm)', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={form.allowKokoOnline}
                                onChange={(e) => setForm({ ...form, allowKokoOnline: e.target.checked })}
                              />
                              Allow Koko on Online Checkout
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--ds-text-sm)', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={form.allowKokoPos}
                                onChange={(e) => setForm({ ...form, allowKokoPos: e.target.checked })}
                              />
                              Allow Koko on POS
                            </label>
                          </div>
                        </div>
                        {editingId && (
                          <div className="ds-form-group">
                            <label className="ds-label">Status</label>
                            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="ds-input">
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="ds-modal-footer">
                        <button type="button" onClick={() => setShowModal(false)} className="ds-btn ds-btn-ghost">
                          Cancel
                        </button>
                        <button type="submit" disabled={saving} className="ds-btn ds-btn-primary">
                          {saving ? 'Saving...' : editingId ? 'Update Product' : 'Save Product'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.name}
      />
    </DashboardLayout>
  );
};

export default AdminProducts;
