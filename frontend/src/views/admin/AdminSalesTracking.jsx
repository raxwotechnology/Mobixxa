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
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-indigo/10 to-brand-fuchsia/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2 m-0">
              <div className="w-8 h-8 rounded-xl bg-brand-fuchsia/10 flex items-center justify-center text-brand-fuchsia">
                <span className="text-lg">📊</span>
              </div>
              Cashier Sales Tracking
            </h1>
            <p className="text-sm font-normal text-slate-500 mt-1 m-0">Cashier POS performance monitoring and detailed summaries</p>
          </div>
          <div className="flex flex-wrap gap-2.5 items-center z-10">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo/15 text-slate-700 font-bold" />
            <span className="text-slate-400 text-xs font-bold">to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl py-2 px-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo/15 text-slate-700 font-bold" />
            
            <button onClick={exportPDFReport} className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/10 cursor-pointer">
              <FileText size={13} /> PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {data?.totals && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total POS Sales', value: `Rs. ${data.totals.totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-brand-fuchsia', bg: 'bg-teal-50 border border-teal-100/60' },
              { label: 'Transactions', value: data.totals.totalTransactions, icon: ShoppingCart, color: 'text-brand-indigo', bg: 'bg-slate-50 border border-slate-200/60' },
              { label: 'Items Sold', value: data.totals.totalItems, icon: BarChart3, color: 'text-brand-fuchsia', bg: 'bg-teal-50 border border-teal-100/60' },
              { label: 'Cashiers Logged', value: data.cashiers?.length || 0, icon: Users, color: 'text-brand-indigo', bg: 'bg-slate-50 border border-slate-200/60' },
            ].map((c, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 flex flex-col justify-between group relative overflow-hidden">
                <div className="flex items-center gap-3 mb-3 relative">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.color}`}>
                    <c.icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{c.label}</span>
                </div>
                <p className="text-xl font-black text-slate-900 m-0">{c.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Visual Bar Chart */}
        {data?.cashiers?.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 m-0">Cashier Performance Comparison</h3>
            <div className="flex flex-col gap-4">
              {data.cashiers.map((c, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="min-w-[120px] text-xs font-bold text-slate-800 truncate">{c.cashier.name}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200/50">
                    <div className="h-full bg-gradient-to-r from-brand-indigo to-brand-fuchsia rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                      style={{ width: `${maxSales > 0 ? (c.totalSales / maxSales * 100) : 0}%` }}>
                      {c.totalSales / maxSales > 0.3 && <span className="text-[10px] font-black text-white">Rs. {c.totalSales.toLocaleString()}</span>}
                    </div>
                  </div>
                  {c.totalSales / maxSales <= 0.3 && <span className="text-xs font-black text-brand-fuchsia">Rs. {c.totalSales.toLocaleString()}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detail Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">Loading...</div>
          ) : !data?.cashiers?.length ? (
            <div className="p-12 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">No POS sales data for this period</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200/80">
                  <tr>
                    {['#', 'Cashier', 'Total Sales', 'Transactions', 'Items', 'Avg Trans.', 'Cash', 'Card', 'Last Sale', 'Actions'].map((h) => (
                      <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.cashiers.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-400">{i + 1}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-extrabold text-slate-900 m-0 leading-tight">{c.cashier.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 m-0 mt-1">{c.cashier.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-brand-fuchsia">Rs. {c.totalSales.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-700 font-bold">{c.transactionCount}</td>
                      <td className="px-6 py-4 text-slate-700 font-bold">{c.totalItems}</td>
                      <td className="px-6 py-4 text-slate-500 font-bold">Rs. {c.avgTransaction.toLocaleString()}</td>
                      <td className="px-6 py-4 text-emerald-600 font-bold">Rs. {c.cashSales.toLocaleString()}</td>
                      <td className="px-6 py-4 text-brand-indigo font-bold">Rs. {c.cardSales.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-500 font-bold text-xs">{c.lastSale ? new Date(c.lastSale).toLocaleDateString() : '—'}</td>
                      
                      {/* View Summary button */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleOpenSummary(c)}
                          className="flex items-center gap-1.5 bg-brand-indigo/10 text-brand-indigo hover:bg-brand-indigo/15 text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          <Eye size={12} /> Summary
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detailed Summary Modal */}
        {showSummaryModal && selectedCashier && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-card-border shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b border-card-border flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="font-bold text-dark-navy text-sm">📋 Cashier Sales Summary - {selectedCashier.cashier.name}</h3>
                  <p className="text-[10px] text-muted-text mt-0.5">Date Range: {startDate} to {endDate}</p>
                </div>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="text-muted-text hover:text-dark-navy font-bold text-base"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {cashierOrdersLoading ? (
                  <div className="py-12 text-center text-muted-text">Loading detailed sales summary...</div>
                ) : (activeTab === 'detailed' ? detailedItems.length === 0 : aggregatedItems.length === 0) ? (
                  <div className="py-12 text-center text-muted-text">No items sold by this cashier in the selected period.</div>
                ) : (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div className="border border-card-border rounded-xl p-3 bg-gray-50">
                        <span className="text-[10px] text-muted-text uppercase font-bold block">Transactions Handled</span>
                        <span className="text-lg font-bold text-dark-navy">{selectedCashier.transactionCount}</span>
                      </div>
                      <div className="border border-card-border rounded-xl p-3 bg-gray-50">
                        <span className="text-[10px] text-muted-text uppercase font-bold block">Total Amount Collected</span>
                        <span className="text-lg font-bold text-emerald-600">Rs. {selectedCashier.totalSales.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex border-b border-gray-150 mb-4 gap-2">
                      <button
                        onClick={() => setActiveTab('detailed')}
                        className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 ${activeTab === 'detailed' ? 'border-blue-500 text-blue-600 font-extrabold' : 'border-transparent text-gray-400'}`}
                      >
                        Detailed Sales Ledger
                      </button>
                      <button
                        onClick={() => setActiveTab('aggregated')}
                        className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 ${activeTab === 'aggregated' ? 'border-blue-500 text-blue-600 font-extrabold' : 'border-transparent text-gray-400'}`}
                      >
                        Aggregated Product Summary
                      </button>
                    </div>

                    {activeTab === 'detailed' ? (
                      <div>
                        <p className="text-[10px] font-bold text-dark-navy mb-2 uppercase tracking-wide">Detailed Ledger (Line Items)</p>
                        <div className="border border-card-border rounded-xl overflow-hidden overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b border-card-border text-left text-[10px] uppercase font-bold text-muted-text">
                                <th className="p-3">Date</th>
                                <th className="p-3">Invoice No</th>
                                <th className="p-3">Product Name</th>
                                <th className="p-3 text-right">Unit Price</th>
                                <th className="p-3 text-center">Qty</th>
                                <th className="p-3 text-right">Total</th>
                                <th className="p-3">IMEIs</th>
                                <th className="p-3">Payment</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {detailedItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50">
                                  <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                                  <td className="p-3 font-semibold text-blue-600">{item.invoiceNumber}</td>
                                  <td className="p-3 font-semibold text-dark-navy">{item.name}</td>
                                  <td className="p-3 text-right font-medium">Rs. {item.unitPrice.toLocaleString()}</td>
                                  <td className="p-3 text-center font-bold text-gray-800">{item.quantity}</td>
                                  <td className="p-3 text-right font-bold text-emerald-600">Rs. {item.totalPrice.toLocaleString()}</td>
                                  <td className="p-3 font-mono text-[10px] text-gray-500 max-w-[120px] truncate" title={item.imeis.join(', ')}>
                                    {item.imeis.length > 0 ? item.imeis.join(', ') : '—'}
                                  </td>
                                  <td className="p-3 uppercase font-bold text-[10px] text-purple-600">{item.paymentMethod}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] font-bold text-dark-navy mb-2 uppercase tracking-wide">Product Quantities Sold</p>
                        <div className="border border-card-border rounded-xl overflow-hidden overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b border-card-border text-left text-[10px] uppercase font-bold text-muted-text">
                                <th className="p-3">Product Name</th>
                                <th className="p-3 text-center">Qty Sold</th>
                                <th className="p-3">Category</th>
                                <th className="p-3">IMEIs / Serial Numbers</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {aggregatedItems.map((item, idx) => {
                                const isMobile = item.imeis.length > 0;
                                return (
                                  <tr key={idx} className="hover:bg-gray-50/50">
                                    <td className="p-3 font-semibold text-dark-navy">{item.name}</td>
                                    <td className="p-3 text-center font-bold text-primary-blue">{item.quantity}</td>
                                    <td className="p-3">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${isMobile ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {isMobile ? 'Mobiles' : 'Accessories'}
                                      </span>
                                    </td>
                                    <td className="p-3 font-mono text-[10px] text-muted-text">
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

              <div className="px-6 py-4 border-t border-card-border bg-gray-50 flex justify-end gap-2">
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
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1"
                  disabled={cashierOrdersLoading || (activeTab === 'detailed' ? detailedItems.length === 0 : aggregatedItems.length === 0)}
                >
                  <FileText size={12} /> Export PDF
                </button>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="bg-white border border-card-border hover:bg-gray-100 text-muted-text font-semibold text-xs px-4 py-2 rounded-xl"
                >
                  Close
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
