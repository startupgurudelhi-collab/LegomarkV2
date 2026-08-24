import React from 'react';
import { LegalPageLayout, LegalPolicyType } from './LegalPageLayout';
import {
  FileText,
  ShieldAlert,
  Scale,
  Building2,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  Landmark,
  Gavel,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import { COMPANY_PROFILE } from '../../data/websiteData';

interface TermsAndConditionsPageProps {
  onNavigatePolicy: (policy: LegalPolicyType) => void;
  onNavigateHome?: () => void;
  onOpenConsultation?: (serviceName?: string) => void;
}

export const TermsAndConditionsPage: React.FC<TermsAndConditionsPageProps> = ({
  onNavigatePolicy,
  onNavigateHome,
  onOpenConsultation,
}) => {
  const { address, contact, name } = COMPANY_PROFILE;

  return (
    <LegalPageLayout
      activePolicy="terms"
      title="Terms & Conditions"
      subtitle="Standard terms of engagement governing website usage, corporate consultancy agreements, and statutory compliance assistance provided by LEGOMARK INDIA."
      lastUpdated="August 24, 2026"
      onNavigatePolicy={onNavigatePolicy}
      onNavigateHome={onNavigateHome}
      onOpenConsultation={onOpenConsultation}
    >
      {/* 1. Acceptance of Terms */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider">
          <Scale className="w-4 h-4" />
          <span>Terms of Engagement</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          1. Acceptance of Terms & Engagement Agreement
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          Welcome to <strong>{name}</strong> (&ldquo;LEGOMARK INDIA,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). These Terms &amp; Conditions (&ldquo;Terms&rdquo;), together with our Privacy Policy and Refund &amp; Cancellation Policy, constitute a legally binding agreement between you (&ldquo;Client,&rdquo; &ldquo;User,&rdquo; or &ldquo;you&rdquo;) and LEGOMARK INDIA governing your access to and use of our website, digital platforms, and professional corporate consultancy services.
        </p>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          By accessing our website, placing an order, booking a consultation, submitting documents, or remitting professional fees, you confirm that you have read, understood, and agreed to be bound by these Terms. If you do not agree with any portion of these Terms, you must discontinue your use of our platform and refrain from engaging our services.
        </p>
      </section>

      {/* 2. Nature of Professional Assistance */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          2. Nature of Professional Advisory & Private Entity Status
        </h2>
        <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-xl space-y-2 text-xs sm:text-sm text-amber-950">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Private Consultancy Notice — Not a Government Department</span>
          </div>
          <p className="leading-relaxed">
            LEGOMARK INDIA is a privately operated legal, tax, secretarial, and corporate advisory consultancy. <strong>LEGOMARK INDIA is NOT a government agency, department, statutory board, or judicial authority.</strong> We assist clients by providing expert advisory, document drafting, procedural compliance management, and electronic filing facilitation on official government portals (including MCA, GSTN, Income Tax, IP India, FSSAI, MSME).
          </p>
        </div>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          Our online intake forms, packages, and consultation questionnaires are proprietary workflows designed to collect required documentation and information from clients for preparation of statutory applications. They do not constitute official government application forms.
        </p>
      </section>

      {/* 3. Scope of Professional Services */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          3. Scope of Professional Services
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          LEGOMARK INDIA provides specialized advisory, drafting, and filing support across the following defined domains:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <strong className="text-slate-900 block font-bold">1. Corporate Incorporation & Structuring</strong>
            <p className="text-slate-600">Private Limited Company, Limited Liability Partnership (LLP), Partnership Firm, and Section 8 / Non-Profit Company registration.</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <strong className="text-slate-900 block font-bold">2. Taxation & Regulatory Filings</strong>
            <p className="text-slate-600">GST Registration, periodic GST return filings (GSTR-1/3B/9), GST refunds, and Income Tax Return (ITR) preparation.</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <strong className="text-slate-900 block font-bold">3. Secretarial & ROC Compliance</strong>
            <p className="text-slate-600">Annual ROC filings (AOC-4, MGT-7), Director KYC (DIR-3 KYC), director appointment/resignation, and registered office shifts.</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <strong className="text-slate-900 block font-bold">4. Trademark, IP & Business Licensing</strong>
            <p className="text-slate-600">Trademark search, Form TM-A filing, objection response drafting, FSSAI Food Licensing, and MSME/Udyam registration.</p>
          </div>
        </div>
      </section>

      {/* 4. Client Responsibilities & Representations */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          4. Client Responsibilities & Document Accuracy
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          The successful and lawful execution of statutory filings depends upon the authenticity and timeliness of information submitted by the Client:
        </p>

        <ul className="text-xs sm:text-sm text-slate-700 space-y-2 list-disc list-inside leading-relaxed pl-2">
          <li>
            <strong>Authenticity & Accuracy:</strong> You warrant that all documents, identification records, PAN details, bank proofs, declarations, and information submitted are true, complete, and legally valid.
          </li>
          <li>
            <strong>Timely Provision of OTPs & Signatures:</strong> Many statutory portals require real-time OTP verifications or Digital Signature Certificates (DSC). The Client agrees to provide timely access to verification credentials.
          </li>
          <li>
            <strong>No Unlawful Filings:</strong> You undertake not to engage our services for any fraudulent enterprise, shell company operations, tax evasion, money laundering, or illegal trade.
          </li>
          <li>
            <strong>Client Indemnity:</strong> The Client agrees to indemnify and hold harmless LEGOMARK INDIA, its directors, and compliance officers from any penalties, statutory actions, or damages arising out of false or misleading information furnished by the Client.
          </li>
        </ul>
      </section>

      {/* 5. Professional Fees vs. Statutory & Government Fees */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          5. Professional Fees & Statutory Government Charges
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          To ensure complete pricing transparency, all fees on our website and invoices are structured as follows:
        </p>

        <div className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <strong className="text-slate-900 block font-bold">A. Professional / Consultancy Service Fees</strong>
            <p className="text-slate-600 leading-relaxed">
              These fees cover professional advisory, research, draft preparation, legal verification, liaison, and filing facilitation performed by LEGOMARK INDIA.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <strong className="text-slate-900 block font-bold">B. Statutory / Government Fees & Stamp Duties</strong>
            <p className="text-slate-600 leading-relaxed">
              Official fees levied directly by government bodies (MCA challans, state stamp duty, name reservation fees, ROC late fees, Trademark filing fees, FSSAI treasury fees). Government fees are variable based on authorized capital, state of incorporation, or applicant legal status and are non-refundable once paid to the government.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <strong className="text-slate-900 block font-bold">C. Third-Party Expenses</strong>
            <p className="text-slate-600 leading-relaxed">
              Direct external disbursements including Class 3 DSC token issuance by licensed Certifying Authorities, stamp paper procurement, or sworn notarizations.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Processing Timelines & Government Dependency */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          6. Timelines & Third-Party / Government Dependencies
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          Turnaround times (TAT) stated on our website or marketing collateral are standard professional estimates based on typical processing schedules under normal operational conditions:
        </p>
        <ul className="text-xs sm:text-sm text-slate-700 space-y-2 list-disc list-inside leading-relaxed pl-2">
          <li>
            <strong>Government Workload & Discretion:</strong> The actual issuance of Certificates of Incorporation, GSTIN, Trademark Examination Reports, or Licenses is subject to the workload and review timelines of respective government officers.
          </li>
          <li>
            <strong>Statutory Portal Downtime:</strong> LEGOMARK INDIA shall not be held liable for delays occasioned by technical glitches, maintenance downtimes, or server outages on government portals (e.g., MCA V3, GST portal, Income Tax portal).
          </li>
          <li>
            <strong>Resubmissions & Departmental Queries:</strong> If a government registrar issues a resubmission notice or query, turnaround time restarts according to statutory resubmission windows.
          </li>
        </ul>
      </section>

      {/* 7. No Guarantee of Government Approvals */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          7. No Guarantee of Discretionary Government Approvals
        </h2>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 space-y-2">
          <p className="font-semibold text-slate-900 flex items-center gap-1.5">
            <Gavel className="w-4 h-4 text-orange-600 shrink-0" />
            <span>Discretionary Statutory Authority Notice:</span>
          </p>
          <p className="leading-relaxed">
            While LEGOMARK INDIA applies rigorous legal diligence in drafting, checking, and filing applications, the final authority to approve company names, grant registrations, accept trademark applications, or issue licenses rests entirely with the designated government examiners and registrars. We do not and cannot guarantee government approvals where discretionary authority lies with statutory authorities.
          </p>
        </div>
      </section>

      {/* 8. Payment Terms & Payment Gateway */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          8. Payment Terms & Gateway Operations
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          All digital payments made via the website are processed securely using Razorpay, a PCI-DSS certified payment aggregator supporting UPI, Net Banking, Debit/Credit Cards, and Corporate Wallets. Services commence upon realization of agreed professional fees and submission of complete prerequisite documentation by the Client.
        </p>
      </section>

      {/* 9. Cancellation & Refund Reference */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          9. Cancellation & Refund Policy
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          Our cancellation and refund terms are governed by our dedicated <strong>Refund &amp; Cancellation Policy</strong>, which forms an integral part of these Terms. Please consult the Refund &amp; Cancellation Policy for detailed rules regarding pre-commencement cancellations, work in progress deductions, and non-refundable government fees.
        </p>
      </section>

      {/* 10. Intellectual Property Rights */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          10. Intellectual Property Rights
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          All intellectual property rights in the website design, text content, legal commentary, blog publications, corporate logos, graphics, software code, and trademarks (including &ldquo;LEGOMARK INDIA&rdquo; and the &ldquo;LM&rdquo; emblem) are the exclusive property of LEGOMARK INDIA. Unauthorized copying, scraping, reverse engineering, or commercial redistribution without prior written consent is strictly prohibited.
        </p>
      </section>

      {/* 11. Limitation of Liability */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          11. Limitation of Liability
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          To the maximum extent permitted by applicable Indian law:
        </p>
        <ul className="text-xs sm:text-sm text-slate-700 space-y-2 list-disc list-inside leading-relaxed pl-2">
          <li>
            LEGOMARK INDIA shall not be liable for any indirect, incidental, punitive, special, or consequential damages, loss of business revenue, or loss of goodwill.
          </li>
          <li>
            <strong>Liability Cap:</strong> In any event, the total aggregate liability of LEGOMARK INDIA arising out of or in connection with any service engagement shall be strictly limited to the actual professional consultancy fees received by us for that specific service.
          </li>
        </ul>
      </section>

      {/* 12. Governing Law & Jurisdiction */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          12. Governing Law & Dispute Jurisdiction
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          These Terms and all service engagements shall be governed by, construed, and enforced in accordance with the substantive laws of the <strong>Republic of India</strong>. Any dispute, claim, or controversy arising out of or relating to these Terms or our services shall be subject to the exclusive jurisdiction of the competent courts located in <strong>New Delhi, India</strong>.
        </p>
      </section>

      {/* 13. Contact & Notice Information */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          13. Notices & Contact Information
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          All formal legal notices, service queries, or communications under these Terms may be directed to our corporate office:
        </p>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 space-y-2">
          <p className="font-bold text-slate-900">{name}</p>
          <p><span className="text-slate-500">Address:</span> {address.fullAddress}</p>
          <p><span className="text-slate-500">Email:</span> <a href={`mailto:${contact.email}`} className="text-orange-600 font-medium">{contact.email}</a></p>
          <p><span className="text-slate-500">Mobile / WhatsApp:</span> {contact.mobile} | <span className="text-slate-500">Landline:</span> {contact.landline}</p>
          <p><span className="text-slate-500">Office Working Hours:</span> {contact.officeHours}</p>
        </div>
      </section>
    </LegalPageLayout>
  );
};
