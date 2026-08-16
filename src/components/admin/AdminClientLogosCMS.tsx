import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  AlertCircle,
  X,
  Building2,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MediaUploadDropzone } from './MediaUploadDropzone';
import { ClientLogoData, CreateClientLogoInput, UpdateClientLogoInput } from '../../types/clientLogo';
import {
  fetchAdminClientLogos,
  createAdminClientLogo,
  updateAdminClientLogo,
  deleteAdminClientLogo,
  reorderAdminClientLogos,
} from '../../services/clientLogo.service';

export const AdminClientLogosCMS: React.FC = () => {
  const [logos, setLogos] = useState<ClientLogoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Editor Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    id?: string;
    name: string;
    logoUrl: string;
    category: string;
    isActive: boolean;
    displayOrder: number;
  }>({
    name: '',
    logoUrl: '',
    category: 'General Corporate',
    isActive: true,
    displayOrder: 1,
  });

  // Delete Confirm Modal State
  const [deletingLogo, setDeletingLogo] = useState<ClientLogoData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const loadLogos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminClientLogos();
      setLogos(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load client logos from server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogos();
  }, []);

  const handleOpenAdd = () => {
    setIsEditingExisting(false);
    setEditingItem({
      name: '',
      logoUrl: '',
      category: 'General Corporate',
      isActive: true,
      displayOrder: logos.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ClientLogoData) => {
    setIsEditingExisting(true);
    setEditingItem({
      id: item.id,
      name: item.name,
      logoUrl: item.logoUrl,
      category: item.category || 'General Corporate',
      isActive: item.isActive,
      displayOrder: item.displayOrder,
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.name.trim()) {
      setError('Client / Enterprise Name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isEditingExisting && editingItem.id) {
        const updateInput: UpdateClientLogoInput = {
          name: editingItem.name,
          logoUrl: editingItem.logoUrl,
          category: editingItem.category,
          isActive: editingItem.isActive,
          displayOrder: editingItem.displayOrder,
        };
        const updated = await updateAdminClientLogo(editingItem.id, updateInput);
        setLogos((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        showToast(`Updated "${updated.name}" successfully.`);
      } else {
        const createInput: CreateClientLogoInput = {
          name: editingItem.name,
          logoUrl: editingItem.logoUrl,
          category: editingItem.category,
          isActive: editingItem.isActive,
          displayOrder: editingItem.displayOrder,
        };
        const created = await createAdminClientLogo(createInput);
        setLogos((prev) => [...prev, created].sort((a, b) => a.displayOrder - b.displayOrder));
        showToast(`Created client logo "${created.name}" successfully.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save client logo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (item: ClientLogoData) => {
    try {
      const updated = await updateAdminClientLogo(item.id, {
        isActive: !item.isActive,
      });
      setLogos((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      showToast(`${item.name} is now ${updated.isActive ? 'Active (Public)' : 'Hidden'}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to update visibility status');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === logos.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...logos];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    // Optimistic UI update
    setLogos(reordered.map((item, idx) => ({ ...item, displayOrder: idx + 1 })));

    try {
      const orderedIds = reordered.map((l) => l.id);
      const serverUpdated = await reorderAdminClientLogos(orderedIds);
      setLogos(serverUpdated);
      showToast('Client logo sequence order persisted.');
    } catch (err: any) {
      setError('Failed to persist order to server. Reloading...');
      loadLogos();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLogo) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteAdminClientLogo(deletingLogo.id);
      const deletedName = deletingLogo.name;
      setLogos((prev) => prev.filter((l) => l.id !== deletingLogo.id));
      setDeletingLogo(null);
      showToast(`Removed "${deletedName}" successfully.`);
      try {
        const refreshed = await fetchAdminClientLogos();
        setLogos(refreshed);
      } catch {
        // Optimistic state is already updated
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete client logo');
    } finally {
      setIsDeleting(false);
    }
  };

  const activeCount = logos.filter((l) => l.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-orange-500" />
              Client & Enterprise Logos CMS
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {logos.length} Total ({activeCount} Public)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage corporate client emblems, active visibility, and continuous marquee ordering on the homepage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadLogos()}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Reload Client Logos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Client Logo
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Information Banner */}
      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-start gap-3 text-xs text-slate-400">
        <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-200">Infinite Marquee Showcase Guarantee</p>
          <p>
            The public website renders all active logos in a continuous horizontal marquee loop. If custom image media is not uploaded, the system renders a clean corporate badge with high-contrast typography so logos never appear blank.
          </p>
        </div>
      </div>

      {/* Grid of Logos */}
      {isLoading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">Loading client logos catalog...</p>
        </div>
      ) : logos.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No client logos found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click "Add Client Logo" to add your first corporate enterprise client.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {logos.map((item, idx) => (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded">
                      #{item.displayOrder}
                    </span>
                    <span className="text-xs font-bold text-white truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 border ${
                      item.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {item.isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>

                {/* Logo Preview Canvas */}
                <div className="w-full h-24 bg-slate-950 border border-slate-800/80 rounded-lg flex items-center justify-center overflow-hidden mb-3 p-3 group">
                  {item.logoUrl ? (
                    <img
                      src={item.logoUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-center px-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 font-black text-xs mb-1">
                        {item.name.charAt(0)}
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400 truncate max-w-[180px]">
                        {item.name}
                      </p>
                    </div>
                  )}
                </div>

                {item.category && (
                  <div className="mb-3">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {item.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions & Reordering */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMoveOrder(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveOrder(idx, 'down')}
                    disabled={idx === logos.length - 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-orange-400 ml-1.5 px-2 py-1 rounded hover:bg-slate-800/60 transition-colors"
                  >
                    {item.isActive ? (
                      <span className="flex items-center gap-1 text-slate-400 hover:text-slate-300">
                        <EyeOff className="w-3 h-3" /> Hide
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Eye className="w-3 h-3" /> Show
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Edit Logo"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingLogo(item)}
                    className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 transition-colors"
                    title="Delete Logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-orange-500" />
                {isEditingExisting ? 'Edit Client Logo' : 'Add New Client Logo'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
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
                  placeholder="e.g. Razorpay Software"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Sector / Category
                  </label>
                  <input
                    type="text"
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    placeholder="e.g. Fintech, Retail, Healthcare"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Public Visibility
                  </label>
                  <select
                    value={editingItem.isActive ? 'active' : 'inactive'}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, isActive: e.target.value === 'active' })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                  >
                    <option value="active">Active (Visible on public marquee)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Native Media Upload Dropzone */}
              <div className="pt-1">
                <MediaUploadDropzone
                  label="Client Corporate Logo Emblem"
                  helperText="Upload official company logo (PNG, SVG, WEBP with transparent background recommended). Size limit: 5MB."
                  category="logos"
                  accept="image"
                  maxSizeMB={5}
                  currentValue={editingItem.logoUrl}
                  onUploaded={(url) => setEditingItem({ ...editingItem, logoUrl: url })}
                  onRemove={() => setEditingItem({ ...editingItem, logoUrl: '' })}
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-2"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isEditingExisting ? 'Save Changes' : 'Create Logo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletingLogo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden space-y-4 animate-fadeIn">
            <button
              onClick={() => !isDeleting && setDeletingLogo(null)}
              disabled={isDeleting}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-100">
                  Delete &ldquo;{deletingLogo.name}&rdquo;?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are you sure you want to permanently delete this client logo from the database? Other logos and media files will remain unaffected.
                </p>
                <div className="mt-3 p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-400">
                  <span className="text-slate-500 font-medium">Logo ID: </span>
                  <code className="text-orange-400 font-mono">{deletingLogo.id}</code>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingLogo(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Logo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
