import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
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
  Eye,
  EyeOff,
  FolderOpen,
  UploadCloud,
  Search,
  Image as ImageIcon,
} from 'lucide-react';
import { MediaUploadDropzone } from './MediaUploadDropzone';
import { AssociationLogoData } from '../../types/associationLogo';
import {
  fetchAdminAssociationLogos,
  createAdminAssociationLogo,
  updateAdminAssociationLogo,
  deleteAdminAssociationLogo,
  reorderAdminAssociationLogos,
} from '../../services/associationLogo.service';
import { fetchMediaAssets, MediaAsset } from '../../services/adminMedia.service';

export const AdminAssociationLogosCMS: React.FC = () => {
  const [logos, setLogos] = useState<AssociationLogoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Editor Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [logoSourceTab, setLogoSourceTab] = useState<'library' | 'upload'>('library');
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
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
    category: 'Professional Association',
    isActive: true,
    displayOrder: 1,
  });

  // Delete Confirm Modal State
  const [deletingLogo, setDeletingLogo] = useState<AssociationLogoData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const loadMediaAssets = async () => {
    setIsLoadingMedia(true);
    try {
      const assets = await fetchMediaAssets();
      setMediaAssets(assets);
    } catch {
      // Non-blocking for modal
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const loadLogos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminAssociationLogos();
      setLogos(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load association logos from server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogos();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditingExisting(false);
    setEditingItem({
      name: '',
      logoUrl: '',
      category: 'Professional Association',
      isActive: true,
      displayOrder: logos.length + 1,
    });
    setIsModalOpen(true);
    loadMediaAssets();
  };

  const handleOpenEditModal = (item: AssociationLogoData) => {
    setIsEditingExisting(true);
    setEditingItem({
      id: item.id,
      name: item.name,
      logoUrl: item.logoUrl,
      category: item.category || 'Professional Association',
      isActive: item.isActive,
      displayOrder: item.displayOrder,
    });
    setIsModalOpen(true);
    loadMediaAssets();
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.name.trim()) {
      setError('Association or Organization Name is required');
      return;
    }
    if (!editingItem.logoUrl.trim()) {
      setError('Logo URL or Media Selection is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isEditingExisting && editingItem.id) {
        const updated = await updateAdminAssociationLogo(editingItem.id, {
          name: editingItem.name,
          logoUrl: editingItem.logoUrl,
          category: editingItem.category,
          isActive: editingItem.isActive,
          displayOrder: editingItem.displayOrder,
        });
        setLogos((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        showToast(`Association logo "${updated.name}" updated successfully.`);
      } else {
        const created = await createAdminAssociationLogo({
          name: editingItem.name,
          logoUrl: editingItem.logoUrl,
          category: editingItem.category,
          isActive: editingItem.isActive,
          displayOrder: editingItem.displayOrder,
        });
        setLogos((prev) => [...prev, created].sort((a, b) => a.displayOrder - b.displayOrder));
        showToast(`Association logo "${created.name}" created successfully.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save association logo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (item: AssociationLogoData) => {
    try {
      const nextActive = !item.isActive;
      const updated = await updateAdminAssociationLogo(item.id, { isActive: nextActive });
      setLogos((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      showToast(`Association logo is now ${nextActive ? 'Active' : 'Hidden'}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to update visibility status');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === logos.length - 1)
    ) {
      return;
    }

    const newLogos = [...logos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const [moved] = newLogos.splice(index, 1);
    newLogos.splice(targetIndex, 0, moved);

    const reorderedPayload = newLogos.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));

    setLogos(reorderedPayload);

    try {
      await reorderAdminAssociationLogos(
        reorderedPayload.map((l) => ({ id: l.id, displayOrder: l.displayOrder }))
      );
      showToast('Display order updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update display order');
      loadLogos();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLogo) return;
    setIsDeleting(true);
    try {
      await deleteAdminAssociationLogo(deletingLogo.id);
      setLogos((prev) => prev.filter((l) => l.id !== deletingLogo.id));
      showToast(`Association logo "${deletingLogo.name}" was deleted.`);
      setDeletingLogo(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete association logo');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl text-sm font-medium animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Trust Factor Management</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Association Logos CMS
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Manage official industry bodies, legal chambers, statutory councils, and professional associations displayed strictly in the "WE ARE ASSOCIATED" Trust Factor section. Completely separate from Client Logos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadLogos}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Association Logo</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-900/40 border border-red-800 rounded-xl flex items-center justify-between gap-3 text-red-200 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table / List Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mb-3" />
            <p className="text-sm">Loading association logos...</p>
          </div>
        ) : logos.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-4">
              <ShieldCheck className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-white">No Association Logos Configured</h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1.5 max-w-md mx-auto">
              No association logos have been added yet. When you add legitimate industry bodies or councils here, they will appear under "WE ARE ASSOCIATED" in the Trust Factor section.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Association Logo</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Order</th>
                  <th className="py-3 px-4 w-28 text-center">Logo Preview</th>
                  <th className="py-3 px-4">Organization / Body Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logos.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold text-slate-400">{item.displayOrder}</span>
                        <div className="flex flex-col ml-1">
                          <button
                            onClick={() => handleMoveOrder(idx, 'up')}
                            disabled={idx === 0}
                            className="p-0.5 text-slate-500 hover:text-white disabled:opacity-20"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveOrder(idx, 'down')}
                            disabled={idx === logos.length - 1}
                            className="p-0.5 text-slate-500 hover:text-white disabled:opacity-20"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="w-20 h-10 mx-auto bg-white rounded-lg p-1.5 flex items-center justify-center border border-slate-700 shadow-2xs">
                        {item.logoUrl ? (
                          <img
                            src={item.logoUrl}
                            alt={item.name}
                            className="max-h-7 max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No image</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{item.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                        {item.category || 'Professional Association'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                          item.isActive
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-900/60'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        {item.isActive ? (
                          <>
                            <Eye className="w-3 h-3 text-emerald-400" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-slate-400" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                          title="Edit Association Logo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingLogo(item)}
                          className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 rounded-lg transition-colors border border-red-900/50"
                          title="Delete Logo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {isEditingExisting ? 'Edit Association Logo' : 'Add Association Logo'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Organization / Association Name *
                </label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="e.g. Bar Council of India, ISO International, QCI India"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  placeholder="e.g. Statutory Council, Standards Body, Industry Chamber"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              {/* Logo Source Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Logo Asset *
                </label>

                <div className="flex gap-2 border-b border-slate-800 pb-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setLogoSourceTab('library')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      logoSourceTab === 'library'
                        ? 'bg-orange-600 text-white'
                        : 'text-slate-400 hover:text-white bg-slate-800/60'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Media Library</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoSourceTab('upload')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      logoSourceTab === 'upload'
                        ? 'bg-orange-600 text-white'
                        : 'text-slate-400 hover:text-white bg-slate-800/60'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload New</span>
                  </button>
                </div>

                {logoSourceTab === 'upload' ? (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <MediaUploadDropzone
                      category="logos"
                      currentValue={editingItem.logoUrl}
                      onUploaded={(uploadedUrl) => {
                        setEditingItem({ ...editingItem, logoUrl: uploadedUrl });
                        setLogoSourceTab('library');
                        loadMediaAssets();
                        showToast('Logo uploaded successfully.');
                      }}
                      onRemove={() => setEditingItem({ ...editingItem, logoUrl: '' })}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={assetSearchQuery}
                        onChange={(e) => setAssetSearchQuery(e.target.value)}
                        placeholder="Search media library..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl">
                      {mediaAssets
                        .filter((a) =>
                          a.name.toLowerCase().includes(assetSearchQuery.toLowerCase())
                        )
                        .map((asset) => (
                          <button
                            key={asset.id}
                            type="button"
                            onClick={() => setEditingItem({ ...editingItem, logoUrl: asset.url })}
                            className={`p-1.5 rounded-lg border text-center transition-all bg-white flex flex-col items-center justify-center ${
                              editingItem.logoUrl === asset.url
                                ? 'border-orange-500 ring-2 ring-orange-500/40'
                                : 'border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            <img
                              src={asset.url}
                              alt={asset.name}
                              className="max-h-8 max-w-full object-contain"
                            />
                            <span className="text-[9px] text-slate-700 truncate w-full mt-1">
                              {asset.name}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Direct URL input fallback */}
                <div className="mt-2">
                  <input
                    type="text"
                    value={editingItem.logoUrl}
                    onChange={(e) => setEditingItem({ ...editingItem, logoUrl: e.target.value })}
                    placeholder="Or enter direct image URL (https://...)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                    required
                  />
                </div>

                {/* Preview Box */}
                {editingItem.logoUrl && (
                  <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-4">
                    <div className="w-24 h-12 bg-white rounded-lg p-2 flex items-center justify-center border border-slate-700">
                      <img
                        src={editingItem.logoUrl}
                        alt="Preview"
                        className="max-h-8 max-w-full object-contain"
                      />
                    </div>
                    <div className="text-xs text-slate-400">
                      <span className="font-bold text-white block">Preview</span>
                      <span className="truncate block max-w-xs">{editingItem.logoUrl}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Switch */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="assoc-isActive"
                  checked={editingItem.isActive}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, isActive: e.target.checked })
                  }
                  className="rounded-sm border-slate-800 text-orange-600 focus:ring-orange-500 w-4 h-4 bg-slate-950"
                />
                <label htmlFor="assoc-isActive" className="text-xs font-semibold text-slate-300">
                  Publish to "WE ARE ASSOCIATED" section immediately
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{isEditingExisting ? 'Save Changes' : 'Create Logo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLogo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-950/60 text-red-400 border border-red-800 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete Association Logo?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete <span className="text-white font-bold">{deletingLogo.name}</span>? This action is permanent.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingLogo(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
