import React from 'react';
import { Shield, Zap, Users, Lock, Award, Headphones } from 'lucide-react';

export const WhyLegomark: React.FC = () => {
  const pillars = [
    {
      icon: <Users className="w-5 h-5 text-orange-600" />,
      title: 'In-House CA & CS Professionals',
      desc: 'Work directly with qualified Chartered Accountants and Company Secretaries who review every statutory filing and corporate document.',
    },
    {
      icon: <Zap className="w-5 h-5 text-orange-600" />,
      title: 'Fast-Track Processing',
      desc: 'Streamlined digital workflows for company incorporation, trademark applications, and tax registrations across India.',
    },
    {
      icon: <Shield className="w-5 h-5 text-orange-600" />,
      title: 'Statutory Compliance Tracking',
      desc: 'Proactive calendar management for annual ROC filings, monthly GST returns, and advance tax payments to keep your business compliant.',
    },
    {
      icon: <Lock className="w-5 h-5 text-orange-600" />,
      title: 'Data Privacy & Confidentiality',
      desc: 'Strict professional standards and confidentiality protocols for corporate records, director identification documents, and financial data.',
    },
    {
      icon: <Award className="w-5 h-5 text-orange-600" />,
      title: 'Transparent Fixed Fees',
      desc: 'Clear upfront pricing with itemized government fees and professional retainers without unexpected surcharges.',
    },
    {
      icon: <Headphones className="w-5 h-5 text-orange-600" />,
      title: 'Dedicated Client Support',
      desc: 'Accessible advisory hotline and email assistance to provide prompt answers for ongoing legal, secretarial, and accounting questions.',
    },
  ];

  return (
    <section id="why-us-section" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
            <Shield className="w-3.5 h-3.5 text-orange-600" />
            The Legomark Advantage
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B132B] tracking-tight font-sans">
            Why Businesses Choose LEGOMARK
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Delivering thorough corporate legal, secretarial, and tax management with transparent advisory standards.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((item, index) => (
            <div
              key={index}
              id={`why-pillar-${index}`}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#0B132B]">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
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
