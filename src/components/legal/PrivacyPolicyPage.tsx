import React from 'react';
import { LegalPageLayout, LegalPolicyType } from './LegalPageLayout';
import {
  ShieldCheck,
  Lock,
  FileCheck2,
  Database,
  UserCheck,
  CreditCard,
  Building,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { COMPANY_PROFILE } from '../../data/websiteData';

interface PrivacyPolicyPageProps {
  onNavigatePolicy: (policy: LegalPolicyType) => void;
  onNavigateHome?: () => void;
  onOpenConsultation?: (serviceName?: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  onNavigatePolicy,
  onNavigateHome,
  onOpenConsultation,
}) => {
  const { address, contact, name } = COMPANY_PROFILE;

  return (
    <LegalPageLayout
      activePolicy="privacy"
      title="Privacy Policy"
      subtitle="How LEGOMARK INDIA collects, processes, protects, and handles personal and statutory information in compliance with Indian privacy and data protection frameworks."
      lastUpdated="August 24, 2026"
      onNavigatePolicy={onNavigatePolicy}
      onNavigateHome={onNavigateHome}
      onOpenConsultation={onOpenConsultation}
    >
      {/* 1. Introduction */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Commitment to Data Privacy</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          1. Introduction & Regulatory Context
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          At <strong>{name}</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; &ldquo;us,&rdquo; or &ldquo;the Organization&rdquo;), we recognize that safeguarding the privacy, confidentiality, and integrity of your personal and corporate information is foundational to our professional relationship. This Privacy Policy sets out the basis on which personal data collected from you, or provided by you to us through our website (<strong>www.legomarkindia.com</strong> and associated subdomains) or through direct professional correspondence, is gathered, processed, stored, and protected.
        </p>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          This policy is drafted in alignment with Indian legal and data protection principles, including the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, the <strong>Information Technology Act, 2000</strong>, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and applicable statutory guidelines issued by regulatory bodies.
        </p>
      </section>

      {/* 2. Scope & Nature of Services */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          2. Nature of Professional Services & Scope
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          LEGOMARK INDIA is an independent corporate advisory and compliance platform providing professional consultancy, statutory filings preparation, tax advisory, company registration (Private Limited, LLP, Partnership, Section 8), GST filings, Income Tax return preparation, ROC compliance, Trademark/IP prosecution, FSSAI licensing, and corporate accounting services.
        </p>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 space-y-2">
          <p className="font-semibold text-slate-900 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
            <span>Important Private Consultancy Clarification:</span>
          </p>
          <p className="leading-relaxed">
            LEGOMARK INDIA is a private corporate advisory entity and is not a government department, statutory tribunal, or public authority. All filings prepared by us are submitted to respective statutory portals (such as the Ministry of Corporate Affairs - MCA, Goods and Services Tax Network - GSTN, Income Tax Department - ITD, and IP India) strictly upon client authorization and instruction.
          </p>
        </div>
      </section>

      {/* 3. Categories of Information We Collect */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          3. Categories of Information We Collect
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          To provide professional legal, tax, incorporation, and compliance services, we collect only such information as is reasonably necessary, proportionate, and directly relevant:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Card A */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <UserCheck className="w-4 h-4 text-orange-600" />
              <h4>A. Client Identification & Contact Data</h4>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Full legal name, designation, and company name</li>
              <li>Mobile / telephone numbers and WhatsApp contact</li>
              <li>Primary email address and billing email</li>
              <li>Communication address, city, state, and postal code</li>
            </ul>
          </div>

          {/* Card B */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <FileCheck2 className="w-4 h-4 text-orange-600" />
              <h4>B. Statutory Filing Documentation</h4>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>PAN (Permanent Account Number) & Aadhaar details for KYC</li>
              <li>Director Identification Number (DIN) & DSC metadata</li>
              <li>Proof of registered office address (Utility bills, NOC, rent deeds)</li>
              <li>Financial records, balance sheets, and invoices for ITR / GST</li>
            </ul>
          </div>

          {/* Card C */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <CreditCard className="w-4 h-4 text-orange-600" />
              <h4>C. Payment & Transaction Metadata</h4>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Transaction ID, Order Reference Number, and payment amount</li>
              <li>Payment mode (UPI, Net Banking, Card, Wallet)</li>
              <li>
                <strong className="text-slate-800">Card Data Security:</strong> All digital transactions are securely processed through Razorpay (PCI-DSS Level 1 compliant). <em>We do NOT store credit/debit card numbers, CVVs, or net banking passwords.</em>
              </li>
            </ul>
          </div>

          {/* Card D */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Database className="w-4 h-4 text-orange-600" />
              <h4>D. Technical & Log Telemetry</h4>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Internet Protocol (IP) address and browser user-agent</li>
              <li>Access timestamps and referral website headers</li>
              <li>Essential session cookies strictly for website navigation</li>
              <li>Zero intrusive ad tracking or unauthorized third-party telemetry</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Purpose & Lawful Basis of Processing */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          4. Lawful Purpose & Basis for Processing
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          In accordance with the DPDP Act 2023, personal data is processed solely for specified, lawful, and explicit purposes consented to by you or necessitated by statutory compliance:
        </p>

        <div className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Service Delivery & Execution:</strong> Verification of eligibility, preparation of statutory draft forms (SPICe+, Form TM-A, GST REG-01, ITR forms), and submission to government portals upon client authorization.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Client Communication & Support:</strong> Providing real-time updates regarding application progress, government queries, objection notices, compliance due dates, and tax filing milestones.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Invoicing, Accounting & Statutory Audit:</strong> Generating statutory tax invoices, maintaining accounting ledgers, and fulfilling audit obligations mandated under the Goods and Services Tax Act and Companies Act.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Security & Anti-Fraud Verification:</strong> Protecting clients against unauthorized filings, identity theft, and fraudulent transactions.
            </div>
          </div>
        </div>
      </section>

      {/* 5. Disclosure to Third Parties & Authorities */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          5. Third-Party Disclosures & Government Portals
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          We maintain strict confidentiality. Your personal information is disclosed only to authorized recipients under the following defined circumstances:
        </p>

        <ul className="text-xs sm:text-sm text-slate-700 space-y-2 list-disc list-inside leading-relaxed pl-2">
          <li>
            <strong>Statutory Authorities:</strong> Uploading required documents and declarations to official government portals (MCA, Income Tax, GSTN, Trademark Registry, FSSAI) as explicitly instructed by you for application processing.
          </li>
          <li>
            <strong>Payment Service Providers:</strong> Secure transmission of order references and billing tokens to Razorpay for transaction authorization and receipt generation.
          </li>
          <li>
            <strong>Certifying Authorities (CA):</strong> When you order Digital Signature Certificates (DSC), identity verification documents are transmitted to licensed Certifying Authorities under Controller of Certifying Authorities (CCA) regulations.
          </li>
          <li>
            <strong>Legal / Law Enforcement Mandates:</strong> Where required by valid statutory notices, court summons, or regulatory directives issued by Indian judicial or tax authorities.
          </li>
          <li>
            <strong className="text-slate-900">Strict Anti-Commercialization Guarantee:</strong> We do NOT sell, rent, lease, or trade your personal data or contact details to third-party telemarketers, lead aggregators, or unauthorized third parties.
          </li>
        </ul>
      </section>

      {/* 6. Data Security & Storage */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          6. Security Safeguards & Infrastructure
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          We implement comprehensive administrative, technical, and physical security measures compliant with Rule 8 of the IT (Reasonable Security Practices) Rules, 2011:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Lock className="w-3.5 h-3.5 text-orange-600" />
              <span>TLS Encryption</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              All communications and document transfers are encrypted using 256-bit TLS/SSL protocols.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
              <span>Access Control</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Role-based least-privilege access restricted exclusively to dedicated compliance officers.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Database className="w-3.5 h-3.5 text-orange-600" />
              <span>Secure Hosting</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Cloud servers hardened with regular vulnerability audits, DDoS mitigation, and firewall protection.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Data Retention */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          7. Data Retention & Erasure Policy
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          We retain your personal and entity information only for as long as necessary to fulfill the operational purposes for which it was collected, to provide ongoing annual corporate advisory, and to adhere to statutory retention mandates under Indian law:
        </p>
        <ul className="text-xs sm:text-sm text-slate-700 space-y-1.5 list-disc list-inside leading-relaxed pl-2">
          <li><strong>Taxation & Accounting Records:</strong> Retained for a minimum of 8 statutory assessment years in compliance with the Income Tax Act, 1961 and GST regulations.</li>
          <li><strong>Company Incorporation & ROC Filings:</strong> Retained for the active corporate life of the entity to assist with ongoing secretarial filings and director changes.</li>
          <li><strong>General Consultation Inquiries:</strong> Erased or anonymized within 24 months if no active service engagement is executed.</li>
        </ul>
      </section>

      {/* 8. Data Principal Rights */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          8. Your Rights as a Data Principal (DPDP Act 2023)
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          As a Data Principal under Indian data protection legislation, you enjoy specific legal entitlements regarding the processing of your personal data:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <strong className="text-slate-900 block font-bold">A. Right to Access & Summary</strong>
            <p className="text-slate-600 leading-relaxed">You may request a copy or summary of personal information held and processed by us.</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <strong className="text-slate-900 block font-bold">B. Right to Correction & Updating</strong>
            <p className="text-slate-600 leading-relaxed">You may request the prompt correction of incomplete, inaccurate, or outdated personal details.</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <strong className="text-slate-900 block font-bold">C. Right to Withdraw Consent</strong>
            <p className="text-slate-600 leading-relaxed">You may withdraw processing consent, subject to our statutory retention requirements for completed filings.</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <strong className="text-slate-900 block font-bold">D. Right to Grievance Redressal</strong>
            <p className="text-slate-600 leading-relaxed">You have the right to register concerns with our Grievance Desk or statutory data protection authorities.</p>
          </div>
        </div>
      </section>

      {/* 9. Cookies & Analytics */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          9. Cookies & Session Technologies
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          Our website utilizes standard session cookies necessary for system navigation, CSRF security verification, and page performance optimization. You can configure your browser settings to decline or purge cookies; however, certain administrative and inquiry submission features may be restricted.
        </p>
      </section>

      {/* 10. Grievance Officer & Contact Information */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          10. Grievance Officer & Redressal Mechanism
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          In accordance with the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023, the details of our Grievance & Compliance Desk are set out below:
        </p>

        <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
            <Building className="w-4 h-4" />
            <span>Grievance & Privacy Redressal Desk</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 pt-1">
            <div>
              <p className="text-slate-400 text-[11px]">Organization:</p>
              <p className="font-semibold text-white">{name}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Designation:</p>
              <p className="font-semibold text-white">Compliance & Grievance Officer</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Email:</p>
              <a href={`mailto:${contact.email}`} className="text-orange-400 hover:underline">
                {contact.email}
              </a>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Phone / Mobile:</p>
              <a href={`tel:${contact.mobileRaw}`} className="text-white hover:underline">
                {contact.mobile}
              </a>
            </div>
            <div className="sm:col-span-2">
              <p className="text-slate-400 text-[11px]">Registered Office Address:</p>
              <p className="text-white">{address.fullAddress}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-slate-400 text-[11px]">Official Working Hours:</p>
              <p className="text-slate-300">{contact.officeHours}</p>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            We endeavor to acknowledge privacy and data inquiries within 48 business hours and resolve complaints within statutory timelines.
          </p>
        </div>
      </section>

      {/* 11. Policy Modifications */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
          11. Updates to This Privacy Policy
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          We may modify this Privacy Policy periodically to reflect enhancements in our advisory operations, technological safeguards, or legislative amendments in Indian law. Revised terms become effective upon publication on this website with an updated &ldquo;Last Updated&rdquo; date. We encourage clients to review this page periodically.
        </p>
      </section>
    </LegalPageLayout>
  );
};
