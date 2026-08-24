import React from 'react';
import { LegalPageLayout, LegalPolicyType } from './LegalPageLayout';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  CreditCard,
  Building,
  Mail,
  Receipt,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { COMPANY_PROFILE } from '../../data/websiteData';

interface RefundPolicyPageProps {
  onNavigatePolicy: (policy: LegalPolicyType) => void;
  onNavigateHome?: () => void;
  onOpenConsultation?: (serviceName?: string) => void;
}

export const RefundPolicyPage: React.FC<RefundPolicyPageProps> = ({
  onNavigatePolicy,
  onNavigateHome,
  onOpenConsultation,
}) => {
  const { address, contact, name } = COMPANY_PROFILE;

  return (
    <LegalPageLayout
      activePolicy="refund"
      title="Refund & Cancellation Policy"
      subtitle="Transparent, fair, and service-specific refund guidelines distinguishing professional advisory fees from non-refundable statutory government disbursements."
      lastUpdated="August 24, 2026"
      onNavigatePolicy={onNavigatePolicy}
      onNavigateHome={onNavigateHome}
      onOpenConsultation={onOpenConsultation}
    >
      {/* 1. Core Philosophy */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider">
          <RotateCcw className="w-4 h-4" />
          <span>Fair & Balanced Refund Standard</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          1. Purpose & Guiding Principles
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          At <strong>{name}</strong>, we are committed to providing professional, reliable, and transparent corporate compliance, tax advisory, company incorporation, and trademark services. We understand that business circumstances may evolve, and we have established this Refund &amp; Cancellation Policy in alignment with the <strong>Consumer Protection Act, 2019</strong> and fair trade practices in professional services.
        </p>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          Unlike retail or product-based commerce, our engagements involve intellectual labor, legal research, statutory document drafting, and direct fee disbursements to government treasuries. This policy provides a clear, balanced distinction between refundable professional service charges and non-refundable statutory disbursements.
        </p>
      </section>

      {/* 2. Breakdown of Fee Components */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          2. Transparent Classification of Fee Components
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          Every client invoice and package price comprises distinct cost elements:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Component 1 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <FileText className="w-4 h-4 text-orange-600" />
              <h4>1. Professional Fees</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Charges payable to LEGOMARK INDIA for professional legal research, name checking, drafting of statutory forms, verification, compliance review, and liaison.
            </p>
            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-semibold">
              Eligible for Refund / Pro-Rata
            </span>
          </div>

          {/* Component 2 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Building className="w-4 h-4 text-orange-600" />
              <h4>2. Statutory Government Fees</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Official fees deposited directly to government departments (MCA challans, Form TM-A fees, state stamp duty, ROC late fees, FSSAI treasury fees).
            </p>
            <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10.5px] font-semibold">
              Non-Refundable Once Deposited
            </span>
          </div>

          {/* Component 3 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <CreditCard className="w-4 h-4 text-orange-600" />
              <h4>3. Third-Party Costs</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct external outlays including Class 3 DSC token issuance by Certifying Authorities, physical stamp paper, sworn notarization, or third-party courier.
            </p>
            <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10.5px] font-semibold">
              Non-Refundable Once Issued
            </span>
          </div>
        </div>
      </section>

      {/* 3. Refund Eligibility Matrix */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          3. Detailed Refund Eligibility Matrix
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          Refund eligibility is evaluated on the basis of service status and operational stage at the time the cancellation request is received:
        </p>

        <div className="space-y-3 pt-2">
          {/* Scenario 1 */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>A. Cancellation Prior to Work Commencement (100% Professional Fee Refund)</span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-950/80 leading-relaxed">
              If the Client requests cancellation in writing within <strong>24 hours of payment</strong> and before any documentation, preliminary search, drafting, or file creation has been initiated by our team, <strong>100% of the professional fee</strong> will be refunded (less the actual nominal payment gateway transaction processing fee of ~2–3% if applicable).
            </p>
          </div>

          {/* Scenario 2 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
              <span>B. Cancellation After Work Has Commenced (Pro-Rata Partial Refund)</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              If cancellation is requested after our compliance team has commenced work (such as trademark preliminary class search, company name availability research, drafting of MoA/AoA/Partnership deeds, or form preparation), a partial refund will be calculated after deducting reasonable charges for professional hours and work already performed.
            </p>
          </div>

          {/* Scenario 3 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>C. Government Fees Already Disbursed (Strictly Non-Refundable)</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Once an application has been uploaded to an official government portal (MCA SPICe+, GST portal, IP India, Income Tax, FSSAI) and the government statutory challan / stamp duty has been generated and paid, <strong>government fees cannot be refunded</strong> under any circumstance, as statutory treasuries do not offer refunds.
            </p>
          </div>

          {/* Scenario 4 */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>D. Duplicate or Erroneous Payments (100% Immediate Refund)</span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-950/80 leading-relaxed">
              In case of duplicate transaction debits due to network timeouts, technical payment gateway glitches, or unintended multiple submissions, <strong>100% of the duplicate amount</strong> will be refunded immediately to the original payment source without deductions.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Non-Refundable Situations */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          4. Situations Ineligible for Professional Fee Refund
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          Refunds cannot be issued under the following circumstances:
        </p>

        <ul className="text-xs sm:text-sm text-slate-700 space-y-2 list-disc list-inside leading-relaxed pl-2">
          <li>
            <strong>Rejection by Government Authorities:</strong> If an application is objected to or rejected by a government registrar (e.g. Trademark examination objection, MCA name rejection due to conflict with existing registered trademarks, or Section 8 license query), professional fees for drafting and filing already executed are not refundable. We will provide resubmission or reply assistance as covered in the service tier.
          </li>
          <li>
            <strong>Client Inaction or Failure to Submit Documentation:</strong> If a client fails to provide mandatory KYC documents, signed declarations, or OTP verifications for more than <strong>60 consecutive days</strong> despite multiple written reminders, the file will be archived.
          </li>
          <li>
            <strong>Change of Mind After Completed Filings:</strong> No refund is admissible after an application has been successfully filed with the relevant authority.
          </li>
        </ul>
      </section>

      {/* 5. Refund Request Procedure */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          5. How to Initiate a Refund Request
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          To ensure structured and auditable processing, all cancellation and refund requests must be submitted in writing through our designated billing channels:
        </p>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs sm:text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Please provide the following information in your request:</p>
          <ul className="space-y-1.5 list-disc list-inside text-slate-600 pl-2">
            <li>Original Order Reference Number / Invoice Number</li>
            <li>Registered Client Name, Contact Number, and Email ID</li>
            <li>Service Name (e.g., Private Limited Incorporation, GST Registration)</li>
            <li>Razorpay Transaction ID / Payment Receipt</li>
            <li>Detailed reason for cancellation or refund request</li>
          </ul>
          <div className="pt-2 flex flex-col sm:flex-row gap-4 text-xs font-medium text-slate-800">
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-orange-600" />
              <span>Email: <a href={`mailto:${contact.email}`} className="text-orange-600 hover:underline">{contact.email}</a></span>
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-orange-600" />
              <span>Phone / WhatsApp: <a href={`tel:${contact.mobileRaw}`} className="text-slate-900">{contact.mobile}</a></span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Processing Timelines & Mode of Refund */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          6. Refund Processing Timelines & Payout
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-slate-700">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>Review Timeline (3 Business Days)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Our accounts and compliance team will review the work log and verify government fee status within 3 business days of receiving your request.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Receipt className="w-4 h-4 text-orange-600" />
              <span>Settlement Timeline (5–7 Banking Days)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Once approved, refunds are credited back directly to the original payment method (Bank Account, UPI, or Card) via Razorpay within 5–7 banking days.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Contact Information */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          7. Billing & Accounts Assistance
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          For any questions concerning an invoice, transaction confirmation, or refund status, please reach out to our billing desk:
        </p>

        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs sm:text-sm">
          <p className="font-bold text-orange-400">{name} — Billing &amp; Accounts Desk</p>
          <p className="text-slate-300">Address: {address.fullAddress}</p>
          <p className="text-slate-300">Email: <a href={`mailto:${contact.email}`} className="text-orange-400 underline">{contact.email}</a></p>
          <p className="text-slate-300">Helpline: {contact.mobile} / {contact.landline}</p>
          <p className="text-slate-400 text-[11px] pt-1">Operating Hours: {contact.officeHours}</p>
        </div>
      </section>
    </LegalPageLayout>
  );
};
