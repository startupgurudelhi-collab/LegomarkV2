import React, { useState, useEffect } from 'react';
import { User, Save, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { fetchAdminFounder, updateAdminFounder, AdminFounderProfile } from '../../services/adminProfile.service';

export const AdminFounderPage: React.FC = () => {
  const [profile, setProfile] = useState<AdminFounderProfile | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    designation: string;
    organization: string;
    photoUrl: string;
    description: string;
    quote: string;
    coreAreasText: string;
    isActive: boolean;
  }>({
    name: '',
    designation: '',
    organization: 'LEGOMARK INDIA',
    photoUrl: '',
    description: '',
    quote: '',
    coreAreasText: '',
    isActive: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminFounder();
      setProfile(data);
      setFormData({
        name: data.name || '',
        designation: data.designation || '',
        organization: data.organization || 'LEGOMARK INDIA',
        photoUrl: data.photoUrl || '',
        description: data.description || '',
        quote: data.quote || '',
        coreAreasText: (data.coreAreas || []).join('\n'),
        isActive: data.isActive ?? true,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load founder profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Founder name is required.');
      return;
    }
    if (!formData.designation.trim()) {
      setError('Designation is required.');
      return;
    }
    if (!formData.description.trim()) {
      setError('Biography/Description is required.');
      return;
    }

    const coreAreas = formData.coreAreasText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (coreAreas.length === 0) {
      setError('At least one core practice area is required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updated = await updateAdminFounder({
        name: formData.name,
        designation: formData.designation,
        organization: formData.organization,
        photoUrl: formData.photoUrl.trim() || null,
        description: formData.description,
        quote: formData.quote.trim() || null,
        coreAreas,
        isActive: formData.isActive,
      });

      setProfile(updated);
      setSuccessMessage('Founder profile updated successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mb-3" />
        <p className="text-sm font-medium">Loading Founder Profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <User className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">Founder Profile CMS</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage genuine founder biography, leadership credentials, and practice areas.
          </p>
        </div>

        {profile?.updatedAt && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Last Updated: {new Date(profile.updatedAt).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="mt-4 p-3.5 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mt-4 p-3.5 rounded-lg bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Founder Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                placeholder="e.g. Nomaan Rizvi"
                required
              />
            </div>

            {/* Designation */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Designation <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                placeholder="e.g. Founder & Managing Director"
                required
              />
            </div>

            {/* Organization */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Organization
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                placeholder="e.g. LEGOMARK INDIA"
              />
            </div>

            {/* Photo URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Founder Photo Asset / Path (Optional)
              </label>
              <input
                type="text"
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                placeholder="/assets/founder.jpg or leave empty for icon"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Protected Brand Media: Do not replace genuine photo with AI-generated or stock media.
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Biography / Leadership Profile <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500 leading-relaxed"
              placeholder="Enter comprehensive biography and practice background..."
              required
            />
          </div>

          {/* Quote */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Founder Quote (Optional)
            </label>
            <input
              type="text"
              value={formData.quote}
              onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
              placeholder="e.g. Delivering transparent, dependable legal services to every Indian enterprise."
            />
          </div>

          {/* Core Areas */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Core Practice Areas (One per line) <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              value={formData.coreAreasText}
              onChange={(e) => setFormData({ ...formData, coreAreasText: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-orange-500"
              placeholder="Company Registration&#10;Taxation & Compliance&#10;Trademark Protection&#10;Business Licensing"
              required
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 pt-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
            <span className="text-xs font-semibold text-slate-300">
              Active on Public Website
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={isSaving}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Reset Form
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Saving Changes...' : 'Save Founder Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
