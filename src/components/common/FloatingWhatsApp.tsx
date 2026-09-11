import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Mail, PhoneCall, X, ChevronUp, Sparkles, ArrowLeft, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { COMPANY_PROFILE } from '../../data/websiteData';
import { submitPublicConsultation } from '../../services/lead.service';

type ActiveView = 'menu' | 'whatsapp' | 'email';

interface FloatingWhatsAppProps {
  serviceName?: string;
  className?: string;
  onRequestCallback?: () => void;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  serviceName,
  className = '',
  onRequestCallback,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('menu');
  const widgetRef = useRef<HTMLDivElement>(null);

  // WhatsApp Form State
  const [waName, setWaName] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const [waQuery, setWaQuery] = useState('');
  const [waSubmitting, setWaSubmitting] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);
  const [waSuccess, setWaSuccess] = useState(false);

  // Email Form State
  const [emailName, setEmailName] = useState('');
  const [emailAddr, setEmailAddr] = useState('');
  const [emailPhone, setEmailPhone] = useState('');
  const [emailService, setEmailService] = useState(serviceName || '');
  const [emailQuery, setEmailQuery] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Update email service whenever active serviceName prop changes
  useEffect(() => {
    if (serviceName && !emailService) {
      setEmailService(serviceName);
    }
  }, [serviceName]);

  const rawMobile = COMPANY_PROFILE.contact.mobileRaw || COMPANY_PROFILE.contact.mobile;
  const digits = rawMobile.replace(/[^\d]/g, '');
  const phone = digits.startsWith('91') ? digits : `91${digits.slice(-10)}`;
  const companyEmail = COMPANY_PROFILE.contact.email || 'info@legomarkindia.com';

  // Handle click outside to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Reset form views when panel closes
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setActiveView('menu');
      setWaError(null);
      setEmailError(null);
      setWaSuccess(false);
      setEmailSuccess(false);
    }, 250);
  };

  const handleOpenPanel = () => {
    if (isOpen) {
      handleClose();
    } else {
      setIsOpen(true);
      setActiveView('menu');
      setWaError(null);
      setEmailError(null);
      setWaSuccess(false);
      setEmailSuccess(false);
    }
  };

  // 1. WhatsApp Lead Submission & Direct Open
  const handleWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaError(null);

    const cleanName = waName.trim();
    const cleanPhone = waPhone.trim().replace(/[^\d]/g, '');
    const cleanQuery = waQuery.trim();

    if (!cleanName) {
      setWaError('Please provide your full name.');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setWaError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!cleanQuery) {
      setWaError('Please enter your query or requirement.');
      return;
    }

    setWaSubmitting(true);
    try {
      // Create lead and route via EFILINGG CRM flow
      await submitPublicConsultation({
        fullName: cleanName,
        phone: cleanPhone,
        serviceInterested: serviceName || 'General WhatsApp Advisory',
        message: cleanQuery,
        source: 'Website – WhatsApp',
      });

      setWaSuccess(true);

      // Build personalized WhatsApp text with visitor name, query, and service context
      const formattedMessage = `Hello LEGOMARK INDIA,\n\nName: ${cleanName}\nPhone: ${cleanPhone}\nService: ${
        serviceName || 'General Legal/Taxation Inquiry'
      }\n\nQuery:\n${cleanQuery}`;

      const encodedMessage = encodeURIComponent(formattedMessage);
      const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

      // Open WhatsApp in new tab after slight delay for visual feedback
      setTimeout(() => {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        handleClose();
      }, 750);
    } catch (err: any) {
      // Even if API network fails, do not block the user from chatting
      console.error('Lead submission failed during WhatsApp trigger:', err);
      const fallbackMsg = `Hello LEGOMARK INDIA,\n\nName: ${cleanName}\nPhone: ${cleanPhone}\n\nQuery:\n${cleanQuery}`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(fallbackMsg)}`, '_blank', 'noopener,noreferrer');
      handleClose();
    } finally {
      setWaSubmitting(false);
    }
  };

  // 2. Email Lead Submission & Direct mailto open
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    const cleanName = emailName.trim();
    const cleanEmail = emailAddr.trim();
    const cleanPhone = emailPhone.trim().replace(/[^\d]/g, '') || '0000000000';
    const cleanService = (emailService.trim() || serviceName || 'Corporate & Legal Advisory').trim();
    const cleanQuery = emailQuery.trim();

    if (!cleanName) {
      setEmailError('Please provide your full name.');
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (!cleanQuery) {
      setEmailError('Please enter your query or message.');
      return;
    }

    setEmailSubmitting(true);
    try {
      // Create lead and route via EFILINGG CRM flow
      await submitPublicConsultation({
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        serviceInterested: cleanService,
        message: cleanQuery,
        source: 'Website – Email',
      });

      setEmailSuccess(true);

      // Build pre-filled mailto targeting info@legomarkindia.com
      const subject = encodeURIComponent(`Inquiry from ${cleanName}: ${cleanService} - LEGOMARK INDIA`);
      const body = encodeURIComponent(
        `Dear LEGOMARK Advisory Team,\n\nI have submitted an advisory enquiry via your website:\n\n` +
        `• Name: ${cleanName}\n` +
        `• Email: ${cleanEmail}\n` +
        `${cleanPhone !== '0000000000' ? `• Phone: ${cleanPhone}\n` : ''}` +
        `• Service: ${cleanService}\n\n` +
        `Query / Requirement:\n${cleanQuery}\n\n` +
        `Please advise on the next steps and timeline at your earliest convenience.\n\n` +
        `Kind regards,\n${cleanName}`
      );
      const mailtoUrl = `mailto:${companyEmail}?subject=${subject}&body=${body}`;

      setTimeout(() => {
        window.location.href = mailtoUrl;
        handleClose();
      }, 750);
    } catch (err: any) {
      console.error('Lead submission failed during Email trigger:', err);
      // Failsafe: still launch mailto
      const subject = encodeURIComponent(`Inquiry from ${cleanName}: ${cleanService} - LEGOMARK INDIA`);
      const body = encodeURIComponent(`Name: ${cleanName}\nEmail: ${cleanEmail}\n\nQuery:\n${cleanQuery}`);
      window.location.href = `mailto:${companyEmail}?subject=${subject}&body=${body}`;
      handleClose();
    } finally {
      setEmailSubmitting(false);
    }
  };

  const handleCallbackClick = () => {
    handleClose();
    if (onRequestCallback) {
      onRequestCallback();
    }
  };

  return (
    <div
      ref={widgetRef}
      id="floating-chat-widget-container"
      className={`fixed bottom-6 right-6 z-40 print:hidden ${className}`}
    >
      {/* Contact Panel Popover */}
      {isOpen && (
        <div
          id="chat-options-panel"
          className="absolute bottom-16 right-0 mb-2 w-84 sm:w-92 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200 max-h-[85vh] flex flex-col"
        >
          {/* Panel Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-700 shrink-0">
            <div className="flex items-center gap-2.5">
              {activeView !== 'menu' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('menu');
                    setWaError(null);
                    setEmailError(null);
                  }}
                  className="p-1 -ml-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Back to menu"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Advisory Desk Active</span>
                </div>
                <h4 className="font-serif font-bold text-base text-white tracking-tight mt-0.5">
                  {activeView === 'menu' && 'Connect with LEGOMARK'}
                  {activeView === 'whatsapp' && 'Chat on WhatsApp'}
                  {activeView === 'email' && 'Email Our Advisory Desk'}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {activeView === 'menu' && (serviceName ? `Inquiring about ${serviceName}` : 'Select your preferred contact channel')}
                  {activeView === 'whatsapp' && 'Enter details to start direct WhatsApp chat'}
                  {activeView === 'email' && `Enquiry dispatched to ${companyEmail}`}
                </p>
              </div>
            </div>
            <button
              id="close-chat-panel-btn"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              aria-label="Close contact panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Panel Body */}
          <div className="overflow-y-auto flex-1 p-4 bg-slate-50/60">
            {/* VIEW 1: Main Menu with 3 Options */}
            {activeView === 'menu' && (
              <div className="space-y-2.5">
                {/* Option 1: WhatsApp */}
                <button
                  id="chat-option-whatsapp"
                  onClick={() => setActiveView('whatsapp')}
                  className="w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 transition-all text-left group shadow-xs cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-5 h-5 fill-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Chat on WhatsApp
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                        Fast
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      Direct WhatsApp chat with our legal advisor
                    </p>
                  </div>
                </button>

                {/* Option 2: Email */}
                <button
                  id="chat-option-email"
                  onClick={() => setActiveView('email')}
                  className="w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-white hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 transition-all text-left group shadow-xs cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                        Email Us
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                        Official
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      Send your case details to {companyEmail}
                    </p>
                  </div>
                </button>

                {/* Option 3: Request a Call Back */}
                <button
                  id="chat-option-callback"
                  onClick={handleCallbackClick}
                  className="w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-white hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300 transition-all text-left group shadow-xs cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-900 group-hover:text-amber-700 transition-colors">
                        Request a Call Back
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                        Free
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      Senior advocate callback within business hours
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* VIEW 2: WhatsApp Lead Capture Form */}
            {activeView === 'whatsapp' && (
              <form onSubmit={handleWhatsAppSubmit} className="space-y-3">
                {serviceName && (
                  <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium truncate">Service: {serviceName}</span>
                  </div>
                )}

                {waError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    {waError}
                  </div>
                )}

                {waSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Lead registered. Launching WhatsApp...</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={waName}
                    onChange={(e) => setWaName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-2.5 text-xs text-slate-600 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      value={waPhone}
                      maxLength={10}
                      onChange={(e) => setWaPhone(e.target.value.replace(/[^\d]/g, ''))}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Query / Requirement <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Briefly describe what legal or corporate service you require..."
                    value={waQuery}
                    onChange={(e) => setWaQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={waSubmitting || waSuccess}
                  className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white font-semibold text-sm shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {waSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : waSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Opening WhatsApp...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Submit & Chat on WhatsApp</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* VIEW 3: Email Lead Capture Form */}
            {activeView === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {emailError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    {emailError}
                  </div>
                )}

                {emailSuccess && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Enquiry logged. Opening mail composer...</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Nair"
                    value={emailName}
                    onChange={(e) => setEmailName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={emailAddr}
                    onChange={(e) => setEmailAddr(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={emailPhone}
                    maxLength={10}
                    onChange={(e) => setEmailPhone(e.target.value.replace(/[^\d]/g, ''))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service of Interest <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Private Limited Company Registration"
                    value={emailService}
                    onChange={(e) => setEmailService(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Query / Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide details about your query or company status..."
                    value={emailQuery}
                    onChange={(e) => setEmailQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={emailSubmitting || emailSuccess}
                  className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-sm shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {emailSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Enquiry...</span>
                    </>
                  ) : emailSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Opening Email Composer...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit & Email Enquiry</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Panel Footer */}
          <div className="px-4 py-2.5 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Direct Legal & Corporate Help
            </span>
            <span>Mon–Sun 11AM–8PM</span>
          </div>
        </div>
      )}

      {/* Floating CHAT US Pill Button (Preserved Design) */}
      <button
        id="floating-chat-us-btn"
        onClick={handleOpenPanel}
        aria-expanded={isOpen}
        aria-controls="chat-options-panel"
        aria-label="Open contact and advisory options"
        className="group relative flex items-center gap-2.5 px-4 py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-full shadow-xl hover:shadow-2xl border border-slate-700/80 transition-all duration-300 cursor-pointer"
      >
        {/* Pulsing online indicator */}
        <span className="relative flex h-3 w-3 items-center justify-center shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>

        {/* Icon & Label */}
        <MessageCircle className="w-5 h-5 text-amber-400 fill-amber-400/20 group-hover:scale-110 transition-transform shrink-0" />
        <span className="font-bold text-xs uppercase tracking-wider text-white whitespace-nowrap pr-0.5">
          Chat Us
        </span>

        {/* Dynamic Chevron / Toggle visual cue */}
        <ChevronUp
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>
    </div>
  );
};
