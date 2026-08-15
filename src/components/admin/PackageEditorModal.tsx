import React, { useState, useEffect, useMemo } from 'react';
import { AdminPackage, PackageFormData, BillingType } from '../../types/admin';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Loader2, CheckCircle2, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';

interface PackageEditorModalProps {
  isOpen: boolean;
  packageToEdit: AdminPackage | null; // null means "Add Package"
  initialNextOrder?: number;
  isSaving: boolean;
  onSave: (data: PackageFormData, isEdit: boolean) => Promise<void>;
  onClose: () => void;
}

const BILLING_OPTIONS: Array<{ value: BillingType; label: string; description: string }> = [
  { value: 'one_time', label: 'One Time', description: 'Single upfront payment for incorporation or setup' },
  { value: 'monthly', label: 'Monthly', description: 'Billed on a recurring monthly cadence' },
  { value: 'yearly', label: 'Yearly', description: 'Billed annually for retainers & compliance' },
  { value: 'custom', label: 'Custom', description: 'Bespoke or tailored enterprise pricing' },
];

export const PackageEditorModal: React.FC<PackageEditorModalProps> = ({
  isOpen,
  packageToEdit,
  initialNextOrder = 0,
  isSaving,
  onSave,
  onClose,
}) => {
  const isEdit = Boolean(packageToEdit);

  // Form State
  const [formData, setFormData] = useState<PackageFormData>({
    id: '',
    name: '',
    tagline: '',
    priceAmount: '',
    currency: 'INR',
    billingType: 'one_time',
    priceDisplayOverride: '',
    idealFor: '',
    popular: false,
    badge: '',
    isActive: true,
    displayOrder: 0,
    features: [],
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Snapshot initial state to check for unsaved dirty changes
  const initialSnapshot = useMemo(() => {
    if (packageToEdit) {
      return JSON.stringify({
        id: packageToEdit.id,
        name: packageToEdit.name,
        tagline: packageToEdit.tagline || '',
        priceAmount: packageToEdit.priceAmount,
        currency: packageToEdit.currency || 'INR',
        billingType: packageToEdit.billingType,
        priceDisplayOverride: packageToEdit.priceDisplayOverride || '',
        idealFor: packageToEdit.idealFor,
        popular: Boolean(packageToEdit.popular),
        badge: packageToEdit.badge || '',
        isActive: Boolean(packageToEdit.isActive),
        displayOrder: packageToEdit.displayOrder,
        features: (packageToEdit.features || []).map((f, idx) => ({
          featureText: f.featureText,
          displayOrder: idx,
        })),
      });
    }
    return JSON.stringify({
      id: '',
      name: '',
      tagline: '',
      priceAmount: '',
      currency: 'INR',
      billingType: 'one_time',
      priceDisplayOverride: '',
      idealFor: '',
      popular: false,
      badge: '',
      isActive: true,
      displayOrder: initialNextOrder,
      features: [
        { featureText: '', displayOrder: 0 },
      ],
    });
  }, [packageToEdit, initialNextOrder]);

  // Initialize or reset form data on open/package change
  useEffect(() => {
    if (isOpen) {
      if (packageToEdit) {
        setFormData({
          id: packageToEdit.id,
          name: packageToEdit.name,
          tagline: packageToEdit.tagline || '',
          priceAmount: packageToEdit.priceAmount,
          currency: packageToEdit.currency || 'INR',
          billingType: packageToEdit.billingType,
          priceDisplayOverride: packageToEdit.priceDisplayOverride || '',
          idealFor: packageToEdit.idealFor,
          popular: Boolean(packageToEdit.popular),
          badge: packageToEdit.badge || '',
          isActive: Boolean(packageToEdit.isActive),
          displayOrder: packageToEdit.displayOrder,
          features: (packageToEdit.features || []).map((f, idx) => ({
            id: f.id,
            featureText: f.featureText,
            displayOrder: idx,
          })),
        });
      } else {
        setFormData({
          id: '',
          name: '',
          tagline: '',
          priceAmount: '',
          currency: 'INR',
          billingType: 'one_time',
          priceDisplayOverride: '',
          idealFor: '',
          popular: false,
          badge: '',
          isActive: true,
          displayOrder: initialNextOrder,
          features: [
            { featureText: '', displayOrder: 0 },
          ],
        });
      }
      setFieldErrors({});
      setGeneralError(null);
      setSaveSuccess(false);
      setShowUnsavedPrompt(false);
    }
  }, [isOpen, packageToEdit, initialNextOrder]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    const currentSnapshot = JSON.stringify({
      id: formData.id,
      name: formData.name,
      tagline: formData.tagline,
      priceAmount: formData.priceAmount,
      currency: formData.currency,
      billingType: formData.billingType,
      priceDisplayOverride: formData.priceDisplayOverride,
      idealFor: formData.idealFor,
      popular: formData.popular,
      badge: formData.badge,
      isActive: formData.isActive,
      displayOrder: formData.displayOrder,
      features: formData.features.map((f, idx) => ({
        featureText: f.featureText,
        displayOrder: idx,
      })),
    });
    return currentSnapshot !== initialSnapshot;
  }, [formData, initialSnapshot]);

  if (!isOpen) return null;

  const handleCloseAttempt = () => {
    if (isDirty && !saveSuccess) {
      setShowUnsavedPrompt(true);
    } else {
      onClose();
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // ID validation for new packages
    if (!isEdit) {
      if (!formData.id.trim()) {
        errors.id = 'Package ID / Slug is required.';
      } else if (!/^[a-z0-9-_]+$/i.test(formData.id.trim())) {
        errors.id = 'ID can only contain letters, numbers, hyphens, and underscores.';
      } else if (formData.id.trim().length > 64) {
        errors.id = 'ID must be 64 characters or less.';
      }
    }

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Package name is required.';
    } else if (formData.name.trim().length > 128) {
      errors.name = 'Package name must be 128 characters or less.';
    }

    // Price validation
    const cleanPrice = formData.priceAmount.trim();
    if (!cleanPrice) {
      errors.priceAmount = 'Price amount is required.';
    } else {
      const parsedNum = parseFloat(cleanPrice.replace(/[^\d.]/g, ''));
      if (isNaN(parsedNum) || parsedNum < 0) {
        errors.priceAmount = 'Must be a valid positive number.';
      }
    }

    // Ideal for validation
    if (!formData.idealFor.trim()) {
      errors.idealFor = 'Ideal for target description is required.';
    }

    // Features validation
    const validFeatures = formData.features.filter((f) => f.featureText.trim().length > 0);
    if (validFeatures.length === 0) {
      errors.features = 'At least one non-empty feature item is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setSaveSuccess(false);

    if (!validateForm()) {
      return;
    }

    try {
      // Clean up features to remove any trailing blank rows
      const sanitizedFeatures = formData.features
        .filter((f) => f.featureText.trim().length > 0)
        .map((f, index) => ({
          ...f,
          featureText: f.featureText.trim(),
          displayOrder: index,
        }));

      const payloadToSave: PackageFormData = {
        ...formData,
        features: sanitizedFeatures,
      };

      await onSave(payloadToSave, isEdit);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to save package. Please review fields and try again.');
    }
  };

  // Feature row operations
  const handleAddFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        { featureText: '', displayOrder: prev.features.length },
      ],
    }));
  };

  const handleUpdateFeatureText = (index: number, text: string) => {
    setFormData((prev) => {
      const updated = [...prev.features];
      updated[index] = { ...updated[index], featureText: text };
      return { ...prev, features: updated };
    });
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => {
      const updated = prev.features.filter((_, i) => i !== index);
      return { ...prev, features: updated };
    });
  };

  const handleMoveFeature = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.features.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    setFormData((prev) => {
      const updated = [...prev.features];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return { ...prev, features: updated };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {isEdit ? `Edit Package: ${packageToEdit?.name}` : 'Create New Package'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEdit ? 'Update metadata, pricing details, and feature specifications' : 'Define package tier, pricing, billing schedule, and feature deliverables'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseAttempt}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unsaved changes prompt overlay */}
        {showUnsavedPrompt && (
          <div className="p-4 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>You have unsaved changes. Are you sure you want to discard them?</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowUnsavedPrompt(false)}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-semibold"
              >
                Discard & Leave
              </button>
            </div>
          </div>
        )}

        {/* General Error Banner */}
        {generalError && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <span>1. Package Identification</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Package ID / Slug */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Package ID / Slug <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  disabled={isEdit || isSaving}
                  value={formData.id}
                  onChange={(e) =>
                    setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })
                  }
                  placeholder="e.g., starter, scale-business"
                  className={`w-full px-3 py-2 text-xs bg-slate-950 border rounded-lg text-slate-100 placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed font-mono ${
                    fieldErrors.id ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
                {fieldErrors.id && <p className="mt-1 text-[11px] text-rose-400">{fieldErrors.id}</p>}
                {isEdit && (
                  <p className="mt-1 text-[10px] text-slate-500">
                    ID is locked to protect relational references in matrix rows.
                  </p>
                )}
              </div>

              {/* Package Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Package Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  disabled={isSaving}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Starter Incorporation, Scale Business"
                  className={`w-full px-3 py-2 text-xs bg-slate-950 border rounded-lg text-slate-100 placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-orange-500 ${
                    fieldErrors.name ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
                {fieldErrors.name && <p className="mt-1 text-[11px] text-rose-400">{fieldErrors.name}</p>}
              </div>
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tagline <span className="text-slate-500 font-normal">(Optional subtitle)</span>
              </label>
              <input
                type="text"
                disabled={isSaving}
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g., Essential legal setup for founders launch-ready in 7 days"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Section 2: Pricing & Billing */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <span>2. Pricing & Commercials</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Price Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Price Amount (₹) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400">
                    ₹
                  </span>
                  <input
                    type="text"
                    disabled={isSaving}
                    value={formData.priceAmount}
                    onChange={(e) => setFormData({ ...formData, priceAmount: e.target.value })}
                    placeholder="6999"
                    className={`w-full pl-7 pr-3 py-2 text-xs bg-slate-950 border rounded-lg text-slate-100 placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono ${
                      fieldErrors.priceAmount ? 'border-rose-500' : 'border-slate-700'
                    }`}
                  />
                </div>
                {fieldErrors.priceAmount && (
                  <p className="mt-1 text-[11px] text-rose-400">{fieldErrors.priceAmount}</p>
                )}
              </div>

              {/* Billing Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Billing Cadence <span className="text-rose-400">*</span>
                </label>
                <select
                  disabled={isSaving}
                  value={formData.billingType}
                  onChange={(e) => setFormData({ ...formData, billingType: e.target.value as BillingType })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                >
                  {BILLING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Display Override */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Price Display Override <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  disabled={isSaving}
                  value={formData.priceDisplayOverride}
                  onChange={(e) => setFormData({ ...formData, priceDisplayOverride: e.target.value })}
                  placeholder="e.g., ₹29,999 / yr"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Ideal For */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ideal For Target Audience <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={2}
                disabled={isSaving}
                value={formData.idealFor}
                onChange={(e) => setFormData({ ...formData, idealFor: e.target.value })}
                placeholder="e.g., Bootstrapped startups, early-stage founders needing MCA registration"
                className={`w-full px-3 py-2 text-xs bg-slate-950 border rounded-lg text-slate-100 placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-orange-500 ${
                  fieldErrors.idealFor ? 'border-rose-500' : 'border-slate-700'
                }`}
              />
              {fieldErrors.idealFor && (
                <p className="mt-1 text-[11px] text-rose-400">{fieldErrors.idealFor}</p>
              )}
            </div>

            {/* Badges, Popular, Active Flags */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Badge Label <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  disabled={isSaving}
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="e.g., Most Popular, Recommended"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Popular Checkbox */}
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="popular"
                  disabled={isSaving}
                  checked={formData.popular}
                  onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                  className="w-4 h-4 rounded-sm bg-slate-950 border-slate-700 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="popular" className="text-xs font-semibold text-slate-200 cursor-pointer">
                  Mark as Popular (Highlighted)
                </label>
              </div>

              {/* Active Checkbox */}
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  disabled={isSaving}
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded-sm bg-slate-950 border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-200 cursor-pointer">
                  Active in Catalogue
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Deliverables / Feature Items */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  3. Deliverable Features ({formData.features.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Add, edit, reorder, or remove bulleted deliverable features for this package.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddFeature}
                disabled={isSaving}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-600/20 text-orange-400 border border-orange-500/30 hover:bg-orange-600/30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Feature</span>
              </button>
            </div>

            {fieldErrors.features && (
              <p className="text-[11px] text-rose-400">{fieldErrors.features}</p>
            )}

            {/* Feature Rows */}
            <div className="space-y-2">
              {formData.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 p-2 bg-slate-950/70 border border-slate-800 rounded-lg group"
                >
                  <span className="w-6 text-center text-[10px] font-mono text-slate-500">
                    {idx + 1}
                  </span>

                  <input
                    type="text"
                    disabled={isSaving}
                    value={feature.featureText}
                    onChange={(e) => handleUpdateFeatureText(idx, e.target.value)}
                    placeholder="Enter feature description..."
                    className="flex-1 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700/60 rounded-md text-slate-100 placeholder-slate-600 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                  />

                  {/* Reorder Buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleMoveFeature(idx, 'up')}
                      disabled={idx === 0 || isSaving}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent"
                      title="Move feature up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveFeature(idx, 'down')}
                      disabled={idx === formData.features.length - 1 || isSaving}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent"
                      title="Move feature down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      disabled={isSaving}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Delete feature"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {formData.features.length === 0 && (
                <div className="py-6 text-center border border-dashed border-slate-800 rounded-lg text-xs text-slate-500">
                  No features added yet. Click &ldquo;+ Add Feature&rdquo; to begin.
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs">
              {saveSuccess && (
                <span className="inline-flex items-center text-emerald-400 font-semibold gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Package saved successfully!</span>
                </span>
              )}
              {isSaving && (
                <span className="inline-flex items-center text-orange-400 gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving package to database...</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleCloseAttempt}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-5 py-2 text-xs font-semibold rounded-lg text-white bg-orange-600 hover:bg-orange-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{isEdit ? 'Update Package' : 'Create Package'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
