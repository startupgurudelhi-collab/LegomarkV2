import { PackageTier, ServiceItem } from '../types/website';
import { parsePriceToNumber, formatINR } from './pricing';

/**
 * Curated package tiers for canonical services
 */
const CANONICAL_SERVICE_PACKAGES: Record<string, PackageTier[]> = {
  // 1. Private Limited Company Registration
  'private-limited-company-registration': [
    {
      id: 'pvt-ltd-basic',
      name: 'Basic Package',
      tagline: 'Core MCA incorporation essentials for 2 directors',
      price: '₹6,999',
      idealFor: 'Early-stage founders with ready KYC documents',
      features: [
        '2 Class 3 Digital Signature Certificates (DSC)',
        '2 Director Identification Numbers (DIN)',
        'SPICe+ Part A Name Reservation Filing',
        'Standard MOA & AOA Drafting',
        'Certificate of Incorporation (COI)',
        'Company PAN & TAN Allotment',
      ],
      ctaLabel: 'Choose Basic',
    },
    {
      id: 'pvt-ltd-standard',
      name: 'Standard Package',
      tagline: 'Incorporation paired with GST, MSME & bank setup',
      price: '₹11,999',
      popular: true,
      badge: 'Most Popular',
      idealFor: 'Startups launching commercial operations immediately',
      features: [
        'Everything in Basic Package',
        'GST Registration Filing & Approval',
        'MSME / Udyam Certificate Registration',
        'Corporate Bank Current Account Opening Kit',
        'First Board Resolutions & Share Certificates Kit',
        'EPFO & ESIC Registrations via AGILE-PRO-S',
      ],
      ctaLabel: 'Select Standard',
    },
    {
      id: 'pvt-ltd-premium',
      name: 'Premium Package',
      tagline: 'Incorporation + Trademark filing + 1st year secretarial setup',
      price: '₹19,999',
      badge: 'Comprehensive',
      idealFor: 'Funded ventures & high-growth businesses needing brand & ROC cover',
      features: [
        'Everything in Standard Package',
        '1 Trademark (™) Application Filing & Search',
        'First Auditor Appointment Documentation (ADT-1)',
        'Commencement of Business Certificate (INC-20A)',
        'Free 1st Year Annual ROC Compliance Review Session',
        'Dedicated Senior CS Account Manager',
      ],
      ctaLabel: 'Select Premium',
    },
  ],

  // 2. LLP Registration
  'llp-registration': [
    {
      id: 'llp-basic',
      name: 'Basic Package',
      tagline: 'Core LLP incorporation for 2 designated partners',
      price: '₹5,499',
      idealFor: 'Small partnerships & professional practices',
      features: [
        '2 Designated Partner Identification Numbers (DPIN)',
        '2 Class 3 Digital Signature Certificates (DSC)',
        'RUN-LLP Name Approval Application',
        'FiLLiP Incorporation Form Submission',
        'Certificate of Incorporation (LLPIN)',
        'LLP PAN & TAN Allotment',
      ],
      ctaLabel: 'Choose Basic',
    },
    {
      id: 'llp-standard',
      name: 'Standard Package',
      tagline: 'Incorporation + Custom LLP Agreement & Form 3 filing',
      price: '₹9,999',
      popular: true,
      badge: 'Most Popular',
      idealFor: 'Active consultancies & service firms',
      features: [
        'Everything in Basic Package',
        'Customized LLP Agreement Drafting with protective clauses',
        'Form 3 ROC Filing within 30 days',
        'MSME / Udyam Registration',
        'Bank Account Opening Resolution Kit',
      ],
      ctaLabel: 'Select Standard',
    },
    {
      id: 'llp-premium',
      name: 'Premium Package',
      tagline: 'Full LLP setup + GST + 1 Trademark filing',
      price: '₹16,999',
      badge: 'Complete Shield',
      idealFor: 'Operating businesses seeking multi-state presence & brand security',
      features: [
        'Everything in Standard Package',
        'GST Registration Certificate',
        '1 Trademark (™) Brand Name Application Filing',
        'Partner Capital Structuring Guidance',
        'Annual ROC Filing (Form 11 & Form 8) Roadmap',
      ],
      ctaLabel: 'Select Premium',
    },
  ],

  // 3. One Person Company (OPC)
  'one-person-company-registration': [
    {
      id: 'opc-basic',
      name: 'Basic Package',
      tagline: 'OPC incorporation for solo founder with 1 nominee',
      price: '₹5,999',
      idealFor: 'Individual entrepreneurs & solo innovators',
      features: [
        '1 Class 3 Digital Signature Certificate (DSC)',
        '1 Director Identification Number (DIN)',
        'SPICe+ Part A Name Reservation',
        'Nominee Consent (INC-3) & Charter Drafting',
        'Certificate of Incorporation (COI)',
        'PAN & TAN Allotment',
      ],
      ctaLabel: 'Choose Basic',
    },
    {
      id: 'opc-standard',
      name: 'Standard Package',
      tagline: 'OPC setup + GST & MSME Udyam registration',
      price: '₹9,999',
      popular: true,
      badge: 'Most Popular',
      idealFor: 'Solo founders ready for commercial transactions',
      features: [
        'Everything in Basic Package',
        'GST Registration Certificate',
        'MSME / Udyam Certificate',
        'Bank Account Opening Documentation',
        'First Board Meeting Minutes & Documentation',
      ],
      ctaLabel: 'Select Standard',
    },
    {
      id: 'opc-premium',
      name: 'Premium Package',
      tagline: 'OPC setup + Trademark application & post-incorporation filings',
      price: '₹16,499',
      badge: 'Full Protection',
      idealFor: 'Solo founders building a distinctive, scalable proprietary brand',
      features: [
        'Everything in Standard Package',
        '1 Trademark (™) Brand Name Application',
        'Auditor Appointment (ADT-1) Support',
        'Commencement of Business (INC-20A) Filing',
        'Dedicated Legal Advisory for Solo Founders',
      ],
      ctaLabel: 'Select Premium',
    },
  ],

  // 4. Partnership Registration
  'partnership-registration': [
    {
      id: 'partnership-basic',
      name: 'Basic Package',
      tagline: 'Tailored Partnership Deed drafting & execution guidance',
      price: '₹3,999',
      idealFor: 'Local businesses & co-founders',
      features: [
        'Custom Legal Drafting of Partnership Deed',
        'State-Specific Stamp Duty Calculation',
        'Notarization Coordination Guidance',
        'Application for Firm PAN Card',
      ],
      ctaLabel: 'Choose Basic',
    },
    {
      id: 'partnership-standard',
      name: 'Standard Package',
      tagline: 'Deed drafting + Registrar of Firms (ROF) application',
      price: '₹7,999',
      popular: true,
      badge: 'Recommended',
      idealFor: 'Partnerships requiring official government ROF registration',
      features: [
        'Everything in Basic Package',
        'Form 1 Preparation for Registrar of Firms (ROF)',
        'Submission with State Registrar of Firms',
        'Firm Current Bank Account Opening Kit',
        'MSME / Udyam Registration',
      ],
      ctaLabel: 'Select Standard',
    },
    {
      id: 'partnership-premium',
      name: 'Premium Package',
      tagline: 'Deed drafting + ROF registration + GST & Trademark',
      price: '₹14,999',
      badge: 'All-Inclusive',
      idealFor: 'Commercial trading & multi-partner enterprises',
      features: [
        'Everything in Standard Package',
        'GST Registration Certificate Filing',
        '1 Trademark (™) Brand Name Application',
        'Dispute Resolution & Partner Exit Clauses Kit',
        'Priority Senior Legal Counsel Support',
      ],
      ctaLabel: 'Select Premium',
    },
  ],

  // 5. Trademark Registration & Search
  'trademark-registration-search': [
    {
      id: 'tm-basic',
      name: 'Basic Package',
      tagline: 'Comprehensive search & single class TM filing',
      price: '₹2,499',
      idealFor: 'Individual creators & single brand owners',
      features: [
        'Comprehensive IP India Registry Trademark Search',
        'TM Class Classification Guidance (NICE Classification)',
        'Application Drafting (Form TM-A)',
        'Online E-Filing & Immediate Application Number',
        'Legal Authorization for ™ Symbol Usage',
      ],
      ctaLabel: 'Choose Basic',
    },
    {
      id: 'tm-standard',
      name: 'Standard Package',
      tagline: 'Search, filing & end-to-end status tracking',
      price: '₹4,999',
      popular: true,
      badge: 'Most Popular',
      idealFor: 'Startups & small businesses launching a brand',
      features: [
        'Everything in Basic Package',
        'Detailed Phonetic & Visual Similarity Search Report',
        'Formality Check Pass Reply Assistance',
        'Real-time Status Tracking & Trademark Journal Alerts',
        'Dedicated Trademark Attorney Consultation',
      ],
      ctaLabel: 'Select Standard',
    },
    {
      id: 'tm-premium',
      name: 'Premium Package',
      tagline: 'Filing + Legal Examination Report Reply cover',
      price: '₹8,999',
      badge: 'Total Brand Cover',
      idealFor: 'Established brands requiring protection against objections',
      features: [
        'Everything in Standard Package',
        'Section 9 & Section 11 Examination Report Reply Drafting',
        'Affidavit of Prior Usage Drafting with Evidence Review',
        'Hearing Strategy Advisory by Senior IP Advocate',
        'Final Registration Certificate Delivery (®)',
      ],
      ctaLabel: 'Select Premium',
    },
  ],

  // 6. Trademark Objection & Hearing
  'trademark-objection-hearing': [
    {
      id: 'tm-obj-basic',
      name: 'Basic Reply',
      tagline: 'Legal written reply to Examination Report',
      price: '₹3,499',
      idealFor: 'Objections under Section 9 (Absolute Grounds) or Section 11',
      features: [
        'Detailed Review of Registrar Examination Report',
        'Legal Drafting of Formal Reply under TM Act, 1999',
        'Case Law Citations & Distinctiveness Arguments',
        'Official Portal Submission within 30 Days',
      ],
      ctaLabel: 'Select Basic',
    },
    {
      id: 'tm-obj-standard',
      name: 'Standard Defense',
      tagline: 'Comprehensive reply + evidence affidavit compilation',
      price: '₹6,499',
      popular: true,
      badge: 'Recommended',
      idealFor: 'Brands with existing commercial usage & turnover evidence',
      features: [
        'Everything in Basic Reply',
        'Rule 25 User Affidavit Drafting with Notarization Guidance',
        'Invoices, Turnover & Marketing Evidence Compilation',
        'Tracking until Accepted & Advertised in TM Journal',
        'Senior IP Advocate Review',
      ],
      ctaLabel: 'Select Standard',
    },
    {
      id: 'tm-obj-premium',
      name: 'Hearing Representation',
      tagline: 'Show Cause Hearing appearance & advocacy',
      price: '₹11,999',
      badge: 'Complete Advocacy',
      idealFor: 'Matters scheduled for Show Cause Hearing before Trademark Officer',
      features: [
        'Comprehensive Hearing Case File & Written Submissions',
        'Oral Arguments Representation by Licensed IP Attorney',
        'Pre-Hearing Strategy Session with Client',
        'Post-Hearing Written Arguments & Order Follow-Up',
        'Dedicated Senior Trademark Counsel',
      ],
      ctaLabel: 'Select Hearing Package',
    },
  ],

  // 7. GST Registration & Filing
  'gst-registration-filing': [
    {
      id: 'gst-basic',
      name: 'Basic Registration',
      tagline: 'New GSTIN registration certificate issuance',
      price: '₹1,499',
      idealFor: 'New business entities crossing threshold or voluntary registrants',
      features: [
        'Document Verification & Jurisdiction Assessment',
        'GST REG-01 Application Preparation & Filing',
        'Clarification & Department Query Resolution',
        'ARN Generation & 15-Digit GSTIN Delivery',
      ],
      ctaLabel: 'Choose Basic',
    },
    {
      id: 'gst-standard',
      name: 'Quarterly Package',
      tagline: 'GST Registration + 3 months GSTR-1 & 3B return filing',
      price: '₹3,999',
      popular: true,
      badge: 'Most Popular',
      idealFor: 'Active businesses wanting smooth initial tax compliance',
      features: [
        'Everything in Basic Registration',
        '3 Months Monthly / Quarterly GSTR-1 & GSTR-3B Filings',
        'Input Tax Credit (ITC) 2B Reconciliation',
        'Sales & Purchase Register Scrutiny',
        'Tax Liability Assessment & Challan Generation',
      ],
      ctaLabel: 'Select Quarterly',
    },
    {
      id: 'gst-premium',
      name: 'Annual Retainer',
      tagline: 'GST Registration + 12 months filing + GSTR-9 annual return',
      price: '₹11,999',
      period: '/ year',
      badge: 'Complete Assurance',
      idealFor: 'Operating companies needing 100% outsourced GST compliance',
      features: [
        'Everything in Basic Registration',
        '12 Months GSTR-1 & GSTR-3B Return Filings',
        'GSTR-9 Annual Return Preparation & Filing',
        'Monthly ITC GSTR-2B Matching to Prevent Tax Leakage',
        'Departmental Notice Handling & Expert Tax Advisory',
      ],
      ctaLabel: 'Select Annual',
    },
  ],

  // 8. FSSAI Food License
  'fssai-food-license': [
    {
      id: 'fssai-basic',
      name: 'Basic Registration',
      tagline: 'For small food business operators (turnover < ₹12 Lakhs)',
      price: '₹1,999',
      idealFor: 'Cloud kitchens, petty food vendors, home bakers & retailers',
      features: [
        'FoSCoS Eligibility Check & Product Mapping',
        'Form A Application Filing on FoSCoS Portal',
        'Food Safety Management Plan (FSMS) Declaration',
        '14-Digit Digital FSSAI Registration Certificate Delivery',
      ],
      ctaLabel: 'Select Basic',
    },
    {
      id: 'fssai-standard',
      name: 'State License',
      tagline: 'For mid-size food units (turnover ₹12 Lakhs – ₹20 Crores)',
      price: '₹4,999',
      popular: true,
      badge: 'Most Popular',
      idealFor: 'Restaurants, caterers, food distributors & manufacturing units',
      features: [
        'Detailed Category & Machinery Scrutiny',
        'Form B State License Application Filing',
        'FSMS Plan & Technical Documentation Compilation',
        'Handling Food Safety Officer (FSO) Clarifications',
        '14-Digit State FSSAI License Delivery',
      ],
      ctaLabel: 'Select State License',
    },
    {
      id: 'fssai-premium',
      name: 'Central License',
      tagline: 'For large manufacturers, importers & multi-state chains',
      price: '₹11,999',
      badge: 'Enterprise Scope',
      idealFor: 'Importers, 100% EOUs, multi-location food brands & large plants',
      features: [
        'Form B Central License Application Preparation',
        'DGFT Import Export Code Integration & Product Authorization',
        'Water Test & Laboratory Certification Verification',
        'Comprehensive Regulatory Compliance Dossier',
        'Senior Food Regulatory Consultant Support',
      ],
      ctaLabel: 'Select Central License',
    },
  ],

  // 9. ROC Annual Filing
  'roc-annual-filing': [
    {
      id: 'roc-basic',
      name: 'Essential ROC',
      tagline: 'Annual financial & secretarial return filing for dormant / small Pvt Ltd',
      price: '₹4,999',
      idealFor: 'Small companies with low transaction volume',
      features: [
        'Form AOC-4 (Financial Statements Filing)',
        'Form MGT-7A (Abridged Annual Return Filing)',
        'Director DIR-3 KYC for 2 Directors',
        'Standard Secretarial Minutes Documentation',
      ],
      ctaLabel: 'Select Essential',
    },
    {
      id: 'roc-standard',
      name: 'Standard ROC & Secretarial',
      tagline: 'Complete annual ROC + Board resolutions + Registers maintenance',
      price: '₹9,999',
      popular: true,
      badge: 'Most Popular',
      idealFor: 'Active operating Private Limited Companies',
      features: [
        'Form AOC-4 & Form MGT-7 Annual Filing with MCA',
        'Preparation of Director’s Report & Annual General Meeting (AGM) Notice',
        'Statutory Registers Maintenance (Members, Directors, Charges)',
        'DIR-3 KYC for all Active Directors',
        'Auditor Appointment Compliance (ADT-1 review)',
      ],
      ctaLabel: 'Select Standard',
    },
    {
      id: 'roc-premium',
      name: 'Comprehensive Corporate Retainer',
      tagline: 'All ROC filings + DPT-3 + MSME-1 + quarterly board resolutions',
      price: '₹19,999',
      period: '/ year',
      badge: 'Full Retainer',
      idealFor: 'Growing companies requiring continuous corporate governance',
      features: [
        'Everything in Standard ROC Package',
        'Form DPT-3 (Return of Deposits / Loans) Filing',
        'Form MSME-1 (Half-Yearly Vendor Return) Filing',
        'Quarterly Board Meeting Minutes & Secretarial Records',
        'Statutory Audit Coordination & Senior CS Advisory',
      ],
      ctaLabel: 'Select Comprehensive',
    },
  ],

  // 10. Other Business Licenses & Registrations
  'other-business-licenses-registrations': [
    {
      id: 'lic-basic',
      name: 'Single Registration',
      tagline: 'Fast-track issuance of MSME Udyam or IEC',
      price: '₹1,499',
      idealFor: 'New ventures needing an immediate commercial identifier',
      features: [
        'MSME / Udyam Registration (Lifetime Validity) OR DGFT IEC',
        'Instant Application Submission & Verification',
        'Digital Certificate Handover',
        'Guidance on Government Concessions & Subsidies',
      ],
      ctaLabel: 'Select Single',
    },
    {
      id: 'lic-standard',
      name: 'Startup Launch Kit',
      tagline: 'MSME Udyam + DGFT Import Export Code (IEC)',
      price: '₹2,999',
      popular: true,
      badge: 'Best Value',
      idealFor: 'Businesses planning local and cross-border trade',
      features: [
        'Udyam MSME Certificate Registration',
        'DGFT Import Export Code (IEC) Issuance',
        'Shop & Establishment Act Advisory',
        'Current Bank Account Registration Support',
      ],
      ctaLabel: 'Select Launch Kit',
    },
    {
      id: 'lic-premium',
      name: 'Commercial Licensing Suite',
      tagline: 'MSME + IEC + Shop Act + Professional Tax registration',
      price: '₹6,999',
      badge: 'Complete Suite',
      idealFor: 'Offices, retail establishments & commercial ventures with staff',
      features: [
        'Udyam MSME Registration Certificate',
        'DGFT Import Export Code (IEC)',
        'Shop & Establishment (Gumasta) Registration',
        'Professional Tax (PT) Employer Registration',
        'Comprehensive Commercial Compliance Checklist',
      ],
      ctaLabel: 'Select Commercial Suite',
    },
  ],
};

