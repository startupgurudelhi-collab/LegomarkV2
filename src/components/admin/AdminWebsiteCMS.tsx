import React, { useState } from 'react';
import { User, Building2, Briefcase, Image as ImageIcon } from 'lucide-react';
import { AdminFounderPage } from './AdminFounderPage';
import { AdminOfficePage } from './AdminOfficePage';
import { AdminClientLogosCMS } from './AdminClientLogosCMS';
import { AdminWebsiteSettingsCMS } from './AdminWebsiteSettingsCMS';

export const AdminWebsiteCMS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'founder' | 'office' | 'logos' | 'company-logo'>('founder');

  return (
    <div className="space-y-6">
      {/* CMS Module Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('founder')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'founder'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Founder Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('office')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'office'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Registered Office</span>
        </button>

        <button
          onClick={() => setActiveTab('logos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'logos'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Client Logos</span>
        </button>

        <button
          onClick={() => setActiveTab('company-logo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'company-logo'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Company Logo</span>
        </button>
      </div>

      {/* Render sub-CMS */}
      <div>
        {activeTab === 'founder' && <AdminFounderPage />}
        {activeTab === 'office' && <AdminOfficePage />}
        {activeTab === 'logos' && <AdminClientLogosCMS />}
        {activeTab === 'company-logo' && <AdminWebsiteSettingsCMS />}
      </div>
    </div>
  );
};
