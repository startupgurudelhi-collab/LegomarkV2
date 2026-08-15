import React, { useState, useEffect } from 'react';
import { AdminCategory } from '../../types/adminService';
import { adminServiceApi } from '../../services/adminService.service';
import {
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Layers,
  Building2,
  ShieldCheck,
  FileText,
  Landmark,
  Scale,
  Briefcase,
  Award,
  Globe,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged: () => void;
}

const AVAILABLE_ICONS = [
  'Building2',
  'ShieldCheck',
  'FileText',
  'Landmark',
  'Scale',
  'Briefcase',
  'Award',
  'Globe',
  'DollarSign',
  'TrendingUp',
  'Layers',
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  onCategoriesChanged,
}) => {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    shortLabel: '',
    description: '',
    iconName: 'Building2',
    isActive: true,
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminServiceApi.getAllCategories();
      // Sort by display order
      const sorted = [...data].sort((a, b) => a.displayOrder - b.displayOrder);
      setCategories(sorted);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const handleStartCreate = () => {
    setEditingId(null);
    setIsCreating(true);
    setFormData({
      id: '',
      name: '',
      shortLabel: '',
      description: '',
      iconName: 'Building2',
      isActive: true,
    });
  };

  const handleStartEdit = (cat: AdminCategory) => {
    setIsCreating(false);
    setEditingId(cat.id);
    setFormData({
      id: cat.id,
      name: cat.name,
      shortLabel: cat.shortLabel || cat.name,
      description: cat.description || '',
      iconName: cat.iconName || 'Building2',
      isActive: cat.isActive,
    });
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Category name is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (isCreating) {
        // Generate slug ID if not provided
        const slugId = formData.id.trim()
          ? formData.id.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
          : formData.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        await adminServiceApi.createCategory({
          id: slugId,
          name: formData.name.trim(),
          shortLabel: formData.shortLabel.trim() || formData.name.trim(),
          description: formData.description.trim() || undefined,
          iconName: formData.iconName,
          isActive: formData.isActive,
          displayOrder: categories.length,
        });
      } else if (editingId) {
        await adminServiceApi.updateCategory(editingId, {
          name: formData.name.trim(),
          shortLabel: formData.shortLabel.trim() || formData.name.trim(),
          description: formData.description.trim() || undefined,
          iconName: formData.iconName,
          isActive: formData.isActive,
        });
      }

      setIsCreating(false);
      setEditingId(null);
      await loadCategories();
      onCategoriesChanged();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (cat: AdminCategory) => {
    try {
      setError(null);
      await adminServiceApi.updateCategoryStatus(cat.id, !cat.isActive);
      await loadCategories();
      onCategoriesChanged();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle category status');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newCategories = [...categories];
    const [moved] = newCategories.splice(index, 1);
    newCategories.splice(targetIndex, 0, moved);

    const reorderPayload = newCategories.map((c, idx) => ({
      id: c.id,
      displayOrder: idx,
    }));

    setCategories(newCategories);

    try {
      await adminServiceApi.reorderCategories(reorderPayload);
      onCategoriesChanged();
    } catch (err: any) {
      setError(err.message || 'Failed to save reorder');
      await loadCategories();
    }
  };

  const handleDelete = async (cat: AdminCategory) => {
    if (cat.serviceCount && cat.serviceCount > 0) {
      setError(`Cannot delete category '${cat.name}' because it contains ${cat.serviceCount} services. Move or delete the services first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the category '${cat.name}'?`)) {
      return;
    }

    try {
      setError(null);
      await adminServiceApi.deleteCategory(cat.id);
      await loadCategories();
      onCategoriesChanged();
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0B132B] border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Practice Area & Category Management</h3>
              <p className="text-xs text-slate-400">Organize service domains and header navigation structure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form when creating or editing */}
          {(isCreating || editingId) && (
            <form onSubmit={handleSave} className="p-4 bg-slate-900/80 border border-orange-500/30 rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-sm font-semibold text-orange-400">
                  {isCreating ? 'Create New Practice Area Category' : `Edit Category: ${formData.name}`}
                </span>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category Name <span className="text-orange-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Company Registration"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Short Menu Label <span className="text-slate-400 font-normal">(Mega Menu)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.shortLabel}
                    onChange={(e) => setFormData({ ...formData, shortLabel: e.target.value })}
                    placeholder="e.g. Incorporation"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {isCreating && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Category Slug / ID <span className="text-slate-400 font-normal">(Auto-generated if blank)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      placeholder="e.g. company-registration"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500 font-mono text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Lucide Icon</label>
                  <select
                    value={formData.iconName}
                    onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                  >
                    {AVAILABLE_ICONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Subtitle</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. End-to-end statutory entity formation and registrations in India"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-500 bg-slate-950 border-slate-700 focus:ring-orange-500"
                  />
                  <span>Active in catalogue & navigation</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Category
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Action Bar */}
          {!isCreating && !editingId && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                {categories.length} Categories Configured
              </span>
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Category
              </button>
            </div>
          )}

          {/* Categories List */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
              <span className="text-xs">Loading practice area categories...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No categories found. Click 'Add Category' to create one.
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat, index) => (
                <div
                  key={cat.id}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-4 ${
                    cat.isActive
                      ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-900/20 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveOrder(index, 'up')}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-20 transition"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === categories.length - 1}
                        onClick={() => handleMoveOrder(index, 'down')}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-20 transition"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Icon & Details */}
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                      <Layers className="w-4 h-4 text-orange-400" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100 truncate">{cat.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {cat.id}
                        </span>
                        {!cat.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate flex items-center gap-3 mt-0.5">
                        <span>Label: {cat.shortLabel || cat.name}</span>
                        <span>•</span>
                        <span>{cat.serviceCount ?? 0} Services</span>
                        {cat.description && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-xs">{cat.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(cat)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                        cat.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      disabled={(cat.serviceCount || 0) > 0}
                      className="p-1.5 rounded-lg border border-slate-800 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 disabled:opacity-20 disabled:pointer-events-none transition"
                      title={
                        (cat.serviceCount || 0) > 0
                          ? 'Cannot delete category with associated services'
                          : 'Delete Category'
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