/**
 * Generate sensible default 3-tier packages for any service
 * based on its starting price and feature list.
 */
function generateDynamicTiers(service: ServiceItem): PackageTier[] {
  const baseAmount = parsePriceToNumber(service.startingPrice) || 4999;
  const standardAmount = Math.round(baseAmount * 1.7 / 100) * 100 - 1; // e.g. 8499
  const premiumAmount = Math.round(baseAmount * 2.8 / 100) * 100 - 1; // e.g. 13999

  const baseFeatures =
    service.features && service.features.length > 0
      ? service.features.slice(0, 4)
      : ['Statutory Documentation Drafting', 'Government Portal Application Filing', 'Dedicated Advisory Support'];

  return [
    {
      id: `${service.slug}-basic`,
      name: 'Basic Package',
      tagline: `Essential ${service.title} filing and documentation`,
      price: formatINR(baseAmount),
      idealFor: 'Founders & small enterprises requiring core processing',
      features: [
        ...baseFeatures,
        'Application Status Tracking & Verification',
      ],
      ctaLabel: 'Choose Basic',
    },
    {
      id: `${service.slug}-standard`,
      name: 'Standard Package',
      tagline: `Comprehensive ${service.title} with expedited processing`,
      price: formatINR(standardAmount),
      popular: true,
      badge: 'Most Popular',
      idealFor: 'Operating businesses seeking complete compliance setup',
      features: [
        ...baseFeatures,
        'Expedited Legal Verification & Scrutiny',
        'Priority Portal Processing with Departmental Follow-up',
        'Dedicated CA / CS Senior Advisor Consultation',
      ],
      ctaLabel: 'Select Standard',
    },
    {
      id: `${service.slug}-premium`,
      name: 'Premium Package',
      tagline: `All-inclusive ${service.title} + post-registration support`,
      price: formatINR(premiumAmount),
      badge: 'All-Inclusive',
      idealFor: 'Enterprises needing complete regulatory cover & advisory',
      features: [
        ...baseFeatures,
        'Expedited Legal Verification & Scrutiny',
        'Comprehensive Statutory Compliance Roadmap',
        '1-on-1 Strategy & Advisory Session with Senior Counsel',
        'Priority Annual Compliance Review Support',
      ],
      ctaLabel: 'Select Premium',
    },
  ];
}

/**
 * Retrieves the package tiers for a specific service.
 * Respects existing explicitly configured packages on the service item or landingPage,
 * then checks canonical definitions, and finally falls back to dynamically scaled tiers.
 */
export function getServicePackages(service?: ServiceItem | null): PackageTier[] {
  if (!service) return [];

  // 1. Explicit packages on the service object
  if (service.packages && service.packages.length > 0) {
    return service.packages;
  }

  // 2. Explicit packages on landingPage
  if (service.landingPage?.packages && service.landingPage.packages.length > 0) {
    return service.landingPage.packages;
  }

  // 3. Canonical service packages by slug
  const canonical = CANONICAL_SERVICE_PACKAGES[service.slug];
  if (canonical && canonical.length > 0) {
    return canonical;
  }

  // 4. Canonical service packages by id
  const canonicalById = CANONICAL_SERVICE_PACKAGES[service.id];
  if (canonicalById && canonicalById.length > 0) {
    return canonicalById;
  }

  // 5. Dynamic fallback
  return generateDynamicTiers(service);
}
