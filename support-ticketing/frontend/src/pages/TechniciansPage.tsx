import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Technician } from '../types';
import toast from 'react-hot-toast';
import { Plus, Users, Pencil, Trash2, Loader, X, Mail } from 'lucide-react';

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; tech: Technician | null }>({ open: false, tech: null });
  const [form, setForm] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Technician | null>(null);

  const load = () => {
    api.get('/technicians').then(r => setTechnicians(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ name: '', email: '' }); setModal({ open: true, tech: null }); };
  const openEdit = (t: Technician) => { setForm({ name: t.name, email: t.email }); setModal({ open: true, tech: t }); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.tech) {
        await api.put(`/technicians/${modal.tech._id}`, form);
        toast.success('Technician updated');
      } else {
        await api.post('/technicians', form);
        toast.success('Technician added');
      }
      setModal({ open: false, tech: null });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/technicians/${deleteTarget._id}`);
      toast.success('Technician deleted');
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Technicians</h1>
          <p className="text-navy-500 text-sm mt-1">{technicians.length} technician{technicians.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add Technician
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader size={24} className="spinner text-navy-400" /></div>
      ) : technicians.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={48} className="mx-auto text-navy-200 mb-4" />
          <p className="text-navy-500 font-medium">No technicians yet</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Added</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {technicians.map(t => (
                <tr key={t._id} className="border-t border-navy-50 hover:bg-navy-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-600 font-semibold text-sm">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-navy-800">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-navy-500">
                    {t.email ? (
                      <div className="flex items-center gap-1.5"><Mail size={13} className="text-navy-400" />{t.email}</div>
                    ) : <span className="text-navy-300">—</span>}
                  </td>
                  <td className="px-6 py-4 text-navy-400 text-xs font-mono">
                    {new Date((t as any).createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-navy-400 hover:text-navy-600 hover:bg-navy-100 transition-all">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(t)} className="p-1.5 rounded-lg text-navy-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
              <h2 className="font-semibold text-navy-800">{modal.tech ? 'Edit Technician' : 'Add Technician'}</h2>
              <button onClick={() => setModal({ open: false, tech: null })} className="text-navy-400 hover:text-navy-600 p-1 rounded-lg hover:bg-navy-50">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="form-label">Name <span className="text-red-400">*</span></label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="form-input" placeholder="Full name" required autoFocus />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="form-input" placeholder="email@example.com" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal({ open: false, tech: null })} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader size={14} className="spinner" /> : null}
                  {saving ? 'Saving...' : modal.tech ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
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
            <h3 className="text-center font-semibold text-navy-800 mb-2">Remove Technician?</h3>
            <p className="text-center text-navy-500 text-sm mb-6">Remove <strong>{deleteTarget.name}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleDelete} className="btn-danger flex-1 justify-center">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
