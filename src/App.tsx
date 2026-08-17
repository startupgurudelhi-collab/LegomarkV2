import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { HeroSection } from './components/hero/HeroSection';
import { TrustStrip } from './components/trust/TrustStrip';
import { ServicesSection } from './components/services/ServicesSection';
import { CategorySpotlights } from './components/services/CategorySpotlights';
import { PackagesSection } from './components/packages/PackagesSection';
import { PackageMatrix } from './components/matrix/PackageMatrix';
import { WhyLegomark } from './components/why-us/WhyLegomark';
import { FounderSection } from './components/founder/FounderSection';
import { OfficeSection } from './components/office/OfficeSection';
import { ClientLogos } from './components/logos/ClientLogos';
import { TestimonialsSection } from './components/testimonials/TestimonialsSection';
import { FAQSection } from './components/faq/FAQSection';
import { BlogSection } from './components/blog/BlogSection';
import { BlogLandingPage } from './components/blog/BlogLandingPage';
import { BlogDetailPage } from './components/blog/BlogDetailPage';
import { ConsultationCTA } from './components/cta/ConsultationCTA';
import { Footer } from './components/layout/Footer';
import { ConsultationModal } from './components/common/ConsultationModal';
import { BuyNowModal } from './components/payment/BuyNowModal';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { ServiceLandingPage } from './components/services/ServiceLandingPage';
import { AdminPortal } from './components/admin/AdminPortal';
import { getServiceBySlug } from './data/websiteData';
import { X } from 'lucide-react';
import { useHealthReport } from './services/useHealthReport';
import { BuyNowItem, PackageTier, ServiceItem } from './types/website';

