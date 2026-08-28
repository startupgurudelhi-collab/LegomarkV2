import React, { useState, useEffect } from 'react';
import {
  Building2,
  Scale,
  Users,
  HeartHandshake,
  ReceiptText,
  FileCheck,
  BadgePercent,
  FileSpreadsheet,
  Award,
  Sparkles,
  Shield,
  ShieldAlert,
  FileText,
  Utensils,
  Briefcase,
  HelpCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  FileCheck2,
  ShieldCheck,
  PhoneCall,
  Lock,
  Layers,
  FolderOpen,
  Info,
  Check
} from 'lucide-react';
import { ServiceCategoryMeta, ServiceItem, BuyNowItem, PackageTier } from '../../types/website';
import { SERVICE_CATEGORIES, SERVICES, getRelatedServices } from '../../data/websiteData';
import { getServicePackages } from '../../utils/servicePackages';
import { ClientLogos } from '../logos/ClientLogos';
import { WhyLegomark } from '../why-us/WhyLegomark';
import { TestimonialsSection } from '../testimonials/TestimonialsSection';
import { FounderSection } from '../founder/FounderSection';
import { ServiceApplicationForm } from './ServiceApplicationForm';
import { ServicePackages } from './ServicePackages';
import { ServiceSnapshot } from './ServiceSnapshot';

interface ServiceLandingPageProps {
  service?: ServiceItem;
  categories?: ServiceCategoryMeta[];
  allServices?: ServiceItem[];
  onOpenConsultation: (serviceName?: string) => void;
  onOpenBuyNow?: (item: BuyNowItem | ServiceItem) => void;
  onNavigateService: (slug: string) => void;
  onNavigateHome: () => void;
}

