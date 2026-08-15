import React from 'react';
import { INDUSTRY_SECTORS } from '../../data/websiteData';
import { Briefcase } from 'lucide-react';

export const ClientLogos: React.FC = () => {
  return (
    <section id="sectors-section" className="py-10 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Advisory Services Across Key Indian Industry Sectors
          </p>
        </div>

        {/* Responsive Sector Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 items-center">
          {INDUSTRY_SECTORS.map((sector) => (
            <div
              key={sector.id}
              id={`sector-${sector.id}`}
              className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg transition-colors text-center flex flex-col items-center justify-center min-h-[64px] group shadow-xs"
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
    </section>
  );
};
