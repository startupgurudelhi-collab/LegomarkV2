import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, CheckCircle, Building2, ArrowRight, Globe } from 'lucide-react';
import { COMPANY_PROFILE } from '../../data/websiteData';
import { fetchPublicOffice, PublicOfficeData, getStaticFallbackOffice } from '../../services/publicOffice.service';

interface OfficeSectionProps {
  onOpenConsultation: (serviceName?: string) => void;
}

export const OfficeSection: React.FC<OfficeSectionProps> = ({ onOpenConsultation }) => {
  const [officeData, setOfficeData] = useState<PublicOfficeData>(getStaticFallbackOffice);

  useEffect(() => {
    let isMounted = true;
    fetchPublicOffice().then((data) => {
      if (isMounted && data) {
        setOfficeData(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="office-section" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Office Information */}
          <div className="lg:col-span-7 space-y-5 text-left">
            {/* Orange Label */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 text-orange-800 border border-orange-200">
              Our Office
            </div>

            {/* Large Heading with Orange-Highlighted Second Line */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B132B] tracking-tight font-sans">
                Registered Office
              </h2>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-orange-600 tracking-tight font-sans">
                {officeData.city} – {officeData.pincode}
              </h3>
            </div>

            {/* Paragraph */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
              {officeData.name} operates from its registered office in {officeData.addressLine2}, {officeData.city}, serving founders, entrepreneurs, and established businesses across India.
            </p>

            {/* Simple Checklist */}
            <div className="space-y-2.5 pt-1">
              {officeData.checklist.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Office Contact Info Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 max-w-xl text-xs">
              <div className="flex items-start gap-2.5 text-slate-800 font-medium">
                <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <span>{officeData.fullAddress}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/80 text-[11px]">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mobile:</span>
                    <a href={`tel:${officeData.mobileRaw}`} className="hover:text-orange-600 font-bold text-slate-900">
                      {officeData.mobile}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Landline:</span>
                    <a href={`tel:${officeData.landlineRaw}`} className="hover:text-orange-600 font-bold text-slate-900">
                      {officeData.landline}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email:</span>
                    <a href={`mailto:${officeData.email}`} className="hover:text-orange-600 font-medium text-slate-900">
                      {officeData.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Office Hours:</span>
                    <span className="font-semibold text-slate-800">{officeData.officeHours}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-2">
              <button
                onClick={() => onOpenConsultation('Office Visit / Consultation')}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Request Advisory Consultation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Combined Office Photo + Office Information Card */}
          <div className="lg:col-span-5">
            <div className="bg-[#0B132B] text-white rounded-2xl border border-slate-700 shadow-md overflow-hidden flex flex-col h-full">
              {/* Top Section: Office Premises Photo (50-55% visual proportion) or High-Fidelity Fallback */}
              <div className="relative w-full h-56 sm:h-64 md:h-72 bg-slate-900 overflow-hidden shrink-0 border-b border-slate-800">
                {officeData.premisesPhotoUrl ? (
                  <img
                    src={officeData.premisesPhotoUrl}
                    alt={`${officeData.name} Registered Office Premises`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#0e1938] to-[#0B132B]">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-500 shadow-inner mb-3">
                      <Building2 className="w-8 h-8 text-orange-500" />
                    </div>
                    <span className="text-xs font-bold tracking-wider text-slate-200 uppercase">
                      Registered Office Premises
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      {officeData.city} – {officeData.pincode}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Section: Quick Office Summary */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4 text-left">
                {/* Office Name & Location */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {officeData.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                      Open 7 Days
                    </span>
                  </div>
                  <p className="text-xs text-orange-400 font-semibold">
                    {officeData.city} – {officeData.pincode}
                  </p>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{officeData.fullAddress}</span>
                </div>

                {/* Quick Key Metrics: Hours & Direct Contact */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Office Hours:</span>
                      <span className="font-medium text-slate-200">{officeData.officeHours}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Contact Direct:</span>
                      <a
                        href={`tel:${officeData.mobileRaw}`}
                        className="font-medium text-slate-200 hover:text-orange-400 transition-colors"
                      >
                        {officeData.mobile}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Website Reference */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                  <Globe className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>{officeData.websites.join(' | ')}</span>
                </div>

                {/* Action: View on Map / Get Directions */}
                <div className="pt-2">
                  <a
                    href={
                      officeData.mapEmbedUrl ||
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        officeData.fullAddress
                      )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600/80 text-slate-200 hover:text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    <span>View on Map / Get Directions</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
