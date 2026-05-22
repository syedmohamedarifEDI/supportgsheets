import React from 'react';
import { Ticket } from '../../types';
import { X, Clock, User, CheckCircle } from 'lucide-react';

interface TicketDetailProps {
  ticket: Ticket;
  onClose: () => void;
}

const statusColor = (s: string) => {
  const map: Record<string, string> = {
    'Open': 'bg-blue-500',
    'In Progress': 'bg-amber-500',
    'On Hold': 'bg-purple-500',
    'Resolved': 'bg-emerald-500',
    'Closed': 'bg-gray-400',
  };
  return map[s] || 'bg-gray-400';
};

const priorityStyle = (p: string) => {
  if (p === 'P1') return 'bg-red-100 text-red-700 border border-red-200';
  if (p === 'P2') return 'bg-orange-100 text-orange-700 border border-orange-200';
  if (p === 'P3') return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-600';
};

export default function TicketDetail({ ticket, onClose }: TicketDetailProps) {
  const project = typeof ticket.projectId === 'object' ? (ticket.projectId as any).projectName : '—';
  const tech = typeof ticket.assignedTo === 'object' ? (ticket.assignedTo as any).name : '—';

  const fields = [
    { label: 'Project', value: project },
    { label: 'Execution ID', value: ticket.executionId, mono: true },
    { label: 'Interface', value: ticket.interfaceName || '—' },
    { label: 'Systems Impacted', value: ticket.systemsImpacted || '—' },
    { label: 'Start Time', value: ticket.incidentStartTime, mono: true },
    { label: 'End Time', value: ticket.incidentEndTime || '—', mono: true },
    { label: 'Last Updated By', value: ticket.lastUpdatedBy || '—' },
    { label: 'Last Updated At', value: ticket.lastUpdatedAt || '—', mono: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
          <div className="flex items-center gap-3">
            <span className="font-mono text-navy-400 text-sm">#{ticket.serialNumber}</span>
            <h2 className="font-semibold text-navy-800">Ticket Details</h2>
          </div>
          <button onClick={onClose} className="text-navy-400 hover:text-navy-600 p-1 rounded-lg hover:bg-navy-50">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${priorityStyle(ticket.businessCriticality)}`}>
              {ticket.businessCriticality}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-white ${statusColor(ticket.status)}`}>
              {ticket.status}
            </span>
            <span className="text-sm text-navy-500">Assigned to <strong>{tech}</strong></span>
          </div>

          {/* Issue */}
          <div className="p-4 bg-navy-50 rounded-xl">
            <p className="text-xs font-semibold text-navy-400 uppercase tracking-wide mb-2">Issue</p>
            <p className="text-navy-800 text-sm leading-relaxed">{ticket.issue}</p>
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-2 gap-3">
            {fields.map(({ label, value, mono }) => (
              <div key={label} className="bg-navy-50 rounded-xl p-3">
                <p className="text-xs text-navy-400 font-medium mb-1">{label}</p>
                <p className={`text-navy-800 text-sm ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
              </div>
            ))}
          </div>

          {/* RCA */}
          {ticket.rca && (
            <div>
              <p className="text-xs font-semibold text-navy-400 uppercase tracking-wide mb-2">RCA</p>
              <p className="text-navy-700 text-sm leading-relaxed bg-navy-50 p-4 rounded-xl">{ticket.rca}</p>
            </div>
          )}

          {/* Fixes */}
          {ticket.fixesDetails && (
            <div>
              <p className="text-xs font-semibold text-navy-400 uppercase tracking-wide mb-2">Fixes Details</p>
              <p className="text-navy-700 text-sm leading-relaxed bg-navy-50 p-4 rounded-xl">{ticket.fixesDetails}</p>
            </div>
          )}

          {/* Status Timeline */}
          <div>
            <p className="text-xs font-semibold text-navy-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Clock size={13} /> Status History
            </p>
            <div className="space-y-0">
              {ticket.statusHistory?.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full ${statusColor(h.status)} flex items-center justify-center shrink-0`}>
                      <CheckCircle size={14} className="text-white" />
                    </div>
                    {i < ticket.statusHistory.length - 1 && (
                      <div className="w-0.5 h-6 bg-navy-200 mt-0.5" />
                    )}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-navy-800">{h.status}</span>
                      <span className="text-xs text-navy-400 flex items-center gap-1"><User size={11} />{h.changedBy}</span>
                    </div>
                    <span className="text-xs text-navy-400 font-mono">{h.changedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
