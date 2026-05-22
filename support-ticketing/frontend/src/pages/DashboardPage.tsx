import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { DashboardSummary, Ticket } from '../types';
import { Ticket as TicketIcon, AlertCircle, Clock, CheckCircle, Loader, TrendingUp, PauseCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    'Open': 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    'On Hold': 'bg-purple-100 text-purple-700',
    'Resolved': 'bg-emerald-100 text-emerald-700',
    'Closed': 'bg-gray-100 text-gray-600',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

const priorityBadge = (p: string) => {
  if (p === 'P1') return 'bg-red-100 text-red-700 border border-red-200';
  if (p === 'P2') return 'bg-orange-100 text-orange-700 border border-orange-200';
  if (p === 'P3') return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-600';
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader size={24} className="spinner text-navy-400" />
    </div>
  );

  const stats = [
    { label: 'Total Tickets', value: data?.total ?? 0, icon: TicketIcon, color: 'bg-navy-600', light: 'bg-navy-50 text-navy-600' },
    { label: 'Open', value: data?.open ?? 0, icon: AlertCircle, color: 'bg-blue-500', light: 'bg-blue-50 text-blue-600' },
    { label: 'In Progress', value: data?.inProgress ?? 0, icon: Clock, color: 'bg-amber-500', light: 'bg-amber-50 text-amber-600' },
    { label: 'On Hold', value: data?.onHold ?? 0, icon: PauseCircle, color: 'bg-purple-500', light: 'bg-purple-50 text-purple-600' },
    { label: 'Resolved', value: data?.resolved ?? 0, icon: CheckCircle, color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-600' },
    { label: 'Closed', value: data?.closed ?? 0, icon: TrendingUp, color: 'bg-gray-500', light: 'bg-gray-50 text-gray-600' },
  ];

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>
        <p className="text-navy-500 text-sm mt-1">Welcome back, {user?.split('@')[0]}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map(({ label, value, icon: Icon, light }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl ${light} flex items-center justify-center mb-3`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-navy-900">{value}</p>
            <p className="text-xs text-navy-500 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent Tickets */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-navy-100">
          <h2 className="font-semibold text-navy-800">Recent Tickets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50">
                {['#', 'Project', 'Issue', 'Assigned To', 'Priority', 'Status', 'Created'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.recentTickets.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-navy-400">No tickets yet</td></tr>
              ) : data?.recentTickets.map((t: Ticket) => (
                <tr key={t._id} className="border-t border-navy-50 hover:bg-navy-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-navy-400">#{t.serialNumber}</td>
                  <td className="px-4 py-3 text-navy-700 font-medium">{(t.projectId as any)?.projectName ?? '—'}</td>
                  <td className="px-4 py-3 text-navy-800 max-w-xs truncate">{t.issue}</td>
                  <td className="px-4 py-3 text-navy-600">{(t.assignedTo as any)?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${priorityBadge(t.businessCriticality)}`}>
                      {t.businessCriticality}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${statusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy-400 text-xs font-mono">{t.incidentStartTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
