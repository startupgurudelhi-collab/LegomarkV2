import React from 'react';
import {
  Globe,
  Briefcase,
  Users,
  MessageSquareQuote,
  Image as ImageIcon,
  BookOpen,
  Settings,
  ArrowRight,
  Shield,
  Layers,
  Building2,
  User,
} from 'lucide-react';
import { AdminNavSection } from './AdminSidebar';
import { AdminFounderPage } from './AdminFounderPage';
import { AdminOfficePage } from './AdminOfficePage';

interface PlaceholderSectionProps {
  section: AdminNavSection;
  onNavigateSection: (section: AdminNavSection) => void;
}

export const AdminPlaceholderView: React.FC<PlaceholderSectionProps> = ({
  section,
  onNavigateSection,
}) => {
  // If section is website, provide direct tabs for Founder & Office which exist
  if (section === 'website') {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-500" />
                Website Content Management System
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Manage executive leadership profiles, registered offices, and corporate presentation.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Founder Profile CMS</h3>
                <p className="text-xs text-slate-400">Managing Director credentials and bio</p>
              </div>
            </div>
            <AdminFounderPage />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Registered Office CMS</h3>
                <p className="text-xs text-slate-400">Jasola, New Delhi headquarters & branches</p>
              </div>
            </div>
            <AdminOfficePage />
          </div>
        </div>
      </div>
    );
  }

  const META_CONFIG: Record<
    string,
    { title: string; desc: string; icon: React.ElementType; tag: string }
  > = {
    services: {
      title: 'Services & Practice Areas Catalog',
      desc: 'Corporate, taxation, and MCA company registration services architecture.',
      icon: Briefcase,
      tag: 'Phase 3 Scope',
    },
    leads: {
      title: 'Leads & Client Enquiries Management',
      desc: 'Inbound consultation requests, direct queries, and client conversion records.',
      icon: Users,
      tag: 'Phase 4 Scope',
    },
    testimonials: {
      title: 'Client Reviews & Endorsements',
      desc: 'Client feedback, company logos, and video endorsement controls.',
      icon: MessageSquareQuote,
      tag: 'Phase 5 Scope',
    },
    media: {
      title: 'Media & Website Assets Library',
      desc: 'Direct file upload infrastructure, logos, and corporate photography assets.',
      icon: ImageIcon,
      tag: 'Phase 5 Scope',
    },
    blogs: {
      title: 'Blogs & Advisory Publications',
      desc: 'Legal updates, tax compliance articles, and regulatory announcements.',
      icon: BookOpen,
      tag: 'Phase 6 Scope',
    },
    settings: {
      title: 'Admin Control Center Settings',
      desc: 'Administrator preferences, contact configurations, and security credentials.',
      icon: Settings,
      tag: 'Phase 6 Scope',
    },
  };

  const currentMeta = META_CONFIG[section] || {
    title: 'Control Center Section',
    desc: 'Section management tools.',
    icon: Layers,
    tag: 'Admin Module',
  };

  const Icon = currentMeta.icon;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 text-center max-w-2xl mx-auto my-8">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-4 text-orange-400 shadow-sm">
          <Icon className="w-7 h-7" />
        </div>

        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 mb-3">
          {currentMeta.tag}
        </div>

        <h2 className="text-xl font-bold text-white mb-2">{currentMeta.title}</h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto mb-6">
          {currentMeta.desc}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigateSection('packages')}
            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-colors"
          >
            <span>Open Package Manager</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
          <button
            onClick={() => onNavigateSection('dashboard')}
            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
