import React, { useState, useEffect } from 'react';
import { ShieldCheck, Star, Award, CheckCircle2, Globe, Building2 } from 'lucide-react';
import { AssociationLogoData } from '../../types/associationLogo';
import { fetchPublicAssociationLogos } from '../../services/associationLogo.service';

interface TrustFactorMetric {
  id: string;
  value: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

export const TrustFactorSection: React.FC = () => {
  const [associatedLogos, setAssociatedLogos] = useState<AssociationLogoData[]>([]);
  const [failedLogoIds, setFailedLogoIds] = useState<Record<string, boolean>>({});
  const [isLoadingLogos, setIsLoadingLogos] = useState(true);

  useEffect(() => {
    fetchPublicAssociationLogos()
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter for active association logos with a valid logoUrl
          const activeLogosWithImages = data.filter(
            (item) => item.isActive && item.logoUrl && item.logoUrl.trim().length > 0
          );
          setAssociatedLogos(activeLogosWithImages);
        }
        setIsLoadingLogos(false);
      })
      .catch(() => {
        setIsLoadingLogos(false);
      });
  }, []);

  const handleImageError = (id: string) => {
    setFailedLogoIds((prev) => ({ ...prev, [id]: true }));
  };

  const visibleLogos = associatedLogos.filter((item) => !failedLogoIds[item.id]);

  const trustMetrics: TrustFactorMetric[] = [
    {
      id: 'clients',
      value: '3100+',
      label: 'Clients Served',
      sublabel: 'Businesses & Startups Nationwide',
      icon: <Building2 className="w-5 h-5 text-orange-600" />,
    },
    {
      id: 'rating',
      value: '5.0',
      label: 'Rating',
      sublabel: 'Client Satisfaction Index',
      icon: <Star className="w-5 h-5 text-amber-500 fill-amber-500" />,
    },
    {
      id: 'iso',
      value: 'ISO Certified',
      label: 'Quality Standards',
      sublabel: 'Certified Management Systems',
      icon: <Award className="w-5 h-5 text-orange-600" />,
    },
    {
      id: 'qci',
      value: 'QCI Approved',
      label: 'Standards Compliance',
      sublabel: 'Quality Council Standards',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    },
    {
      id: 'pan-india',
      value: 'PAN India',
      label: 'Nationwide Service',
      sublabel: 'Covering 28 States & 8 UTs',
      icon: <Globe className="w-5 h-5 text-blue-600" />,
    },
  ];

  return (
    <section id="trust-factor-section" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ==================================================
            1. TRUST FACTOR HEADER & METRICS
        ================================================== */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-700 text-xs font-bold tracking-wide uppercase mb-3 border border-orange-200/60">
            <ShieldCheck className="w-4 h-4 text-orange-600" />
            <span>Credibility & Standards</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B132B] font-sans tracking-tight">
            LEGOMARK TRUST FACTOR
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium mt-2 leading-relaxed">
            Delivering statutory precision, certified standards, and corporate governance excellence for Indian enterprises.
          </p>
        </div>

        {/* Trust Metrics Cards Grid (5-column responsive layout) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-14">
          {trustMetrics.map((metric) => (
            <div
              key={metric.id}
              className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between text-center group"
            >
              <div className="w-10 h-10 mx-auto rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                {metric.icon}
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-[#0B132B] tracking-tight">
                  {metric.value}
                </div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  {metric.label}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
                  {metric.sublabel}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ==================================================
            2. WE ARE ASSOCIATED DYNAMIC LOGOS
        ================================================== */}
        <div className="pt-10 border-t border-slate-200/80">
          <div className="text-center mb-8">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 font-sans">
              WE ARE ASSOCIATED
            </h3>
          </div>

          {isLoadingLogos ? (
            <div className="flex justify-center items-center py-6">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : visibleLogos.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-10">
              {visibleLogos.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-center h-14 sm:h-16 max-w-[160px] p-2 transition-transform duration-200 hover:scale-105"
                  title={item.name}
                >
                  <img
                    src={item.logoUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    onError={() => handleImageError(item.id)}
                    className="max-h-12 sm:max-h-14 max-w-[140px] sm:max-w-[160px] w-auto h-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

      </div>
    </section>
  );
};
