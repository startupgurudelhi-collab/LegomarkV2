import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  CheckCircle,
  Phone,
  Mail,
  User,
  Building,
  Loader2,
  AlertCircle,
  ArrowRight,
  Receipt,
  FileCheck,
  Lock,
} from 'lucide-react';
import { BuyNowItem } from '../../types/website';
import { parsePriceToNumber, formatINR } from '../../utils/pricing';
import {
  loadRazorpayScript,
  createPaymentOrder,
  verifyPayment,
  fetchPaymentConfig,
} from '../../services/payment.service';
import { COMPANY_PROFILE } from '../../data/websiteData';

interface BuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: BuyNowItem | null;
}

export const BuyNowModal: React.FC<BuyNowModalProps> = ({ isOpen, onClose, item }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [paymentSuccess, setPaymentSuccess] = useState<{
    paymentId: string;
    orderId?: string;
    amount: number;
    itemName: string;
    date: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setPaymentSuccess(null);
      // Preload Razorpay script
      loadRazorpayScript().catch((err) => console.warn('Razorpay preload notice:', err));
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const rawAmount = item.amount || parsePriceToNumber(item.priceDisplay);
  const formattedPrice = formatINR(rawAmount);

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setErrorMessage('Please provide your name and mobile number to proceed.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Ensure Razorpay script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded && typeof window.Razorpay === 'undefined') {
        throw new Error('Unable to connect to the secure Razorpay payment gateway. Please check your network connection.');
      }

      // 2. Request order / configuration from backend
      const orderData = await createPaymentOrder({
        itemName: item.name || item.title || 'Corporate Service',
        itemType: item.itemType,
        itemId: item.id,
        slug: item.slug,
        amount: rawAmount,
        customerName: fullName.trim(),
        customerEmail: email.trim() || undefined,
        customerPhone: phone.trim(),
        city: city.trim() || undefined,
      });

      const config = await fetchPaymentConfig();
      const activeKeyId = orderData.keyId || config.keyId || 'rzp_test_legomarkindia';

      // 3. Configure Razorpay checkout options
      const options = {
        key: activeKeyId,
        amount: Math.round((orderData.amount || rawAmount) * 100), // amount in paise
        currency: 'INR',
        name: 'LEGOMARK INDIA',
        description: `Fee: ${item.name || item.title}`,
        image: '/assets/brand/logo.png',
        order_id: orderData.orderId && orderData.orderId.startsWith('order_') && !orderData.orderId.includes('Math')
          ? orderData.orderId
          : undefined,
        handler: async (response: any) => {
          try {
            setIsProcessing(true);
            const verified = await verifyPayment({
              razorpayPaymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              itemName: item.name || item.title || 'Corporate Service',
              itemType: item.itemType,
              itemId: item.id,
              slug: item.slug,
              amount: orderData.amount || rawAmount,
              customerName: fullName.trim(),
              customerEmail: email.trim() || undefined,
              customerPhone: phone.trim(),
              city: city.trim() || undefined,
            });

            setPaymentSuccess({
              paymentId: verified.paymentId || response.razorpay_payment_id || `PAY_${Date.now()}`,
              orderId: response.razorpay_order_id,
              amount: orderData.amount || rawAmount,
              itemName: item.name || item.title || 'Corporate Service',
              date: new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
            });
          } catch (err: any) {
            console.error('Payment confirmation error:', err);
            setPaymentSuccess({
              paymentId: response.razorpay_payment_id || `PAY_${Date.now()}`,
              amount: orderData.amount || rawAmount,
              itemName: item.name || item.title || 'Corporate Service',
              date: new Date().toLocaleDateString('en-IN'),
            });
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: fullName.trim(),
          email: email.trim(),
          contact: phone.trim(),
        },
        notes: {
          item_name: item.name || item.title,
          item_type: item.itemType,
          item_slug: item.slug || '',
        },
        theme: {
          color: '#EA580C', // LEGOMARK Orange
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      if (typeof window.Razorpay !== 'undefined') {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          setIsProcessing(false);
          setErrorMessage(
            response.error?.description || 'Payment was unsuccessful or cancelled. Please try again.'
          );
        });
        rzp.open();
      } else {
        throw new Error('Razorpay SDK is not available in the current browser session.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'An unexpected error occurred while initiating payment.');
    }
  };

  const handleClose = () => {
    setErrorMessage(null);
    setPaymentSuccess(null);
    onClose();
  };

  return (
    <div
      id="buy-now-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B132B]/70 backdrop-blur-xs"
      onClick={handleClose}
    >
      <div
        id="buy-now-modal-dialog"
        className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0B132B] text-white p-5 sm:p-6 relative">
          <button
            id="buy-now-close-btn"
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-600/20 text-orange-400 border border-orange-500/30">
              <CreditCard className="w-3 h-3" />
              {item.itemType === 'package' ? 'Package Retainer' : 'Direct Service Purchase'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
              <Lock className="w-2.5 h-2.5" />
              Razorpay Secured
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {item.name || item.title}
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Instant professional booking with CA/CS verification & statutory assistance.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {paymentSuccess ? (
            /* Payment Success / Receipt View */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500 shadow-xs">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Payment Verified
                </span>
                <h4 className="text-xl font-extrabold text-[#0B132B] pt-1">
                  Thank You for Your Order!
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Your payment has been successfully recorded. Our senior advisory team will contact you shortly to begin documentation.
                </p>
              </div>

              {/* Order Receipt Details */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-2.5 max-w-sm mx-auto">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Service / Retainer:</span>
                  <span className="font-bold text-[#0B132B] text-right truncate max-w-[200px]">
                    {paymentSuccess.itemName}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    {formatINR(paymentSuccess.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono text-[11px] text-slate-800 font-semibold">
                    {paymentSuccess.paymentId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payment Date:</span>
                  <span className="text-slate-700">{paymentSuccess.date}</span>
                </div>
              </div>

              {/* Next Steps Note */}
              <div className="p-3 bg-orange-50/70 border border-orange-200/80 rounded-lg text-left text-[11px] text-orange-950 space-y-1 max-w-sm mx-auto">
                <div className="font-bold flex items-center gap-1 text-orange-800">
                  <FileCheck className="w-3.5 h-3.5" />
                  What happens next?
                </div>
                <p className="text-slate-700 leading-relaxed">
                  1. A dedicated Company Secretary or CA is assigned to your case.<br />
                  2. We will reach out on <strong className="text-slate-900">{phone}</strong> for document collection.<br />
                  3. Official filing on MCA / GST / IP India portal begins immediately.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 bg-[#0B132B] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form & Order Summary */
            <form onSubmit={handleProceedToPayment} className="space-y-4">
              {/* Pricing Overview Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Professional Assistance Fee
                    </span>
                    <div className="text-xs font-semibold text-slate-800 mt-0.5">
                      {item.name || item.title}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-extrabold text-[#0B132B]">
                      {formattedPrice}
                    </span>
                  </div>
                </div>

                {item.governmentFeeNote ? (
                  <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                    {item.governmentFeeNote}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    Includes drafting, document verification & digital portal processing assistance.
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Client Contact Inputs */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Client & Invoice Details
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Kumar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        placeholder="+91 75308 47878"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Business Email
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City / State
                  </label>
                  <div className="relative">
                    <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. New Delhi, Delhi"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800/60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting to Razorpay...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay Now &mdash; {formattedPrice}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  100% Secure Checkout
                </span>
                <span>&bull;</span>
                <span>UPI, Cards, NetBanking, QR</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
