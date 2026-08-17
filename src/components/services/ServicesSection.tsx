import React, { useState } from 'react';
import {
  SERVICES,
  SERVICE_CATEGORIES,
} from '../../data/websiteData';
import { ServiceCategory, ServiceCategoryMeta, ServiceItem } from '../../types/website';
import {
  Building2,
  Scale,
  UserCheck,
  Users,
  HeartHandshake,
  ReceiptText,
  FileCheck,
  ShieldAlert,
  BadgePercent,
  FileSpreadsheet,
  Sparkles,
  FileText,
  Award,
  Utensils,
  Globe,
  Briefcase,
  Store,
  ArrowRight,
  CheckCircle,
  Clock,
  Shield,
} from 'lucide-react';

interface ServicesSectionProps {
  onOpenConsultation: (serviceName?: string) => void;
  onOpenBuyNow?: (service: ServiceItem) => void;
  onNavigateService?: (slug: string) => void;
  categories?: ServiceCategoryMeta[];
  services?: ServiceItem[];
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  onOpenConsultation,
  onOpenBuyNow,
  onNavigateService,
  categories = SERVICE_CATEGORIES,
  services = SERVICES,
}) => {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('company-registration');

  const renderServiceIcon = (iconName: string) => {
    const iconClass = 'w-5 h-5 text-orange-600';
    switch (iconName) {
      case 'Building2':
        return <Building2 className={iconClass} />;
      case 'Scale':
        return <Scale className={iconClass} />;
      case 'UserCheck':
        return <UserCheck className={iconClass} />;
      case 'Users':
        return <Users className={iconClass} />;
      case 'HeartHandshake':
        return <HeartHandshake className={iconClass} />;
      case 'ReceiptText':
        return <ReceiptText className={iconClass} />;
      case 'FileCheck':
        return <FileCheck className={iconClass} />;
      case 'ShieldAlert':
        return <ShieldAlert className={iconClass} />;
      case 'BadgePercent':
        return <BadgePercent className={iconClass} />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className={iconClass} />;
      case 'Sparkles':
        return <Sparkles className={iconClass} />;
      case 'FileText':
        return <FileText className={iconClass} />;
      case 'Award':
        return <Award className={iconClass} />;
      case 'Utensils':
        return <Utensils className={iconClass} />;
      case 'Globe':
        return <Globe className={iconClass} />;
      case 'Briefcase':
        return <Briefcase className={iconClass} />;
      case 'Store':
        return <Store className={iconClass} />;
      default:
        return <Shield className={iconClass} />;
    }
  };

  const filteredServices = services.filter((s) => s.category === activeCategory);

  return (
    <section id="services-section" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
            Professional Offerings
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B132B] tracking-tight font-sans">
            Legal, Tax & Statutory Compliance Services
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Directly handled by practicing Chartered Accountants, Company Secretaries, and Legal Consultants.
          </p>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 p-1 bg-white rounded-xl max-w-3xl mx-auto border border-slate-200 shadow-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as ServiceCategory)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#0B132B] text-white'
                  : 'text-slate-700 hover:text-[#0B132B] hover:bg-slate-100'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                  activeCategory === cat.id ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service: ServiceItem) => (
            <div
              key={service.id}
              id={`service-card-${service.id}`}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Top Card Bar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                    {renderServiceIcon(service.iconName)}
                  </div>
                  {service.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                      {service.badge}
                    </span>
                  )}
                </div>

                {/* Service Title & Desc */}
                <div className="space-y-1.5">
                  <a
                    href={`/services/${service.slug}`}
                    onClick={(e) => {
                      if (onNavigateService && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onNavigateService(service.slug);
                      }
                    }}
                    className="text-sm sm:text-base font-bold text-[#0B132B] hover:text-orange-600 transition-colors block cursor-pointer"
                  >
                    {service.title}
                  </a>
                  <p className="text-xs text-slate-600 leading-relaxed">{service.shortDesc}</p>
                </div>

                {/* Deliverables Checklist */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    What&apos;s Included:
                  </div>
                  <ul className="space-y-1.5">
                    {service.features.slice(0, 4).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Card Footer with Timeline, Price & Action */}
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{service.timeline}</span>
                  </div>
                  {service.startingPrice && (
                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-sans">Starting </span>
                      <span className="text-sm font-bold text-[#0B132B]">
                        {service.startingPrice}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (onOpenBuyNow) {
                        onOpenBuyNow(service);
                      } else {
                        onOpenConsultation(service.title);
                      }
                    }}
                    className="w-full py-2.5 px-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Buy Now &mdash; {service.startingPrice}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onOpenConsultation(service.title)}
                      className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer text-center"
                    >
                      <span>Consultation</span>
                    </button>
                    <a
                      href={`/services/${service.slug}`}
                      onClick={(e) => {
                        if (onNavigateService && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                          e.preventDefault();
                          onNavigateService(service.slug);
                        }
                      }}
                      className="py-2 px-2.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer text-center"
                    >
                      <span>View Details</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
