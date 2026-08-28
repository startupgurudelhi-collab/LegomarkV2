import React, { useState } from 'react';
import {
  ShieldCheck,
  Send,
  Loader2,
  CheckCircle2,
  Phone,
  Mail,
  User,
  MapPin,
  FileText,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Layers,
  Check
} from 'lucide-react';
import { ServiceItem, PackageTier, BuyNowItem } from '../../types/website';
import { submitPublicConsultation } from '../../services/lead.service';

interface ServiceApplicationFormProps {
  service: ServiceItem;
  packages?: PackageTier[];
  selectedPackage?: PackageTier | null;
  onSelectPackage?: (pkg: PackageTier) => void;
  onOpenBuyNow?: (item: BuyNowItem | ServiceItem) => void;
  onOpenConsultation?: (serviceName?: string) => void;
}

export const ServiceApplicationForm: React.FC<ServiceApplicationFormProps> = ({
  service,
  packages,
  selectedPackage,
  onSelectPackage,
  onOpenBuyNow,
  onOpenConsultation,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePriceDisplay = selectedPackage ? selectedPackage.price : service.startingPrice;
  const activePackageName = selectedPackage ? selectedPackage.name : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    const cleanPhone = phone.trim().replace(/[^\d]/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    const serviceTitleWithPackage = activePackageName
      ? `${service.title} (${activePackageName} - ${activePriceDisplay})`
      : service.title;

    try {
      setSubmitting(true);
      await submitPublicConsultation({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: cleanPhone.slice(-10),
        city: city.trim() || undefined,
        serviceId: service.id || service.slug,
        selectedService: serviceTitleWithPackage,
        serviceInterested: service.title,
        message:
          message.trim() ||
          `Service application initiated for ${serviceTitleWithPackage}`,
        source: 'service_landing_page_application_form',
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Unable to submit your application. Please try again or call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFullName('');
    setEmail('');
    setPhone('');
    setCity('');
    setMessage('');
    setError(null);
  };

  const handleCheckoutClick = () => {
    if (!onOpenBuyNow) return;
    if (selectedPackage) {
      onOpenBuyNow({
        id: selectedPackage.id,
        name: `${service.title} - ${selectedPackage.name}`,
        title: `${service.title} (${selectedPackage.name})`,
        slug: service.slug,
        priceDisplay: selectedPackage.price,
        itemType: 'package',
        category: service.category,
        governmentFeeNote: service.governmentFeeNote,
        features: selectedPackage.features,
      });
    } else {
      onOpenBuyNow(service);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-7 relative overflow-hidden">
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

      {submitted ? (
        <div className="py-6 text-center space-y-5 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
              Application Received
            </span>
            <h3 className="text-xl font-bold text-[#0B132B]">
              Thank You, {fullName.split(' ')[0]}!
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Your application for <strong className="text-slate-800">{service.title}</strong>{' '}
              {activePackageName && (
                <span className="text-orange-700 font-semibold">({activePackageName})</span>
              )}{' '}
              has been received.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Service:</span>
              <span className="font-semibold text-slate-900">{service.title}</span>
            </div>
            {activePackageName && (
              <div className="flex items-center justify-between text-slate-600">
                <span>Selected Package:</span>
                <span className="font-bold text-orange-600">
                  {activePackageName}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-slate-600">
              <span>Estimated Response:</span>
              <span className="font-semibold text-emerald-700">Within 30 Minutes</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Contact Phone:</span>
              <span className="font-mono text-slate-800">+91 {phone.slice(-10)}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            {onOpenBuyNow && (
              <button
                type="button"
                onClick={handleCheckoutClick}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>START YOUR REGISTRATION</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2.5 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Submit Another Inquiry
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header */}
          <div className="space-y-1 pb-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/60">
                Fast-Track Application
              </span>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified CA/CS Process</span>
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#0B132B] tracking-tight pt-1">
              Apply for {service.title}
            </h3>
            <p className="text-xs text-slate-500">
              Get an instant quotation, statutory roadmap, and dedicated CA/CS consultation.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9.5 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rajesh@company.in"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9.5 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="98765 43210"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-11 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-mono focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
                  />
                </div>
              </div>
            </div>

            {/* City / State */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City / Business Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai, Bengaluru, Delhi NCR"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9.5 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
                />
              </div>
            </div>

            {/* Specific Requirement */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Specific Requirements <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share any special timelines, partner count, or questions..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Application...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>SUBMIT APPLICATION</span>
                </>
              )}
            </button>

            {/* Quick Buy Now Option */}
            {onOpenBuyNow && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Ready to start?</span>
                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  className="font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>START YOUR REGISTRATION</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Trust Footer */}
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>SSL Encrypted</span>
              </span>
              <span>&bull;</span>
              <span>100% Confidential</span>
              <span>&bull;</span>
              <span>Zero Spam</span>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

