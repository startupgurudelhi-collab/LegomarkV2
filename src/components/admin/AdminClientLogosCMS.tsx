import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Trash2, Edit2, CheckCircle2, XCircle, ArrowUp, ArrowDown, Save, X } from 'lucide-react';
import { MediaUploadDropzone } from './MediaUploadDropzone';

export interface ClientLogoItem {
  id: string;
  name: string;
  logoUrl: string;
  isActive: boolean;
  displayOrder: number;
}

const STORAGE_KEY = 'legomark_client_logos_v1';

const INITIAL_LOGOS: ClientLogoItem[] = [
  { id: 'logo-1', name: 'Tech Innovations India', logoUrl: '', isActive: true, displayOrder: 1 },
  { id: 'logo-2', name: 'Bharat Logistics Pvt Ltd', logoUrl: '', isActive: true, displayOrder: 2 },
  { id: 'logo-3', name: 'Vanguard Retail Enterprises', logoUrl: '', isActive: true, displayOrder: 3 },
  { id: 'logo-4', name: 'Apex Healthcare Labs', logoUrl: '', isActive: true, displayOrder: 4 },
];

export const AdminClientLogosCMS: React.FC = () => {
  const [logos, setLogos] = useState<ClientLogoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_LOGOS;
  });

  const [editingItem, setEditingItem] = useState<ClientLogoItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const saveToStorage = (updated: ClientLogoItem[]) => {
    setLogos(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingItem({
      id: `logo-${Date.now()}`,
      name: '',
      logoUrl: '',
      isActive: true,
      displayOrder: logos.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ClientLogoItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editingItem.name.trim()) return;

    let updated: ClientLogoItem[];
    const exists = logos.some((l) => l.id === editingItem.id);
    if (exists) {
      updated = logos.map((l) => (l.id === editingItem.id ? editingItem : l));
    } else {
      updated = [...logos, editingItem];
    }
    saveToStorage(updated);
    setIsModalOpen(false);
    setEditingItem(null);
    showToast('Client logo saved successfully.');
  };

  const handleDelete = (id: string) => {
    const updated = logos.filter((l) => l.id !== id);
    saveToStorage(updated);
    showToast('Client logo removed.');
  };

  const handleToggleStatus = (id: string) => {
    const updated = logos.map((l) => (l.id === id ? { ...l, isActive: !l.isActive } : l));
    saveToStorage(updated);
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === logos.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...logos];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    // re-assign display orders
    const updated = reordered.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    saveToStorage(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-orange-500" />
            Client Logos Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage corporate client logos, display ordering, and public visibility.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Client Logo
        </button>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {logos.map((item, idx) => (
          <div
            key={item.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-white truncate">{item.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    item.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Logo Preview */}
              <div className="w-full h-28 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center overflow-hidden mb-3 p-2">
                {item.logoUrl ? (
                  <img
                    src={item.logoUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-500">
                    <Briefcase className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">
                      Badge View: {item.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions & Reordering */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMoveOrder(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMoveOrder(idx, 'down')}
                  disabled={idx === logos.length - 1}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleToggleStatus(item.id)}
                  className="text-[11px] font-semibold text-slate-400 hover:text-orange-400 ml-2"
                >
                  {item.isActive ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Edit Logo"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-md bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 transition-colors"
                  title="Delete Logo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-orange-500" />
                {editingItem.id ? 'Edit Client Logo' : 'Add Client Logo'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Client / Enterprise Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="e.g. Apex Healthcare Labs"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Visibility
                </label>
                <select
                  value={editingItem.isActive ? 'active' : 'inactive'}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, isActive: e.target.value === 'active' })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                >
                  <option value="active">Active (Visible on public website)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>

              {/* Native Upload ONLY for Client Logo */}
              <div className="pt-2">
                <MediaUploadDropzone
                  label="Client Corporate Logo (Native Upload Only)"
                  helperText="Upload official company emblem (PNG, SVG, WEBP with transparent background recommended)"
                  category="logos"
                  accept="image"
                  currentValue={editingItem.logoUrl}
                  onUploaded={(url) => setEditingItem({ ...editingItem, logoUrl: url })}
                  onRemove={() => setEditingItem({ ...editingItem, logoUrl: '' })}
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-sm"
                >
                  Save Logo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
