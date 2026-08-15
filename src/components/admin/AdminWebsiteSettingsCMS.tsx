import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Globe,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Building,
  ShieldCheck,
  FileText,
  Info,
} from 'lucide-react';
import { WebsiteSettingsData, UpdateWebsiteSettingsInput } from '../../types/settings';
import { fetchAdminSettings, updateAdminSettings } from '../../services/settings.service';

interface AdminWebsiteSettingsCMSProps {
  onNavigateToSection?: (sectionId: string) => void;
}

export const AdminWebsiteSettingsCMS: React.FC<AdminWebsiteSettingsCMSProps> = ({
  onNavigateToSection,
}) => {
  const [settings, setSettings] = useState<WebsiteSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<UpdateWebsiteSettingsInput>({
    companyName: '',
    positioning: '',
    tagline: '',
    businessDescription: '',
    phone: '',
    mobile: '',
    landline: '',
    email: '',
    whatsapp: '',
    primaryWebsite: '',
    secondaryWebsite: '',
    officeHours: '',
    registeredOfficeAddress: '',
  });

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminSettings();
      setSettings(data);
      setFormData({
        companyName: data.companyName || 'LEGOMARK INDIA',
        positioning: data.positioning || 'LEGAL, TAXATION & CORPORATE ADVISORY',
        tagline: data.tagline || 'Legal, Taxation & Corporate Advisory Services',
        businessDescription:
          data.businessDescription ||
          'Simplifying company registration, taxation, trademark protection, and business compliance through transparent professional services.',
        phone: data.phone || '+91 75308 47878',
        mobile: data.mobile || '+91 75308 47878',
        landline: data.landline || '011-45768289',
        email: data.email || 'info@legomarkindia.com',
        whatsapp: data.whatsapp || '+91 75308 47878',
        primaryWebsite: data.primaryWebsite || 'www.legomarkindia.com',
        secondaryWebsite: data.secondaryWebsite || 'www.legomark.com',
        officeHours: data.officeHours || 'Monday to Sunday: 11:00 AM – 8:00 PM',
        registeredOfficeAddress:
          data.registeredOfficeAddress ||
          'D-561, Pocket 11, DDA Janta Flats, Jasola, New Delhi – 110025',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load website settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updated = await updateAdminSettings(formData);
      setSettings(updated);
      setSuccessMessage('Website configuration saved successfully to database.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save website settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Website Settings</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
              GLOBAL CONFIG
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage global firm details, official contact channels, and website operational profile.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadSettings()}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Reload settings"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* DEDICATED CMS LINK CARDS (Founder & Registered Office) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-orange-400 mb-2">
              <UserCheck className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Founder Profile CMS</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Manage Nomaan Rizvi's credentials, bar council enrollments, practice experience, and photo portraits.
            </p>
          </div>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => onNavigateToSection && onNavigateToSection('founder')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors group"
            >
              <span>Manage Founder Profile</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-orange-400 mb-2">
              <Building className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Registered Office CMS</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Manage Jasola, New Delhi head office photo gallery, landmark coordinates, and visiting instructions.
            </p>
          </div>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => onNavigateToSection && onNavigateToSection('office')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors group"
            >
              <span>Manage Registered Office</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* GLOBAL SETTINGS FORM */}
      {isLoading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">Loading website configuration...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: BUSINESS & BRAND INFORMATION */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800 text-sm font-bold text-white">
              <Building2 className="w-4 h-4 text-orange-400" />
              <span>Business & Positioning Information</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Firm / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Positioning Statement
                </label>
                <input
                  type="text"
                  value={formData.positioning}
                  onChange={(e) => setFormData({ ...formData, positioning: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Business Description
                </label>
                <textarea
                  rows={3}
                  value={formData.businessDescription}
                  onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: OFFICIAL CONTACT & CHANNELS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800 text-sm font-bold text-white">
              <Phone className="w-4 h-4 text-orange-400" />
              <span>Official Contact Channels</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Primary Mobile / Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  WhatsApp Advisory Number
                </label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Direct Landline
                </label>
                <input
                  type="text"
                  value={formData.landline}
                  onChange={(e) => setFormData({ ...formData, landline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Official Advisory Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Office Operational Hours
                </label>
                <input
                  type="text"
                  value={formData.officeHours}
                  onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: WEBSITES & STATUTORY ADDRESS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800 text-sm font-bold text-white">
              <Globe className="w-4 h-4 text-orange-400" />
              <span>Websites & Registered Address</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Primary Domain
                </label>
                <input
                  type="text"
                  value={formData.primaryWebsite}
                  onChange={(e) => setFormData({ ...formData, primaryWebsite: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Secondary Domain
                </label>
                <input
                  type="text"
                  value={formData.secondaryWebsite}
                  onChange={(e) => setFormData({ ...formData, secondaryWebsite: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Registered Head Office Address
                </label>
                <textarea
                  rows={2}
                  value={formData.registeredOfficeAddress}
                  onChange={(e) => setFormData({ ...formData, registeredOfficeAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2 hover:shadow-orange-500/20"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Website Settings</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
