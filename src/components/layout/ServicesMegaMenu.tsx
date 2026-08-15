import React from 'react';
import { 
  Building2, 
  Receipt, 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Briefcase, 
  ArrowRight, 
  ArrowUpRight,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { SERVICE_CATEGORIES, SERVICES } from '../../data/websiteData';

interface ServicesMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectService?: (serviceTitle: string) => void;
  onNavigateService?: (slug: string) => void;
  onNavigateSection: (sectionId: string) => void;
}

export const ServicesMegaMenu: React.FC<ServicesMegaMenuProps> = ({
  isOpen,
  onClose,
  onSelectService,
  onNavigateService,
  onNavigateSection,
}) => {
  if (!isOpen) return null;

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'company-registration':
        return <Building2 className="w-4 h-4 text-orange-600 shrink-0" />;
      case 'taxation-gst':
        return <Receipt className="w-4 h-4 text-orange-600 shrink-0" />;
      case 'trademark-ip':
        return <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />;
      case 'compliance-roc':
        return <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />;
      case 'licenses-registrations':
        return <Award className="w-4 h-4 text-orange-600 shrink-0" />;
      case 'advisory-secretarial':
        return <Briefcase className="w-4 h-4 text-orange-600 shrink-0" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />;
    }
  };

  const handleCategoryHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigateSection('services-section');
    onClose();
  };

  const handleServiceClick = (e: React.MouseEvent, slug: string, title: string) => {
    // If modifier key is pressed (Ctrl, Cmd, Shift, Alt, middle-click), allow native browser new tab
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (onNavigateService) {
      onNavigateService(slug);
    } else if (onSelectService) {
      onSelectService(title);
    }
    onClose();
  };

  return (
    <div
      id="services-mega-menu"
      role="region"
      aria-label="Services Mega Menu"
      className="absolute top-full left-1/2 -translate-x-1/2 w-[94vw] max-w-6xl bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Top Corporate Mega Menu Header */}
      <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded">
              PRACTICE AREAS
            </span>
            <h3 className="text-sm font-black text-[#0B132B] font-sans">
              Comprehensive Legal, Taxation & Corporate Advisory Solutions
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Click any service to view full requirements, timeline, pricing, and book a dedicated consultation.
          </p>
        </div>

        <button
          onClick={handleCategoryHeaderClick}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B132B] hover:text-orange-600 transition-colors shrink-0 group self-start sm:self-auto cursor-pointer"
        >
          <span>Explore All 16 Services</span>
          <ArrowRight className="w-3.5 h-3.5 text-orange-600 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 6-Category Dynamic Multi-Column Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-white max-h-[75vh] overflow-y-auto">
        {SERVICE_CATEGORIES.map((category) => {
          const categoryServices = SERVICES.filter((s) => s.category === category.id);

          return (
            <div
              key={category.id}
              className="flex flex-col border border-slate-100 rounded-lg p-4 bg-slate-50/40 hover:border-slate-200 transition-colors"
            >
              {/* Category Header */}
              <div
                onClick={handleCategoryHeaderClick}
                className="flex items-start justify-between pb-2.5 mb-2.5 border-b border-slate-200/70 cursor-pointer group"
                title={`View ${category.name} in Services Section`}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-50 rounded-md border border-orange-100">
                    {getCategoryIcon(category.id)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#0B132B] group-hover:text-orange-600 transition-colors">
                      {category.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {category.count}
                    </span>
                  </div>
                </div>

                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>

              {/* Category Services List */}
              <ul className="space-y-1.5 flex-1" role="menu">
                {categoryServices.map((service) => (
                  <li key={service.id} role="none">
                    <a
                      href={`/services/${service.slug}`}
                      onClick={(e) => handleServiceClick(e, service.slug, service.title)}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:text-orange-600 hover:bg-orange-50/80 transition-all flex items-center justify-between group cursor-pointer"
                      role="menuitem"
                      title={service.shortDesc}
                    >
                      <span className="truncate pr-2">{service.title}</span>
                      {service.popular && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-orange-700 bg-orange-100/90 px-1.5 py-0.5 rounded shrink-0">
                          Popular
                        </span>
                      )}
                      {service.badge && !service.popular && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded shrink-0">
                          {service.badge}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Bottom Quick Advisory Footer Strip */}
      <div className="bg-slate-900 text-slate-300 px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Standard SPICe+ MCA & FoSCoS Government Portals</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Practicing Chartered Accountants & Company Secretaries</span>
          </div>
        </div>

        <a
          href="/services/advisory-secretarial-consultation"
          onClick={(e) => handleServiceClick(e, 'advisory-secretarial-consultation', 'Advisory & Secretarial Consultation')}
          className="text-orange-400 hover:text-orange-300 font-bold text-[11px] underline underline-offset-2 shrink-0 cursor-pointer"
        >
          Need Custom Corporate Structuring? Talk to an Expert
        </a>
      </div>
    </div>
  );
};
