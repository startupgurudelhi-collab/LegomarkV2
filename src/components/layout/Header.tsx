import React, { useState, useRef, useEffect } from 'react';
import { Phone, Mail, Clock, Menu, X, ArrowRight, Search, User, ChevronDown, ChevronUp, HelpCircle, ShieldCheck, FileText, Sparkles, Building2, Receipt, Award, Briefcase } from 'lucide-react';
import { COMPANY_PROFILE, SERVICE_CATEGORIES, SERVICES } from '../../data/websiteData';
import { ServicesMegaMenu } from './ServicesMegaMenu';

interface HeaderProps {
  onOpenConsultation: (serviceName?: string) => void;
  onNavigateSection: (sectionId: string) => void;
  onNavigateService?: (slug: string) => void;
  onNavigateHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenConsultation,
  onNavigateSection,
  onNavigateService,
  onNavigateHome,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesMenuOpen, setServicesMenuOpen] = useState(false);
  const [mobileExpandedCategory, setMobileExpandedCategory] = useState<string | null>(null);
  const servicesNavRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { label: 'Services', sectionId: 'services-section', hasDropdown: true },
    { label: 'Packages', sectionId: 'packages-section', hasDropdown: false },
    { label: 'Compare Matrix', sectionId: 'matrix-section', hasDropdown: false },
    { label: 'Why Us', sectionId: 'why-us-section', hasDropdown: false },
    { label: 'Leadership', sectionId: 'founder-section', hasDropdown: false },
    { label: 'Our Office', sectionId: 'office-section', hasDropdown: false },
    { label: 'FAQ', sectionId: 'faq-section', hasDropdown: false },
  ];

  // Close mega menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideNav = servicesNavRef.current && servicesNavRef.current.contains(target);
      const isInsideMegaMenu = megaMenuRef.current && megaMenuRef.current.contains(target);

      if (!isInsideNav && !isInsideMegaMenu) {
        setServicesMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setServicesMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNavClick = (sectionId: string) => {
    onNavigateSection(sectionId);
    setMobileMenuOpen(false);
    setServicesMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      handleNavClick('hero-section');
    }
    setMobileMenuOpen(false);
    setServicesMenuOpen(false);
  };

  const handleServiceSelect = (serviceTitle: string) => {
    onOpenConsultation(serviceTitle);
    setServicesMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const handleServiceNav = (slug: string) => {
    if (onNavigateService) {
      onNavigateService(slug);
    }
    setServicesMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'company-registration':
        return <Building2 className="w-3.5 h-3.5 text-orange-600" />;
      case 'taxation-gst':
        return <Receipt className="w-3.5 h-3.5 text-orange-600" />;
      case 'trademark-ip':
        return <Sparkles className="w-3.5 h-3.5 text-orange-600" />;
      case 'compliance-roc':
        return <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />;
      case 'licenses-registrations':
        return <Award className="w-3.5 h-3.5 text-orange-600" />;
      case 'advisory-secretarial':
        return <Briefcase className="w-3.5 h-3.5 text-orange-600" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full shadow-xs">
      {/* 1. Top Professional Bar (Dark Navy) */}
      <div className="bg-[#0B132B] text-slate-300 text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5 sm:gap-6 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="text-slate-400">Mobile:</span>
              <a href={`tel:${COMPANY_PROFILE.contact.mobileRaw}`} className="hover:text-white font-medium transition-colors">
                {COMPANY_PROFILE.contact.mobile}
              </a>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="text-slate-400">Landline:</span>
              <a href={`tel:${COMPANY_PROFILE.contact.landlineRaw}`} className="hover:text-white font-medium transition-colors">
                {COMPANY_PROFILE.contact.landline}
              </a>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="text-slate-400">Email:</span>
              <a href={`mailto:${COMPANY_PROFILE.contact.email}`} className="hover:text-white font-medium transition-colors">
                {COMPANY_PROFILE.contact.email}
              </a>
            </div>
            <div className="hidden lg:flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="text-slate-400">Hours:</span>
              <span>{COMPANY_PROFILE.contact.officeHours}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <a
              href="#consultation"
              onClick={(e) => {
                e.preventDefault();
                onOpenConsultation();
              }}
              className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold underline underline-offset-2"
            >
              Request Callback
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Navbar (White Background, Clean Corporate Appearance) */}
      <div className="bg-white border-b border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 xl:gap-4">
          {/* Logo on the Left */}
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-lg bg-[#0B132B] flex items-center justify-center text-white font-black text-lg tracking-wider border border-slate-700 shadow-xs">
              LM
            </div>
            <div>
              <div className="flex items-center tracking-tight">
                <span className="text-xl font-black text-[#0B132B] font-sans">
                  LEGOMARK
                </span>
                <span className="text-xl font-black text-orange-600 font-sans ml-1">
                  INDIA
                </span>
              </div>
              <p className="text-[9.5px] uppercase font-bold tracking-wider text-slate-500 -mt-0.5">
                {COMPANY_PROFILE.positioning}
              </p>
            </div>
          </div>

          {/* Center / Horizontal Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs font-bold text-slate-800" ref={servicesNavRef}>
            {navLinks.map((link) => {
              if (link.hasDropdown) {
                return (
                  <div key={link.sectionId} className="relative">
                    <button
                      onClick={() => setServicesMenuOpen(!servicesMenuOpen)}
                      aria-expanded={servicesMenuOpen}
                      aria-haspopup="true"
                      className={`flex items-center gap-1 hover:text-orange-600 transition-colors py-2 cursor-pointer font-sans ${
                        servicesMenuOpen ? 'text-orange-600' : ''
                      }`}
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          servicesMenuOpen ? 'rotate-180 text-orange-600' : 'text-slate-500'
                        }`}
                      />
                    </button>
                  </div>
                );
              }

              return (
                <button
                  key={link.sectionId}
                  onClick={() => handleNavClick(link.sectionId)}
                  className="hover:text-orange-600 transition-colors py-2 cursor-pointer font-sans whitespace-nowrap"
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Area: Contact Box, Search, Login, Book Free Consultation CTA */}
          <div className="hidden lg:flex items-center gap-2.5 xl:gap-3.5 shrink-0">
            {/* Dedicated Light-Grey Rounded Contact Box */}
            <a
              href={`tel:${COMPANY_PROFILE.contact.mobileRaw}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100/90 hover:bg-slate-200/90 border border-slate-200 text-xs text-slate-800 transition-colors shadow-xs"
              title="Call Official Contact Desk"
            >
              <Phone className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span className="text-slate-500 font-medium text-[11px]">Call:</span>
              <span className="font-bold text-[#0B132B] text-[11px] whitespace-nowrap">
                {COMPANY_PROFILE.contact.mobile}
              </span>
            </a>

            {/* Outlined Search Icon */}
            <button
              onClick={() => onNavigateSection('services-section')}
              className="p-2 text-slate-600 hover:text-[#0B132B] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Search Services"
              aria-label="Search Services"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Subtle Login Link */}
            <button
              onClick={() => onOpenConsultation('Client Portal Login')}
              className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-[#0B132B] px-2.5 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Client Portal Login"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Login</span>
            </button>

            {/* Orange Consultation CTA */}
            <button
              onClick={() => onOpenConsultation()}
              className="px-3.5 xl:px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Book Free Consultation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => onOpenConsultation()}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1"
            >
              <span>Consult</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Large Corporate Services Mega Menu (Anchored to header navbar) */}
        <div ref={megaMenuRef}>
          <ServicesMegaMenu
            isOpen={servicesMenuOpen}
            onClose={() => setServicesMenuOpen(false)}
            onSelectService={handleServiceSelect}
            onNavigateService={handleServiceNav}
            onNavigateSection={handleNavClick}
          />
        </div>

        {/* 3. Subtle SUPPORT HUB Strip Underneath Main Navigation */}
        <div className="bg-slate-50/80 border-t border-slate-100 py-1 px-4 sm:px-6 lg:px-8 text-center sm:text-right">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px]">
            <div className="hidden md:flex items-center gap-2 text-slate-500 text-[10.5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>MCA SPICe+, GST, Trademark & ROC Filings</span>
            </div>

            <div className="flex items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
              <button
                onClick={() => onOpenConsultation('Support Hub / Advisory Assistance')}
                className="text-[11px] font-bold uppercase tracking-wider text-orange-600 hover:text-orange-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3 h-3 text-orange-600" />
                <span>SUPPORT HUB</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-lg max-h-[85vh] overflow-y-auto">
          {/* Mobile Contact Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-600" />
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">Official Contact</span>
                <a href={`tel:${COMPANY_PROFILE.contact.mobileRaw}`} className="font-bold text-slate-900 text-xs">
                  {COMPANY_PROFILE.contact.mobile}
                </a>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenConsultation('Client Portal Login');
              }}
              className="flex items-center gap-1 text-xs font-bold text-slate-700 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Login</span>
            </button>
          </div>

          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              if (link.hasDropdown) {
                return (
                  <div key={link.sectionId} className="border-b border-slate-100 pb-1">
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold text-slate-800 bg-slate-50/50">
                      <button
                        onClick={() => handleNavClick(link.sectionId)}
                        className="text-left font-bold text-slate-900 hover:text-orange-600"
                      >
                        {link.label}
                      </button>
                      <button
                        onClick={() => setMobileExpandedCategory(mobileExpandedCategory === 'services' ? null : 'services')}
                        className="p-1 text-slate-500 hover:text-orange-600"
                        aria-label="Expand all practice areas"
                      >
                        {mobileExpandedCategory === 'services' ? (
                          <ChevronUp className="w-4 h-4 text-orange-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Mobile Services Accordion */}
                    {mobileExpandedCategory === 'services' && (
                      <div className="pl-3 pr-1 py-2 space-y-2.5 animate-in fade-in duration-150">
                        {SERVICE_CATEGORIES.map((category) => {
                          const categoryServices = SERVICES.filter((s) => s.category === category.id);
                          return (
                            <div key={category.id} className="border-l-2 border-orange-500 pl-2.5 py-0.5">
                              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-slate-800 mb-1">
                                {getCategoryIcon(category.id)}
                                <span>{category.name}</span>
                              </div>
                              <div className="space-y-1">
                                {categoryServices.map((service) => (
                                  <a
                                    key={service.id}
                                    href={`/services/${service.slug}`}
                                    onClick={(e) => {
                                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                                        e.preventDefault();
                                        handleServiceNav(service.slug);
                                      }
                                    }}
                                    className="w-full text-left text-xs text-slate-600 hover:text-orange-600 py-1 flex items-center justify-between group"
                                  >
                                    <span className="truncate">{service.title}</span>
                                    {service.popular && (
                                      <span className="text-[8px] font-bold text-orange-700 bg-orange-100 px-1 py-0.2 rounded">
                                        Popular
                                      </span>
                                    )}
                                  </a>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={link.sectionId}
                  onClick={() => handleNavClick(link.sectionId)}
                  className="text-left px-3 py-2.5 rounded-lg text-xs font-bold text-slate-800 hover:bg-slate-50 hover:text-orange-600 transition-colors flex items-center justify-between"
                >
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenConsultation();
              }}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>Book Free Consultation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenConsultation('Support Hub');
              }}
              className="w-full py-2 bg-slate-50 text-orange-600 border border-slate-200 text-[11px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="w-3 h-3 text-orange-600" />
              <span>SUPPORT HUB</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};


