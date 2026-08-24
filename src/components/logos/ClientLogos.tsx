import React, { useState, useEffect } from 'react';
import { Briefcase, Building2, ShieldCheck } from 'lucide-react';
import { ClientLogoData } from '../../types/clientLogo';
import { fetchPublicClientLogos } from '../../services/clientLogo.service';
import { INDUSTRY_SECTORS } from '../../data/websiteData';

export const ClientLogos: React.FC = () => {
  const [logos, setLogos] = useState<ClientLogoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPublicClientLogos().then((data) => {
      setLogos(data);
      setIsLoading(false);
    });
  }, []);

  // Duplicate logos for seamless infinite looping marquee if we have items
  const marqueeLogos = logos.length > 0 ? [...logos, ...logos] : [];

  return (
    <section id="sectors-section" className="py-12 bg-slate-50/70 border-b border-slate-200 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-700 text-[11px] font-bold tracking-wide uppercase mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Trusted Enterprise Legal Advisory
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 font-sans tracking-tight">
              Trusted by Businesses Across India
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium max-w-sm sm:text-right">
            From emerging startups to established corporate enterprises across India
          </p>
        </div>
      </div>

      {/* Infinite Scrolling Horizontal Marquee */}
      {logos.length > 0 ? (
        <div className="relative w-full overflow-hidden py-3">
          {/* Subtle gradient fades on left and right for seamless scroll aesthetic */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-slate-50/90 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-slate-50/90 to-transparent z-10 pointer-events-none" />

          <div className="flex gap-4 sm:gap-6 animate-marquee hover:[animation-play-state:paused] w-max">
            {marqueeLogos.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200/80 rounded-xl shadow-xs hover:shadow-md hover:border-slate-300 transition-all shrink-0 min-w-[190px] h-16 group"
              >
                {item.logoUrl ? (
                  <div className="flex items-center justify-center h-9 max-w-[130px] shrink-0">
                    <img
                      src={item.logoUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="max-h-9 max-w-[130px] w-auto h-auto object-contain transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-orange-50 text-slate-600 group-hover:text-orange-600 border border-slate-200 flex items-center justify-center font-black text-xs shrink-0 transition-colors">
                    {item.name.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col truncate">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#0B132B] truncate max-w-[140px] transition-colors">
                    {item.name}
                  </span>
                  {item.category && (
                    <span className="text-[9.5px] text-slate-400 font-medium truncate uppercase tracking-wider">
                      {item.category}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 items-center">
            {INDUSTRY_SECTORS.map((sector) => (
              <div
                key={sector.id}
                id={`sector-${sector.id}`}
                className="p-3 bg-white border border-slate-200 rounded-lg transition-colors text-center flex flex-col items-center justify-center min-h-[64px] group shadow-xs"
              >
                <div className="flex items-center gap-1 text-slate-400 group-hover:text-orange-600 transition-colors mb-1">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#0B132B] transition-colors truncate max-w-full">
                  {sector.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
