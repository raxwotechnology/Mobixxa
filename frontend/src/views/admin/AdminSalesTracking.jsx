'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, ShoppingCart, DollarSign, Calendar, Download, BarChart3, Eye, FileText } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { adminNavGroups as navItems } from './adminNavItems';
import { getCashierSalesReport, getAdminOrders } from '../../services/api';
import { toast } from 'react-toastify';
import useAdminStoreStore from '../../store/adminStoreStore';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';

const AdminSalesTracking = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { selectedStoreId } = useAdminStoreStore();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Cashier Summary Modal States
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [cashierOrders, setCashierOrders] = useState([]);
  const [cashierOrdersLoading, setCashierOrdersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('detailed');

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        startDate,
        endDate,
        ...(selectedStoreId !== 'all' ? { storeId: selectedStoreId } : {})
      };
      const res = await getCashierSalesReport(params);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedStoreId]);

  const handleOpenSummary = async (cashierData) => {
    setSelectedCashier(cashierData);
    setShowSummaryModal(true);
    setCashierOrdersLoading(true);
    try {
      const params = {
        cashierId: cashierData.cashier._id,
        startDate,
        endDate,
        ...(selectedStoreId !== 'all' ? { storeId: selectedStoreId } : {})
      };
      const { data: orders } = await getAdminOrders(params);
      setCashierOrders(orders || []);
    } catch (err) {
      toast.error('Failed to load cashier sales details');
    } finally {
      setCashierOrdersLoading(false);
    }
  };

  const exportPDFReport = () => {
    if (!data?.cashiers?.length) return;
    const cols = [
      { label: 'Cashier Name', accessor: (r) => r.cashier.name },
      { label: 'Email', accessor: (r) => r.cashier.email },
      { label: 'Total Sales', accessor: (r) => `Rs. ${r.totalSales?.toLocaleString()}` },
      { label: 'Transactions', accessor: 'transactionCount' },
      { label: 'Items Sold', accessor: 'totalItems' },
      { label: 'Avg Transaction', accessor: (r) => `Rs. ${r.avgTransaction?.toLocaleString()}` },
      { label: 'Cash Sales', accessor: (r) => `Rs. ${r.cashSales?.toLocaleString()}` },
      { label: 'Card Sales', accessor: (r) => `Rs. ${r.cardSales?.toLocaleString()}` }
    ];
    exportToPDF(data.cashiers, cols, 'Cashier Sales Performance');
  };

  const maxSales = data?.cashiers?.length ? Math.max(...data.cashiers.map((c) => c.totalSales)) : 0;

  // Aggregate items from cashier orders for detailed summary
  const getAggregatedItems = () => {
    const itemsMap = new Map();
    cashierOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.productId || item.name;
        const existing = itemsMap.get(key);
        const imeis = item.imei || [];
        if (existing) {
          existing.quantity += item.quantity;
          existing.imeis = [...existing.imeis, ...imeis];
        } else {
          itemsMap.set(key, {
            name: item.name,
            quantity: item.quantity,
            imeis: [...imeis]
          });
        }
      });
    });
    return Array.from(itemsMap.values());
  };

  const aggregatedItems = getAggregatedItems();

  const getDetailedItemsList = () => {
    const list = [];
    cashierOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        list.push({
          date: order.createdAt,
          invoiceNumber: order.invoiceNumber || order.invoiceNo || order._id.toString().slice(-6).toUpperCase(),
          name: item.name,
          unitPrice: item.price || 0,
          quantity: item.quantity || 1,
          totalPrice: (item.price || 0) * (item.quantity || 1),
          imeis: item.imei || [],
          paymentMethod: order.paymentMethod || 'cash'
        });
      });
    });
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const detailedItems = getDetailedItemsList();

  return (
    <DashboardLayout navItems={navItems} title="Sales Tracking">
      <div className="ds-page">
        {/* Header Controls */}
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-badge">
              <span className="text-lg"></span>
            </div>
            <div>
              <h1 className="m-0">Sales Tracking</h1>
              <p className="m-0 mt-1 text-slate-500 text-sm">Cashier POS performance monitoring and detailed summaries</p>
            </div>
          </div>
          <div className="ds-page-header-right">
            <div className="flex flex-wrap gap-2.5 items-center">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="ds-input" />
              <span className="text-slate-400 text-xs font-bold">to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="ds-input" />
              
              <button onClick={exportPDFReport} className="ds-btn ds-btn-sm ds-btn-danger">
                <FileText size={13} /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {data?.totals && (
          <div className="ds-stats">
            {[
              { label: 'Total POS Sales', value: `Rs. ${data.totals.totalSales.toLocaleString()}`, icon: DollarSign },
              { label: 'Transactions', value: data.totals.totalTransactions, icon: ShoppingCart },
              { label: 'Items Sold', value: data.totals.totalItems, icon: BarChart3 },
              { label: 'Cashiers Logged', value: data.cashiers?.length || 0, icon: Users },
            ].map((c, i) => (
              <div key={i} className="ds-stat">
                <div className="flex items-center gap-3 mb-3">
                  <div className="ds-stat-icon">
                    <c.icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className="ds-stat-label">{c.label}</span>
                </div>
                <h2 className="ds-stat-value">{c.value}</h2>
              </div>
            ))}
          </div>
        )}

        {/* Visual Bar Chart */}
        {data?.cashiers?.length > 0 && (
          <div className="ds-card">
            <div className="ds-card-header">
              <h3 className="ds-card-title">Cashier Performance Comparison</h3>
            </div>
            <div className="ds-card-body">
              <div className="flex flex-col gap-4">
                {data.cashiers.map((c, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="min-w-[120px] text-xs font-bold text-slate-800 truncate">{c.cashier.name}</span>
                    <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200/50">
                      <div className="h-full bg-gradient-to-r from-brand-indigo to-brand-fuchsia rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                        style={{ width: `${maxSales > 0 ? (c.totalSales / maxSales * 100) : 0}%` }}>
                        {c.totalSales / maxSales > 0.3 && <span className="text-xs font-bold text-white">Rs. {c.totalSales.toLocaleString()}</span>}
                      </div>
                    </div>
                    {c.totalSales / maxSales <= 0.3 && <span className="text-xs font-bold text-brand-fuchsia">Rs. {c.totalSales.toLocaleString()}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detail Table */}
        <div className="ds-table-wrap">
          <table className="ds-table">
            <thead>
              <tr>
                {['#', 'Cashier', 'Total Sales', 'Transactions', 'Items', 'Avg Trans.', 'Cash', 'Card', 'Last Sale', 'Actions'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10}>
                    <div className="ds-loading"><div className="ds-spinner"></div></div>
                  </td>
                </tr>
              ) : !data?.cashiers?.length ? (
                <tr>
                  <td colSpan={10}>
                    <div className="ds-empty">
                      <p className="ds-empty-title">No POS sales data for this period</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.cashiers.map((c, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      <div>
                        <p className="font-bold text-slate-900 m-0 leading-tight">{c.cashier.name}</p>
                        <p className="text-xs font-bold text-slate-400 m-0 mt-1">{c.cashier.email}</p>
                      </div>
                    </td>
                    <td className="font-bold text-brand-fuchsia">Rs. {c.totalSales.toLocaleString()}</td>
                    <td className="font-bold">{c.transactionCount}</td>
                    <td className="font-bold">{c.totalItems}</td>
                    <td className="font-bold">Rs. {c.avgTransaction.toLocaleString()}</td>
                    <td className="text-emerald-600 font-bold">Rs. {c.cashSales.toLocaleString()}</td>
                    <td className="text-brand-indigo font-bold">Rs. {c.cardSales.toLocaleString()}</td>
                    <td className="text-xs">{c.lastSale ? new Date(c.lastSale).toLocaleDateString() : '—'}</td>
                    
                    <td>
                      <button
                        onClick={() => handleOpenSummary(c)}
                        className="ds-btn ds-btn-sm ds-btn-primary"
                      >
                        <Eye size={12} /> Summary
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detailed Summary Modal */}
        {showSummaryModal && selectedCashier && (
          <div className="ds-modal-overlay">
            <div className="ds-modal ds-modal-lg">
              <div className="ds-modal-header">
                <div>
                  <h3 className="ds-modal-title"> Cashier Sales Summary - {selectedCashier.cashier.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Date Range: {startDate} to {endDate}</p>
                </div>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="ds-btn ds-btn-icon ds-btn-ghost"
                >
                  X
                </button>
              </div>

              <div className="ds-modal-body">
                {cashierOrdersLoading ? (
                  <div className="ds-loading"><div className="ds-spinner"></div></div>
                ) : (activeTab === 'detailed' ? detailedItems.length === 0 : aggregatedItems.length === 0) ? (
                  <div className="ds-empty">
                    <p className="ds-empty-title">No items sold by this cashier in the selected period.</p>
                  </div>
                ) : (
                  <div>
                    <div className="ds-stats mb-4">
                      <div className="ds-stat">
                        <span className="ds-stat-label">Transactions Handled</span>
                        <span className="ds-stat-value">{selectedCashier.transactionCount}</span>
                      </div>
                      <div className="ds-stat">
                        <span className="ds-stat-label">Total Amount Collected</span>
                        <span className="ds-stat-value text-emerald-600">Rs. {selectedCashier.totalSales.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex border-b border-slate-200 mb-4 gap-2">
                      <button
                        onClick={() => setActiveTab('detailed')}
                        className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 ${activeTab === 'detailed' ? 'border-brand-indigo text-brand-indigo font-bold' : 'border-transparent text-slate-400'}`}
                      >
                        Detailed Sales Ledger
                      </button>
                      <button
                        onClick={() => setActiveTab('aggregated')}
                        className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 ${activeTab === 'aggregated' ? 'border-brand-indigo text-brand-indigo font-bold' : 'border-transparent text-slate-400'}`}
                      >
                        Aggregated Product Summary
                      </button>
                    </div>

                    {activeTab === 'detailed' ? (
                      <div>
                        <p className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wide">Detailed Ledger (Line Items)</p>
                        <div className="ds-table-wrap">
                          <table className="ds-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Invoice No</th>
                                <th>Product Name</th>
                                <th className="text-right">Unit Price</th>
                                <th className="text-center">Qty</th>
                                <th className="text-right">Total</th>
                                <th>IMEIs</th>
                                <th>Payment</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailedItems.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="text-slate-500 whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                                  <td className="font-semibold text-brand-indigo">{item.invoiceNumber}</td>
                                  <td className="font-semibold text-slate-900">{item.name}</td>
                                  <td className="text-right font-medium">Rs. {item.unitPrice.toLocaleString()}</td>
                                  <td className="text-center font-bold text-slate-800">{item.quantity}</td>
                                  <td className="text-right font-bold text-emerald-600">Rs. {item.totalPrice.toLocaleString()}</td>
                                  <td className="font-mono text-xs text-slate-500 max-w-[120px] truncate" title={item.imeis.join(', ')}>
                                    {item.imeis.length > 0 ? item.imeis.join(', ') : '—'}
                                  </td>
                                  <td className="uppercase font-bold text-xs">{item.paymentMethod}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wide">Product Quantities Sold</p>
                        <div className="ds-table-wrap">
                          <table className="ds-table">
                            <thead>
                              <tr>
                                <th>Product Name</th>
                                <th className="text-center">Qty Sold</th>
                                <th>Category</th>
                                <th>IMEIs / Serial Numbers</th>
                              </tr>
                            </thead>
                            <tbody>
                              {aggregatedItems.map((item, idx) => {
                                const isMobile = item.imeis.length > 0;
                                return (
                                  <tr key={idx}>
                                    <td className="font-semibold text-slate-900">{item.name}</td>
                                    <td className="text-center font-bold text-brand-indigo">{item.quantity}</td>
                                    <td>
                                      <span className={`ds-badge ${isMobile ? 'ds-badge-blue' : 'ds-badge-amber'}`}>
                                        {isMobile ? 'Mobiles' : 'Accessories'}
                                      </span>
                                    </td>
                                    <td className="font-mono text-xs text-slate-500">
                                      {item.imeis.length > 0 ? item.imeis.join(', ') : '—'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="ds-modal-footer">
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="ds-btn ds-btn-secondary"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (activeTab === 'detailed') {
                      const detailCols = [
                        { label: 'Date', accessor: (r) => new Date(r.date).toLocaleDateString() },
                        { label: 'Invoice', accessor: 'invoiceNumber' },
                        { label: 'Product Name', accessor: 'name' },
                        { label: 'Unit Price', accessor: (r) => `Rs. ${r.unitPrice.toLocaleString()}` },
                        { label: 'Qty', accessor: 'quantity' },
                        { label: 'Total', accessor: (r) => `Rs. ${r.totalPrice.toLocaleString()}` },
                        { label: 'IMEIs', accessor: (r) => r.imeis.join(', ') || '—' },
                        { label: 'Payment', accessor: 'paymentMethod' }
                      ];
                      exportToPDF(detailedItems, detailCols, `${selectedCashier.cashier.name}_Detailed_Sales_Ledger`);
                    } else {
                      const summaryCols = [
                        { label: 'Product Name', accessor: 'name' },
                        { label: 'Qty Sold', accessor: 'quantity' },
                        { label: 'IMEIs', accessor: (r) => r.imeis.join(', ') || '—' }
                      ];
                      exportToPDF(aggregatedItems, summaryCols, `${selectedCashier.cashier.name}_Sales_Summary`);
                    }
                  }}
                  className="ds-btn ds-btn-danger"
                  disabled={cashierOrdersLoading || (activeTab === 'detailed' ? detailedItems.length === 0 : aggregatedItems.length === 0)}
                >
                  <FileText size={12} /> Export PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminSalesTracking;
