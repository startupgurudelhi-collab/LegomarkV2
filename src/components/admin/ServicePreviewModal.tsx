import React from 'react';
import { AdminService } from '../../types/adminService';
import { RichContentRenderer } from '../blog/RichContentRenderer';
import {
  X,
  Building2,
  Clock,
  IndianRupee,
  CheckCircle2,
  FileText,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ServicePreviewModalProps {
  isOpen: boolean;
  service: AdminService | null;
  onClose: () => void;
  onEdit?: (service: AdminService) => void;
}

export const ServicePreviewModal: React.FC<ServicePreviewModalProps> = ({
  isOpen,
  service,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0B132B] border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">{service.title}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {service.slug}
                </span>
                {service.badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {service.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Public Service Landing Page Preview</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(service);
                }}
                className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-slate-950 text-xs font-bold transition"
              >
                Edit Service
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Hero Banner Section */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  {service.category?.name || 'General Practice'}
                </span>
                {service.popular && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Popular
                  </span>
                )}
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Starting from</div>
                <div className="text-xl font-black text-orange-400">{service.startingPrice}</div>
              </div>
            </div>

            <h1 className="text-2xl font-black text-slate-100 mb-2">{service.title}</h1>
            {service.headline && (
              <p className="text-sm font-medium text-slate-300 mb-3">{service.headline}</p>
            )}
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">{service.shortDesc}</p>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <span>Timeline: <strong>{service.timeline}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-orange-400" />
                <span>Pricing Model: <strong className="capitalize">{service.pricingType}</strong></span>
              </div>
              {service.governmentFeeNote && (
                <div className="text-slate-400 italic">
                  Note: {service.governmentFeeNote}
                </div>
              )}
            </div>
          </div>

          {/* Overview Narrative */}
          {service.overview && (
            <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Strategic Overview
              </h4>
              <RichContentRenderer content={service.overview} className="text-slate-300 text-xs" />
            </div>
          )}

          {/* Features / Highlights Grid */}
          {((service.features && service.features.length > 0) || (service.highlights && service.highlights.length > 0)) && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Key Inclusions & Highlights
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {service.highlights && service.highlights.length > 0 ? (
                  service.highlights.map((hl, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-1">
                        <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
                        <span>{hl.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal pl-6">{hl.description}</p>
                    </div>
                  ))
                ) : (
                  (service.features || []).map((feat, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Required Documents & Deliverables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {service.documents && service.documents.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-400" />
                  Client Documents Required
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {service.documents.map((doc, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {service.deliverables && service.deliverables.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Tangible Deliverables
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {service.deliverables.map((deliv, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{deliv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Process Steps */}
          {service.processSteps && service.processSteps.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Execution Roadmap
              </h4>
              <div className="space-y-2">
                {service.processSteps.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold flex items-center justify-center shrink-0">
                      {step.stepNumber || idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{step.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {service.faqs && service.faqs.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-orange-400" />
                Frequently Asked Questions ({service.faqs.length})
              </h4>
              <div className="space-y-2">
                {service.faqs.map((faq, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                    <div className="text-xs font-bold text-slate-200 mb-1">Q: {faq.question}</div>
                    <div className="text-[11px] text-slate-400 pl-4 border-l-2 border-slate-700">{faq.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEO Metadata Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            <div className="font-semibold text-slate-300 mb-1">Search Engine Meta Preview:</div>
            <div className="text-blue-400 text-sm font-semibold truncate">
              {service.seoTitle || `${service.title} | LEGOMARK INDIA`}
            </div>
            <div className="text-emerald-500 text-[11px]">https://legomark.in/services/{service.slug}</div>
            <div className="text-slate-400 text-[11px] mt-1 line-clamp-2">
              {service.metaDescription || service.shortDesc}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Status: <span className={service.isActive ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>{service.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
