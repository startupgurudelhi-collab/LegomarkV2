import React from 'react';
import { Building2, Receipt, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import { getServiceBySlug, SERVICES } from '../../data/websiteData';
import { BuyNowItem, ServiceItem } from '../../types/website';
import { ensureRupeePrice } from '../../utils/pricing';

interface CategorySpotlightsProps {
  onOpenConsultation: (serviceName?: string) => void;
  onOpenBuyNow?: (item: BuyNowItem | { name: string; priceDisplay: string; itemType: 'service' }) => void;
  services?: ServiceItem[];
}

export const CategorySpotlights: React.FC<CategorySpotlightsProps> = ({
  onOpenConsultation,
  onOpenBuyNow,
  services = SERVICES,
}) => {
  // Authoritative single-source-of-truth service records from catalog
  const pvtLtdService = services.find(s => s.slug === 'private-limited-company-registration') || getServiceBySlug('private-limited-company-registration') || services[0];
  const annualComplianceService = services.find(s => s.slug === 'annual-compliance') || getServiceBySlug('annual-compliance') || services[0];
  const trademarkService = services.find(s => s.slug === 'trademark-registration') || getServiceBySlug('trademark-registration') || services[0];

  return (
    <div className="space-y-12 py-10">
      {/* Spotlight 1: Company Registration In-Depth */}
      <section id="company-registration-spotlight" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 text-orange-800 border border-orange-200">
              <Building2 className="w-3.5 h-3.5 text-orange-600" />
              Company Incorporation
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#0B132B] tracking-tight">
              SPICe+ MCA Company Registration Workflow
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Our practicing company secretaries and legal associates manage the full SPICe+ digital workflow—including DSC token issuance, RUN name reservations, eMOA/eAOA drafting, and Certificate of Incorporation (COI) issuance.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>2 Class 3 DSCs with encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Director DIN & SPICe+ Part A/B</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>eMOA & eAOA Legal Drafting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Certificate of Incorporation (COI)</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={() => {
                  if (onOpenBuyNow) {
                    onOpenBuyNow({
                      id: pvtLtdService.id,
                      slug: pvtLtdService.slug,
                      name: pvtLtdService.title,
                      priceDisplay: ensureRupeePrice(pvtLtdService.startingPrice),
                      itemType: 'service',
                      governmentFeeNote: pvtLtdService.governmentFeeNote,
                      features: pvtLtdService.features,
                    });
                  } else {
                    onOpenConsultation(pvtLtdService.title);
                  }
                }}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Buy Now &mdash; {ensureRupeePrice(pvtLtdService.startingPrice)}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onOpenConsultation(pvtLtdService.title)}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Request Consultation</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-50 rounded-xl p-5 sm:p-6 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0B132B]">Incorporation Stages</span>
              <span className="text-[11px] font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">Standard MCA Processing</span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex gap-2.5 p-2 bg-white rounded border border-slate-100">
                <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-[10px] shrink-0">1</div>
                <div>
                  <div className="font-bold text-slate-800">DSC Generation & Name Approval</div>
                  <div className="text-[11px] text-slate-500">Class 3 DSCs and RUN name reservation submitted.</div>
                </div>
              </div>
              <div className="flex gap-2.5 p-2 bg-white rounded border border-slate-100">
                <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-[10px] shrink-0">2</div>
                <div>
                  <div className="font-bold text-slate-800">SPICe+ Part B & Legal Drafting</div>
                  <div className="text-[11px] text-slate-500">MOA, AOA, AGILE-PRO-S and director consents.</div>
                </div>
              </div>
              <div className="flex gap-2.5 p-2 bg-white rounded border border-slate-100">
                <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-[10px] shrink-0">3</div>
                <div>
                  <div className="font-bold text-slate-800">COI, PAN, TAN & Bank Kit</div>
                  <div className="text-[11px] text-slate-500">Official Certificate of Incorporation issued by MCA.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spotlight 2: Tax & Annual Compliance */}
      <section id="tax-compliance-spotlight" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 text-orange-800 border border-orange-200">
              <Receipt className="w-3.5 h-3.5 text-orange-600" />
              Statutory Compliance
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#0B132B] tracking-tight">
              Annual ROC Filing & GST Return Filings
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Timely filing of AOC-4 financial statements, MGT-7 annual returns, and monthly GST reconciliations (GSTR-1 & 3B) handled directly by our CA team.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Form AOC-4 Financial Statements</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Form MGT-7 / 7A Annual Return</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Director DIR-3 KYC Validation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Monthly GST Returns (GSTR-1 & 3B)</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={() => {
                  if (onOpenBuyNow) {
                    onOpenBuyNow({
                      id: annualComplianceService.id,
                      slug: annualComplianceService.slug,
                      name: annualComplianceService.title,
                      priceDisplay: ensureRupeePrice(annualComplianceService.startingPrice),
                      itemType: 'service',
                      governmentFeeNote: annualComplianceService.governmentFeeNote,
                      features: annualComplianceService.features,
                    });
                  } else {
                    onOpenConsultation(annualComplianceService.title);
                  }
                }}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Buy Now &mdash; {ensureRupeePrice(annualComplianceService.startingPrice)}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onOpenConsultation(annualComplianceService.title)}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Request Consultation</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-50 rounded-xl p-5 sm:p-6 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0B132B]">Statutory Timelines</span>
              <span className="text-[11px] font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">Financial Year</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-white rounded border border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-800">DIR-3 KYC</span>
                <span className="text-slate-500 font-mono text-[11px]">Due Sept 30</span>
              </div>
              <div className="p-2.5 bg-white rounded border border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-800">AOC-4 (Financials)</span>
                <span className="text-slate-500 font-mono text-[11px]">Within 30 Days of AGM</span>
              </div>
              <div className="p-2.5 bg-white rounded border border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-800">MGT-7 (Annual Return)</span>
                <span className="text-slate-500 font-mono text-[11px]">Within 60 Days of AGM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spotlight 3: Trademark & IP */}
      <section id="trademark-spotlight" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 text-orange-800 border border-orange-200">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              Intellectual Property
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#0B132B] tracking-tight">
              Trademark (™) Registration & Brand Protection
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Protect your brand name, logo, and slogan nationwide. We conduct class search across all 45 classes, file Form TM-A with IP India, and handle objection replies.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Class 1 to 45 Classification Search</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Form TM-A Filing with IP India</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant Right to use ™ Symbol</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Section 9 / 11 Objection Rebuttal</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={() => {
                  if (onOpenBuyNow) {
                    onOpenBuyNow({
                      id: trademarkService.id,
                      slug: trademarkService.slug,
                      name: trademarkService.title,
                      priceDisplay: ensureRupeePrice(trademarkService.startingPrice),
                      itemType: 'service',
                      governmentFeeNote: trademarkService.governmentFeeNote,
                      features: trademarkService.features,
                    });
                  } else {
                    onOpenConsultation(trademarkService.title);
                  }
                }}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Buy Now &mdash; {ensureRupeePrice(trademarkService.startingPrice)}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onOpenConsultation(trademarkService.title)}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Request Consultation</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-50 rounded-xl p-5 sm:p-6 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0B132B]">Trademark Benefits</span>
              <span className="text-[11px] font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">10 Years Validity</span>
            </div>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="p-2.5 bg-white rounded border border-slate-200">
                <div className="font-bold text-slate-900">Immediate ™ Symbol Rights</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Use ™ on brand assets immediately upon application acknowledgment.</div>
              </div>
              <div className="p-2.5 bg-white rounded border border-slate-200">
                <div className="font-bold text-slate-900">50% MSME Government Fee Discount</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Govt fees reduced to ₹4,500 for eligible MSME/Udyam enterprises.</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
