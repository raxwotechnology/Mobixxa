'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Check, ChevronDown } from 'lucide-react';

const matchesQuery = (emp, q) => {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    (emp.name || '').toLowerCase().includes(needle) ||
    (emp._id || '').toLowerCase().includes(needle) ||
    (emp.email || '').toLowerCase().includes(needle) ||
    (emp.employeeInfo?.department || '').toLowerCase().includes(needle)
  );
};

/**
 * Shared searchable employee picker — used both as a compact popover
 * (drop-in replacement for a plain <select>) and as an always-open panel
 * (for screens like "Assign Policy"/"Assign Technicians" where the picker
 * is the primary content of the form). `value` is always an array of
 * employee _ids, even in single-select mode.
 */
const EmployeeSelector = ({
  employees = [],
  value = [],
  onChange,
  multiple = true,
  alwaysOpen = false,
  placeholder = 'Search by name, ID, email, or department...',
  triggerLabel,
  allowSelectAll = multiple,
}) => {
  const emptyTriggerLabel = triggerLabel || (multiple ? 'Select employees...' : 'Select employee...');
  const [open, setOpen] = useState(alwaysOpen);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = useMemo(() => employees.filter((e) => matchesQuery(e, query)), [employees, query]);
  const selectedSet = useMemo(() => new Set(value), [value]);
  const selectedEmployees = useMemo(() => employees.filter((e) => selectedSet.has(e._id)), [employees, selectedSet]);

  useEffect(() => { setHighlight(-1); }, [query, open]);

  useEffect(() => {
    if (alwaysOpen || !open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, alwaysOpen]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const toggle = (id) => {
    if (multiple) {
      onChange(selectedSet.has(id) ? value.filter((v) => v !== id) : [...value, id]);
    } else {
      onChange([id]);
      setOpen(false);
      setQuery('');
    }
  };

  const remove = (id, e) => {
    e?.stopPropagation();
    onChange(value.filter((v) => v !== id));
  };
  const selectAll = () => onChange(employees.map((e) => e._id));
  const clearAll = () => onChange([]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlight >= 0 && filtered[highlight]) toggle(filtered[highlight]._id);
    } else if (e.key === 'Escape' && !alwaysOpen) {
      setOpen(false);
    }
  };

  const panel = (
    <div className={alwaysOpen ? '' : 'absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden'}>
      <div className={alwaysOpen ? 'mb-2' : 'p-2 border-b border-slate-100'}>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all"
          />
        </div>
      </div>

      {multiple && allowSelectAll && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/60">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            {value.length} of {employees.length} selected
          </span>
          <div className="flex gap-2">
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={selectAll} className="text-[10px] font-bold text-brand-indigo hover:text-indigo-800 bg-brand-indigo/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer">
              Select All
            </button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={clearAll} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer">
              Clear All
            </button>
          </div>
        </div>
      )}

      <div className={alwaysOpen ? 'max-h-56 overflow-y-auto space-y-1.5 pr-1' : 'max-h-56 overflow-y-auto'}>
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">No employees found</div>
        ) : (
          filtered.map((emp, idx) => {
            const checked = selectedSet.has(emp._id);
            return (
              <label
                key={emp._id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => toggle(emp._id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none transition-colors ${
                  alwaysOpen ? 'rounded-xl border' : 'border-b border-slate-50 last:border-b-0'
                } ${idx === highlight ? 'ring-2 ring-brand-indigo/30' : ''} ${
                  checked
                    ? alwaysOpen ? 'bg-brand-indigo/5 border-brand-indigo/50' : 'bg-brand-indigo/5'
                    : alwaysOpen ? 'bg-slate-50/50 border-slate-200/70 hover:border-slate-300' : 'hover:bg-slate-50'
                }`}
              >
                {multiple && (
                  <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors flex-shrink-0 ${
                    checked ? 'bg-brand-indigo border-brand-indigo text-white' : 'bg-white border-slate-300'
                  }`}>
                    {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate m-0">{emp.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold truncate m-0">
                    {emp.role}{emp.employeeInfo?.department ? ` · ${emp.employeeInfo.department}` : ''}{emp.email ? ` · ${emp.email}` : ''}
                  </p>
                </div>
                {!multiple && checked && <Check size={14} className="text-brand-indigo flex-shrink-0" strokeWidth={3} />}
              </label>
            );
          })
        )}
      </div>
    </div>
  );

  if (alwaysOpen) {
    return (
      <div>
        {multiple && selectedEmployees.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedEmployees.map((emp) => (
              <span key={emp._id} className="inline-flex items-center gap-1 bg-brand-indigo/10 text-brand-indigo text-[11px] font-bold pl-2.5 pr-1.5 py-1 rounded-full">
                {emp.name}
                <button type="button" onClick={(e) => remove(emp._id, e)} className="hover:text-indigo-900">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        {panel}
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all cursor-pointer"
      >
        <div className="flex-1 flex flex-wrap gap-1 min-w-0">
          {value.length === 0 ? (
            <span className="text-slate-400 font-medium">{emptyTriggerLabel}</span>
          ) : multiple ? (
            <>
              {selectedEmployees.slice(0, 3).map((emp) => (
                <span key={emp._id} className="inline-flex items-center gap-1 bg-brand-indigo/10 text-brand-indigo text-[10px] font-bold pl-2 pr-1 py-0.5 rounded-full">
                  {emp.name}
                  <span role="button" onClick={(e) => remove(emp._id, e)} className="hover:text-indigo-900">
                    <X size={10} />
                  </span>
                </span>
              ))}
              {value.length > 3 && <span className="text-[10px] font-bold text-slate-400 self-center">+{value.length - 3} more</span>}
            </>
          ) : (
            <span className="text-slate-800 truncate">{selectedEmployees[0]?.name}</span>
          )}
        </div>
        {!multiple && value.length > 0 && (
          <span role="button" onClick={(e) => remove(value[0], e)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
            <X size={13} />
          </span>
        )}
        <ChevronDown size={14} className={`text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && panel}
    </div>
  );
};

export default EmployeeSelector;
