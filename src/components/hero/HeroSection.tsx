import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Building2,
  Receipt,
  Sparkles,
  ShieldCheck,
  Award,
  Briefcase,
  ChevronRight,
} from 'lucide-react';
import { SERVICE_CATEGORIES, SERVICES } from '../../data/websiteData';
import { ServiceCategory } from '../../types/website';

interface HeroSectionProps {
  onOpenConsultation: (serviceName?: string) => void;
  onNavigateSection: (sectionId: string) => void;
  onNavigateService?: (slug: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenConsultation,
  onNavigateSection,
  onNavigateService,
}) => {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('company-registration');

  const getCategoryIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Building2':
        return <Building2 className={className} />;
      case 'Receipt':
        return <Receipt className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Briefcase':
        return <Briefcase className={className} />;
      default:
        return <Building2 className={className} />;
    }
  };

  const currentCategory =
    SERVICE_CATEGORIES.find((c) => c.id === activeCategory) || SERVICE_CATEGORIES[0];

  const currentServices = SERVICES.filter((s) => s.category === currentCategory.id);

  return (
    <section
      id="hero-section"
      className="bg-white text-slate-900 pt-8 pb-14 lg:pt-12 lg:pb-20 border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Eyebrow, Main Heading, Supporting Text, Action Buttons, Trust Points */}
          <div className="lg:col-span-6 space-y-5 text-left">
            {/* Small Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-orange-50 text-orange-700 border border-orange-200">
              <span>LEGAL, TAXATION &amp; CORPORATE ADVISORY</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#0B132B] tracking-tight leading-[1.18] font-sans">
              Business Registration,{' '}
              <span className="text-orange-600">Tax &amp; Compliance</span> — All
              Under One Roof
            </h1>

            {/* Supporting Text */}
            <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
              Professional assistance for company registration, GST, income tax, trademark protection, statutory compliance and other business registrations.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <button
                onClick={() => onOpenConsultation('General Corporate Consultation')}
                className="px-6 py-3.5 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Book Free Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigateSection('services-section')}
                className="px-6 py-3.5 bg-white hover:bg-slate-50 text-[#0B132B] text-xs sm:text-sm font-bold rounded-lg border border-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore All Services</span>
              </button>
            </div>

            {/* Compact Service Highlights */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-y-2 gap-x-4 text-xs font-semibold text-slate-700">
              <button
                onClick={() => {
                  setActiveCategory('company-registration');
                  onNavigateSection('services-section');
                }}
                className="flex items-center gap-1.5 hover:text-orange-600 text-left transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Company Registration</span>
              </button>
              <button
                onClick={() => {
                  setActiveCategory('taxation-gst');
                  onNavigateSection('services-section');
                }}
                className="flex items-center gap-1.5 hover:text-orange-600 text-left transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>GST &amp; Taxation</span>
              </button>
              <button
                onClick={() => {
                  setActiveCategory('trademark-ip');
                  onNavigateSection('services-section');
                }}
                className="flex items-center gap-1.5 hover:text-orange-600 text-left transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Trademark &amp; IP</span>
              </button>
              <button
                onClick={() => {
                  setActiveCategory('compliance-roc');
                  onNavigateSection('services-section');
                }}
                className="flex items-center gap-1.5 hover:text-orange-600 text-left transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Annual Compliance</span>
              </button>
            </div>
          </div>

          {/* Right Column: Prominent "OUR SERVICES" Interactive Service Selector */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 sm:p-7 space-y-4">
              {/* Card Header: "OUR SERVICES" */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                    Practice Directory
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#0B132B] tracking-tight">
                    OUR SERVICES
                  </h2>
                </div>
                <button
                  onClick={() => onNavigateSection('services-section')}
                  className="text-xs font-bold text-slate-600 hover:text-orange-600 flex items-center gap-1 transition-colors"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Service Categories Tabs / Pills Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SERVICE_CATEGORIES.map((cat) => {
                  const isActive = cat.id === activeCategory;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#0B132B] text-white border-[#0B132B] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-[#0B132B]'
                      }`}
                    >
                      <span className={isActive ? 'text-orange-400' : 'text-orange-600'}>
                        {getCategoryIcon(cat.iconName)}
                      </span>
                      <span className="truncate text-[11px] sm:text-xs">
                        {cat.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Category Display & List of Specific Services */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0B132B] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-600" />
                    {currentCategory.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {currentServices.length} Practice Items
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentServices.map((item) => (
                    <a
                      key={item.id}
                      href={`/services/${item.slug}`}
                      onClick={(e) => {
                        if (onNavigateService && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                          e.preventDefault();
                          onNavigateService(item.slug);
                        }
                      }}
                      className="group p-2.5 rounded-lg bg-white border border-slate-200 hover:border-orange-500 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#0B132B] group-hover:text-orange-600 flex items-center justify-between">
                          <span className="truncate pr-1">{item.title}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-orange-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight mt-1 line-clamp-2">
                          {item.shortDesc}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Bottom Card Action Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-slate-500 text-center sm:text-left">
                  Need guidance on which structure or filing fits your business?
                </p>
                <button
                  onClick={() => onOpenConsultation(currentCategory.name)}
                  className="w-full sm:w-auto px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <span>Select {currentCategory.shortLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


