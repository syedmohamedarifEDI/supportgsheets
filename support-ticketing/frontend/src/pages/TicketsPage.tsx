import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { Ticket, Project, Technician, TicketListResponse } from '../types';
import toast from 'react-hot-toast';
import TicketForm from '../components/tickets/TicketForm';
import TicketDetail from '../components/tickets/TicketDetail';
import {
  Plus, Search, Download, Pencil, Trash2, Eye, Loader,
  ChevronLeft, ChevronRight, ArrowUpDown, Filter
} from 'lucide-react';

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    'Open': 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    'On Hold': 'bg-purple-100 text-purple-700',
    'Resolved': 'bg-emerald-100 text-emerald-700',
    'Closed': 'bg-gray-100 text-gray-600',
  };
  return map[s] || 'bg-gray-100 text-gray-600';
};

const priorityBadge = (p: string) => {
  if (p === 'P1') return 'bg-red-100 text-red-700 border border-red-200 font-bold';
  if (p === 'P2') return 'bg-orange-100 text-orange-700 border border-orange-200 font-bold';
  if (p === 'P3') return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-600';
};

const STATUSES = ['', 'Open', 'In Progress', 'On Hold', 'Resolved', 'Closed'];

export default function TicketsPage() {
  const [data, setData] = useState<TicketListResponse | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({ projectId: '', status: '', assignedTo: '', page: 1, limit: 15, sortBy: 'serialNumber', sortOrder: 'desc' });

  const [showForm, setShowForm] = useState(false);
  const [editTicket, setEditTicket] = useState<Ticket | null>(null);
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);
  const [exportProject, setExportProject] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  const loadTickets = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.projectId) params.set('projectId', filters.projectId);
    if (filters.status) params.set('status', filters.status);
    if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
    params.set('page', filters.page.toString());
    params.set('limit', filters.limit.toString());
    params.set('sortBy', filters.sortBy);
    params.set('sortOrder', filters.sortOrder);

    api.get(`/tickets?${params}`).then(r => setData(r.data)).finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data));
    api.get('/technicians').then(r => setTechnicians(r.data));
  }, []);

  const setFilter = (key: string, value: string) => {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/tickets/${deleteTarget._id}`);
      toast.success('Ticket deleted');
      setDeleteTarget(null);
      loadTickets();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleExport = async () => {
    if (!exportProject) { toast.error('Select a project to export'); return; }
    setExporting(true);
    try {
      const res = await api.get(`/export/tickets/${exportProject}`, { responseType: 'blob' });
      const proj = projects.find(p => p._id === exportProject);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${proj?.projectName || 'export'}_Tickets.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded');
      setShowExportModal(false);
    } catch (err: any) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = data?.pages || 1;

  return (
    <div className="p-6 space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Tickets</h1>
          <p className="text-navy-500 text-sm mt-1">{data?.total ?? 0} total tickets</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowExportModal(true)} className="btn-secondary">
            <Download size={15} /> Export Excel
          </button>
          <button onClick={() => { setEditTicket(null); setShowForm(true); }} className="btn-primary">
            <Plus size={15} /> New Ticket
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-navy-500">
            <Filter size={15} />
            <span className="text-xs font-semibold uppercase tracking-wide">Filters</span>
          </div>
          <select value={filters.projectId} onChange={e => setFilter('projectId', e.target.value)}
            className="form-select !py-2 !w-auto min-w-[160px] text-sm">
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilter('status', e.target.value)}
            className="form-select !py-2 !w-auto min-w-[140px] text-sm">
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <select value={filters.assignedTo} onChange={e => setFilter('assignedTo', e.target.value)}
            className="form-select !py-2 !w-auto min-w-[160px] text-sm">
            <option value="">All Technicians</option>
            {technicians.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          {(filters.projectId || filters.status || filters.assignedTo) && (
            <button onClick={() => setFilters(f => ({ ...f, projectId: '', status: '', assignedTo: '', page: 1 }))}
              className="text-xs text-navy-400 hover:text-navy-600 underline">Clear filters</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50">
                {[
                  { label: '#', key: 'serialNumber' },
                  { label: 'Project', key: '' },
                  { label: 'Issue', key: '' },
                  { label: 'Execution ID', key: 'executionId' },
                  { label: 'Assigned To', key: '' },
                  { label: 'Priority', key: 'businessCriticality' },
                  { label: 'Status', key: 'status' },
                  { label: 'Start Time', key: 'incidentStartTime' },
                  { label: '', key: '' },
                ].map(({ label, key }, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide whitespace-nowrap">
                    {key ? (
                      <button onClick={() => setFilters(f => ({ ...f, sortBy: key, sortOrder: f.sortBy === key && f.sortOrder === 'asc' ? 'desc' : 'asc', page: 1 }))}
                        className="flex items-center gap-1 hover:text-navy-800 transition-colors">
                        {label} <ArrowUpDown size={11} />
                      </button>
                    ) : label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-16">
                  <Loader size={20} className="spinner text-navy-400 mx-auto" />
                </td></tr>
              ) : data?.tickets.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16 text-navy-400">No tickets found</td></tr>
              ) : data?.tickets.map((t: Ticket) => (
                <tr key={t._id} className="border-t border-navy-50 hover:bg-navy-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-navy-400">#{t.serialNumber}</td>
                  <td className="px-4 py-3 text-navy-700 font-medium whitespace-nowrap">
                    {(t.projectId as any)?.projectName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-navy-800 max-w-[200px] truncate">{t.issue}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-500">{t.executionId}</td>
                  <td className="px-4 py-3 text-navy-600 whitespace-nowrap">{(t.assignedTo as any)?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs ${priorityBadge(t.businessCriticality)}`}>
                      {t.businessCriticality}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${statusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy-400 text-xs font-mono whitespace-nowrap">{t.incidentStartTime}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setViewTicket(t)} className="p-1.5 rounded-lg text-navy-400 hover:text-navy-600 hover:bg-navy-100 transition-all" title="View">
                        <Eye size={13} />
                      </button>
                      <button onClick={() => { setEditTicket(t); setShowForm(true); }} className="p-1.5 rounded-lg text-navy-400 hover:text-navy-600 hover:bg-navy-100 transition-all" title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget(t)} className="p-1.5 rounded-lg text-navy-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(data?.pages ?? 0) > 1 && (
          <div className="px-4 py-3 border-t border-navy-100 flex items-center justify-between">
            <p className="text-xs text-navy-400">
              Page {filters.page} of {totalPages} • {data?.total} results
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                disabled={filters.page <= 1}
                className="p-1.5 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 transition-all">
                <ChevronLeft size={14} />
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = Math.max(1, Math.min(filters.page - 2, totalPages - 4)) + i;
                return (
                  <button key={page} onClick={() => setFilters(f => ({ ...f, page }))}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${page === filters.page ? 'bg-navy-600 text-white' : 'border border-navy-200 text-navy-600 hover:bg-navy-50'}`}>
                    {page}
                  </button>
                );
              })}
              <button onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                disabled={filters.page >= totalPages}
                className="p-1.5 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Form Modal */}
      {showForm && (
        <TicketForm ticket={editTicket} onClose={() => setShowForm(false)} onSaved={loadTickets} />
      )}

      {/* View Detail Modal */}
      {viewTicket && (
        <TicketDetail ticket={viewTicket} onClose={() => setViewTicket(null)} />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 fade-in p-6">
            <h3 className="font-semibold text-navy-800 mb-4">Download Records by Project</h3>
            <div className="mb-4">
              <label className="form-label">Select Project</label>
              <select value={exportProject} onChange={e => setExportProject(e.target.value)} className="form-select">
                <option value="">Choose project...</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowExportModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleExport} disabled={exporting || !exportProject} className="btn-success flex-1 justify-center">
                {exporting ? <><Loader size={14} className="spinner" /> Exporting...</> : <><Download size={14} /> Download</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 fade-in p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-center font-semibold text-navy-800 mb-2">Delete Ticket?</h3>
            <p className="text-center text-navy-500 text-sm mb-6">
              Ticket <strong>#{deleteTarget.serialNumber}</strong> will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleDelete} className="btn-danger flex-1 justify-center">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
