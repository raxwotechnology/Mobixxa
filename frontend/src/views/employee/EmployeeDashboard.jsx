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
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-fuchsia rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={getEmployeeNavGroups(user?.role)} title="Employee Portal">
      <div className="animate-fade-in space-y-6">
        
        {/* Welcome Banner */}
        <div className="employee-command-banner rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 text-white relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(2,132,199,0.2),transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 bg-sky-500/20 text-sky-300 border border-sky-400/30 px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest mb-2 sm:mb-3">
                <Coffee size={12} /> {roleLabel} Portal
              </span>
              <h1 className="text-xl sm:text-2xl md:text-4xl font-black tracking-tight text-white m-0 break-words">
                Welcome back, {user?.name?.split(' ')[0]}
              </h1>
              <p className="text-slate-300 text-xs md:text-sm font-semibold m-0 mt-2 max-w-xl">
                Manage shifts, attendance, break logs, leave applications, and monthly salary history.
              </p>
            </div>
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-slate-900/60 border border-slate-700 flex items-center justify-center text-sky-400 text-2xl sm:text-3xl font-black backdrop-blur-md shadow-inner shrink-0 self-start md:self-center overflow-hidden">
              {user?.avatar ? (
                <img src={getImageUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'E'
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="relative z-10 mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-slate-700/60">
            <Link
              to="/employee/attendance"
              className="bg-white hover:bg-slate-100 text-slate-900 font-black text-[10px] uppercase tracking-wider px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all shadow-md flex items-center gap-2 no-underline"
            >
              <Clock size={14} /> Mark Attendance
            </Link>
            {!onBreak ? (
              <>
                <button onClick={() => handleStartBreak('short')} className="bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow-xs flex items-center gap-2 hover:scale-[1.02] active:scale-95 border-0 cursor-pointer">
                  <Coffee size={12} /> Short Break
                </button>
                <button onClick={() => handleStartBreak('lunch')} className="bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow-xs flex items-center gap-2 hover:scale-[1.02] active:scale-95 border-0 cursor-pointer">
                  Lunch Break
                </button>
              </>
            ) : (
              <button onClick={handleEndBreak} className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-wider px-6 py-3 rounded-xl transition-all flex items-center gap-2 animate-pulse border-0 cursor-pointer">
                <Coffee size={14} /> End Break · {formatTimer(breakTimer)}
              </button>
            )}
            {stats.todayCheckedIn && (
              <span className="bg-emerald-500/20 text-emerald-300 font-black text-[10px] uppercase tracking-wider px-5 py-3 rounded-xl backdrop-blur-sm flex items-center gap-2 border border-emerald-500/30 shadow-xs">
                <CheckCircle size={14} /> Attendance recorded today
              </span>
            )}
          </div>
        </div>

        {/* Employee Quick Access Console */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-black text-slate-900 m-0 tracking-tight flex items-center gap-2">
                <Zap size={16} className="text-blue-600 fill-blue-600" /> Employee Quick Access
              </h3>
              <p className="text-xs font-semibold text-slate-500 m-0 mt-0.5">Quick access to daily staff modules</p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
              Staff Shortcuts
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(user?.role === 'cashier'
              ? [
                  { title: 'POS Terminal', desc: 'Open billing & checkout terminal', path: '/pos', icon: Monitor, gradient: 'from-blue-600 to-indigo-700', badge: 'Billing' },
                  { title: 'Reload & Card Stock', desc: 'Track opening, added & sell-out', path: '/admin/reloads', icon: Smartphone, gradient: 'from-emerald-600 to-teal-600', badge: 'Reloads' },
                  { title: 'Petty Cash & Expenses', desc: 'Record daily shop expenses', path: '/admin/expenses', icon: DollarSign, gradient: 'from-amber-500 to-orange-600', badge: 'Expenses' },
                  { title: 'Installments (HP)', desc: 'Collect customer installment payments', path: '/admin/hp', icon: CreditCard, gradient: 'from-purple-600 to-pink-600', badge: 'HP Pay' },
                  { title: 'Cheque Management', desc: 'Manage customer cheque entries', path: '/admin/cheques', icon: FileText, gradient: 'from-sky-600 to-cyan-600', badge: 'Cheques' },
                  { title: 'Stock & Price Lookup', desc: 'Check available products & IMEI', path: '/employee/stock', icon: Package, gradient: 'from-indigo-500 to-blue-600', badge: 'Inventory' },
                  { title: 'Device Repairs', desc: 'View repair orders & progress', path: '/employee/repairs', icon: Wrench, gradient: 'from-teal-600 to-emerald-700', badge: 'Repairs' },
                  { title: 'Barcode Label Generator', desc: 'Generate & print product labels', path: '/barcode-generator', icon: Barcode, gradient: 'from-rose-500 to-red-600', badge: 'Labels' },
                  { title: 'Clock In & Attendance', desc: 'Mark attendance & break logs', path: '/employee/attendance', icon: Clock, gradient: 'from-slate-700 to-slate-900', badge: 'Attendance' },
                ]
              : user?.role === 'deliveryGuy'
              ? [
                  { title: 'Deliveries Hub', desc: 'Track & fulfill customer deliveries', path: '/delivery', icon: Truck, gradient: 'from-blue-600 to-indigo-700', badge: 'Deliveries' },
                  { title: 'Clock In & Attendance', desc: 'Mark attendance & break logs', path: '/employee/attendance', icon: Clock, gradient: 'from-sky-500 to-blue-600', badge: 'Attendance' },
                  { title: 'Leave Requests', desc: 'Apply and track leave requests', path: '/employee/leaves', icon: Calendar, gradient: 'from-amber-500 to-orange-600', badge: 'Leaves' },
                  { title: 'Overtime Pay Records', desc: 'View overtime hours & status', path: '/employee/overtime', icon: Timer, gradient: 'from-purple-600 to-pink-600', badge: 'Overtime' },
                  { title: 'Salary & EPF/ETF', desc: 'View pay and EPF/ETF contributions', path: '/employee/salary', icon: CreditCard, gradient: 'from-emerald-600 to-teal-600', badge: 'Payroll' },
                  { title: 'My Profile & Documents', desc: 'View personal details and agreements', path: '/employee/profile', icon: User, gradient: 'from-slate-700 to-slate-900', badge: 'Profile' },
                ]
              : [
                  { title: 'Stock & Price Lookup', desc: 'Check available products & IMEI', path: '/employee/stock', icon: Package, gradient: 'from-indigo-500 to-blue-600', badge: 'Inventory' },
                  { title: 'Barcode Label Generator', desc: 'Generate & print product labels', path: '/barcode-generator', icon: Barcode, gradient: 'from-rose-500 to-red-600', badge: 'Labels' },
                  { title: 'Device Repairs', desc: 'View repair orders & progress', path: '/employee/repairs', icon: Wrench, gradient: 'from-teal-600 to-emerald-700', badge: 'Repairs' },
                  { title: 'Clock In & Attendance', desc: 'Mark attendance & break logs', path: '/employee/attendance', icon: Clock, gradient: 'from-sky-500 to-blue-600', badge: 'Attendance' },
                  { title: 'Leave Requests', desc: 'Apply and track leave requests', path: '/employee/leaves', icon: Calendar, gradient: 'from-amber-500 to-orange-600', badge: 'Leaves' },
                  { title: 'Overtime Pay Records', desc: 'View overtime hours & status', path: '/employee/overtime', icon: Timer, gradient: 'from-purple-600 to-pink-600', badge: 'Overtime' },
                  { title: 'Salary & EPF/ETF', desc: 'View pay and EPF/ETF contributions', path: '/employee/salary', icon: CreditCard, gradient: 'from-emerald-600 to-teal-600', badge: 'Payroll' },
                  { title: 'My Profile & Documents', desc: 'View personal details and agreements', path: '/employee/profile', icon: User, gradient: 'from-slate-700 to-slate-900', badge: 'Profile' },
                ]
            ).map((q) => (
              <Link
                key={q.title}
                to={q.path}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200/70 hover:border-blue-400 bg-slate-50/50 hover:bg-white transition-all duration-300 no-underline shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${q.gradient} flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <q.icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">{q.title}</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 flex-shrink-0">{q.badge}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 truncate m-0 mt-0.5">{q.desc}</p>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Days Worked */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between enterprise-card shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shadow-xs">
                <Clock size={20} className="text-sky-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                This Month
              </span>
            </div>
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 m-0 mb-1">Days Worked</p>
              <p className="text-2xl font-black text-slate-900 m-0">{stats.attendanceCount}</p>
            </div>
          </div>

          {/* Leave Balance */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between enterprise-card shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-xs">
                <Calendar size={20} className="text-amber-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                Annual Leave
              </span>
            </div>
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 m-0 mb-1">Leave Balance</p>
              <p className="text-2xl font-black text-slate-900 m-0">{stats.leaveBalance} Days</p>
              <p className="text-[10px] text-slate-400 font-semibold m-0 mt-1">({stats.usedLeaves || 0} used)</p>
            </div>
          </div>

          {/* Pending Leaves */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between enterprise-card shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shadow-xs">
                <AlertCircle size={20} className="text-orange-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                In Review
              </span>
            </div>
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 m-0 mb-1">Pending Leaves</p>
              <p className="text-2xl font-black text-slate-900 m-0">{stats.pendingLeaves || 0}</p>
            </div>
          </div>

          {/* Last Salary */}
          <div className="glass-card rounded-2xl p-5 flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100/60 flex items-center justify-center shadow-xs">
                <TrendingUp size={20} className="text-emerald-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                {stats.lastSalary ? `${stats.lastSalary.month}/${stats.lastSalary.year}` : 'No Record'}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 m-0 mb-1">Last Salary</p>
              <p className="text-2xl font-black text-slate-900 m-0">
                {stats.lastSalary ? `Rs. ${stats.lastSalary.netSalary?.toLocaleString()}` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Targets Section */}
        {targets.length > 0 && (
          <div className="glass-card rounded-[2rem] p-6 shadow-sm border border-slate-200/60">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                <Target size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 m-0">My Performance Targets</h2>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1 m-0">Monthly target values and potential bonus rewards</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {targets.map(t => {
                const progress = t.targetValue > 0 ? Math.min(100, Math.round((t.achievedValue / t.targetValue) * 100)) : 0;
                const isCompleted = t.status === 'completed';
                return (
                  <div key={t._id} className={`border rounded-2xl p-4 transition-all duration-300 ${isCompleted ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200/80 bg-white/40'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold text-slate-800 capitalize flex items-center gap-2">
                        {isCompleted && <Award size={14} className="text-emerald-500" />}
                        {t.targetType.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-indigo/10 text-brand-indigo'
                      }`}>
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-2xl font-black text-slate-800">{t.achievedValue.toLocaleString()}</span>
                      <span className="text-slate-400 text-xs font-bold mb-1">/ {t.targetValue.toLocaleString()} {t.targetType === 'sales' ? 'Rs.' : ''}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-brand-indigo shadow-[0_0_8px_rgba(99,102,241,0.5)]'}`} style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-[10px] font-bold text-slate-500">{progress}% complete</span>
                      {t.bonusAmount > 0 && (
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          Bonus: Rs. {t.bonusAmount.toLocaleString()} {t.bonusPaid ? '(Paid)' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'My Profile', desc: 'View personal details', path: '/employee/profile', Icon: User, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
            { label: 'Attendance', desc: 'Check-in & shift history', path: '/employee/attendance', Icon: Clock, color: 'text-brand-indigo', bg: 'bg-indigo-50 border-indigo-100' },
            { label: 'Leave Requests', desc: 'Apply & track leaves', path: '/employee/leaves', Icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
            { label: 'Salary & EPF/ETF', desc: 'View pay & contributions', path: '/employee/salary', Icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 block no-underline group"
            >
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${item.bg} group-hover:scale-105 transition-transform`}>
                <item.Icon size={18} className={item.color} />
              </div>
              <h3 className="font-black text-sm text-slate-800 mt-4 mb-1 uppercase tracking-wide m-0">{item.label}</h3>
              <p className="text-xs text-slate-500 font-semibold m-0">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
