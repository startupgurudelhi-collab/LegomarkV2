import React from 'react';
import { COMPANY_PROFILE } from '../../data/websiteData';
import { Phone, Mail, MapPin, Clock, ArrowUp, Globe } from 'lucide-react';

interface FooterProps {
  onNavigateSection: (sectionId: string) => void;
  onOpenConsultation: (serviceName?: string) => void;
  onNavigateService?: (slug: string) => void;
  onNavigateHome?: () => void;
  onNavigatePath?: (path: string) => void;
  onToggleDiagnostics?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateSection,
  onOpenConsultation,
  onNavigateService,
  onNavigateHome,
  onNavigatePath,
  onToggleDiagnostics,
}) => {
  const { address, contact, positioning } = COMPANY_PROFILE;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleServiceClick = (e: React.MouseEvent, slug: string, fallbackTitle: string) => {
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      if (onNavigateService) {
        onNavigateService(slug);
      } else {
        onOpenConsultation(fallbackTitle);
      }
    }
  };

  return (
    <footer className="bg-[#0B132B] text-slate-400 border-t border-slate-800 text-xs">
      {/* Main Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Col 1: Brand & Contact Information */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-extrabold text-sm tracking-wider shadow-xs">
                LM
              </div>
              <div className="flex items-center">
                <span className="text-lg font-black tracking-tight text-white font-sans">
                  LEGOMARK
                </span>
                <span className="text-lg font-black tracking-tight text-orange-500 font-sans ml-1">
                  INDIA
                </span>
              </div>
            </div>

            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              {positioning}
            </p>

            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Simplifying company registration, taxation, trademark protection, and business compliance through transparent professional services.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-start gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>{address.fullAddress}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Mobile:</span>
                <a href={`tel:${contact.mobileRaw}`} className="hover:text-orange-400 transition-colors font-medium text-white">
                  {contact.mobile}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Landline:</span>
                <a href={`tel:${contact.landlineRaw}`} className="hover:text-orange-400 transition-colors font-medium text-white">
                  {contact.landline}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Email:</span>
                <a href={`mailto:${contact.email}`} className="hover:text-orange-400 transition-colors text-white">
                  {contact.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Globe className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Web:</span>
                <span className="text-white">{contact.websites.join(' / ')}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Hours: {contact.officeHours}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Company Incorporation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Company Registration
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a
                  href="/services/private-limited-company-registration"
                  onClick={(e) => handleServiceClick(e, 'private-limited-company-registration', 'Private Limited Company Registration')}
                  className="hover:text-orange-400 transition-colors text-left block cursor-pointer"
                >
                  Private Limited Company
                </a>
              </li>
              <li>
                <a
                  href="/services/llp-registration"
                  onClick={(e) => handleServiceClick(e, 'llp-registration', 'LLP Registration')}
                  className="hover:text-orange-400 transition-colors text-left block cursor-pointer"
                >
                  LLP Registration
                </a>
              </li>
              <li>
                <a
                  href="/services/partnership-registration"
                  onClick={(e) => handleServiceClick(e, 'partnership-registration', 'Partnership Registration')}
                  className="hover:text-orange-400 transition-colors text-left block cursor-pointer"
                >
                  Partnership Registration
                </a>
              </li>
              <li>
                <a
                  href="/services/section-8-ngo-registration"
                  onClick={(e) => handleServiceClick(e, 'section-8-ngo-registration', 'Section 8 / NGO Registration')}
                  className="hover:text-orange-400 transition-colors text-left block cursor-pointer"
                >
                  Section 8 / NGO
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Tax & ROC Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Tax & Compliance
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a
                  href="/services/gst-registration"
                  onClick={(e) => handleServiceClick(e, 'gst-registration', 'GST Registration')}
                  className="hover:text-orange-400 transition-colors text-left block cursor-pointer"
                >
                  GST Registration
                </a>
              </li>
              <li>
                <a
                  href="/services/gst-return-filing"
                  onClick={(e) => handleServiceClick(e, 'gst-return-filing', 'GST Return Filing')}
                  className="hover:text-orange-400 transition-colors text-left block cursor-pointer"
                >
                  GST Return Filing
                </a>
              </li>
              <li>
                <a
                  href="/services/income-tax-return-itr"
                  onClick={(e) => handleServiceClick(e, 'income-tax-return-itr', 'Income Tax Return / ITR')}
                  className="hover:text-orange-400 transition-colors text-left block cursor-pointer"
                >
                  Income Tax Return / ITR
                </a>
              </li>
              <li>
                <a
                  href="/services/roc-filing"
                  onClick={(e) => handleServiceClick(e, 'roc-filing', 'ROC Filing')}
                  className="hover:text-orange-400 transition-colors text-left block cursor-pointer"
                >
                  ROC Annual Filing
                </a>
              </li>
              <li>
                <a
                  href="/services/trademark-registration"
                  onClick={(e) => handleServiceClick(e, 'trademark-registration', 'Trademark Registration')}
                  className="hover:text-orange-400 transition-colors text-left block cursor-pointer"
                >
                  Trademark Registration
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: IP & Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <button
                  onClick={() => onNavigateSection('services-section')}
                  className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                >
                  All Services
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('packages-section')}
                  className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                >
                  Advisory Packages
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('matrix-section')}
                  className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                >
                  Comparison Matrix
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('founder-section')}
                  className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                >
                  Leadership
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('office-section')}
                  className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                >
                  Our Office
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('resources')}
                  className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                >
                  Knowledge Resources
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('faq-section')}
                  className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                >
                  FAQs
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 space-y-4">
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-4xl">
            <strong className="text-slate-300">Website Disclaimer:</strong> LEGOMARK INDIA is a privately operated platform and is not affiliated with, endorsed by, or connected with any government department or authority. Our forms and services are provided for information and assistance purposes and are not official government registration or application forms. We assist clients with business registration, taxation, compliance, licensing and related services based on their requirements. Fees charged through this website are service/professional assistance fees; applicable government fees, if any, are separate. Government rules, fees and procedures may change, and users are advised to verify official requirements where necessary.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>&copy; {new Date().getFullYear()} LEGOMARK INDIA. All Rights Reserved.</span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span>
                Designed & Developed by <span className="text-slate-300 font-medium hover:text-orange-400 transition-colors">Creattivee</span>
                {/* Designed & Developed by Creattivee */}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="/admin/login"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    if (onNavigatePath) {
                      onNavigatePath('/admin/login');
                    } else {
                      window.location.assign('/admin/login');
                    }
                  }
                }}
                className="text-slate-500 hover:text-slate-400 transition-colors cursor-pointer text-[10px] underline"
              >
                Admin Portal
              </a>
              {onToggleDiagnostics && (
                <button
                  onClick={onToggleDiagnostics}
                  className="text-slate-500 hover:text-slate-400 transition-colors cursor-pointer text-[10px] underline"
                >
                  Diagnostic Status
                </button>
              )}
              <button
                onClick={scrollToTop}
                className="p-2 rounded-lg bg-slate-800 hover:bg-orange-600 text-white transition-colors cursor-pointer flex items-center gap-1"
                aria-label="Scroll to top"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">Top</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
