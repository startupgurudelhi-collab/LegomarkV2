import React from 'react';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  Package as PackageIcon,
  Layers,
  Zap,
  HelpCircle
} from 'lucide-react';
import { PackageTier, ServiceItem, BuyNowItem } from '../../types/website';

interface ServicePackagesProps {
  packages?: PackageTier[];
  service: ServiceItem;
  onOpenBuyNow?: (item: BuyNowItem) => void;
  onOpenConsultation?: (serviceOrPackageName?: string) => void;
}

export const ServicePackages: React.FC<ServicePackagesProps> = ({
  packages,
  service,
  onOpenBuyNow,
  onOpenConsultation,
}) => {
  if (!packages || packages.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 md:p-10 shadow-xs space-y-8">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-bold uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5" />
          <span>Transparent Packages</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B132B] tracking-tight">
          Select the Right Package for {service.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Comprehensive compliance tiers curated with practicing CAs and CS professionals. Transparent pricing with no hidden surprises.
        </p>
      </div>

      {/* Packages Grid */}
      <div
        className={`grid grid-cols-1 gap-6 ${
          packages.length === 1
            ? 'max-w-md mx-auto'
            : packages.length === 2
            ? 'md:grid-cols-2 max-w-4xl mx-auto'
            : 'md:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {packages.map((pkg) => {
          const isPopular = !!pkg.popular || !!pkg.badge;

          return (
            <div
              key={pkg.id}
              className={`rounded-xl border flex flex-col justify-between transition-all duration-200 relative ${
                isPopular
                  ? 'border-orange-500 bg-gradient-to-b from-orange-50/30 to-white shadow-md ring-2 ring-orange-500/20'
                  : 'border-slate-200 bg-white shadow-xs hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Featured Badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{pkg.badge || 'Most Popular'}</span>
                </div>
              )}

              {/* Card Header */}
              <div className="p-6 pb-4 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#0B132B]">
                    {pkg.name}
                  </h3>
                  {pkg.tagline && (
                    <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px]">
                      {pkg.tagline}
                    </p>
                  )}
                </div>

                {/* Price Display */}
                <div className="border-y border-slate-100 py-3.5 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#0B132B]">
                    {pkg.price}
                  </span>
                  {pkg.period && (
                    <span className="text-xs font-semibold text-slate-500">
                      / {pkg.period}
                    </span>
                  )}
                </div>

                {/* Ideal For Note */}
                {pkg.idealFor && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700">
                    <span className="font-bold text-slate-900">Ideal For: </span>
                    <span>{pkg.idealFor}</span>
                  </div>
                )}

                {/* Features List */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    What's Included:
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {pkg.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="p-6 pt-3 border-t border-slate-100 space-y-2 bg-slate-50/50 rounded-b-xl">
                {onOpenBuyNow && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenBuyNow({
                        id: pkg.id,
                        name: `${service.title} - ${pkg.name}`,
                        title: `${service.title} (${pkg.name})`,
                        priceDisplay: pkg.price,
                        itemType: 'package',
                        category: service.category,
                        features: pkg.features,
                      })
                    }
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>{pkg.ctaLabel || 'Buy Package'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {onOpenConsultation && (
                  <button
                    type="button"
                    onClick={() => onOpenConsultation(`${service.title} - ${pkg.name}`)}
                    className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-orange-600" />
                    <span>Consult on this Tier</span>
                  </button>
                )}

                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Senior CA/CS Review Included</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Statutory Guidance Note */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center max-w-2xl mx-auto text-xs text-slate-600 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          Need a tailored multi-state corporate retainer or customized enterprise scope?{' '}
          {onOpenConsultation && (
            <button
              onClick={() => onOpenConsultation(service.title)}
              className="font-bold text-orange-600 hover:underline inline-flex items-center gap-0.5 ml-1 cursor-pointer"
            >
              Request custom enterprise quote
            </button>
          )}
        </span>
      </div>
    </section>
  );
};