export default function App() {
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [consultationService, setConsultationService] = useState('Private Limited Company Registration');
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState<BuyNowItem | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });

  const [activeServiceSlug, setActiveServiceSlug] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/services/')) {
        const slug = pathname.replace('/services/', '').replace(/\/$/, '').trim();
        return slug || null;
      }
    }
    return null;
  });

  const [activeBlogSlug, setActiveBlogSlug] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/resources/blog/')) {
        const slug = pathname.replace('/resources/blog/', '').replace(/\/$/, '').trim();
        return slug || null;
      }
      if (pathname.startsWith('/blog/')) {
        const slug = pathname.replace('/blog/', '').replace(/\/$/, '').trim();
        return slug || null;
      }
    }
    return null;
  });

  const { health, loading, lastChecked, refreshHealth } = useHealthReport();

  // Listen to browser popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      setCurrentPath(pathname);

      // Route matching
      if (pathname.startsWith('/services/')) {
        const slug = pathname.replace('/services/', '').replace(/\/$/, '').trim();
        setActiveServiceSlug(slug || null);
        setActiveBlogSlug(null);
      } else if (pathname.startsWith('/resources/blog/')) {
        const slug = pathname.replace('/resources/blog/', '').replace(/\/$/, '').trim();
        setActiveBlogSlug(slug || null);
        setActiveServiceSlug(null);
      } else if (pathname.startsWith('/blog/')) {
        const slug = pathname.replace('/blog/', '').replace(/\/$/, '').trim();
        setActiveBlogSlug(slug || null);
        setActiveServiceSlug(null);
      } else {
        setActiveServiceSlug(null);
        setActiveBlogSlug(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenConsultation = (serviceName?: string) => {
    if (serviceName) {
      setConsultationService(serviceName);
    }
    setIsConsultationOpen(true);
  };

  const handleOpenBuyNow = useCallback(
    (
      item:
        | BuyNowItem
        | ServiceItem
        | PackageTier
        | { name: string; priceDisplay?: string; price?: string; startingPrice?: string; id?: string; slug?: string }
    ) => {
      const priceDisplay =
        (item as any).priceDisplay ||
        (item as any).price ||
        (item as any).startingPrice ||
        '₹0';
      const name = (item as any).name || (item as any).title || 'Corporate Service';
      const itemType: 'service' | 'package' =
        (item as any).itemType || ((item as any).price ? 'package' : 'service');

      setBuyNowItem({
        id: item.id,
        name,
        title: (item as any).title || name,
        slug: (item as any).slug,
        priceDisplay,
        itemType,
        governmentFeeNote: (item as any).governmentFeeNote,
        features: (item as any).features,
      });
      setIsBuyNowOpen(true);
    },
    []
  );

  const handleNavigateService = useCallback((slug: string) => {
    setActiveServiceSlug(slug);
    setActiveBlogSlug(null);
    setCurrentPath(`/services/${slug}`);
    window.history.pushState({}, '', `/services/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateBlogDetail = useCallback((slug: string) => {
    setActiveBlogSlug(slug);
    setActiveServiceSlug(null);
    setCurrentPath(`/resources/blog/${slug}`);
    window.history.pushState({}, '', `/resources/blog/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateResources = useCallback(() => {
    setActiveBlogSlug(null);
    setActiveServiceSlug(null);
    setCurrentPath('/resources');
    window.history.pushState({}, '', '/resources');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateHome = useCallback(() => {
    setActiveServiceSlug(null);
    setActiveBlogSlug(null);
    setCurrentPath('/');
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigatePath = useCallback((path: string) => {
    setActiveServiceSlug(null);
    setActiveBlogSlug(null);
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateSection = useCallback((sectionId: string) => {
    if (sectionId === 'resources') {
      handleNavigateResources();
      return;
    }

    if (activeServiceSlug || activeBlogSlug || currentPath === '/resources' || currentPath.startsWith('/admin')) {
      // If currently on a dedicated page or admin, transition back to home first
      setActiveServiceSlug(null);
      setActiveBlogSlug(null);
      setCurrentPath('/');
      window.history.pushState({}, '', '/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [activeServiceSlug, activeBlogSlug, currentPath, handleNavigateResources]);

  // If path is admin route, render isolated Admin Portal
  if (currentPath.startsWith('/admin')) {
    return (
      <AdminPortal
        initialPath={currentPath}
        onNavigateHome={handleNavigateHome}
      />
    );
  }

  const currentServiceItem = activeServiceSlug ? getServiceBySlug(activeServiceSlug) : undefined;
  const isResourcesLanding = currentPath === '/resources' || currentPath === '/blog';

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-orange-500 selection:text-white antialiased">
      {/* 1. Header & Navigation Shell */}
      <Header
        onOpenConsultation={handleOpenConsultation}
        onNavigateSection={handleNavigateSection}
        onNavigateService={handleNavigateService}
        onNavigateHome={handleNavigateHome}
        onNavigatePath={handleNavigatePath}
      />

      {/* 2. Page Content: Dedicated Article Page OR Resources Landing Page OR Service Landing Page OR Homepage */}
      {activeBlogSlug !== null ? (
        <BlogDetailPage
          slug={activeBlogSlug}
          onOpenConsultation={handleOpenConsultation}
          onNavigateResources={handleNavigateResources}
          onNavigateBlogDetail={handleNavigateBlogDetail}
          onNavigateHome={handleNavigateHome}
        />
      ) : isResourcesLanding ? (
        <BlogLandingPage
          onOpenConsultation={handleOpenConsultation}
          onNavigateBlogDetail={handleNavigateBlogDetail}
          onNavigateHome={handleNavigateHome}
        />
      ) : activeServiceSlug !== null ? (
        <ServiceLandingPage
          service={currentServiceItem}
          onOpenConsultation={handleOpenConsultation}
          onOpenBuyNow={handleOpenBuyNow}
          onNavigateService={handleNavigateService}
          onNavigateHome={handleNavigateHome}
        />
      ) : (
        <main>
          {/* Hero Section */}
          <HeroSection
            onOpenConsultation={handleOpenConsultation}
            onNavigateSection={handleNavigateSection}
          />

          {/* Trust & Credibility Strip */}
          <TrustStrip />

          {/* Client / Company Logo Showcase */}
          <ClientLogos />

          {/* Services Overview & Category Tabs */}
          <ServicesSection
            onOpenConsultation={handleOpenConsultation}
            onOpenBuyNow={handleOpenBuyNow}
            onNavigateService={handleNavigateService}
          />

          {/* Deep Category Spotlights (Incorporation, Tax/ROC, Trademark) */}
          <div className="bg-slate-50 border-b border-slate-200 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <CategorySpotlights
                onOpenConsultation={handleOpenConsultation}
                onOpenBuyNow={handleOpenBuyNow}
              />
            </div>
          </div>

          {/* Packages & Pricing Area */}
          <PackagesSection
            onOpenConsultation={handleOpenConsultation}
            onOpenBuyNowPackage={handleOpenBuyNow}
          />

          {/* Package Matrix Presentation */}
          <PackageMatrix
            onOpenConsultation={handleOpenConsultation}
            onOpenBuyNowPackage={handleOpenBuyNow}
          />

          {/* Why LEGOMARK Advantage */}
          <WhyLegomark />

          {/* Founder & Leadership Section */}
          <FounderSection onOpenConsultation={handleOpenConsultation} />

          {/* Corporate Office Section */}
          <OfficeSection onOpenConsultation={handleOpenConsultation} />

          {/* Client Testimonials */}
          <TestimonialsSection />

          {/* Statutory Blog & Knowledge Resources Grid (navigates to dedicated page) */}
          <BlogSection
            onOpenConsultation={handleOpenConsultation}
            onNavigateBlogDetail={handleNavigateBlogDetail}
            onNavigateResources={handleNavigateResources}
          />

          {/* FAQ Accordion */}
          <FAQSection onOpenConsultation={() => handleOpenConsultation('General Legal Inquiry')} />

          {/* Consultation CTA Banner */}
          <ConsultationCTA onOpenConsultation={() => handleOpenConsultation('General Corporate Consultation')} />
        </main>
      )}

      {/* 3. Footer */}
      <Footer
        onNavigateSection={handleNavigateSection}
        onOpenConsultation={handleOpenConsultation}
        onNavigateService={handleNavigateService}
        onNavigateHome={handleNavigateHome}
        onNavigatePath={handleNavigatePath}
        onToggleDiagnostics={() => setShowDiagnostics(!showDiagnostics)}
      />

      {/* Consultation Modal Dialog */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        initialService={consultationService}
      />

      {/* Buy Now & Payment Modal Dialog */}
      <BuyNowModal
        isOpen={isBuyNowOpen}
        onClose={() => setIsBuyNowOpen(false)}
        item={buyNowItem}
      />

      {/* Diagnostic Overlay */}
      {showDiagnostics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowDiagnostics(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <DiagnosticsPanel
              health={health}
              loading={loading}
              lastChecked={lastChecked}
              onRefresh={refreshHealth}
            />
          </div>
        </div>
      )}
    </div>
  );
}
