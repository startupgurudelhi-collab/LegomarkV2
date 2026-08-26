import React, { useState, useEffect, useCallback } from 'react';
import { AdminPackage, PackageFormData, ReorderItem } from '../../types/admin';
import {
  fetchAdminPackages,
  createAdminPackage,
  updateAdminPackage,
  toggleAdminPackageStatus,
  reorderAdminPackages,
  deleteAdminPackage,
} from '../../services/adminPackage.service';
import { PackageEditorModal } from './PackageEditorModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Package,
  Layers,
  Sparkles,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';

export const AdminPackagesPage: React.FC = () => {
  const [packagesList, setPackagesList] = useState<AdminPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Editor Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [packageToEdit, setPackageToEdit] = useState<AdminPackage | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<AdminPackage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reorder loading state
  const [isReordering, setIsReordering] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  // Load packages from database
  const loadPackages = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchAdminPackages();
      // Ensure sorted by displayOrder ASC
      const sorted = [...data].sort((a, b) => a.displayOrder - b.displayOrder);
      setPackagesList(sorted);
    } catch (err: any) {
      if (err.statusCode === 401) {
        window.location.href = '/admin/login';
        return;
      }
      setErrorMessage(err.message || 'Failed to load packages from database.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  // Open Create modal
  const handleOpenCreate = () => {
    setPackageToEdit(null);
    setIsEditorOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (pkg: AdminPackage) => {
    setPackageToEdit(pkg);
    setIsEditorOpen(true);
  };

  // Open Delete modal
  const handleOpenDelete = (pkg: AdminPackage) => {
    setPackageToDelete(pkg);
    setIsDeleteOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSavePackage = async (formData: PackageFormData, isEdit: boolean) => {
    setIsSaving(true);
    try {
      if (isEdit) {
        await updateAdminPackage(formData.id, formData);
        showToast(`✓ Package "${formData.name}" updated successfully.`);
      } else {
        await createAdminPackage(formData);
        showToast(`✓ Package "${formData.name}" created successfully.`);
      }
      await loadPackages();
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Status Toggle (Active / Inactive)
  const handleToggleStatus = async (pkg: AdminPackage) => {
    setTogglingId(pkg.id);
    const nextStatus = !pkg.isActive;
    try {
      await toggleAdminPackageStatus(pkg.id, nextStatus);
      showToast(
        `✓ Package "${pkg.name}" is now ${nextStatus ? 'ACTIVE' : 'INACTIVE'}.`
      );
      await loadPackages();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update package status.');
    } finally {
      setTogglingId(null);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!packageToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAdminPackage(packageToDelete.id);
      showToast(`✓ Package "${packageToDelete.name}" deleted successfully.`);
      setIsDeleteOpen(false);
      setPackageToDelete(null);
      await loadPackages();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete package.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Reordering with ↑ / ↓ buttons
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === packagesList.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reorderedList = [...packagesList];
    const temp = reorderedList[index];
    reorderedList[index] = reorderedList[targetIndex];
    reorderedList[targetIndex] = temp;

    // Assign new sequential displayOrder values: 0, 1, 2, ...
    const reorderPayload: ReorderItem[] = reorderedList.map((pkg, idx) => ({
      id: pkg.id,
      displayOrder: idx,
    }));

    setIsReordering(true);
    try {
      await reorderAdminPackages(reorderPayload);
      showToast('✓ Package order updated and persisted to database.');
      await loadPackages();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to persist package ordering.');
    } finally {
      setIsReordering(false);
    }
  };

  // Filter & Search
  const filteredPackages = packagesList.filter((pkg) => {
    const matchesSearch =
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.tagline && pkg.tagline.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && pkg.isActive) ||
      (statusFilter === 'inactive' && !pkg.isActive);

    return matchesSearch && matchesStatus;
  });

  const formatPrice = (amount: string, override: string | null) => {
    if (override && override.trim()) return override;
    const num = parseFloat(amount);
    return isNaN(num) ? amount : `₹${num.toLocaleString('en-IN')}`;
  };

  const formatBilling = (type: string) => {
    switch (type) {
      case 'one_time':
        return 'One Time';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      case 'custom':
        return 'Custom';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-emerald-950 border border-emerald-500/40 text-emerald-200 text-xs px-4 py-3 rounded-xl shadow-2xl animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{successToast}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-orange-400 mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Catalogue & Pricing Engine</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                PACKAGE MANAGEMENT
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Manage commercial packages, deliverable features, and visual display priority.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={loadPackages}
                disabled={isLoading || isReordering}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                title="Reload from database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg text-white bg-orange-600 hover:bg-orange-500 shadow-md shadow-orange-600/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Package</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-[11px] font-medium text-slate-400">Total Packages</div>
              <div className="text-lg font-bold text-white mt-0.5">{packagesList.length}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-[11px] font-medium text-emerald-400">Active in Public View</div>
              <div className="text-lg font-bold text-emerald-300 mt-0.5">
                {packagesList.filter((p) => p.isActive).length}
              </div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-[11px] font-medium text-amber-400">Inactive / Draft</div>
              <div className="text-lg font-bold text-amber-300 mt-0.5">
                {packagesList.filter((p) => !p.isActive).length}
              </div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-[11px] font-medium text-slate-400">Total Deliverables</div>
              <div className="text-lg font-bold text-slate-200 mt-0.5">
                {packagesList.reduce((acc, p) => acc + (p.features?.length || 0), 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs underline hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search package by name or ID..."
              className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({packagesList.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active ({packagesList.filter((p) => p.isActive).length})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800/60 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Inactive ({packagesList.filter((p) => !p.isActive).length})
            </button>
          </div>
        </div>

        {/* Packages Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
              <p className="text-xs">Connecting to PostgreSQL database...</p>
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Package className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <h3 className="text-sm font-semibold text-slate-200">No packages found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try modifying your search query or filter options.'
                  : 'Get started by creating your first corporate package.'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={handleOpenCreate}
                  className="mt-4 inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Package</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-3.5 px-4 w-16 text-center">Order</th>
                    <th className="py-3.5 px-4">Package</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Billing</th>
                    <th className="py-3.5 px-4">Included Deliverables</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPackages.map((pkg, idx) => {
                    const originalIndex = packagesList.findIndex((p) => p.id === pkg.id);
                    return (
                      <tr
                        key={pkg.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          !pkg.isActive ? 'bg-slate-950/40 opacity-75' : ''
                        }`}
                      >
                        {/* Order & Reorder Controls */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center justify-center space-y-0.5">
                            <span className="font-mono text-slate-400 text-xs font-semibold">
                              {originalIndex + 1}
                            </span>
                            <div className="flex items-center space-x-0.5 mt-1">
                              <button
                                type="button"
                                onClick={() => handleMoveOrder(originalIndex, 'up')}
                                disabled={originalIndex === 0 || isReordering}
                                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 transition-colors"
                                title="Move Package Up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveOrder(originalIndex, 'down')}
                                disabled={
                                  originalIndex === packagesList.length - 1 || isReordering
                                }
                                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 transition-colors"
                                title="Move Package Down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Package Info */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-100 text-sm">{pkg.name}</span>
                              {pkg.popular && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                  POPULAR
                                </span>
                              )}
                              {pkg.badge && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  {pkg.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-500 mt-0.5">
                              ID: {pkg.id}
                            </span>
                            {pkg.tagline && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                                {pkg.tagline}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-4 px-4 font-mono font-bold text-slate-100">
                          {formatPrice(pkg.priceAmount, pkg.priceDisplayOverride)}
                        </td>

                        {/* Billing Type */}
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {formatBilling(pkg.billingType)}
                          </span>
                        </td>

                        {/* Deliverables Count */}
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300">
                              {pkg.features?.length || 0} deliverables
                            </span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4">
                          {pkg.isActive ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle className="w-3 h-3" />
                              <span>ACTIVE</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <XCircle className="w-3 h-3" />
                              <span>INACTIVE</span>
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Toggle Active / Inactive */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(pkg)}
                              disabled={togglingId === pkg.id}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border ${
                                pkg.isActive
                                  ? 'bg-slate-800 hover:bg-amber-950/60 text-slate-300 hover:text-amber-300 border-slate-700 hover:border-amber-800/60'
                                  : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/60'
                              }`}
                              title={pkg.isActive ? 'Deactivate package' : 'Activate package'}
                            >
                              {togglingId === pkg.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mx-1" />
                              ) : pkg.isActive ? (
                                'Disable'
                              ) : (
                                'Enable'
                              )}
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(pkg)}
                              className="p-1.5 rounded-md text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                              title="Edit Package"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(pkg)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/30 transition-colors"
                              title="Delete Package"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Package Editor Modal */}
      <PackageEditorModal
        isOpen={isEditorOpen}
        packageToEdit={packageToEdit}
        initialNextOrder={packagesList.length}
        isSaving={isSaving}
        onSave={handleSavePackage}
        onClose={() => {
          setIsEditorOpen(false);
          setPackageToEdit(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        packageItem={packageToDelete}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setIsDeleteOpen(false);
          setPackageToDelete(null);
        }}
      />
    </div>
  );
};
