'use client';

import { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, FileText, DollarSign, FileSpreadsheet } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { getEmployeeNavGroups } from './employeeNav';
import API, { exportSalaryHistory } from '../../services/api';
import { toast } from 'react-toastify';
import EmployeePageHeader, { EmployeeLoading } from './EmployeePageHeader';

const EmployeeSalary = () => {
  const { user } = useAuthStore();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const downloadSalaryReport = async (format) => {
    try {
      const { data } = await exportSalaryHistory('me', { format });
      const blob = new Blob([data], {
        type: format === 'pdf'
          ? 'application/pdf'
          : format === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `salary-report.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Salary report exported (${format.toUpperCase()})`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to export salary report');
    }
  };

  useEffect(() => {
    const fetchSalary = async () => {
      try {
        const { data } = await API.get('/payroll/history/me');
        setHistory(data);
        if (data.length > 0) setSelectedRecord(data[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSalary();
  }, []);

  const basicSalary = user?.employeeInfo?.salary || 0;
  const epfEmployee = Math.round(basicSalary * 0.08);
  const epfEmployer = Math.round(basicSalary * 0.12);
  const etfEmployer = Math.round(basicSalary * 0.03);

  if (loading) {
    return (
      <DashboardLayout navItems={getEmployeeNavGroups(user?.role)} title="Employee Portal">
        <div className="ds-loading"><div className="ds-spinner"/></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={getEmployeeNavGroups(user?.role)} title="Employee Portal">
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-badge"><CreditCard size={24} /></div>
            <div>
              <h1>Salary & EPF/ETF</h1>
              <p>View pay logs, contributions, and payslips</p>
            </div>
          </div>
          <div className="ds-page-header-right">
            <button
              onClick={() => downloadSalaryReport('pdf')}
              className="ds-btn ds-btn-secondary"
            >
              <FileText size={14} /> PDF
            </button>
            <button
              onClick={() => downloadSalaryReport('xlsx')}
              className="ds-btn ds-btn-secondary"
            >
              <FileSpreadsheet size={14} /> Excel
            </button>
          </div>
        </div>

        {/* Salary Overview Card matching reference layout */}
        <div className="ds-stats">
          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                <DollarSign size={18} />
              </div>
              <span className="ds-stat-change blue">Contract</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">Basic Monthly Salary</p>
              <p className="ds-stat-value">Rs. {basicSalary.toLocaleString()}</p>
            </div>
          </div>

          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>
                <TrendingUp size={18} />
              </div>
              <span className="ds-stat-change up">Take-Home</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">Net Take-Home</p>
              <p className="ds-stat-value text-emerald-600">Rs. {(basicSalary - epfEmployee).toLocaleString()}</p>
            </div>
          </div>

          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <FileText size={18} />
              </div>
              <span className="ds-stat-change neu">Statutory</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">Total EPF (8% + 12%)</p>
              <p className="ds-stat-value">Rs. {(epfEmployee + epfEmployer).toLocaleString()}</p>
            </div>
          </div>

          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#fffbeb', color: '#b45309' }}>
                <CreditCard size={18} />
              </div>
              <span className="ds-stat-change amber">Employer</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">ETF (Employer 3%)</p>
              <p className="ds-stat-value text-amber-600">Rs. {etfEmployer.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* EPF/ETF Numbers */}
        <div className="ds-card">
          <div className="ds-card-header">
            <h3 className="ds-card-title"><FileText size={16} /> EPF/ETF Numbers</h3>
          </div>
          <div className="ds-card-body">
            <div className="ds-stats">
              <div className="ds-stat">
                <div className="ds-stat-label">EPF Number</div>
                <div className="ds-stat-value">{user?.employeeInfo?.epfNo || 'Not assigned'}</div>
              </div>
              <div className="ds-stat">
                <div className="ds-stat-label">ETF Number</div>
                <div className="ds-stat-value">{user?.employeeInfo?.etfNo || 'Not assigned'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="ds-card">
          <div className="ds-card-header">
            <h3 className="ds-card-title"><TrendingUp size={16} /> Payment History</h3>
          </div>
          <div className="ds-card-body p-0">
            {history.length === 0 ? (
              <div className="ds-empty">No salary records yet</div>
            ) : (
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th style={{textAlign: 'right'}}>Basic</th>
                      <th style={{textAlign: 'right'}}>EPF (You)</th>
                      <th style={{textAlign: 'right'}}>EPF (Employer)</th>
                      <th style={{textAlign: 'right'}}>ETF</th>
                      <th style={{textAlign: 'right'}}>Net Salary</th>
                      <th style={{textAlign: 'center'}}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => (
                      <tr key={record._id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedRecord(record)}>
                        <td>
                          {new Date(0, record.month - 1).toLocaleString('en', { month: 'short' })} {record.year}
                        </td>
                        <td style={{textAlign: 'right'}}>Rs. {record.basicSalary?.toLocaleString()}</td>
                        <td style={{textAlign: 'right', color: 'var(--ds-badge-red, #ef4444)'}}>-{record.epfEmployee?.toLocaleString()}</td>
                        <td style={{textAlign: 'right', color: 'var(--ds-badge-green, #10b981)'}}>+{record.epfEmployer?.toLocaleString()}</td>
                        <td style={{textAlign: 'right', color: 'var(--ds-badge-blue, #3b82f6)'}}>+{record.etfEmployer?.toLocaleString()}</td>
                        <td style={{textAlign: 'right', fontWeight: 'bold'}}>Rs. {record.netSalary?.toLocaleString()}</td>
                        <td style={{textAlign: 'center'}}>
                          <span className={`ds-badge ${record.status === 'paid' ? 'ds-badge-green' : 'ds-badge-amber'}`}>
                            {record.status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Selected Record Detail */}
        {selectedRecord && (
          <div className="ds-card">
            <div className="ds-card-header">
              <h3 className="ds-card-title">
                Payslip: {new Date(0, selectedRecord.month - 1).toLocaleString('en', { month: 'long' })} {selectedRecord.year}
              </h3>
            </div>
            <div className="ds-card-body">
              <div className="ds-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                <div className="ds-stat">
                  <div className="ds-stat-label">Basic</div>
                  <div className="ds-stat-value" style={{ fontSize: 'var(--ds-text-md)' }}>Rs. {selectedRecord.basicSalary?.toLocaleString()}</div>
                </div>
                <div className="ds-stat">
                  <div className="ds-stat-label">Allowances</div>
                  <div className="ds-stat-value" style={{ fontSize: 'var(--ds-text-md)' }}>Rs. {(selectedRecord.allowances || 0).toLocaleString()}</div>
                </div>
                <div className="ds-stat">
                  <div className="ds-stat-label">Bonuses</div>
                  <div className="ds-stat-value" style={{ fontSize: 'var(--ds-text-md)' }}>Rs. {(selectedRecord.bonuses || 0).toLocaleString()}</div>
                </div>
                <div className="ds-stat">
                  <div className="ds-stat-label">Gross</div>
                  <div className="ds-stat-value" style={{ fontSize: 'var(--ds-text-md)' }}>Rs. {selectedRecord.grossSalary?.toLocaleString()}</div>
                </div>
                <div className="ds-stat">
                  <div className="ds-stat-label" style={{ color: 'var(--ds-badge-red, #ef4444)' }}>EPF Deduction (8%)</div>
                  <div className="ds-stat-value" style={{ color: 'var(--ds-badge-red, #ef4444)', fontSize: 'var(--ds-text-md)' }}>- Rs. {selectedRecord.epfEmployee?.toLocaleString()}</div>
                </div>
                <div className="ds-stat">
                  <div className="ds-stat-label" style={{ color: 'var(--ds-badge-green, #10b981)' }}>EPF Employer (12%)</div>
                  <div className="ds-stat-value" style={{ color: 'var(--ds-badge-green, #10b981)', fontSize: 'var(--ds-text-md)' }}>+ Rs. {selectedRecord.epfEmployer?.toLocaleString()}</div>
                </div>
                <div className="ds-stat">
                  <div className="ds-stat-label" style={{ color: 'var(--ds-badge-blue, #3b82f6)' }}>ETF Employer (3%)</div>
                  <div className="ds-stat-value" style={{ color: 'var(--ds-badge-blue, #3b82f6)', fontSize: 'var(--ds-text-md)' }}>+ Rs. {selectedRecord.etfEmployer?.toLocaleString()}</div>
                </div>
                <div className="ds-stat" style={{ background: 'var(--ds-border-soft)' }}>
                  <div className="ds-stat-label">Net Salary</div>
                  <div className="ds-stat-value" style={{ fontSize: 'var(--ds-text-md)' }}>Rs. {selectedRecord.netSalary?.toLocaleString()}</div>
                </div>
              </div>
              {selectedRecord.paidAt && (
                <p style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)', marginTop: '1rem', fontWeight: 600, margin: '1rem 0 0 0' }}>
                  Paid on: {new Date(selectedRecord.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeeSalary;
