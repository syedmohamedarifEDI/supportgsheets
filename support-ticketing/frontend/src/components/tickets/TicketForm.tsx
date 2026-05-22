import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Ticket, Project, Technician } from '../../types';
import toast from 'react-hot-toast';
import { X, Loader, AlertTriangle, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface TicketFormProps {
  ticket?: Ticket | null;
  onClose: () => void;
  onSaved: () => void;
}

const STATUSES = ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed'];
const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];

const emptyForm = {
  projectId: '',
  incidentStartTime: '',
  incidentEndTime: '',
  issue: '',
  assignedTo: '',
  systemsImpacted: '',
  businessCriticality: '',
  rca: '',
  interfaceName: '',
  executionId: '',
  fixesDetails: '',
  status: 'Open',
};

// ─── DateTime Picker ────────────────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function pad(n: number) { return String(n).padStart(2, '0'); }

interface DateTimePickerProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
}

function DateTimePicker({ label, required, value, onChange }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const parsed = value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  const now = new Date();

  const [calYear,  setCalYear]  = useState(parsed ? +parsed[1] : now.getFullYear());
  const [calMonth, setCalMonth] = useState(parsed ? +parsed[2] - 1 : now.getMonth());
  const [selDay,   setSelDay]   = useState(parsed ? +parsed[3] : now.getDate());
  const [hour,     setHour]     = useState(parsed ? +parsed[4] : 0);
  const [minute,   setMinute]   = useState(parsed ? +parsed[5] : 0);
  const [second,   setSecond]   = useState(parsed ? +parsed[6] : 0);

  useEffect(() => {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
    if (m) {
      setCalYear(+m[1]); setCalMonth(+m[2]-1); setSelDay(+m[3]);
      setHour(+m[4]); setMinute(+m[5]); setSecond(+m[6]);
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const str = `${calYear}-${pad(calMonth+1)}-${pad(selDay)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
    if (str !== value) onChange(str);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calYear, calMonth, selDay, hour, minute, second]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="relative" ref={ref}>
      <label className="form-label">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      <div
        className="form-input flex items-center gap-2 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
      >
        <Calendar size={15} className="text-navy-400 shrink-0" />
        <span className={`flex-1 font-mono text-sm ${value ? 'text-navy-900' : 'text-navy-400'}`}>
          {value || 'YYYY-MM-DD HH:mm:ss'}
        </span>
        <Clock size={15} className="text-navy-400 shrink-0" />
      </div>

      {open && (
        <div
          className="absolute z-50 mt-1 bg-white border border-navy-200 rounded-2xl shadow-2xl p-4"
          style={{ minWidth: 300 }}
        >
          {/* Calendar */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-navy-50 text-navy-600">
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <select
                value={calMonth}
                onChange={e => setCalMonth(+e.target.value)}
                className="text-sm font-semibold text-navy-800 bg-transparent border-none outline-none cursor-pointer"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <input
                type="number"
                value={calYear}
                onChange={e => setCalYear(+e.target.value)}
                className="w-16 text-sm font-semibold text-navy-800 bg-transparent border-none outline-none text-center"
              />
            </div>
            <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-navy-50 text-navy-600">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-navy-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const isSelected = day === selDay;
              const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelDay(day)}
                  className={`mx-auto w-8 h-8 rounded-full text-sm font-medium transition-all
                    ${isSelected ? 'bg-navy-600 text-white shadow' : isToday ? 'bg-navy-100 text-navy-700 font-bold' : 'text-navy-700 hover:bg-navy-50'}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time picker */}
          <div className="mt-4 pt-3 border-t border-navy-100">
            <div className="flex items-center gap-1 justify-center">
              <Clock size={14} className="text-navy-400 mr-1" />

              {[
                { val: hour, set: setHour, max: 23 },
                { val: minute, set: setMinute, max: 59 },
                { val: second, set: setSecond, max: 59 },
              ].map(({ val, set: setVal, max }, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-navy-600 font-bold text-lg mb-0.5">:</span>}
                  <div className="flex flex-col items-center">
                    <button type="button" onClick={() => setVal((v: number) => (v + 1) % (max + 1))}
                      className="text-navy-400 hover:text-navy-700 p-0.5 leading-none">▲</button>
                    <input
                      type="number" min={0} max={max} value={pad(val)}
                      onChange={e => setVal(Math.min(max, Math.max(0, +e.target.value)))}
                      className="w-10 text-center text-sm font-mono font-bold text-navy-800
                        border border-navy-200 rounded-lg py-1 bg-navy-50 outline-none
                        focus:ring-2 focus:ring-navy-400"
                    />
                    <button type="button" onClick={() => setVal((v: number) => (v + max) % (max + 1))}
                      className="text-navy-400 hover:text-navy-700 p-0.5 leading-none">▼</button>
                  </div>
                </React.Fragment>
              ))}

              <span className="ml-2 text-xs text-navy-400 font-mono">HH:MM:SS</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex gap-2 justify-end">
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
              className="text-xs text-navy-400 hover:text-navy-600 px-2 py-1">
              Clear
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-primary text-xs px-3 py-1.5">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ticket Form ─────────────────────────────────────────────────────────────

export default function TicketForm({ ticket, onClose, onSaved }: TicketFormProps) {
  const [form, setForm] = useState({ ...emptyForm });
  const [projects, setProjects] = useState<Project[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data));
    api.get('/technicians').then(r => setTechnicians(r.data));
  }, []);

  useEffect(() => {
    if (ticket) {
      setForm({
        projectId: typeof ticket.projectId === 'string' ? ticket.projectId : (ticket.projectId as any)?._id || '',
        incidentStartTime: ticket.incidentStartTime || '',
        incidentEndTime: ticket.incidentEndTime || '',
        issue: ticket.issue || '',
        assignedTo: typeof ticket.assignedTo === 'string' ? ticket.assignedTo : (ticket.assignedTo as any)?._id || '',
        systemsImpacted: ticket.systemsImpacted || '',
        businessCriticality: ticket.businessCriticality || '',
        rca: ticket.rca || '',
        interfaceName: ticket.interfaceName || '',
        executionId: ticket.executionId || '',
        fixesDetails: ticket.fixesDetails || '',
        status: ticket.status || 'Open',
      });
    }
  }, [ticket]);

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      if (ticket) {
        await api.put(`/tickets/${ticket._id}`, form);
        toast.success('Ticket updated');
      } else {
        await api.post('/tickets', form);
        toast.success('Ticket created');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData?.errors) setErrors(errData.errors);
      else toast.error(errData?.error || errData?.errors?.[0] || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="font-semibold text-navy-800 text-lg">
            {ticket ? `Edit Ticket #${ticket.serialNumber}` : 'New Ticket'}
          </h2>
          <button onClick={onClose} className="text-navy-400 hover:text-navy-600 p-1 rounded-lg hover:bg-navy-50">
            <X size={18} />
          </button>
        </div>

        {errors.length > 0 && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                {errors.map((e, i) => <p key={i} className="text-red-700 text-sm">{e}</p>)}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section: Incident Info */}
          <div>
            <h3 className="text-sm font-semibold text-navy-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-navy-500 rounded-full" />
              Incident Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Project <span className="text-red-400">*</span></label>
                <select value={form.projectId} onChange={e => set('projectId', e.target.value)} className="form-select" required disabled={!!ticket}>
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Execution ID <span className="text-red-400">*</span></label>
                <input type="text" value={form.executionId} onChange={e => set('executionId', e.target.value)}
                  className="form-input" placeholder="e.g. EX-2024-001" required />
              </div>

              <DateTimePicker
                label="Incident Start Time"
                required
                value={form.incidentStartTime}
                onChange={val => set('incidentStartTime', val)}
              />
              <DateTimePicker
                label="Incident End Time"
                value={form.incidentEndTime}
                onChange={val => set('incidentEndTime', val)}
              />
            </div>
            <div className="mt-4">
              <label className="form-label">Issue <span className="text-red-400">*</span></label>
              <textarea value={form.issue} onChange={e => set('issue', e.target.value)}
                className="form-textarea" rows={3} placeholder="Describe the issue..." required />
            </div>
          </div>

          {/* Section: Assignment */}
          <div>
            <h3 className="text-sm font-semibold text-navy-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-accent-500 rounded-full" />
              Assignment & Priority
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Assigned To <span className="text-red-400">*</span></label>
                <select value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} className="form-select" required>
                  <option value="">Select technician...</option>
                  {technicians.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Business Criticality <span className="text-red-400">*</span></label>
                <select value={form.businessCriticality} onChange={e => set('businessCriticality', e.target.value)} className="form-select" required>
                  <option value="">Select...</option>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Status <span className="text-red-400">*</span></label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className="form-select" required>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="form-label">Systems Impacted</label>
              <input type="text" value={form.systemsImpacted} onChange={e => set('systemsImpacted', e.target.value)}
                className="form-input" placeholder="e.g. ERP, CRM, Payment Gateway" />
            </div>
          </div>

          {/* Section: Technical Details */}
          <div>
            <h3 className="text-sm font-semibold text-navy-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-emerald-500 rounded-full" />
              Technical Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Interface Name</label>
                <input type="text" value={form.interfaceName} onChange={e => set('interfaceName', e.target.value)}
                  className="form-input" placeholder="e.g. SAP-Boomi Interface" />
              </div>
            </div>
            <div className="mt-4">
              <label className="form-label">RCA</label>
              <textarea value={form.rca} onChange={e => set('rca', e.target.value)}
                className="form-textarea" rows={3} placeholder="Root cause analysis..." />
            </div>
            <div className="mt-4">
              <label className="form-label">Fixes Details</label>
              <textarea value={form.fixesDetails} onChange={e => set('fixesDetails', e.target.value)}
                className="form-textarea" rows={3} placeholder="Details of the fix applied..." />
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-navy-100">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <><Loader size={14} className="spinner" /> Saving...</> : ticket ? 'Update Ticket' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
