import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Project } from '../types';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, Trash2, Loader, X } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const load = () => {
    api.get('/projects').then(r => setProjects(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/projects', { projectName });
      toast.success('Project created');
      setProjectName('');
      setShowModal(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/projects/${deleteTarget._id}`);
      toast.success('Project deleted');
      setDeleteTarget(null);
      setDeleteConfirm('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete project');
    }
  };

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Projects</h1>
          <p className="text-navy-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Add Project
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader size={24} className="spinner text-navy-400" /></div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderKanban size={48} className="mx-auto text-navy-200 mb-4" />
          <p className="text-navy-500 font-medium">No projects yet</p>
          <p className="text-navy-400 text-sm mt-1">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map(p => (
            <div key={p._id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center">
                  <FolderKanban size={18} className="text-navy-600" />
                </div>
                <button onClick={() => { setDeleteTarget(p); setDeleteConfirm(''); }} className="text-navy-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50">
                  <Trash2 size={15} />
                </button>
              </div>
              <h3 className="font-semibold text-navy-800">{p.projectName}</h3>
              <p className="text-xs text-navy-400 mt-1 font-mono">
                {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
              <h2 className="font-semibold text-navy-800">New Project</h2>
              <button onClick={() => setShowModal(false)} className="text-navy-400 hover:text-navy-600 p-1 rounded-lg hover:bg-navy-50">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="form-label">Project Name <span className="text-red-400">*</span></label>
                <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)}
                  className="form-input" placeholder="e.g. Boomi Integration v2" required autoFocus />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader size={14} className="spinner" /> : <Plus size={14} />}
                  {saving ? 'Creating...' : 'Create Project'}
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
            <h3 className="text-center font-semibold text-navy-800 mb-2">Delete Project?</h3>
            <p className="text-center text-navy-500 text-sm mb-6">
              Confirm you wish to delete <strong>{deleteTarget.projectName}</strong>. If deleted, all data for this project will be removed from the database and cannot be undone.
            </p>
            <div className="space-y-2 mb-6">
              <label className="form-label text-center">Type DELETE to confirm</label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                className="form-input text-center"
                placeholder="DELETE"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setDeleteTarget(null); setDeleteConfirm(''); }} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirm.trim() !== 'DELETE'}
                className="btn-danger flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
