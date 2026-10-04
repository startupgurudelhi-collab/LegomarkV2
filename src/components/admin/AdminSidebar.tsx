import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Globe,
  Briefcase,
  Users,
  MessageSquareQuote,
  Image as ImageIcon,
  BookOpen,
  Settings,
  Sparkles,
  ListOrdered,
  Link2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  User,
  Gauge,
  MessageSquare,
  Layers,
  Calendar,
  Activity,
  Share2,
  Sliders,
  Terminal,
} from 'lucide-react';
import { AdminUser } from '../../types/admin';

export type AdminNavSection =
  | 'command-center'
  | 'dashboard'
  | 'analytics'
  | 'website'
  | 'client-logos'
  | 'services'
  | 'packages'
  | 'leads'
  | 'testimonials'
  | 'media'
  | 'blogs'
  | 'auto-blog'
  | 'blog-comments'
  | 'ai-seo-optimizer'
  | 'keyword-cluster'
  | 'blog-series'
  | 'internal-linking'
  | 'orphan-detector'
  | 'backlinks'
  | 'tracked-backlinks'
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

interface NavGroupConfig {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: string;
  items: NavItemConfig[];
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
  // LACS Sections Configuration (Moving existing items only)
  const lacsGroups: NavGroupConfig[] = [
    {
      id: 'content-studio',
      title: 'Content Studio',
      icon: Layers,
      items: [
        {
          id: 'blogs',
          label: 'Blogs & Articles',
          description: 'Legal & Tax Insights',
          icon: BookOpen,
        },
        {
          id: 'auto-blog',
          label: 'Auto Blog Generator',
          description: 'Unified AI Workflow',
          icon: Sparkles,
          badge: 'AI',
        },
        {
          id: 'keyword-cluster',
          label: 'AI Keyword Cluster',
          description: 'SEO Research & Intent',
          icon: Sparkles,
          badge: 'AI',
        },
        {
          id: 'blog-series',
          label: 'AI Blog Series',
          description: 'Multi-Part Content Planner',
          icon: ListOrdered,
          badge: 'AI',
        },
        {
          id: 'ai-seo-optimizer',
          label: 'AI SEO Optimizer',
          description: 'LEGOMARK On-Page Score',
          icon: Gauge,
          badge: 'AI',
        },
        {
          id: 'internal-linking',
          label: 'AI Internal Linking',
          description: 'Contextual Links & Routing',
          icon: Link2,
          badge: 'AI',
        },
      ],
    },
    {
      id: 'content-planner',
      title: 'Content Planner',
      icon: Calendar,
      badge: 'Upcoming',
      items: [],
    },
    {
      id: 'seo-health',
      title: 'SEO Health',
      icon: Activity,
      items: [
        {
          id: 'orphan-detector',
          label: 'AI Orphan Detector',
          description: 'Link Equity & Inbound Audit',
          icon: ShieldAlert,
          badge: 'AI',
        },
      ],
    },
    {
      id: 'engagement',
      title: 'Engagement',
      icon: MessageSquare,
      items: [
        {
          id: 'blog-comments',
          label: 'Blog Comments',
          description: 'Moderation & Discussion',
          icon: MessageSquare,
        },
      ],
    },
    {
      id: 'backlinks',
      title: 'Backlinks',
      icon: Share2,
      badge: 'LACS',
      items: [
        {
          id: 'backlinks',
          label: 'Backlink Opportunities',
          description: 'SERP Elevation & Outreach',
          icon: Share2,
          badge: 'SERP',
        },
        {
          id: 'tracked-backlinks',
          label: 'Tracked Backlinks',
          description: 'Verification & Monitoring',
          icon: Link2,
          badge: 'Tracker',
        },
      ],
    },
    {
      id: 'analytics-group',
      title: 'Analytics',
      icon: BarChart3,
      items: [
        {
          id: 'analytics',
          label: 'Website Analytics',
          description: 'Traffic & Visitor Metrics',
          icon: BarChart3,
        },
      ],
    },
  ];

