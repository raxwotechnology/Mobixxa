/**
 * Shared page header for cashier / deliveryGuy / stockEmployee portals.
 * Responsive for mobile, tablet, and desktop.
 */
const EmployeePageHeader = ({ badge = 'EMPLOYEE PORTAL', title, subtitle, icon: Icon, actions }) => (
  <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between bg-white/60 backdrop-blur-md p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
    <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-brand-indigo/5 rounded-full blur-3xl pointer-events-none -z-10" />
    <div className="min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-flex items-center gap-1.5 bg-brand-indigo/10 text-brand-indigo text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 sm:px-3 py-1 rounded-lg border border-brand-indigo/15">
          {Icon ? <Icon size={12} /> : null}
          <span className="truncate">{badge}</span>
        </span>
      </div>
      <h1 className="text-xl sm:text-2xl font-black text-slate-900 m-0 leading-tight">{title}</h1>
      {subtitle && (
        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1.5 sm:mt-2 m-0 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
    {actions && (
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full md:w-auto md:justify-end shrink-0">
        {actions}
      </div>
    )}
  </div>
);

export const EmployeeStatCard = ({
  label,
  value,
  color = 'text-slate-900',
  icon: Icon,
  iconBg = 'bg-indigo-50 border-indigo-100/60',
  iconColor = 'text-brand-indigo',
}) => (
  <div className="bg-white/60 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/40 p-3.5 sm:p-5 shadow-sm flex flex-col justify-between min-w-0">
    {Icon && (
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border flex items-center justify-center ${iconBg}`}>
          <Icon size={16} className={iconColor} />
        </div>
      </div>
    )}
    <div className="min-w-0">
      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 m-0 mb-1 truncate">{label}</p>
      <p className={`text-lg sm:text-2xl font-black m-0 truncate ${color}`}>{value}</p>
    </div>
  </div>
);

export const EmployeePanel = ({ title, subtitle, actions, children, className = '' }) => (
  <div className={`bg-white/60 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/40 shadow-sm overflow-hidden ${className}`}>
    {(title || actions) && (
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          {title && <h2 className="font-black text-slate-900 text-xs sm:text-sm m-0 uppercase tracking-wider">{title}</h2>}
          {subtitle && <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1 m-0">{subtitle}</p>}
        </div>
        {actions}
      </div>
    )}
    <div className="p-4 sm:p-6">{children}</div>
  </div>
);

/** Scrollable table shell — prevents page overflow on mobile */
export const EmployeeTableWrap = ({ children }) => (
  <div className="overflow-x-auto -mx-1 px-1 overscroll-x-contain [scrollbar-width:thin]">
    <div className="min-w-[640px]">{children}</div>
  </div>
);

export const EmployeeLoading = () => (
  <div className="flex items-center justify-center h-48 sm:h-64">
    <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" />
  </div>
);

export default EmployeePageHeader;
