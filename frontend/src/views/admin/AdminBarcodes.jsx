'use client';

import { useState, useEffect } from 'react';
import { Barcode, Search, Download, Calendar, Filter, Clock, User, Package, Eye, X, Printer } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import DashboardLayout from '../../components/DashboardLayout';
import { getBarcodeLogs } from '../../services/api';
import { toast } from 'react-toastify';
import { adminNavGroups as navItems } from './adminNavItems';

const AdminBarcodes = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewingLog, setViewingLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [page, roleFilter, startDate, endDate]);

  const fetchLogs = async (searchVal) => {
    try {
      setLoading(true);
      const params = { page, limit: 30 };
      if (searchVal || search) params.search = searchVal || search;
      if (roleFilter) params.role = roleFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await getBarcodeLogs(params);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load barcode logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchLogs(search);
  };

  const exportCSV = () => {
    if (logs.length === 0) return;
    const rows = [
      ['Date', 'Time', 'User', 'Role', 'Product', 'SKU', 'Barcode', 'Quantity', 'Printer'].join(','),
      ...logs.map(l => [
        new Date(l.createdAt).toLocaleDateString(),
        new Date(l.createdAt).toLocaleTimeString(),
        l.generatedByName,
        l.generatedByRole,
        `"${l.productName}"`,
        l.sku || 'N/A',
        l.barcode,
        l.quantity,
        `"${l.printerName || 'Default'}"`,
      ].join(','))
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `barcode_activity_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    cashier: 'bg-amber-100 text-amber-700',
  };

  return (
    <DashboardLayout navItems={navItems} title="Mobixa Admin Panel">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-dark-navy flex items-center gap-2">
              <Barcode size={24} /> Barcode Activity Log
            </h1>
            <p className="text-muted-text text-sm mt-1">Track all barcode generation activity ({total} total records)</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              disabled={logs.length === 0}
              className="flex items-center gap-2 bg-dark-navy hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50 cursor-pointer border-0"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-card-border p-4 shadow-sm mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="text-xs font-medium text-muted-text block mb-1">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Product, user, SKU, barcode..."
                  className="w-full border border-card-border rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-text block mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                className="border border-card-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-text block mb-1">From</label>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setPage(1); }}
                className="border border-card-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-text block mb-1">To</label>
              <input
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setPage(1); }}
                className="border border-card-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer border-0"
            >
              <Filter size={14} />
            </button>
          </div>
        </div>

        {/* Log Table */}
        <div className="bg-white rounded-2xl border border-card-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-text">
              <Barcode size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No barcode activity found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium text-muted-text">
                      <div className="flex items-center gap-1"><Clock size={13} /> Date & Time</div>
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-muted-text">
                      <div className="flex items-center gap-1"><User size={13} /> Generated By</div>
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-muted-text">Role</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-text">
                      <div className="flex items-center gap-1"><Package size={13} /> Product</div>
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-muted-text">SKU</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-text">Barcode</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-text">Printer</th>
                    <th className="text-center px-5 py-3 font-medium text-muted-text">Qty</th>
                    <th className="text-center px-5 py-3 font-medium text-muted-text">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {logs.map(log => (
                    <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="text-dark-navy font-semibold">{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-text">{new Date(log.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-dark-navy">{log.generatedByName}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleColors[log.generatedByRole] || 'bg-gray-100 text-gray-600'}`}>
                          {log.generatedByRole}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-dark-navy font-bold max-w-48 truncate">{log.productName}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-muted-text">{log.sku || '—'}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-800 font-bold">{log.barcode}</td>
                      <td className="px-5 py-3.5 text-xs text-muted-text font-medium">{log.printerName || 'Default'}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="bg-blue-100 text-blue-700 text-xs font-black px-2.5 py-1 rounded-full">
                          {log.quantity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setViewingLog(log)}
                          className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white text-xs font-black px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer border-0"
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-card-border bg-gray-50">
              <p className="text-xs text-muted-text">
                Page {page} of {totalPages} ({total} records)
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-card-border rounded-lg disabled:opacity-50 hover:bg-gray-50 cursor-pointer"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-card-border rounded-lg disabled:opacity-50 hover:bg-gray-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barcode View Detail Modal */}
      {viewingLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 relative text-center">
            <button
              onClick={() => setViewingLog(null)}
              className="no-print absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>

            {/* id="pos-receipt-content" — same convention as InvoiceModal/
                ManagerRepairs/AdminOrders; index.css/globals.css hide the
                rest of the page and pin this via position:fixed for print. */}
            <div id="pos-receipt-content">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Barcode size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900 m-0">Barcode Details</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Generated by {viewingLog.generatedByName} ({viewingLog.generatedByRole})
              </p>

              <div className="my-5 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center">
                <p className="text-xs font-black text-slate-900 uppercase tracking-wide mb-1">Mobixa</p>
                <p className="text-sm font-bold text-slate-800 line-clamp-1 max-w-[240px] text-center mb-1">
                  {viewingLog.productName}
                </p>

                {/* Barcode SVG container */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 my-2 shadow-xs">
                  <svg
                    ref={(el) => {
                      if (el && viewingLog.barcode) {
                        try {
                          JsBarcode(el, viewingLog.barcode, {
                            format: 'CODE128',
                            width: 1.6,
                            height: 45,
                            displayValue: true,
                            fontSize: 11,
                            margin: 2
                          });
                        } catch (e) {}
                      }
                    }}
                  />
                </div>

                <div className="w-full grid grid-cols-2 gap-2 text-left bg-white p-3 rounded-xl border border-slate-200/60 mt-2 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">SKU</span>
                    <span className="font-mono font-bold text-slate-800">{viewingLog.sku || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Quantity</span>
                    <span className="font-bold text-blue-600">{viewingLog.quantity} Labels</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Printer</span>
                    <span className="font-semibold text-slate-700">{viewingLog.printerName || 'Default'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Date</span>
                    <span className="font-semibold text-slate-700">{new Date(viewingLog.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="no-print flex gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer border-0"
              >
                <Printer size={15} /> Print Sticker
              </button>
              <button
                onClick={() => setViewingLog(null)}
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminBarcodes;
