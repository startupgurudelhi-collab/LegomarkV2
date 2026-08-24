import React, { useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  RotateCcw,
  ChevronRight,
  Clock,
  Printer,
  Phone,
  Mail,
  MapPin,
  HelpCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { COMPANY_PROFILE } from '../../data/websiteData';

export type LegalPolicyType = 'privacy' | 'terms' | 'refund';

interface LegalPageLayoutProps {
  activePolicy: LegalPolicyType;
  title: string;
  subtitle: string;
  lastUpdated: string;
  onNavigatePolicy: (policy: LegalPolicyType) => void;
  onNavigateHome?: () => void;
  onOpenConsultation?: (serviceName?: string) => void;
  children: React.ReactNode;
}

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  activePolicy,
  title,
  subtitle,
  lastUpdated,
  onNavigatePolicy,
  onNavigateHome,
  onOpenConsultation,
  children,
}) => {
  const { address, contact, name } = COMPANY_PROFILE;

  // Set document title and scroll to top on mount / change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = `${title} | ${name}`;
  }, [title, name]);

  const policies = [
    {
      id: 'privacy' as LegalPolicyType,
      label: 'Privacy Policy',
      path: '/privacy-policy',
      icon: ShieldCheck,
      desc: 'Information collection, DPDP Act 2023 alignment & data protection',
    },
    {
      id: 'terms' as LegalPolicyType,
      label: 'Terms & Conditions',
      path: '/terms-and-conditions',
      icon: FileText,
      desc: 'Service terms, client obligations & scope of professional advisory',
    },
    {
      id: 'refund' as LegalPolicyType,
      label: 'Refund & Cancellation',
      path: '/refund-policy',
      icon: RotateCcw,
      desc: 'Professional fees, statutory charges & cancellation terms',
    },
  ];

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. Header Banner */}
      <section className="bg-[#0B132B] text-white pt-10 pb-12 sm:pt-14 sm:pb-16 border-b border-slate-800 relative overflow-hidden">
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 mb-6 flex-wrap">
            <button
              onClick={() => onNavigateHome ? onNavigateHome() : window.location.assign('/')}
              className="hover:text-orange-400 transition-colors cursor-pointer"
            >
              Home
            </button>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-400">Legal & Governance</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-orange-400 font-semibold">{title}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-orange-400 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Statutory Compliance & Legal Policies</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
                {title}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {subtitle}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2 bg-slate-800/90 px-3.5 py-2 rounded-lg border border-slate-700/80">
                <Clock className="w-4 h-4 text-orange-400" />
                <span>Last Updated: <strong className="text-white">{lastUpdated}</strong></span>
              </div>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Print or Save PDF"
              >
                <Printer className="w-4 h-4 text-slate-400" />
                <span>Print / Save Copy</span>
              </button>
            </div>
          </div>

          {/* 2. Policy Quick Navigation Tabs */}
          <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {policies.map((p) => {
              const Icon = p.icon;
              const isActive = activePolicy === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onNavigatePolicy(p.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-orange-600/15 border-orange-500/80 text-white shadow-sm'
                      : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-200'}`}>
                      {p.label}
                    </p>
                    <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
                      {p.id === 'privacy' ? 'Data protection & rights' : p.id === 'terms' ? 'Advisory engagement terms' : 'Fees & cancellation rules'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Main Policy Content Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Document Content */}
          <div className="lg:col-span-8 space-y-8 bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs">
            {children}
          </div>

          {/* Sidebar with Quick Contact & Verification */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Registered Entity Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-md bg-[#0B132B] flex items-center justify-center text-white font-extrabold text-xs">
                  LM
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Corporate Advisory & Compliance Desk
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">{address.fullAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-600 shrink-0" />
                  <a href={`mailto:${contact.email}`} className="text-slate-900 hover:text-orange-600 font-medium transition-colors">
                    {contact.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-orange-600 shrink-0" />
                  <a href={`tel:${contact.mobileRaw}`} className="text-slate-900 hover:text-orange-600 font-medium transition-colors">
                    {contact.mobile}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-slate-500 pt-1 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Hours: {contact.officeHours}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  For policy questions, data inquiries, or service fee verifications, contact our grievance & compliance team directly.
                </p>
              </div>
            </div>

            {/* Statutory Disclaimer Box */}
            <div className="bg-amber-50/70 border border-amber-200/80 p-5 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Statutory Notice & Disclaimer</span>
              </div>
              <p className="text-[11px] text-amber-950/80 leading-relaxed">
                LEGOMARK INDIA is a privately operated professional consultancy assisting enterprises with registration, taxation, trademark, and corporate compliance filings. We are not a government agency. Government fees are deposited directly to respective statutory authorities.
              </p>
            </div>

            {/* Need Professional Assistance? */}
            <div className="bg-[#0B132B] text-white p-6 rounded-2xl shadow-sm space-y-4">
              <div className="space-y-1">
                <span className="text-[10.5px] font-bold text-orange-400 uppercase tracking-wider">
                  Expert Advisory
                </span>
                <h4 className="text-base font-bold text-white">
                  Have a Compliance or Service Query?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Speak directly with our senior corporate advisors for incorporation, GST, ROC, or trademark guidance.
                </p>
              </div>

              <button
                onClick={() => onOpenConsultation ? onOpenConsultation('General Corporate Consultation') : undefined}
                className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Book Free Consultation</span>
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};