export const ServiceLandingPage: React.FC<ServiceLandingPageProps> = ({
  service,
  categories = SERVICE_CATEGORIES,
  allServices = SERVICES,
  onOpenConsultation,
  onOpenBuyNow,
  onNavigateService,
  onNavigateHome,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Available packages for this specific service
  const packages = getServicePackages(service);
  const defaultPkg = packages.find((p) => p.popular) || packages[0] || null;
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(defaultPkg?.id || null);

  // Sync selected package when service changes
  useEffect(() => {
    const pkgs = getServicePackages(service);
    const defaultP = pkgs.find((p) => p.popular) || pkgs[0] || null;
    setSelectedPackageId(defaultP?.id || null);
  }, [service?.id, service?.slug]);

  const selectedPackage = packages.find((p) => p.id === selectedPackageId) || defaultPkg;

  // Handler to initiate Buy Now with selected package or service
  const handleProceedBuyNow = () => {
    if (!onOpenBuyNow) return;
    if (selectedPackage && service) {
      onOpenBuyNow({
        id: selectedPackage.id,
        name: `${service.title} - ${selectedPackage.name}`,
        title: `${service.title} (${selectedPackage.name})`,
        slug: service.slug,
        priceDisplay: selectedPackage.price,
        itemType: 'package',
        category: service.category,
        governmentFeeNote: service.governmentFeeNote,
        features: selectedPackage.features,
      });
    } else if (service) {
      onOpenBuyNow(service);
    }
  };

  const handleConsultation = () => {
    if (!service) return;
    const label = selectedPackage
      ? `${service.title} - ${selectedPackage.name}`
      : service.title;
    onOpenConsultation(label);
  };

  const scrollToPackages = () => {
    const el = document.getElementById('service-packages-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Update page title & meta for SEO
  useEffect(() => {
    if (service) {
      document.title = `${service.title} | LEGOMARK INDIA - Legal & Corporate Advisory`;
      window.scrollTo(0, 0);
    } else {
      document.title = 'Service Not Found | LEGOMARK INDIA';
    }
  }, [service]);

  // Helper to render icon by name
  const renderIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Building2':
        return <Building2 className={className} />;
      case 'Scale':
        return <Scale className={className} />;
      case 'Users':
        return <Users className={className} />;
      case 'HeartHandshake':
        return <HeartHandshake className={className} />;
      case 'ReceiptText':
        return <ReceiptText className={className} />;
      case 'FileCheck':
        return <FileCheck className={className} />;
      case 'BadgePercent':
        return <BadgePercent className={className} />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Shield':
        return <Shield className={className} />;
      case 'ShieldAlert':
        return <ShieldAlert className={className} />;
      case 'FileText':
        return <FileText className={className} />;
      case 'Utensils':
        return <Utensils className={className} />;
      case 'Briefcase':
        return <Briefcase className={className} />;
      default:
        return <Building2 className={className} />;
    }
  };

  // 404 State: Service not found
  if (!service) {
    return (
      <main className="min-h-screen bg-slate-50 pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 mb-2">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0B132B] tracking-tight">
              Service Not Found
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
              The service page you are looking for does not exist or has been relocated within our corporate catalogue.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B132B] hover:bg-orange-600 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home & All Services</span>
            </button>
          </div>

          {/* Directory of Available Services */}
          <div className="mt-12 pt-10 border-t border-slate-200 text-left">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-6 text-center">
              Explore Our Canonical Legal & Compliance Services
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {allServices.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onNavigateService(s.slug)}
                  className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 hover:border-orange-500 hover:shadow-xs transition-all text-left text-xs font-semibold text-slate-800 group cursor-pointer"
                >
                  <span className="line-clamp-1">{s.title}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const categoryObj = categories.find((c) => c.id === service.category) || SERVICE_CATEGORIES.find((c) => c.id === service.category);
  const landingData = service.landingPage;
  const sameCategoryRelated = allServices.filter(
    (s) => s.slug !== service.slug && s.category === service.category
  );
  const otherCategoryRelated = allServices.filter(
    (s) => s.slug !== service.slug && s.category !== service.category
  );
  const dynamicRelated = [...sameCategoryRelated, ...otherCategoryRelated].slice(0, 3);
  const relatedServices = dynamicRelated.length > 0 ? dynamicRelated : getRelatedServices(service);

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* 2. Hero Section */}
      <section className="bg-white border-b border-slate-200 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Core Service Information */}
            <div className="lg:col-span-7 space-y-6">
              {/* Category & Badge Row */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-orange-50 text-orange-800 border border-orange-200">
                  {renderIcon(service.iconName, 'w-3.5 h-3.5 text-orange-600')}
                  <span>{categoryObj?.name}</span>
                </span>
                {service.badge && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {service.badge}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{service.timeline}</span>
                </span>
              </div>

              {/* Title & Headline */}
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0B132B] tracking-tight leading-tight">
                  {service.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {landingData?.headline || service.fullDesc}
                </p>
              </div>

              {/* Reusable Service Snapshot & Core Inclusions (Independent of Package Selection) */}
              <ServiceSnapshot service={service} />

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <button
                  type="button"
                  className="px-6 py-3.5 bg-[#0B132B] hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>START YOUR REGISTRATION</span>
                </button>
                <button
                  type="button"
                  onClick={handleConsultation}
                  className="px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold rounded-lg border border-slate-300 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-orange-600" />
                  <span>REQUEST PHONE CALL</span>
                </button>
              </div>
            </div>

            {/* Right Column: Service Application Form */}
            <div className="lg:col-span-5">
              <ServiceApplicationForm
                service={service}
                packages={packages}
                selectedPackage={selectedPackage}
                onSelectPackage={(pkg) => setSelectedPackageId(pkg.id)}
                onOpenBuyNow={onOpenBuyNow}
                onOpenConsultation={onOpenConsultation}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Detailed Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Section: 3 Main Package Cards (Basic / Standard / Premium) */}
        {packages && packages.length > 0 && (
          <ServicePackages
            packages={packages}
            service={service}
            selectedPackageId={selectedPackage?.id}
            onSelectPackage={(pkg) => setSelectedPackageId(pkg.id)}
            onOpenBuyNow={onOpenBuyNow}
            onOpenConsultation={onOpenConsultation}
          />
        )}

        {/* Section: Service Overview & Regulatory Context / Package Overview */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
            <Info className="w-4 h-4" />
            <span>Service Overview & Regulatory Framework</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0B132B]">
            About {service.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-4xl">
            {landingData?.overview || service.fullDesc}
          </p>

          {/* Strategic Benefits Grid */}
          {landingData?.benefits && landingData.benefits.length > 0 && (
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B132B] mb-4">
                Key Strategic & Legal Advantages
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {landingData.benefits.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                      ✓
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Section: What's Included (Deliverables) & Documents Required (2-Col Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Deliverables Column */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
              <FolderOpen className="w-4 h-4" />
              <span>What You Receive</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0B132B]">
              Comprehensive Service Deliverables
            </h2>
            <p className="text-xs text-slate-600">
              Every deliverable is verified by our corporate secretarial and legal drafting team.
            </p>
            <ul className="space-y-3 pt-2">
              {(landingData?.deliverables || service.features).map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Required Documents Column */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
              <FileText className="w-4 h-4" />
              <span>Prerequisites & Requirements</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0B132B]">
              Required Checklist & KYC Documents
            </h2>
            <p className="text-xs text-slate-600">
              Digital scanned copies are sufficient. Our team assists with formatting and verification.
            </p>
            <ul className="space-y-3 pt-2">
              {(landingData?.documents || [
                'PAN Card of all applicants / directors / partners',
                'Identity & Address Proof (Aadhaar / Passport / Voter ID)',
                'Registered office premises proof & Landlord NOC',
                'Recent passport-size digital photographs',
              ]).map((doc, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                  <div className="w-4 h-4 rounded bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                    {idx + 1}
                  </div>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-100 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>All client documents are held under strict legal confidentiality.</span>
            </div>
          </section>
        </div>

        {/* Section: Step-by-Step Procedure */}
        {landingData?.process && landingData.process.length > 0 && (
          <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
              <Layers className="w-4 h-4" />
              <span>Execution Roadmap</span>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0B132B]">
                Step-by-Step Filing & Registration Process
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                A structured, transparent workflow designed for statutory compliance and prompt turnaround.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4">
              {landingData.process.map((stepItem, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2 relative flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-xs font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded inline-block">
                      STEP {stepItem.step}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#0B132B] leading-tight">
                      {stepItem.title}
                    </h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {stepItem.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 4. Cross-Platform Trust, Social Proof & Authority Sections */}
      {/* 1. Client / Company Logo Showcase */}
      <ClientLogos />

      {/* 2. Why Businesses Choose LEGOMARK */}
      <WhyLegomark />

      {/* 3. Client Testimonials */}
      <TestimonialsSection />

      {/* 4. Leadership & Executive Authority */}
      <FounderSection onOpenConsultation={onOpenConsultation} />

      {/* 5. FAQ, Related Services & Conversion Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Section: Frequently Asked Questions */}
        {landingData?.faqs && landingData.faqs.length > 0 && (
          <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
              <HelpCircle className="w-4 h-4" />
              <span>Clarifications & Guidance</span>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0B132B]">
                Frequently Asked Questions on {service.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Direct answers to common regulatory, timeline, and documentation questions.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {landingData.faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-lg overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full px-4 py-3.5 text-left bg-slate-50 hover:bg-slate-100 flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-[#0B132B] cursor-pointer transition-colors"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180 text-orange-600' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 py-3.5 bg-white text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section: Related Services */}
        {relatedServices.length > 0 && (
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#0B132B]">
                  Related Services in {categoryObj?.name || 'Corporate Practices'}
                </h2>
                <p className="text-xs text-slate-600">
                  Complementary legal, tax, and secretarial solutions for growing businesses.
                </p>
              </div>
              <button
                onClick={onNavigateHome}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Catalogue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedServices.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onNavigateService(rel.slug)}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-orange-400 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                        {renderIcon(rel.iconName, 'w-4 h-4')}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">{rel.timeline}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0B132B] group-hover:text-orange-600 transition-colors">
                        {rel.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {rel.shortDesc}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0B132B]">
                    <span>{rel.startingPrice}</span>
                    <span className="text-orange-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Learn More <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Bottom Conversion CTA Banner */}
        <section className="bg-[#0B132B] text-white rounded-2xl p-8 sm:p-10 shadow-lg text-center space-y-6 relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Proceed with {service.title}?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Consult with our practicing Company Secretaries and Chartered Accountants. Receive clear legal guidance, transparent fee quotations, and fast turnaround.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={handleProceedBuyNow}
              className="px-6 py-3.5 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span>START YOUR REGISTRATION</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleConsultation}
              className="px-5 py-3.5 bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <PhoneCall className="w-4 h-4 text-orange-600" />
              <span>REQUEST PHONE CALL</span>
            </button>
            <button
              onClick={onNavigateHome}
              className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold rounded-lg border border-white/20 transition-colors cursor-pointer"
            >
              <span>Back to Home</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};
