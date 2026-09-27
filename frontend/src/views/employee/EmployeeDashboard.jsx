'use client';

import { useState, useEffect } from 'react';
import { Link } from '../../utils/navigation';
import { 
  Clock, Calendar, CheckCircle, AlertCircle, TrendingUp, Coffee, Target, Award, 
  User, Zap, Package, ShoppingBag, Barcode, ArrowRight, RotateCcw, Monitor, 
  Smartphone, DollarSign, CreditCard, FileText, Landmark, Wrench, Truck, Timer 
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { getEmployeeNavGroups } from './employeeNav';
import API from '../../services/api';
import { getActiveBreak, startBreak, endBreak, getMyTargets } from '../../services/api';
import { toast } from 'react-toastify';
import { getImageUrl } from '../../utils/imageHelper';

const EmployeeDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ attendanceCount: 0, leaveBalance: 14, lastSalary: null, todayCheckedIn: false });
  const [loading, setLoading] = useState(true);
  const [onBreak, setOnBreak] = useState(false);
  const [breakData, setBreakData] = useState(null);
  const [targets, setTargets] = useState([]);
  const [breakTimer, setBreakTimer] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        const [attendanceRes, leavesRes, salaryRes, breakRes, targetsRes] = await Promise.allSettled([
          API.get('/hr/attendance', { params: { month: now.getMonth() + 1, year: now.getFullYear() } }),
          API.get('/hr/leaves'),
          API.get(`/payroll/history/me`),
          getActiveBreak(),
          getMyTargets(),
        ]);

        const attendance = attendanceRes.status === 'fulfilled' ? attendanceRes.value.data : [];
        const leaves = leavesRes.status === 'fulfilled' ? leavesRes.value.data : [];
        const salary = salaryRes.status === 'fulfilled' ? salaryRes.value.data : [];
        const activeBreak = breakRes.status === 'fulfilled' ? breakRes.value.data : null;
        const myTargets = targetsRes.status === 'fulfilled' ? targetsRes.value.data : [];

        const today = new Date().toDateString();
        const todayRecord = attendance.find(a => new Date(a.date).toDateString() === today);
        const approvedLeaves = leaves.filter(l => l.status === 'approved');
        const usedDays = approvedLeaves.reduce((sum, l) => sum + (l.totalDays || 0), 0);

        setStats({
          attendanceCount: attendance.length,
          leaveBalance: Math.max(0, 14 - usedDays),
          usedLeaves: usedDays,
          pendingLeaves: leaves.filter(l => l.status === 'pending').length,
          lastSalary: salary.length > 0 ? salary[0] : null,
          todayCheckedIn: !!todayRecord,
          todayCheckedOut: !!(todayRecord?.checkOut),
        });

        if (activeBreak) {
          setOnBreak(true);
          setBreakData(activeBreak);
        }
        setTargets(myTargets);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Break timer
  useEffect(() => {
    let interval;
    if (onBreak && breakData?.breakStart) {
      interval = setInterval(() => {
        const elapsed = Math.round((Date.now() - new Date(breakData.breakStart).getTime()) / 1000);
        setBreakTimer(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [onBreak, breakData]);

  const handleStartBreak = async (type) => {
    try {
      const { data } = await startBreak({ type });
      setOnBreak(true);
      setBreakData(data);
      toast.success(`${type === 'lunch' ? 'Lunch' : 'Short'} break started`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start break');
    }
  };

  const handleEndBreak = async () => {
    try {
      const { data } = await endBreak();
      setOnBreak(false);
      setBreakData(null);
      setBreakTimer(0);
      toast.success(`Break ended (${data.duration} min)`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end break');
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const roleLabel = user?.role === 'deliveryGuy' ? 'Delivery Rider' : user?.role === 'cashier' ? 'Cashier' : user?.role === 'stockEmployee' ? 'Stock Employee' : user?.role;

  if (loading) {
    return (
      <DashboardLayout navItems={getEmployeeNavGroups(user?.role)} title="Employee Portal">
        <div className="ds-loading">
          <div className="ds-spinner" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={getEmployeeNavGroups(user?.role)} title="Employee Portal">
      <div className="ds-page">
        
        {/* Welcome Banner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="ds-page-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)', color: '#fff', border: 'none' }}>
            <div className="ds-page-header-left">
              <span style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', fontSize:'var(--ds-text-2xs)', fontWeight:700, padding:'0.2rem 0.75rem', borderRadius:999, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.75rem' }}>
                <Coffee size={12} /> {roleLabel} Portal
              </span>
              <h1 style={{ margin: 0, fontSize: 'var(--ds-text-xl)', fontWeight: 600 }}>
                Welcome back, {user?.name?.split(' ')[0]}
              </h1>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontSize: 'var(--ds-text-sm)' }}>
                Manage shifts, attendance, break logs, leave applications, and monthly salary history.
              </p>
            </div>
            <div className="ds-page-header-right">
              <div style={{ width: '4rem', height: '4rem', borderRadius: 'var(--ds-r-md)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {user?.avatar ? (
                  <img src={getImageUrl(user.avatar)} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || 'E'
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions (Banner Bottom) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link
              to="/employee/attendance"
              className="ds-btn ds-btn-primary"
            >
              <Clock size={14} /> Mark Attendance
            </Link>
            {!onBreak ? (
              <>
                <button onClick={() => handleStartBreak('short')} className="ds-btn ds-btn-secondary">
                  <Coffee size={12} /> Short Break
                </button>
                <button onClick={() => handleStartBreak('lunch')} className="ds-btn ds-btn-secondary">
                  Lunch Break
                </button>
              </>
            ) : (
              <button onClick={handleEndBreak} className="ds-btn" style={{ background: '#e11d48', color: '#fff', borderColor: '#be123c' }}>
                <Coffee size={14} /> End Break · {formatTimer(breakTimer)}
              </button>
            )}
            {stats.todayCheckedIn && (
              <span className="ds-badge ds-badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: 'var(--ds-text-sm)' }}>
                <CheckCircle size={14} /> Attendance recorded today
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid matching reference layout */}
        <div className="ds-stats" style={{ marginTop: '1.5rem' }}>
          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                <Clock size={18} />
              </div>
              <span className="ds-stat-change blue">This Month</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">Days Worked</p>
              <p className="ds-stat-value text-blue-600">{stats.attendanceCount}</p>
            </div>
          </div>

          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#fffbeb', color: '#b45309' }}>
                <Calendar size={18} />
              </div>
              <span className="ds-stat-change amber">{stats.usedLeaves || 0} Used</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">Leave Balance</p>
              <p className="ds-stat-value text-amber-600">{stats.leaveBalance} <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Days</span></p>
            </div>
          </div>

          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#fff1f2', color: '#be123c' }}>
                <AlertCircle size={18} />
              </div>
              <span className="ds-stat-change down">In Review</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">Pending Leaves</p>
              <p className="ds-stat-value text-rose-600">{stats.pendingLeaves || 0}</p>
            </div>
          </div>

          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>
                <TrendingUp size={18} />
              </div>
              <span className="ds-stat-change up">{stats.lastSalary ? `${stats.lastSalary.month}/${stats.lastSalary.year}` : 'Latest'}</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">Last Net Salary</p>
              <p className="ds-stat-value text-emerald-600">{stats.lastSalary ? `Rs. ${stats.lastSalary.netSalary?.toLocaleString()}` : '—'}</p>
            </div>
          </div>
        </div>

        {/* Employee Quick Access Console */}
        <div className="ds-card" style={{ marginTop: '1.5rem' }}>
          <div className="ds-card-header">
            <div className="ds-card-title"><Zap size={16} /> Employee Quick Access</div>
          </div>
          <div className="ds-card-body" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'0.75rem' }}>
            {(user?.role === 'cashier'
              ? [
                  { title: 'POS Terminal', desc: 'Open billing & checkout terminal', path: '/pos', icon: Monitor, color: '#2563eb' },
                  { title: 'Reload & Card Stock', desc: 'Track opening, added & sell-out', path: '/admin/reloads', icon: Smartphone, color: '#059669' },
                  { title: 'Petty Cash & Expenses', desc: 'Record daily shop expenses', path: '/admin/expenses', icon: DollarSign, color: '#d97706' },
                  { title: 'Installments (HP)', desc: 'Collect customer installment payments', path: '/admin/hp', icon: CreditCard, color: '#9333ea' },
                  { title: 'Cheque Management', desc: 'Manage customer cheque entries', path: '/admin/cheques', icon: FileText, color: '#0284c7' },
                  { title: 'Stock & Price Lookup', desc: 'Check available products & IMEI', path: '/employee/stock', icon: Package, color: '#4f46e5' },
                  { title: 'Device Repairs', desc: 'View repair orders & progress', path: '/employee/repairs', icon: Wrench, color: '#0d9488' },
                  { title: 'Barcode Label Generator', desc: 'Generate & print product labels', path: '/barcode-generator', icon: Barcode, color: '#e11d48' },
                  { title: 'Clock In & Attendance', desc: 'Mark attendance & break logs', path: '/employee/attendance', icon: Clock, color: '#475569' },
                ]
              : user?.role === 'deliveryGuy'
              ? [
                  { title: 'Deliveries Hub', desc: 'Track & fulfill customer deliveries', path: '/delivery', icon: Truck, color: '#2563eb' },
                  { title: 'Clock In & Attendance', desc: 'Mark attendance & break logs', path: '/employee/attendance', icon: Clock, color: '#0ea5e9' },
                  { title: 'Leave Requests', desc: 'Apply and track leave requests', path: '/employee/leaves', icon: Calendar, color: '#d97706' },
                  { title: 'Overtime Pay Records', desc: 'View overtime hours & status', path: '/employee/overtime', icon: Timer, color: '#9333ea' },
                  { title: 'Salary & EPF/ETF', desc: 'View pay and EPF/ETF contributions', path: '/employee/salary', icon: CreditCard, color: '#059669' },
                  { title: 'My Profile & Documents', desc: 'View personal details and agreements', path: '/employee/profile', icon: User, color: '#475569' },
                ]
              : [
                  { title: 'Stock & Price Lookup', desc: 'Check available products & IMEI', path: '/employee/stock', icon: Package, color: '#4f46e5' },
                  { title: 'Barcode Label Generator', desc: 'Generate & print product labels', path: '/barcode-generator', icon: Barcode, color: '#e11d48' },
                  { title: 'Device Repairs', desc: 'View repair orders & progress', path: '/employee/repairs', icon: Wrench, color: '#0d9488' },
                  { title: 'Clock In & Attendance', desc: 'Mark attendance & break logs', path: '/employee/attendance', icon: Clock, color: '#0ea5e9' },
                  { title: 'Leave Requests', desc: 'Apply and track leave requests', path: '/employee/leaves', icon: Calendar, color: '#d97706' },
                  { title: 'Overtime Pay Records', desc: 'View overtime hours & status', path: '/employee/overtime', icon: Timer, color: '#9333ea' },
                  { title: 'Salary & EPF/ETF', desc: 'View pay and EPF/ETF contributions', path: '/employee/salary', icon: CreditCard, color: '#059669' },
                  { title: 'My Profile & Documents', desc: 'View personal details and agreements', path: '/employee/profile', icon: User, color: '#475569' },
                ]
            ).map((q) => (
              <Link key={q.title} to={q.path} className="ds-action-card" style={{ textDecoration: 'none' }}>
                <div className="ds-action-card-icon" style={{ background: `${q.color}20`, color: q.color }}>
                  <q.icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ds-action-card-label">{q.title}</div>
                  <div className="ds-action-card-sub">{q.desc}</div>
                </div>
                <ArrowRight size={16} style={{ opacity: 0.5 }} />
              </Link>
            ))}
          </div>
        </div>

        {/* Targets Section */}
        {targets.length > 0 && (
          <div className="ds-card" style={{ marginTop: '1.5rem' }}>
            <div className="ds-card-header">
              <div className="ds-card-title"><Target size={18} /> My Performance Targets</div>
            </div>
            <div className="ds-card-body">
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                {targets.map(t => {
                  const progress = t.targetValue > 0 ? Math.min(100, Math.round((t.achievedValue / t.targetValue) * 100)) : 0;
                  const isCompleted = t.status === 'completed';
                  return (
                    <div key={t._id} style={{ border: '1px solid var(--ds-border-soft)', padding: '1rem', borderRadius: 'var(--ds-r-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: 'var(--ds-text-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'capitalize' }}>
                          {isCompleted && <Award size={14} style={{ color: '#10b981' }} />}
                          {t.targetType.replace('_', ' ')}
                        </span>
                        <span className={`ds-badge ${isCompleted ? 'ds-badge-green' : 'ds-badge-primary'}`}>
                          {isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{t.achievedValue.toLocaleString()}</span>
                        <span style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)' }}>/ {t.targetValue.toLocaleString()} {t.targetType === 'sales' ? 'Rs.' : ''}</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--ds-border-soft)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: isCompleted ? '#10b981' : 'var(--ds-primary)', width: `${progress}%`, transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                        <span style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)' }}>{progress}% complete</span>
                        {t.bonusAmount > 0 && (
                          <span className="ds-badge ds-badge-amber">
                            Bonus: Rs. {t.bonusAmount.toLocaleString()} {t.bonusPaid ? '(Paid)' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="ds-card" style={{ marginTop: '1.5rem' }}>
          <div className="ds-card-body" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'0.75rem' }}>
            {[
              { label: 'My Profile', desc: 'View personal details', path: '/employee/profile', Icon: User, color: '#8b5cf6' },
              { label: 'Attendance', desc: 'Check-in & shift history', path: '/employee/attendance', Icon: Clock, color: '#4f46e5' },
              { label: 'Leave Requests', desc: 'Apply & track leaves', path: '/employee/leaves', Icon: Calendar, color: '#d97706' },
              { label: 'Salary & EPF/ETF', desc: 'View pay & contributions', path: '/employee/salary', Icon: TrendingUp, color: '#10b981' },
            ].map((item) => (
              <Link key={item.path} to={item.path} className="ds-action-card" style={{ textDecoration: 'none' }}>
                <div className="ds-action-card-icon" style={{ background: `${item.color}20`, color: item.color }}>
                  <item.Icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ds-action-card-label">{item.label}</div>
                  <div className="ds-action-card-sub">{item.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
