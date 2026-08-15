import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquareQuote,
  Briefcase,
  Package,
  BookOpen,
  HelpCircle,
  ArrowUpRight,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
  Shield,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { AdminUser } from '../../types/admin';
import { SERVICES, PACKAGES, FAQS, COMPANY_PROFILE } from '../../data/websiteData';
import { fetchAdminPackages } from '../../services/adminPackage.service';
import { fetchAdminLeads } from '../../services/lead.service';
import { LeadItem, LeadStats } from '../../types/lead';
import { AdminNavSection } from './AdminSidebar';

interface AdminDashboardProps {
  user: AdminUser | null;
  onNavigateSection: (section: AdminNavSection) => void;
  onNavigateHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  onNavigateSection,
  onNavigateHome,
}) => {
  const [totalPackagesCount, setTotalPackagesCount] = useState<number>(PACKAGES.length);
  const [activePackagesCount, setActivePackagesCount] = useState<number>(PACKAGES.length);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [leadStats, setLeadStats] = useState<LeadStats>({
    total: 0,
    new: 0,
    contacted: 0,
    inProgress: 0,
    converted: 0,
    closed: 0,
  });
  const [recentLeads, setRecentLeads] = useState<LeadItem[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const [pkgs, leadsRes] = await Promise.all([
          fetchAdminPackages().catch(() => []),
          fetchAdminLeads({ limit: 4 }).catch(() => ({ leads: [], total: 0, stats: { total: 0, new: 0, contacted: 0, inProgress: 0, converted: 0, closed: 0 } })),
        ]);

        if (isMounted) {
          if (pkgs && pkgs.length > 0) {
            setTotalPackagesCount(pkgs.length);
            setActivePackagesCount(pkgs.filter((p) => p.isActive).length);
          } else {
            setTotalPackagesCount(PACKAGES.length);
            setActivePackagesCount(PACKAGES.length);
          }

          if (leadsRes) {
            setLeadStats(leadsRes.stats);
            setRecentLeads(leadsRes.leads || []);
          }
        }
      } catch (err) {
        if (isMounted) {
          setTotalPackagesCount(PACKAGES.length);
          setActivePackagesCount(PACKAGES.length);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPackages(false);
          setIsLoadingLeads(false);
        }
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalServices = SERVICES.length;
  const activeServices = SERVICES.length;
  const totalFaqs = FAQS.length;
  const totalPracticeCategories = 6; // 6 core legal/tax categories

  // Format current greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const adminDisplayName = user?.fullName || 'NOMАAN RIZVI';

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0B132B] via-[#0F1E3D] to-[#1E293B] border border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Control Center
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" /> Authorized Admin
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {getGreeting()}, {adminDisplayName}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Here’s what’s happening with LEGOMARK INDIA corporate advisory, services, and commercial packages.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateSection('packages')}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition-all"
            >
              <Package className="w-4 h-4 mr-1.5" />
              Manage Packages
            </button>
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Live Website
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Bar (Using Real Existing Records) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1: Leads */}
        <button
          onClick={() => onNavigateSection('leads')}
          className="text-left bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Leads</span>
            <Users className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">
              {isLoadingLeads ? '...' : leadStats.total}
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
              <span>All enquiries</span>
            </div>
          </div>
        </button>

        {/* Metric 2: New Leads */}
        <button
          onClick={() => onNavigateSection('leads')}
          className="text-left bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 flex flex-col justify-between transition-all"
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-medium">New Enquiries</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-amber-400">
              {isLoadingLeads ? '...' : leadStats.new}
            </div>
            <div className="text-[11px] text-amber-400/80 flex items-center gap-1 mt-0.5">
              <span>Needs follow-up</span>
            </div>
          </div>
        </button>

        {/* Metric 3: Active Services */}
        <button
          onClick={() => onNavigateSection('services')}
          className="text-left bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Services</span>
            <Briefcase className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{activeServices}</div>
            <div className="text-[11px] text-emerald-400/90 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Live on website
            </div>
          </div>
        </button>

        {/* Metric 4: Packages */}
        <button
          onClick={() => onNavigateSection('packages')}
          className="text-left bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Packages</span>
            <Package className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">
              {isLoadingPackages ? '...' : activePackagesCount}
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
              <span>Commercial tiers</span>
            </div>
          </div>
        </button>

        {/* Metric 5: Testimonials */}
        <button
          onClick={() => onNavigateSection('testimonials')}
          className="text-left bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Client Reviews</span>
            <MessageSquareQuote className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">Social Proof</div>
            <div className="text-[11px] text-orange-400/90 flex items-center gap-1 mt-0.5">
              <span>Manage Reviews</span>
            </div>
          </div>
        </button>

        {/* Metric 6: Categories */}
        <button
          onClick={() => onNavigateSection('services')}
          className="text-left bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Practice Areas</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{totalPracticeCategories}</div>
            <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
              <span>Core domains</span>
            </div>
          </div>
        </button>
      </div>

      {/* 3. Main Content Split: Packages & Services Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Commercial Packages Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  Commercial Packages Overview
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Public tiers available on the LEGOMARK INDIA corporate portal.
                </p>
              </div>
              <button
                onClick={() => onNavigateSection('packages')}
                className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
              >
                <span>Full Package Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-xs font-bold text-slate-200 truncate">{pkg.name}</span>
                      {pkg.badge && (
                        <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          {pkg.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-extrabold text-white mb-2">
                      {pkg.price}{' '}
                      {pkg.period && <span className="text-xs font-normal text-slate-400">{pkg.period}</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">{pkg.tagline}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                    {pkg.features.length} core deliverables included
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Practice Areas / Services Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-orange-500" />
                  Services & Practice Areas ({totalServices})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Authoritative practice areas mapped across India business law and taxation.
                </p>
              </div>
              <button
                onClick={() => onNavigateSection('services')}
                className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
              >
                <span>View All Services</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {SERVICES.slice(0, 5).map((service) => (
                <div
                  key={service.id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-slate-800/30 px-2 rounded-md transition-colors"
                >
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-2">
                      <span>{service.title}</span>
                      {service.popular && (
                        <span className="px-1.5 py-0.2 rounded-sm text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {service.category.toUpperCase()} • {service.shortDesc}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-orange-400">{service.startingPrice}</div>
                    <div className="text-[10px] text-slate-300">{service.timeline}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Corporate Details & Activity Inbox */}
        <div className="space-y-6">
          {/* Corporate Profile Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-500" />
                Registered Entity
              </h2>
              <button
                onClick={() => onNavigateSection('website')}
                className="text-[11px] font-semibold text-orange-400 hover:underline"
              >
                Edit Details
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Company Name
                </div>
                <div className="font-semibold text-slate-200 mt-0.5">{COMPANY_PROFILE.name}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Managing Director / Founder
                </div>
                <div className="font-semibold text-slate-200 mt-0.5">
                  {COMPANY_PROFILE.founder.name} ({COMPANY_PROFILE.founder.designation})
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Registered Office (New Delhi)
                </div>
                <div className="text-slate-300 mt-0.5 leading-relaxed">
                  {COMPANY_PROFILE.address.fullAddress}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-300 block">Mobile:</span>
                  <span className="text-slate-300 font-medium">{COMPANY_PROFILE.contact.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-300 block">Landline:</span>
                  <span className="text-slate-300 font-medium">{COMPANY_PROFILE.contact.landline}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Inbound Leads / Consultation Requests */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                Recent Enquiries ({leadStats.total})
              </h2>
              <button
                onClick={() => onNavigateSection('leads')}
                className="text-[11px] font-semibold text-orange-400 hover:underline flex items-center gap-1"
              >
                <span>Lead Center</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentLeads.length > 0 ? (
              <div className="space-y-2.5">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => onNavigateSection('leads')}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-lg cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-white truncate">{lead.fullName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          lead.status === 'NEW'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : lead.status === 'CONTACTED'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                            : lead.status === 'CONVERTED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-orange-400 truncate">{lead.serviceInterested}</div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                      <span>{lead.phone}</span>
                      <span>{lead.city || 'India'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Structured Professional Empty State */
              <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-lg p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-200 mb-1">No New Consultation Enquiries</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto mb-3">
                  Inbound consultation submissions through the public website will appear here in real-time.
                </p>
                <button
                  onClick={() => onNavigateSection('leads')}
                  className="inline-flex items-center text-xs font-semibold text-orange-400 hover:text-orange-300"
                >
                  <span>Open Lead Management</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
