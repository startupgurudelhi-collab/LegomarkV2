import React, { useState } from 'react';
import { FAQS } from '../../data/websiteData';
import { FAQItem } from '../../types/website';
import { ChevronDown, HelpCircle, PhoneCall } from 'lucide-react';
import { COMPANY_CONTACT } from '../../data/websiteData';

interface FAQSectionProps {
  onOpenConsultation: () => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ onOpenConsultation }) => {
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <section id="faq-section" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 text-orange-800 border border-orange-200">
            <HelpCircle className="w-3.5 h-3.5 text-orange-600" />
            Support & Clarifications
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B132B] tracking-tight font-sans">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Clear information regarding company registration, MCA compliance, and taxation rules in India.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq: FAQItem) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                id={`faq-item-${faq.id}`}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-[#0B132B]">
                    {faq.question}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    <p className="pt-3">{faq.answer}</p>
                    {faq.category && (
                      <div className="mt-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Category: {faq.category}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still Have Questions Box */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 sm:p-7 text-center space-y-3">
          <h4 className="text-sm sm:text-base font-bold text-[#0B132B]">
            Have a Specific Legal or Tax Question?
          </h4>
          <p className="text-xs text-slate-600 max-w-lg mx-auto">
            Speak directly with our senior corporate advisory team for tailored guidance on your business structure.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={onOpenConsultation}
              className="px-5 py-2.5 bg-[#0B132B] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Request Free Callback
            </button>
            <a
              href={`tel:${COMPANY_CONTACT.phone}`}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-[#0B132B] border border-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <PhoneCall className="w-3.5 h-3.5 text-orange-600" />
              <span>Call {COMPANY_CONTACT.phone}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
