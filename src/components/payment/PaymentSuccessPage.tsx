import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  ShieldCheck,
  Phone,
  MessageCircle,
  ArrowLeft,
  Copy,
  Check,
  Printer,
  FileCheck2,
  Clock,
  Building,
  User,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { COMPANY_PROFILE } from '../../data/websiteData';
import { formatINR } from '../../utils/pricing';

export interface VerifiedPaymentReceipt {
  verified: boolean;
  timestamp: number;
  paymentId: string;
  orderId: string;
  amount: number;
  serviceName: string;
  packageName: string;
  itemName: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  city?: string;
  date: string;
}

interface PaymentSuccessPageProps {
  receipt?: VerifiedPaymentReceipt | null;
  onNavigateHome: () => void;
  onOpenConsultation?: (serviceName?: string) => void;
}

const STORAGE_KEY = 'legomark_verified_payment';

export const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({
  receipt: propReceipt,
  onNavigateHome,
}) => {
  const [receipt, setReceipt] = useState<VerifiedPaymentReceipt | null>(propReceipt || null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (propReceipt && propReceipt.verified) {
      setReceipt(propReceipt);
      return;
    }

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as VerifiedPaymentReceipt;
        if (parsed && parsed.verified && parsed.paymentId) {
          setReceipt(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read verified payment receipt from session:', e);
    }
  }, [propReceipt]);

  const handleCopy = (text: string, field: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // WhatsApp click handler
  const whatsappNumber = COMPANY_PROFILE.contact.mobileRaw.replace(/[^0-9]/g, '');
  const paymentRef = receipt?.paymentId || 'Verified Transaction';
  const serviceRef = receipt?.serviceName || 'Legal Services';
  const packageRef = receipt?.packageName || 'Professional Plan';
  const whatsappMessage = encodeURIComponent(
    `Hello LEGOMARK INDIA team, I have completed payment for ${serviceRef} (${packageRef}). Payment ID: ${paymentRef}. Please assist me with the documentation and next steps.`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // If no verified payment exists in session or prop (e.g. direct URL visit or refresh without prior payment)
  // Strictly enforce: Do NOT treat merely opening the URL as a successful conversion!
  if (!receipt || !receipt.verified) {
    return (
      <main id="payment-success-unverified" className="min-h-[70vh] bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-6">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-200">
            <Lock className="w-7 h-7 text-amber-600" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5" />
              Verification Required
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              No Active Payment Found
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              This confirmation page is strictly restricted to authenticated transactions. Merely opening this URL does not record or constitute a successful payment.
            </p>
            <p className="text-xs text-slate-500">
              If you have recently made a payment, please check your SMS / email for the Razorpay confirmation or contact our senior legal desk.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              id="unverified-back-btn"
              onClick={onNavigateHome}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#0B132B] hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Website
            </button>
            <a
              id="unverified-call-btn"
              href={`tel:${COMPANY_PROFILE.contact.mobileRaw}`}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
            >
              <Phone className="w-4 h-4 text-orange-600" />
              Call Support
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="payment-success-page" className="bg-slate-50 min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* 1. Header Banner & Success Confirmation */}
        <div id="payment-success-banner" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500 shadow-xs">
            <CheckCircle className="w-9 h-9 sm:w-11 sm:h-11 text-emerald-600" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Payment Successful
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B132B] tracking-tight pt-2">
              Thank you for choosing LEGOMARK INDIA
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
              Your transaction has been securely processed and cryptographically verified by Razorpay. A dedicated legal advisor has been assigned to initiate your engagement.
            </p>
          </div>
        </div>

        {/* 2. Order & Payment Breakdown Card */}
        <div id="payment-success-receipt" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#0B132B] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Official Payment Receipt
              </span>
            </div>
            <button
              id="print-receipt-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Main Service & Package Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-200">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Service Name
                </span>
                <p className="text-lg font-bold text-[#0B132B] mt-1">
                  {receipt.serviceName}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Selected Package
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                    {receipt.packageName}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Payment Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-200">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-medium text-slate-500 block">Amount Paid</span>
                <span className="text-2xl font-extrabold text-emerald-700 mt-0.5 block">
                  {formatINR(receipt.amount)}
                </span>
                <span className="text-[11px] text-slate-500">Inclusive of CA/CS filing & professional advisory</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-medium text-slate-500 block">Transaction Date & Time</span>
                <span className="text-sm font-bold text-slate-800 mt-1 block">
                  {receipt.date}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" /> Status: Completed & Captured
                </span>
              </div>
            </div>

            {/* Transaction Reference IDs */}
            <div className="space-y-3 pb-6 border-b border-slate-200 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Razorpay Payment ID:</span>
                <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                  <span>{receipt.paymentId}</span>
                  <button
                    onClick={() => handleCopy(receipt.paymentId, 'paymentId')}
                    title="Copy Payment ID"
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    {copiedField === 'paymentId' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Razorpay Order ID:</span>
                <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                  <span>{receipt.orderId}</span>
                  <button
                    onClick={() => handleCopy(receipt.orderId, 'orderId')}
                    title="Copy Order ID"
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    {copiedField === 'orderId' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {receipt.customerName && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium">Registered Client Name:</span>
                  <span className="font-semibold text-slate-800">{receipt.customerName}</span>
                </div>
              )}

              {receipt.customerPhone && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium">Contact Phone:</span>
                  <span className="font-semibold text-slate-800">{receipt.customerPhone}</span>
                </div>
              )}
            </div>

            {/* 3. Advisory Next Steps & Explanation Notice */}
            <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-5 space-y-2 text-left">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>What happens next? Our team will contact you shortly</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Our senior legal and corporate compliance advisory team has received your order. A dedicated <strong>Company Secretary (CS)</strong> or <strong>Chartered Accountant (CA)</strong> has been assigned to your case and will reach out on your registered contact number <strong>({receipt.customerPhone || 'your mobile'})</strong> within 15–30 minutes during business hours to collect the required documents and prepare statutory filings.
              </p>
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
                <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-amber-200/60">
                  <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>1. KYC Checklist:</strong> Document collection over WhatsApp / Email.</span>
                </div>
                <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-amber-200/60">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>2. Drafting:</strong> MCA / GST / IP India application filing.</span>
                </div>
                <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-amber-200/60">
                  <Building className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <span><strong>3. Issuance:</strong> Certificate delivery & compliance kit.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Action Buttons: WhatsApp / Call / Back to Website */}
        <div id="payment-success-actions" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-center">
            Need Immediate Assistance? Connect With Us Directly
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* WhatsApp Option */}
            <a
              id="payment-success-whatsapp-btn"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Connect on WhatsApp</span>
            </a>

            {/* Call Option */}
            <a
              id="payment-success-call-btn"
              href={`tel:${COMPANY_PROFILE.contact.mobileRaw}`}
              className="inline-flex items-center justify-center gap-2.5 py-3.5 px-4 bg-[#0B132B] hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Phone className="w-4 h-4 text-orange-400" />
              <span>Call Senior Advisory ({COMPANY_PROFILE.contact.mobile})</span>
            </a>
          </div>

          {/* Back to Website Option */}
          <div className="pt-2 text-center">
            <button
              id="payment-success-home-btn"
              onClick={onNavigateHome}
              className="inline-flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold text-slate-700 hover:text-[#0B132B] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Website</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
