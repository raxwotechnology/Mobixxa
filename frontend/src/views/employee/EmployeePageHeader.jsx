'use client';

/**
 * Shared page header for cashier / deliveryGuy / stockEmployee portals.
 * Responsive for mobile, tablet, and desktop.
 */
const EmployeePageHeader = ({ badge = 'EMPLOYEE PORTAL', title, subtitle, icon: Icon, actions }) => (
  <div className="ds-page-header">
    <div className="ds-page-header-left">
      {Icon && (
        <div className="ds-page-header-icon">
          <Icon size={20} strokeWidth={1.75} />
        </div>
      )}
      <div>
        <h1 className="ds-page-title">{title}</h1>
        {subtitle && (
          <p className="ds-page-subtitle">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {actions && (
      <div className="ds-page-header-right flex items-center gap-2 sm:gap-3 flex-wrap">
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
  <div className="employee-stat flex flex-col justify-between min-w-0">
    {Icon && (
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border flex items-center justify-center ${iconBg}`}>
          <Icon size={16} className={iconColor} />
        </div>
      </div>
    )}
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 m-0 mb-1 truncate">{label}</p>
      <p className={`employee-stat-value m-0 truncate ${color}`}>{value}</p>
    </div>
  </div>
);

export const EmployeePanel = ({ title, subtitle, actions, children, className = '' }) => (
  <div className={`employee-panel overflow-hidden ${className}`}>
    {(title || actions) && (
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          {title && <h2 className="font-bold text-slate-900 text-xs sm:text-sm m-0 uppercase tracking-wider">{title}</h2>}
          {subtitle && <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1 m-0">{subtitle}</p>}
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
