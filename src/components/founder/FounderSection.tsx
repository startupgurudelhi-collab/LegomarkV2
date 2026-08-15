import React, { useState, useEffect } from 'react';
import { User, ArrowRight } from 'lucide-react';
import { COMPANY_PROFILE } from '../../data/websiteData';
import { fetchPublicFounder, PublicFounderData, getStaticFallbackFounder } from '../../services/publicFounder.service';

interface FounderSectionProps {
  onOpenConsultation: (serviceName?: string) => void;
}

export const FounderSection: React.FC<FounderSectionProps> = ({ onOpenConsultation }) => {
  const [founderData, setFounderData] = useState<PublicFounderData>(getStaticFallbackFounder);
  const { address } = COMPANY_PROFILE;

  useEffect(() => {
    let isMounted = true;
    fetchPublicFounder().then((data) => {
      if (isMounted && data) {
        setFounderData(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="founder-section" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Clean White Rounded Container */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Founder Profile Card */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-4 shadow-xs">
                {/* Profile Visual */}
                <div className="w-32 h-32 mx-auto rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center shadow-xs overflow-hidden">
                  {founderData.photoUrl ? (
                    <img
                      src={founderData.photoUrl}
                      alt={founderData.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <User className="w-14 h-14 text-slate-400" />
                      <span className="text-[10px] text-slate-500 font-semibold mt-1 uppercase">Leadership</span>
                    </>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-[#0B132B]">{founderData.name}</h4>
                  <p className="text-xs text-orange-600 font-semibold">
                    {founderData.designation}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {founderData.organization}
                  </p>
                </div>

                {founderData.quote && (
                  <p className="text-xs italic text-slate-600 px-3 py-1 bg-white border border-slate-200/80 rounded-lg">
                    "{founderData.quote}"
                  </p>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-center gap-4 text-[11px] text-slate-600 font-medium">
                  <span>{address.city} Registered Office</span>
                </div>
              </div>
            </div>

            {/* Right Column: Leadership Content */}
            <div className="lg:col-span-7 space-y-5 text-left">
              {/* Orange Label */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 text-orange-800 border border-orange-200">
                Leadership
              </div>

              {/* Title & Name */}
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B132B] tracking-tight font-sans">
                  Meet Our Leadership
                </h2>
                <h3 className="text-lg font-bold text-slate-800">
                  {founderData.name} — <span className="text-slate-600 font-normal">{founderData.designation}</span>
                </h3>
              </div>

              {/* Description */}
              <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <p>
                  {founderData.description}
                </p>
              </div>

              {/* Core Focus Areas */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Core Practice Areas:
                </span>
                <div className="flex flex-wrap gap-2">
                  {founderData.coreAreas.map((area, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-3">
                <button
                  onClick={() => onOpenConsultation('Leadership Advisory Consultation')}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Request Advisory Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
