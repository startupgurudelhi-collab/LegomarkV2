import React, { useState, useEffect } from 'react';
import { PackageTier } from '../../types/website';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { fetchPublicPackages } from '../../services/publicPackage.service';
import { PACKAGES as STATIC_FALLBACK_PACKAGES } from '../../data/websiteData';

interface PackagesSectionProps {
  onOpenConsultation: (packageName?: string) => void;
}

export const PackagesSection: React.FC<PackagesSectionProps> = ({ onOpenConsultation }) => {
  const [packages, setPackages] = useState<PackageTier[]>(STATIC_FALLBACK_PACKAGES);

  useEffect(() => {
    let isMounted = true;

    async function loadPackages() {
      const res = await fetchPublicPackages();
      if (isMounted && res.packages.length > 0) {
        setPackages(res.packages);
      }
    }

    loadPackages();

    return () => {
      isMounted = false;
    };
  }, []);

  const gridClass =
    packages.length === 1
      ? 'grid grid-cols-1 max-w-md mx-auto gap-6'
      : packages.length === 2
      ? 'grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-6 items-stretch'
      : packages.length === 4
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch'
      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch';

  return (
    <section id="packages-section" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 text-orange-800 border border-orange-200">
            Advisory Retainers & Pricing
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B132B] tracking-tight font-sans">
            Consultancy & Compliance Packages
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Transparent pricing structures for startups, expanding enterprises, and corporate retainers.
          </p>
        </div>

        {/* Packages Grid */}
        <div className={gridClass}>
          {packages.map((pkg: PackageTier) => (
            <div
              key={pkg.id}
              id={`package-card-${pkg.id}`}
              className={`rounded-xl p-6 sm:p-7 flex flex-col justify-between transition-all relative bg-white ${
                pkg.popular
                  ? 'border-2 border-orange-500 shadow-md ring-1 ring-orange-500/20'
                  : 'border border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              {/* Popular Badge */}
              {pkg.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-600 text-white shadow-xs">
                    {pkg.badge}
                  </span>
                </div>
              )}

              <div className="space-y-5">
                {/* Package Title & Price */}
                <div className="space-y-2 border-b border-slate-100 pb-5">
                  <h3 className="text-lg font-bold text-[#0B132B] tracking-tight">{pkg.name}</h3>
                  <p className="text-xs text-slate-600 min-h-[32px]">{pkg.tagline}</p>
                  <div className="pt-2 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#0B132B] tracking-tight">
                      {pkg.price}
                    </span>
                    {pkg.period && <span className="text-xs text-slate-500">{pkg.period}</span>}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Ideal for: <span className="text-slate-800 font-semibold">{pkg.idealFor}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Included Services:
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4 border-t border-slate-100">
                <button
                  onClick={() => onOpenConsultation(pkg.name)}
                  className={`w-full py-2.5 px-4 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                    pkg.popular
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-[#0B132B] hover:bg-slate-800 text-white'
                  }`}
                >
                  <span>{pkg.ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

