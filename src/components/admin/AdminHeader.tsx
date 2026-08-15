import React from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  Menu,
  ShieldCheck,
  LogOut,
  ExternalLink,
  User,
  KeyRound,
  Bell,
  Search,
} from 'lucide-react';
import { AdminNavSection } from './AdminSidebar';

interface AdminHeaderProps {
  currentSection: AdminNavSection;
  onNavigateSection: (section: AdminNavSection) => void;
  onNavigateHome: () => void;
  onOpenMobileMenu: () => void;
  isSidebarCollapsed: boolean;
}

const SECTION_TITLES: Record<AdminNavSection, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Executive Dashboard',
    subtitle: 'High-level business activity & catalog overview',
  },
  website: {
    title: 'Website & CMS Management',
    subtitle: 'Homepage content, founder bio, and registered offices',
  },
  services: {
    title: 'Services & Practice Areas',
    subtitle: 'Legal, taxation, and corporate compliance services catalog',
  },
  packages: {
    title: 'Package Management',
    subtitle: 'Manage commercial packages, deliverables and public display',
  },
  leads: {
    title: 'Leads & Enquiries',
    subtitle: 'Inbound consultation requests and prospect follow-ups',
  },
  testimonials: {
    title: 'Reviews & Testimonials',
    subtitle: 'Client endorsements, photos, and video testimonials',
  },
  media: {
    title: 'Media & Website Assets',
    subtitle: 'Direct file uploads and asset library management',
  },
  blogs: {
    title: 'Blogs & Legal Insights',
    subtitle: 'Publish articles, guides, and tax compliance updates',
  },
  settings: {
    title: 'Admin Settings',
    subtitle: 'Administrator profile and security credentials',
  },
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentSection,
  onNavigateSection,
  onNavigateHome,
  onOpenMobileMenu,
  isSidebarCollapsed,
}) => {
  const { user, logout, isLoading } = useAdminAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/admin/login';
  };

  const sectionMeta = SECTION_TITLES[currentSection] || {
    title: 'Admin Portal',
    subtitle: 'Control Center',
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0B132B] border-b border-slate-800/90 text-slate-100 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Menu Trigger + Breadcrumb Title */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 focus:outline-hidden"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {sectionMeta.title}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {currentSection.toUpperCase()}
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400">{sectionMeta.subtitle}</p>
            </div>
          </div>

          {/* Right: Quick Actions + User Profile + Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* View Live Website Button */}
            <button
              onClick={onNavigateHome}
              className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
              title="Open Public Website in Viewer"
            >
              <span>View Website</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>

            {/* Admin User Profile Pill */}
            {user && (
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg py-1 px-2 sm:px-2.5">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs border border-slate-700">
                  <User className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <div className="hidden lg:block text-left text-xs leading-tight">
                  <div className="font-semibold text-slate-200 truncate max-w-[130px]">
                    {user.fullName || user.email}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                    <span>{user.role}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Security / Password Link (Points strictly to frozen password change) */}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/admin/change-password');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hidden md:inline-flex items-center space-x-1 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Update Admin Security Credentials"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Password</span>
            </button>

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="inline-flex items-center space-x-1 text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Log out of Admin Control Center"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