  // Core Admin Section (Dashboard, CMS, Logos, Services, Leads, Testimonials, Media, Settings)
  const coreAdminGroup: NavGroupConfig = {
    id: 'core-admin',
    title: 'Core Admin',
    icon: Sliders,
    items: [
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
        id: 'settings',
        label: 'Settings',
        description: 'Profile & Configuration',
        icon: Settings,
      },
    ],
  };

  const allGroups = [...lacsGroups, coreAdminGroup];

  // Expandable/Collapsible section states (defaults expanded for active groups)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'content-studio': true,
    'content-planner': false,
    'seo-health': true,
    engagement: true,
    backlinks: false,
    'analytics-group': true,
    'core-admin': true,
  });

  // Automatically expand group if active item resides within it
  useEffect(() => {
    for (const group of allGroups) {
      if (group.items.some((item) => item.id === currentSection)) {
        setExpandedSections((prev) => ({ ...prev, [group.id]: true }));
        break;
      }
    }
  }, [currentSection]);

  const toggleSection = (groupId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

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
            className="flex items-center space-x-3 text-left focus:outline-hidden group overflow-hidden cursor-pointer"
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
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4 custom-scrollbar">
          {/* PROMINENT AI SEO COMMAND CENTER AT TOP */}
          <div className="px-1">
            <button
              onClick={() => handleItemClick('command-center')}
              className={`w-full relative overflow-hidden rounded-xl border transition-all duration-200 text-left group cursor-pointer ${
                currentSection === 'command-center'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 border-orange-400 text-white shadow-lg shadow-orange-600/30'
                  : 'bg-gradient-to-r from-slate-900 via-[#101B36] to-slate-900 border-orange-500/30 hover:border-orange-500/60 text-slate-200 shadow-md'
              } ${isCollapsed ? 'p-2.5 flex justify-center' : 'p-3'}`}
              title="AI SEO Command Center"
            >
              {/* Subtle Ambient Glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center space-x-2.5 relative z-10">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    currentSection === 'command-center'
                      ? 'bg-white/20 text-white'
                      : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  }`}
                >
                  <Gauge className="w-4 h-4 animate-pulse" />
                </div>

                {!isCollapsed && (
                  <div className="truncate flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                        AI SEO Command Center
                      </span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded tracking-wider ${
                          currentSection === 'command-center'
                            ? 'bg-white/25 text-white'
                            : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        }`}
                      >
                        LACS #23
                      </span>
                    </div>
                    <p
                      className={`text-[10px] truncate mt-0.5 ${
                        currentSection === 'command-center' ? 'text-orange-100' : 'text-slate-400'
                      }`}
                    >
                      Unified Health & Priority Queue
                    </p>
                  </div>
                )}
              </div>

              {/* Collapsed Tooltip */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  AI SEO Command Center
                </div>
              )}
            </button>
          </div>

          {/* LACS SECTIONS HEADER */}
          {!isCollapsed && (
            <div className="px-2 pt-1 flex items-center justify-between">
              <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                LACS Architecture
              </span>
              <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.2 rounded border border-orange-500/20">
                SEO & Content
              </span>
            </div>
          )}

          {/* 6 LACS EXPANDABLE / COLLAPSIBLE SECTIONS */}
          <div className="space-y-1.5">
            {lacsGroups.map((group) => {
              const isExpanded = expandedSections[group.id] ?? true;
              const hasItems = group.items.length > 0;
              const GroupIcon = group.icon;
              const hasActiveItem = group.items.some((i) => i.id === currentSection);

              return (
                <div key={group.id} className="rounded-xl overflow-hidden">
                  {/* Group Header */}
                  {!isCollapsed ? (
                    <button
                      type="button"
                      onClick={() => toggleSection(group.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 text-left rounded-lg transition-colors cursor-pointer group ${
                        hasActiveItem
                          ? 'bg-slate-800/40 text-white'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <GroupIcon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            hasActiveItem
                              ? 'text-orange-400'
                              : 'text-slate-400 group-hover:text-slate-300'
                          }`}
                        />
                        <span className="text-xs font-bold tracking-tight truncate">
                          {group.title}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {group.badge ? (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-500 border border-slate-700/50">
                            {group.badge}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400">
                            {group.items.length}
                          </span>
                        )}
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-slate-300' : ''
                          }`}
                        />
                      </div>
                    </button>
                  ) : (
                    <div className="w-full flex justify-center py-1">
                      <div
                        className="w-8 h-px bg-slate-800/80 my-1"
                        title={group.title}
                      />
                    </div>
                  )}

                  {/* Group Children Items */}
                  {(isExpanded || isCollapsed) && (
                    <div className={`space-y-0.5 ${!isCollapsed ? 'pl-2 pt-0.5 pb-1' : ''}`}>
                      {hasItems ? (
                        group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = currentSection === item.id;

                          return (
                            <button
                              key={item.id}
                              id={`nav-${item.id}`}
                              onClick={() => handleItemClick(item.id)}
                              className={`w-full flex items-center rounded-lg transition-all duration-150 text-left group relative cursor-pointer ${
                                isCollapsed ? 'justify-center p-2.5' : 'px-2.5 py-2'
                              } ${
                                isActive
                                  ? 'bg-orange-600 text-white font-semibold shadow-md shadow-orange-950/40'
                                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                              }`}
                              title={isCollapsed ? item.label : undefined}
                            >
                              <Icon
                                className={`w-4 h-4 shrink-0 ${
                                  isActive
                                    ? 'text-white'
                                    : 'text-slate-400 group-hover:text-orange-400'
                                }`}
                              />

                              {!isCollapsed && (
                                <div className="ml-2.5 truncate flex-1 flex items-center justify-between">
                                  <div className="truncate">
                                    <div className="text-xs font-medium tracking-tight">
                                      {item.label}
                                    </div>
                                    <div
                                      className={`text-[9px] truncate ${
                                        isActive ? 'text-orange-100' : 'text-slate-400'
                                      }`}
                                    >
                                      {item.description}
                                    </div>
                                  </div>
                                  {item.badge && (
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ml-1 shrink-0 ${
                                        isActive
                                          ? 'bg-white/20 text-white'
                                          : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                      }`}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
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
                        })
                      ) : !isCollapsed ? (
                        <div className="px-3 py-1.5 text-[11px] text-slate-500 italic flex items-center gap-1.5">
                          <span>No items configured yet</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CORE ADMIN SECTION (EXPANDABLE / COLLAPSIBLE) */}
          <div className="pt-2 border-t border-slate-800/80">
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => toggleSection('core-admin')}
                className="w-full flex items-center justify-between px-2.5 py-2 text-left rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/20 transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-2 truncate">
                  <Sliders className="w-4 h-4 text-slate-400 group-hover:text-slate-300 shrink-0" />
                  <span className="text-xs font-bold tracking-tight uppercase text-slate-400">
                    Core Admin
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400">
                    {coreAdminGroup.items.length}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      expandedSections['core-admin'] ? 'rotate-180 text-slate-300' : ''
                    }`}
                  />
                </div>
              </button>
            ) : (
              <div className="w-full flex justify-center py-1">
                <div className="w-8 h-px bg-slate-800/80 my-1" title="Core Admin" />
              </div>
            )}

            {(expandedSections['core-admin'] || isCollapsed) && (
              <div className={`space-y-0.5 ${!isCollapsed ? 'pl-2 pt-0.5 pb-1' : ''}`}>
                {coreAdminGroup.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`nav-${item.id}`}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center rounded-lg transition-all duration-150 text-left group relative cursor-pointer ${
                        isCollapsed ? 'justify-center p-2.5' : 'px-2.5 py-2'
                      } ${
                        isActive
                          ? 'bg-orange-600 text-white font-semibold shadow-md shadow-orange-950/40'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-orange-400'
                        }`}
                      />

                      {!isCollapsed && (
                        <div className="ml-2.5 truncate flex-1">
                          <div className="text-xs font-medium tracking-tight">{item.label}</div>
                          <div
                            className={`text-[9px] truncate ${
                              isActive ? 'text-orange-100' : 'text-slate-400'
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
            )}
          </div>
        </div>

        {/* Footer: User Profile & Public Site Link */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0F1E3D]/30 space-y-2">
          <button
            onClick={onNavigateHome}
            className={`w-full flex items-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer ${
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
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
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
