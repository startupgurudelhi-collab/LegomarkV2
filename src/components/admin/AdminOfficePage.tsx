import React, { useState, useEffect } from 'react';
import { Building2, Save, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { fetchAdminOffice, updateAdminOffice, AdminOfficeProfile } from '../../services/adminProfile.service';

export const AdminOfficePage: React.FC = () => {
  const [profile, setProfile] = useState<AdminOfficeProfile | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    premisesPhotoUrl: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    pincode: string;
    fullAddress: string;
    mobile: string;
    mobileRaw: string;
    landline: string;
    landlineRaw: string;
    email: string;
    officeHours: string;
    websitesText: string;
    primaryWebsite: string;
    checklistText: string;
    mapEmbedUrl: string;
    isActive: boolean;
  }>({
    name: 'LEGOMARK INDIA',
    premisesPhotoUrl: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    pincode: '',
    fullAddress: '',
    mobile: '',
    mobileRaw: '',
    landline: '',
    landlineRaw: '',
    email: '',
    officeHours: '',
    websitesText: '',
    primaryWebsite: 'www.legomarkindia.com',
    checklistText: '',
    mapEmbedUrl: '',
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
      const data = await fetchAdminOffice();
      setProfile(data);
      setFormData({
        name: data.name || 'LEGOMARK INDIA',
        premisesPhotoUrl: data.premisesPhotoUrl || '',
        addressLine1: data.addressLine1 || '',
        addressLine2: data.addressLine2 || '',
        city: data.city || '',
        pincode: data.pincode || '',
        fullAddress: data.fullAddress || '',
        mobile: data.mobile || '',
        mobileRaw: data.mobileRaw || '',
        landline: data.landline || '',
        landlineRaw: data.landlineRaw || '',
        email: data.email || '',
        officeHours: data.officeHours || '',
        websitesText: (data.websites || []).join('\n'),
        primaryWebsite: data.primaryWebsite || 'www.legomarkindia.com',
        checklistText: (data.checklist || []).join('\n'),
        mapEmbedUrl: data.mapEmbedUrl || '',
        isActive: data.isActive ?? true,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load office profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.addressLine1.trim()) {
      setError('Address Line 1 is required.');
      return;
    }
    if (!formData.city.trim()) {
      setError('City is required.');
      return;
    }
    if (!formData.pincode.trim()) {
      setError('Pincode is required.');
      return;
    }
    if (!formData.mobile.trim()) {
      setError('Mobile is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required.');
      return;
    }

    const websites = formData.websitesText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const checklist = formData.checklistText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updated = await updateAdminOffice({
        name: formData.name,
        premisesPhotoUrl: formData.premisesPhotoUrl.trim() || null,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        pincode: formData.pincode,
        fullAddress: formData.fullAddress.trim() || `${formData.addressLine1}, ${formData.addressLine2}, ${formData.city} – ${formData.pincode}`,
        mobile: formData.mobile,
        mobileRaw: formData.mobileRaw || formData.mobile.replace(/[^\d+]/g, ''),
        landline: formData.landline,
        landlineRaw: formData.landlineRaw || formData.landline.replace(/[^\d]/g, ''),
        email: formData.email,
        officeHours: formData.officeHours,
        websites: websites.length > 0 ? websites : ['www.legomarkindia.com', 'www.legomark.com'],
        primaryWebsite: formData.primaryWebsite || 'www.legomarkindia.com',
        checklist: checklist.length > 0 ? checklist : undefined,
        mapEmbedUrl: formData.mapEmbedUrl.trim() || null,
        isActive: formData.isActive,
      });

      setProfile(updated);
      setSuccessMessage('Office profile updated successfully.');
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
        <p className="text-sm font-medium">Loading Office Profile...</p>
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
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">Registered Office CMS</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage genuine registered office address, premises credentials, direct contact numbers, and office hours.
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
          {/* Section: Basic & Address */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Office Premises & Location
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Office / Entity Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Premises Photo Asset / Path (Optional)
                </label>
                <input
                  type="text"
                  value={formData.premisesPhotoUrl}
                  onChange={(e) => setFormData({ ...formData, premisesPhotoUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                  placeholder="/assets/office.jpg or leave empty"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Address Line 1 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                  placeholder="D-561, Pocket 11, DDA Janta Flats"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Address Line 2 (Area/Locality) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                  placeholder="Jasola"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  City <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                  placeholder="New Delhi"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pincode <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                  placeholder="110025"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Formatted Address
                </label>
                <input
                  type="text"
                  value={formData.fullAddress}
                  onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                  placeholder="D-561, Pocket 11, DDA Janta Flats, Jasola, New Delhi – 110025"
                />
              </div>
            </div>
          </div>

          {/* Section: Contact & Hours */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Official Communication Channels
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mobile Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                  placeholder="+91 75308 47878"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Landline Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.landline}
                  onChange={(e) => setFormData({ ...formData, landline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                  placeholder="011-45768289"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Official Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                  placeholder="info@legomarkindia.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Office Working Hours <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.officeHours}
                  onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                  placeholder="Monday to Sunday: 11:00 AM – 8:00 PM"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Official Domains (One per line)
                </label>
                <textarea
                  rows={2}
                  value={formData.websitesText}
                  onChange={(e) => setFormData({ ...formData, websitesText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-orange-500"
                  placeholder="www.legomarkindia.com&#10;www.legomark.com"
                />
              </div>
            </div>
          </div>

          {/* Section: Checklist Highlights */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Office Capabilities & Checklist Items (One per line)
            </h3>
            <textarea
              rows={4}
              value={formData.checklistText}
              onChange={(e) => setFormData({ ...formData, checklistText: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
              placeholder="Registered office and corporate advisory services in New Delhi&#10;Consultation desk for business incorporation and compliance"
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
            <span>{isSaving ? 'Saving Changes...' : 'Save Office Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
