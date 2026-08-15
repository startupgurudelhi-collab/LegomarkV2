import React from 'react';
import { ShieldCheck, FileCheck2, Award, Clock } from 'lucide-react';
import { ADVISORY_PILLARS } from '../../data/websiteData';

export const TrustStrip: React.FC = () => {
  const icons = [
    <ShieldCheck key="1" className="w-5 h-5 text-orange-600" />,
    <FileCheck2 key="2" className="w-5 h-5 text-orange-600" />,
    <Award key="3" className="w-5 h-5 text-orange-600" />,
    <Clock key="4" className="w-5 h-5 text-orange-600" />,
  ];

  return (
    <section id="trust-strip" className="bg-slate-50 border-b border-slate-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {ADVISORY_PILLARS.map((item, index) => (
            <div
              key={index}
              id={`trust-highlight-${index}`}
              className="flex items-center gap-3.5 p-3 rounded-lg bg-white border border-slate-200 shadow-xs"
            >
              <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-100 shrink-0">
                {icons[index % icons.length]}
              </div>
              <div className="space-y-0.5">
                <div className="text-xs sm:text-sm font-bold text-[#0B132B]">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-500 font-medium leading-tight">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
