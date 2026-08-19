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
  Check,
  HelpCircle
} from 'lucide-react';
import { PackageTier, ServiceItem, BuyNowItem } from '../../types/website';

interface ServicePackagesProps {
  packages?: PackageTier[];
  service: ServiceItem;
  selectedPackageId?: string | null;
  onSelectPackage?: (pkg: PackageTier) => void;
  onOpenBuyNow?: (item: BuyNowItem) => void;
  onOpenConsultation?: (serviceOrPackageName?: string) => void;
}

export const ServicePackages: React.FC<ServicePackagesProps> = ({
  packages,
  service,
  selectedPackageId,
  onSelectPackage,
  onOpenBuyNow,
  onOpenConsultation,
}) => {
  if (!packages || packages.length === 0) {
    return null;
  }

  return (
    <section id="service-packages-section" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 md:p-10 shadow-xs space-y-8">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-bold uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5" />
          <span>Available Packages</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B132B] tracking-tight">
          Choose a Package for {service.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Compare available tiers and deliverables. Select the package that fits your business scale, or checkout directly with full CA/CS support.
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
          const isSelected = selectedPackageId === pkg.id;
          const isPopular = !!pkg.popular || !!pkg.badge;

          return (
            <div
              key={pkg.id}
              onClick={() => onSelectPackage && onSelectPackage(pkg)}
              className={`rounded-xl border flex flex-col justify-between transition-all duration-200 relative cursor-pointer ${
                isSelected
                  ? 'border-orange-500 bg-orange-50/20 shadow-lg ring-2 ring-orange-500'
                  : isPopular
                  ? 'border-orange-300 bg-gradient-to-b from-orange-50/20 to-white shadow-md hover:border-orange-400'
                  : 'border-slate-200 bg-white shadow-xs hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Badge: Selected or Popular */}
              {isSelected ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full shadow-sm flex items-center gap-1 z-10">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Currently Selected</span>
                </div>
              ) : isPopular ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0B132B] text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm flex items-center gap-1 z-10">
                  <Sparkles className="w-3 h-3 text-orange-400" />
                  <span>{pkg.badge || 'Most Popular'}</span>
                </div>
              ) : null}

              {/* Card Header */}
              <div className="p-6 pb-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
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

                  {/* Radio-style check indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected
                        ? 'border-orange-600 bg-orange-600 text-white'
                        : 'border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
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
                    Included Deliverables:
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
                {/* Select / Selected Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectPackage) onSelectPackage(pkg);
                  }}
                  className={`w-full py-2.5 px-3 text-xs font-bold rounded-lg border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-orange-600 border-orange-600 text-white shadow-xs'
                      : 'bg-white hover:bg-orange-50 text-slate-800 border-slate-300 hover:border-orange-400'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Selected Package</span>
                    </>
                  ) : (
                    <span>Select This Package</span>
                  )}
                </button>

                {/* Direct Buy Button */}
                {onOpenBuyNow && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectPackage) onSelectPackage(pkg);
                      onOpenBuyNow({
                        id: pkg.id,
                        name: `${service.title} - ${pkg.name}`,
                        title: `${service.title} (${pkg.name})`,
                        priceDisplay: pkg.price,
                        itemType: 'package',
                        category: service.category,
                        governmentFeeNote: service.governmentFeeNote,
                        features: pkg.features,
                      });
                    }}
                    className="w-full py-2.5 bg-[#0B132B] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Instant Checkout &mdash; {pkg.price}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
                  </button>
                )}

                {/* Consultation on this tier */}
                {onOpenConsultation && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectPackage) onSelectPackage(pkg);
                      onOpenConsultation(`${service.title} - ${pkg.name}`);
                    }}
                    className="w-full py-2 bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PhoneCall className="w-3 h-3 text-orange-600" />
                    <span>Inquire About This Tier</span>
                  </button>
                )}

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Practicing CA/CS Verification Included</span>
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
          Need a custom corporate scope or multi-state retainer?{' '}
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

