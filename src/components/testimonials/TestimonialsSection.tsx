import React from 'react';
import { Shield, FileCheck2, Clock, Lock, CheckCircle2 } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const commitments = [
    {
      icon: <Clock className="w-5 h-5 text-orange-600" />,
      title: 'Punctual Statutory Filings',
      desc: 'Proactive scheduling and timely submissions for ROC annual filings, GST returns, and tax acknowledgments to avoid statutory late fees.',
    },
    {
      icon: <Lock className="w-5 h-5 text-orange-600" />,
      title: 'Confidentiality & Data Security',
      desc: 'All director identity documents, DSC credentials, accounting data, and corporate secretarial files are handled with strict privacy protocols.',
    },
    {
      icon: <FileCheck2 className="w-5 h-5 text-orange-600" />,
      title: 'Clear Documentation & Drafting',
      desc: 'Precise legal drafting for MOA, AOA, Partnership Deeds, LLP Agreements, and trademark applications adhering to current government norms.',
    },
    {
      icon: <Shield className="w-5 h-5 text-orange-600" />,
      title: 'Direct Advisory Guidance',
      desc: 'Clear communication throughout each stage of company incorporation, tax registration, and annual compliance management.',
    },
  ];

  return (
    <section id="commitments-section" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
            Advisory Standards
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B132B] tracking-tight font-sans">
            Our Client Service Commitments
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Professional principles guiding every corporate setup, taxation filing, and secretarial engagement at LEGOMARK INDIA.
          </p>
        </div>

        {/* Commitments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {commitments.map((item, idx) => (
            <div
              key={idx}
              id={`commitment-card-${idx}`}
              className="bg-white border border-slate-200 p-6 sm:p-7 rounded-xl flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-base font-bold text-[#0B132B]">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
