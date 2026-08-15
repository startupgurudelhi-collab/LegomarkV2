import React from 'react';
import { ArrowRight, Phone, Shield, Clock } from 'lucide-react';
import { COMPANY_PROFILE } from '../../data/websiteData';

interface ConsultationCTAProps {
  onOpenConsultation: () => void;
}

export const ConsultationCTA: React.FC<ConsultationCTAProps> = ({ onOpenConsultation }) => {
  const { contact } = COMPANY_PROFILE;

  return (
    <section id="cta-section" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0B132B] text-white rounded-2xl border border-slate-800 p-8 sm:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-8 space-y-4 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-600/20 text-orange-400 border border-orange-500/30">
                <Clock className="w-3.5 h-3.5" />
                Prompt Professional Response
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-sans">
                Ready to Incorporate or Structure Your Compliance?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Connect directly with LEGOMARK INDIA for company registration, taxation, trademark protection, and statutory business compliance.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-orange-400" />
                  <span>Strict Confidentiality</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-orange-400" />
                  <span>Transparent Pricing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-orange-400" />
                  <span>Digital Workflow</span>
                </div>
              </div>
            </div>

            {/* Right Action Stack */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              <button
                onClick={onOpenConsultation}
                className="w-full py-3.5 px-6 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Request Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={`tel:${contact.mobileRaw}`}
                className="w-full py-3 px-6 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-3.5 h-3.5 text-orange-400" />
                <span>Call {contact.mobile}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
