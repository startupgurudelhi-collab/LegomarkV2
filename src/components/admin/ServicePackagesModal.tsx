import React, { useState, useEffect, useCallback } from 'react';
import { AdminService } from '../../types/adminService';
import { AdminPackage, PackageFormData, ReorderItem } from '../../types/admin';
import {
  fetchAdminPackages,
  createAdminPackage,
  updateAdminPackage,
  toggleAdminPackageStatus,
  reorderAdminPackages,
  deleteAdminPackage,
} from '../../services/adminPackage.service';
import { adminServiceApi } from '../../services/adminService.service';
import { PackageEditorModal } from './PackageEditorModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
  X,
  Package,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Layers,
  Sparkles,
  AlertCircle,
  Loader2,
  Check,
  Building2,
  Tag,
  IndianRupee,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface ServicePackagesModalProps {
  isOpen: boolean;
  service: AdminService | null;
  onClose: () => void;
}

export const ServicePackagesModal: React.FC<ServicePackagesModalProps> = ({
  isOpen,
  service,
  onClose,
}) => {
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

  // Load packages for this specific service
  const loadPackages = useCallback(async () => {
    if (!isOpen || !service) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // 1. Fetch fresh service details to get assignedPackages
      const fullService = await adminServiceApi.getServiceById(service.id);
      const assigned = fullService?.assignedPackages || [];
      const assignedPkgIds = new Set(assigned.map((ap) => ap.packageId));

      // 2. Fetch all packages to get complete package metadata and features
      const allPackages = await fetchAdminPackages();

      // 3. Filter packages strictly belonging to this service
      let servicePkgs = allPackages.filter((pkg) => assignedPkgIds.has(pkg.id));

      // Order according to service's assignedPackages displayOrder
      const orderMap = new Map(assigned.map((ap) => [ap.packageId, Number(ap.displayOrder) || 0]));
      servicePkgs.sort((a, b) => {
        const orderA = orderMap.has(a.id) ? Number(orderMap.get(a.id)) : Number(a.displayOrder) || 0;
        const orderB = orderMap.has(b.id) ? Number(orderMap.get(b.id)) : Number(b.displayOrder) || 0;
        return orderA - orderB;
      });

      setPackagesList(servicePkgs);
    } catch (err: any) {
      if (err.statusCode === 401) {
        window.location.href = '/admin/login';
        return;
      }
      setErrorMessage(err.message || 'Failed to load packages for this service.');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, service]);

  useEffect(() => {
    if (isOpen && service) {
      loadPackages();
    }
  }, [isOpen, service, loadPackages]);

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
  const handleSavePackage = async (formData: PackageFormData, isEdit: boolean, associatedServiceId?: string) => {
    setIsSaving(true);
    try {
      if (isEdit) {
        await updateAdminPackage(formData.id, formData);
        showToast(`✓ Package "${formData.name}" updated successfully.`);
      } else {
        await createAdminPackage(formData);

        // Automatically associate new package with this service
        const targetServiceId = associatedServiceId || service?.id;
        if (targetServiceId) {
          try {
            const currentService = await adminServiceApi.getServiceById(targetServiceId);
            const currentPkgIds = (currentService.assignedPackages || []).map((p) => p.packageId);
            if (!currentPkgIds.includes(formData.id)) {
              await adminServiceApi.updateService(targetServiceId, {
                packageIds: [...currentPkgIds, formData.id],
              });
            }
          } catch (assocErr) {
            console.warn('Could not auto-link package to service', assocErr);
          }
        }

        showToast(`✓ Package "${formData.name}" created and added to ${service?.title || 'service'}.`);
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
      // Persist global display orders
      await reorderAdminPackages(reorderPayload);

      // Also persist service-scoped packageIds order to service
      if (service?.id) {
        await adminServiceApi.updateService(service.id, {
          packageIds: reorderedList.map((p) => p.id),
        });
      }

      showToast('✓ Package order updated and persisted.');
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

  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Toast Notification */}
        {successToast && (
          <div className="absolute top-4 right-14 z-50 flex items-center space-x-2 bg-emerald-950 border border-emerald-500/40 text-emerald-200 text-xs px-3.5 py-2 rounded-xl shadow-xl animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successToast}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-950/70 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25 uppercase tracking-wider">
                  Service Package Management
                </span>
                <span className="text-[11px] text-slate-400">
                  {service.category?.name || 'General Category'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                Service: <span className="text-orange-400">{service.title}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Packages for this Service — Manage pricing tiers, deliverable feature lists, and display status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreate}
              className="flex items-center space-x-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm hover:shadow-orange-500/20 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Package</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Service Summary Banner */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Starting Price: <strong className="text-orange-400">{service.startingPrice}</strong></span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Timeline: <strong className="text-slate-200">{service.timeline}</strong></span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Path: <span className="font-mono text-slate-500">/services/{service.slug}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Status:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                service.isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {service.isActive ? 'Active Service' : 'Draft Service'}
              </span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search packages by name or feature..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({packagesList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    statusFilter === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Active ({packagesList.filter((p) => p.isActive).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('inactive')}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    statusFilter === 'inactive'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Draft ({packagesList.filter((p) => !p.isActive).length})
                </button>
              </div>

              <button
                type="button"
                onClick={loadPackages}
                disabled={isLoading}
                className="p-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-rose-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Packages Table / List */}
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
              <p className="text-xs">Loading packages for {service.title}...</p>
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-slate-950/40 border border-slate-800/80">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-white">No Packages Found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'all'
                  ? 'No packages matched the current search/filter.'
                  : `No commercial packages have been created for ${service.title} yet.`}
              </p>
              <button
                onClick={handleOpenCreate}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Package</span>
              </button>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 text-[10px]">
                    <tr>
                      <th className="py-3 px-3 w-16 text-center">Order</th>
                      <th className="py-3 px-4">Package Name & Tagline</th>
                      <th className="py-3 px-4">Commercial Terms</th>
                      <th className="py-3 px-4">Deliverables</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPackages.map((pkg, idx) => (
                      <tr
                        key={pkg.id}
                        className={`hover:bg-slate-800/20 transition-colors ${
                          !pkg.isActive ? 'opacity-70 bg-slate-950/20' : ''
                        }`}
                      >
                        {/* Order & Reorder */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-mono text-[11px] text-slate-400 font-bold">
                              {pkg.displayOrder + 1}
                            </span>
                            <div className="flex flex-col ml-0.5">
                              <button
                                type="button"
                                disabled={idx === 0 || isReordering}
                                onClick={() => handleMoveOrder(idx, 'up')}
                                className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200 disabled:opacity-20 transition cursor-pointer"
                                title="Move up"
                              >
                                <ArrowUp className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === filteredPackages.length - 1 || isReordering}
                                onClick={() => handleMoveOrder(idx, 'down')}
                                className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200 disabled:opacity-20 transition cursor-pointer"
                                title="Move down"
                              >
                                <ArrowDown className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Package Name & Tagline */}
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                              <Package className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-xs">{pkg.name}</span>
                                {pkg.badge && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                    {pkg.badge}
                                  </span>
                                )}
                                {pkg.popular && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    Popular
                                  </span>
                                )}
                              </div>
                              {pkg.tagline && (
                                <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-sm">
                                  {pkg.tagline}
                                </p>
                              )}
                              {pkg.idealFor && (
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  Best for: {pkg.idealFor}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Commercial Terms */}
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-bold text-orange-400 text-xs">
                              {formatPrice(pkg.priceAmount, pkg.priceDisplayOverride)}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{formatBilling(pkg.billingType)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Deliverables Count */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
                            <Layers className="w-3 h-3 text-orange-400" />
                            <span>{(pkg.features || []).length} Deliverables</span>
                          </span>
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            disabled={togglingId === pkg.id}
                            onClick={() => handleToggleStatus(pkg)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition border cursor-pointer ${
                              pkg.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {togglingId === pkg.id ? (
                              <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                            ) : pkg.isActive ? (
                              'Active'
                            ) : (
                              'Draft'
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(pkg)}
                              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-orange-400 transition cursor-pointer"
                              title="Edit Package"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenDelete(pkg)}
                              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                              title="Delete Package"
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
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Packages configured for this service: <strong className="text-orange-400">{packagesList.length}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Reused Package Editor Modal */}
      {isEditorOpen && (
        <PackageEditorModal
          isOpen={isEditorOpen}
          packageToEdit={packageToEdit}
          initialNextOrder={packagesList.length}
          initialServiceId={service?.id}
          isSaving={isSaving}
          onSave={handleSavePackage}
          onClose={() => setIsEditorOpen(false)}
        />
      )}

      {/* Reused Delete Confirm Modal */}
      {isDeleteOpen && (
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
      )}
    </div>
  );
};
