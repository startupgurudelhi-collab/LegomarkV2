import React from 'react';
import {
  LayoutDashboard,
  Globe,
  Briefcase,
  Package,
  Users,
  MessageSquareQuote,
  Image as ImageIcon,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  User,
} from 'lucide-react';
import { AdminUser } from '../../types/admin';

export type AdminNavSection =
  | 'dashboard'
  | 'website'
  | 'client-logos'
  | 'services'
  | 'packages'
  | 'leads'
  | 'testimonials'
  | 'media'
  | 'blogs'
  | 'settings';

interface AdminSidebarProps {
  currentSection: AdminNavSection;
  onNavigateSection: (section: AdminNavSection) => void;
  onNavigateHome: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  user: AdminUser | null;
}

interface NavItemConfig {
  id: AdminNavSection;
  label: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentSection,
  onNavigateSection,
  onNavigateHome,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  user,
}) => {
  const navItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Overview & Activity',
      icon: LayoutDashboard,
    },
    {
      id: 'website',
      label: 'Website CMS',
      description: 'Homepage, Profile, Offices',
      icon: Globe,
    },
    {
      id: 'client-logos',
      label: 'Client Logos',
      description: 'Marquee & Corporate Emblems',
      icon: Briefcase,
    },
    {
      id: 'services',
      label: 'Services',
      description: 'Categories & Practice Areas',
      icon: Briefcase,
    },
    {
      id: 'leads',
      label: 'Leads & Enquiries',
      description: 'Consultation Requests',
      icon: Users,
    },
    {
      id: 'testimonials',
      label: 'Testimonials',
      description: 'Reviews & Client Media',
      icon: MessageSquareQuote,
    },
    {
      id: 'media',
      label: 'Media & Assets',
      description: 'Uploads & Brand Media',
      icon: ImageIcon,
    },
    {
      id: 'blogs',
      label: 'Blogs & Articles',
      description: 'Legal & Tax Insights',
      icon: BookOpen,
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Profile & Configuration',
      icon: Settings,
    },
  ];

  const handleItemClick = (sectionId: AdminNavSection) => {
    onNavigateSection(sectionId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="admin-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0B132B] border-r border-slate-800/80 transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-[#0F1E3D]/50">
          <button
            onClick={onNavigateHome}
            className="flex items-center space-x-3 text-left focus:outline-hidden group overflow-hidden"
            title="Return to Public Website"
          >
            <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white shadow-md group-hover:bg-orange-500 transition-colors shrink-0">
              L
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
                  LEGOMARK INDIA
                </div>
                <div className="text-[10px] font-medium tracking-wide uppercase text-orange-400/90">
                  Control Center
                </div>
              </div>
            )}
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          <div className={`px-2 mb-2 ${isCollapsed ? 'text-center' : ''}`}>
            <span className="text-[10px] font-semibold tracking-wider text-slate-300 uppercase">
              {isCollapsed ? 'CMS' : 'Control Menu'}
            </span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center rounded-lg transition-all duration-150 text-left group relative ${
                  isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-orange-600 text-white font-semibold shadow-md shadow-orange-950/40'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-400'
                  }`}
                />

                {!isCollapsed && (
                  <div className="ml-3 truncate flex-1">
                    <div className="text-xs font-semibold tracking-tight">{item.label}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isActive ? 'text-orange-100' : 'text-slate-300'
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                )}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer: User Profile & Public Site Link */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0F1E3D]/30 space-y-2">
          <button
            onClick={onNavigateHome}
            className={`w-full flex items-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors ${
              isCollapsed ? 'justify-center p-2' : 'px-3 py-2 space-x-2'
            }`}
            title="Open Public Website"
          >
            <ExternalLink className="w-4 h-4 shrink-0 text-slate-400" />
            {!isCollapsed && (
              <span className="text-xs font-medium text-slate-300">View Public Website</span>
            )}
          </button>

          {user && (
            <div
              className={`flex items-center rounded-lg bg-slate-900/60 border border-slate-800/80 ${
                isCollapsed ? 'justify-center p-2' : 'p-2.5 space-x-2.5'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0 border border-slate-700">
                <User className="w-4 h-4 text-orange-400" />
              </div>
              {!isCollapsed && (
                <div className="truncate flex-1">
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {user.fullName || user.email}
                  </div>
                  <div className="text-[10px] text-slate-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{user.role}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
