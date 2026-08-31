import React from 'react';
import { MessageCircle } from 'lucide-react';
import { COMPANY_PROFILE } from '../../data/websiteData';

interface FloatingWhatsAppProps {
  serviceName?: string;
  className?: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ serviceName, className = '' }) => {
  const rawMobile = COMPANY_PROFILE.contact.mobileRaw || COMPANY_PROFILE.contact.mobile;
  const digits = rawMobile.replace(/[^\d]/g, '');
  const phone = digits.startsWith('91') ? digits : `91${digits.slice(-10)}`;

  const defaultMessage = serviceName
    ? `Hello LEGOMARK INDIA, I would like to inquire about ${serviceName}.`
    : `Hello LEGOMARK INDIA, I would like to inquire about your legal, taxation and corporate services.`;

  const encodedMessage = encodeURIComponent(defaultMessage);
  const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

  return (
    <div
      id="floating-whatsapp-container"
      className={`fixed bottom-6 right-6 z-40 print:hidden ${className}`}
    >
      <a
        id="floating-whatsapp-btn"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with LEGOMARK INDIA on WhatsApp"
        className="w-14 h-14 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center cursor-pointer group"
      >
        <div className="relative flex items-center justify-center">
          <MessageCircle className="w-7 h-7 fill-white text-[#25D366]" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
        </div>
      </a>
    </div>
  );
};
