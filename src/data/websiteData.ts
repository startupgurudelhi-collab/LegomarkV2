import {
  CompanyProfile,
  ServiceItem,
  ServiceCategoryMeta,
  PackageTier,
  MatrixRow,
  FAQItem,
} from '../types/website';

// ==================================================
// AUTHORITATIVE LEGOMARK INDIA COMPANY PROFILE
// ==================================================

export const COMPANY_PROFILE: CompanyProfile = {
  name: 'LEGOMARK INDIA',
  positioning: 'LEGAL, TAXATION & CORPORATE ADVISORY',
  tagline: 'Legal, Taxation & Corporate Advisory Services',
  address: {
    line1: 'D-561, Pocket 11, DDA Janta Flats',
    line2: 'Jasola',
    city: 'New Delhi',
    pincode: '110025',
    fullAddress: 'D-561, Pocket 11, DDA Janta Flats, Jasola, New Delhi – 110025',
  },
  contact: {
    mobile: '+91 75308 47878',
    mobileRaw: '+917530847878',
    landline: '011-45768289',
    landlineRaw: '01145768289',
    email: 'info@legomarkindia.com',
    websites: ['www.legomarkindia.com', 'www.legomark.com'],
    primaryWebsite: 'www.legomarkindia.com',
    officeHours: 'Monday to Sunday: 11:00 AM – 8:00 PM',
    officeHoursSchedule: {
      days: 'Monday to Sunday',
      timing: '11:00 AM – 8:00 PM',
    },
  },
  founder: {
    name: 'Nomaan Rizvi',
    designation: 'Founder & Managing Director',
    organization: 'LEGOMARK INDIA',
    description:
      'Nomaan Rizvi leads LEGOMARK INDIA with a focus on simplifying company registration, taxation, trademark protection and business compliance through transparent, technology-driven professional services.',
    coreAreas: [
      'Company Registration',
      'Taxation & Compliance',
      'Trademark Protection',
      'Business Licensing',
    ],
  },
};

// Centralized reference for backwards compatibility and ease of access
export const COMPANY_CONTACT = {
  name: COMPANY_PROFILE.name,
  positioning: COMPANY_PROFILE.positioning,
  tagline: COMPANY_PROFILE.tagline,
  phone: COMPANY_PROFILE.contact.mobile,
  mobile: COMPANY_PROFILE.contact.mobile,
  landline: COMPANY_PROFILE.contact.landline,
  email: COMPANY_PROFILE.contact.email,
  websites: COMPANY_PROFILE.contact.websites,
  primaryWebsite: COMPANY_PROFILE.contact.primaryWebsite,
  workingHours: COMPANY_PROFILE.contact.officeHours,
  registeredOffice: COMPANY_PROFILE.address.fullAddress,
  office: COMPANY_PROFILE.address.fullAddress,
  headquarters: COMPANY_PROFILE.address.fullAddress, // Deprecated alias for backwards compatibility
  address: COMPANY_PROFILE.address,
  founder: COMPANY_PROFILE.founder,
};

// Neutral advisory highlights (No invented statistics or artificial claims)
export const ADVISORY_PILLARS = [
  {
    title: 'Company Registration',
    desc: 'Structured legal incorporation for Pvt Ltd, LLP, Partnerships & NGOs',
  },
  {
    title: 'Taxation & Filing',
    desc: 'GST registrations, periodic returns, refunds & Income Tax management',
  },
  {
    title: 'Trademark Protection',
    desc: 'Brand name, logo registration and comprehensive IP protection',
  },
  {
    title: 'Business Compliance',
    desc: 'ROC annual filing, statutory compliance & corporate secretarial support',
  },
];

export const SERVICE_CATEGORIES: ServiceCategoryMeta[] = [
  {
    id: 'company-registration',
    name: 'Company Registration',
    shortLabel: 'Company Reg.',
    count: '4 Services',
    iconName: 'Building2',
    description: 'Corporate incorporation structure for startups and growing enterprises.',
  },
  {
    id: 'taxation-gst',
    name: 'GST & Taxation',
    shortLabel: 'Tax & GST',
    count: '5 Services',
    iconName: 'Receipt',
    description: 'Direct & indirect taxation registrations, returns, reconciliations and audits.',
  },
  {
    id: 'trademark-ip',
    name: 'Trademark & IP',
    shortLabel: 'Trademark & IP',
    count: '2 Services',
    iconName: 'Sparkles',
    description: 'Brand name, logo, slogan protection, registry clearance and objection replies.',
  },
  {
    id: 'compliance-roc',
    name: 'ROC & Annual Compliance',
    shortLabel: 'Compliance',
    count: '2 Services',
    iconName: 'ShieldCheck',
    description: 'Statutory MCA filings, annual financial returns, director KYC and AGM filings.',
  },
  {
    id: 'licenses-registrations',
    name: 'Licenses & Registrations',
    shortLabel: 'Licenses',
    count: '2 Services',
    iconName: 'Award',
    description: 'FSSAI food licensing, MSME / Udyam registration, IEC and commercial permits.',
  },
  {
    id: 'advisory-secretarial',
    name: 'Advisory & Secretarial',
    shortLabel: 'Advisory & CS',
    count: '1 Service',
    iconName: 'Briefcase',
    description: 'Corporate secretarial guidance, structural governance, and business advisory.',
  },
];

export const SERVICES: ServiceItem[] = [
  // ==================================================
  // 1. Company Registration (4 Canonical Services)
  // ==================================================
  {
    id: 'pvt-ltd',
    slug: 'private-limited-company-registration',
    category: 'company-registration',
    title: 'Private Limited Company Registration',
    shortDesc: 'Corporate incorporation structure for startups and growing enterprises requiring limited liability.',
    fullDesc: 'End-to-end SPICe+ MCA incorporation including Digital Signature Certificates (DSC), Director Identification Numbers (DIN), name reservation, MOA/AOA drafting, Certificate of Incorporation (COI), PAN, TAN, and statutory setup.',
    popular: true,
    timeline: 'Standard MCA Processing',
    startingPrice: '₹6,999',
    pricingType: 'fixed',
    governmentFeeNote: '+ Govt. Stamp Duty as per State',
    features: [
      'Digital Signature Certificates (DSC)',
      'Director Identification Numbers (DIN)',
      'SPICe+ Part A Name Reservation',
      'MOA & AOA Drafting',
      'Certificate of Incorporation (COI)',
      'Company PAN & TAN Allotment',
    ],
    iconName: 'Building2',
    badge: 'Popular',
    aliases: ['Private Limited Company', 'Pvt Ltd Registration', 'Company Registration'],
    landingPage: {
      headline: 'Incorporate your Private Limited Company with complete MCA & ROC compliance.',
      description: 'Get your Private Limited Company incorporated seamlessly with professional assistance from name reservation through Certificate of Incorporation issuance.',
      overview: 'A Private Limited Company is the gold standard corporate legal entity in India for startups, growing enterprises, and businesses seeking institutional equity funding. Regulated under the Companies Act, 2013 by the Ministry of Corporate Affairs (MCA), it provides an uncompromised corporate veil, separate legal identity, and perpetual succession.',
      benefits: [
        'Distinct Legal Entity & Limited Liability Protection for Founders',
        'High Credibility with Banks, Vendors, Clients & Venture Investors',
        'Seamless Equity Capital Raising & ESOP Pool Structuring',
        'Perpetual Succession Independent of Individual Directors or Shareholders',
      ],
      deliverables: [
        '2 Class 3 Digital Signature Certificates (DSC) with encryption',
        '2 Director Identification Numbers (DIN / DPIN) from MCA',
        'SPICe+ Part A Name Reservation Filing & Approval',
        'Drafting of Memorandum of Association (MOA) & Articles of Association (AOA)',
        'Certificate of Incorporation (COI) issued by Central Registration Centre',
        'Company PAN, TAN & EPFO/ESIC Registrations via AGILE-PRO-S',
        'First Board Resolution & Corporate Bank Account Opening Kit',
      ],
      documents: [
        'PAN Card copy of all proposed directors & shareholders (Mandatory)',
        'Identity Proof (Passport, Voter ID, or Driving License)',
        'Address Proof of directors (Bank Statement, Electricity or Mobile Bill < 2 months old)',
        'Passport-size digital photographs of all directors',
        'Proof of Registered Office (Electricity Bill, Water Bill, or Gas Bill)',
        'NOC from property owner along with Rent Agreement (if rented premises)',
      ],
      process: [
        {
          step: '01',
          title: 'Consultation & Requirement Review',
          description: 'Evaluate business objectives, state of registration, director credentials, authorized capital, and shareholding ratio.',
        },
        {
          step: '02',
          title: 'DSC Issuance & Name Approval',
          description: 'Procure Class 3 Digital Signatures and submit SPICe+ Part A for unique corporate name reservation with the MCA.',
        },
        {
          step: '03',
          title: 'Legal Drafting & SPICe+ Part B Filing',
          description: 'Draft e-MOA, e-AOA, statutory declarations (INC-9), and file consolidated SPICe+ Part B application.',
        },
        {
          step: '04',
          title: 'CRC Scrutiny & COI Issuance',
          description: 'Central Registration Centre examines the application and issues the official Certificate of Incorporation.',
        },
        {
          step: '05',
          title: 'Post-Incorporation Compliance Setup',
          description: 'Deliver corporate PAN, TAN, certified charter documents, and guide initial INC-20A bank account filing.',
        },
      ],
      faqs: [
        {
          question: 'How many directors and shareholders are required to incorporate?',
          answer: 'A minimum of 2 directors and 2 shareholders are required (a person can be both a director and shareholder). At least one director must be a resident in India.',
        },
        {
          question: 'Is there a minimum paid-up capital required for incorporation?',
          answer: 'No. The Companies Act does not mandate a minimum paid-up capital. You can start with nominal authorized capital (e.g., ₹1,00,000) and nominal paid-up capital of any amount.',
        },
        {
          question: 'Can a residential address be used as the registered office?',
          answer: 'Yes. A residential property owned by a director or rented can serve as the registered office, provided a utility bill (< 2 months old) and owner NOC are submitted.',
        },
        {
          question: 'What is the processing timeline for MCA incorporation?',
          answer: 'Once all KYC and DSC signatures are completed, standard CRC approval typically takes 3 to 7 working days, subject to government MCA portal turnaround.',
        },
      ],
    },
  },
  {
    id: 'llp-registration',
    slug: 'llp-registration',
    category: 'company-registration',
    title: 'LLP Registration',
    shortDesc: 'Limited Liability Partnership structure offering operational flexibility with limited liability protection.',
    fullDesc: 'LLP incorporation via FiLLiP with the Ministry of Corporate Affairs, tailored LLP Agreement drafting, Form 3 filing, Designated Partner DPINs, and partner onboarding.',
    popular: false,
    timeline: 'Standard MCA Processing',
    startingPrice: '₹5,499',
    pricingType: 'fixed',
    governmentFeeNote: '+ State Stamp Duty on LLP Agreement',
    features: [
      'Designated Partner Identification Numbers (DPIN)',
      'Class 3 Digital Signatures',
      'RUN-LLP Name Approval',
      'LLP Agreement Drafting & Form 3 Filing',
      'PAN & TAN for LLP',
    ],
    iconName: 'Scale',
    aliases: ['Limited Liability Partnership', 'LLP Formation'],
    landingPage: {
      headline: 'Form a Limited Liability Partnership with customized agreement drafting & MCA registration.',
      description: 'Establish your LLP with professional assistance from name approval through FiLLiP incorporation and Form 3 LLP Agreement filing.',
      overview: 'A Limited Liability Partnership (LLP) combines the organizational flexibility and internal tax advantages of a traditional partnership with the limited liability protections of a corporate entity. Governed by the LLP Act, 2008, it is an ideal corporate vehicle for professional service firms, consultancies, and family businesses.',
      benefits: [
        'Limited Liability Shield for all Designated Partners against Business Debts',
        'Lower Statutory Compliance Overhead Compared to Private Limited Companies',
        'No Mandatory Statutory Audit if Turnover is Below ₹40 Lakhs',
        'Operational Freedom Governed Directly by the Custom LLP Agreement',
      ],
      deliverables: [
        '2 Designated Partner Identification Numbers (DPIN)',
        '2 Class 3 Digital Signature Certificates (DSC)',
        'RUN-LLP Name Reservation Application Filing',
        'FiLLiP Incorporation Form Submission with ROC',
        'Certificate of Incorporation (COI) with LLPIN',
        'Customized LLP Agreement Drafting & Form 3 ROC Filing',
        'LLP PAN & TAN Allotment',
      ],
      documents: [
        'PAN Card of all designated partners (Mandatory)',
        'Identity Proof (Aadhaar Card, Passport, or Voter ID)',
        'Address Proof (Bank Statement or Utility Bill not older than 2 months)',
        'Passport-size photographs of all designated partners',
        'Registered office utility bill (Electricity or Water bill)',
        'NOC from property owner & Rent Agreement (if rented)',
      ],
      process: [
        {
          step: '01',
          title: 'Partner KYC & DSC Procurement',
          description: 'Verify partner KYC documentation and issue Class 3 Digital Signature Certificates.',
        },
        {
          step: '02',
          title: 'LLP Name Reservation',
          description: 'Submit RUN-LLP application on MCA portal to reserve unique partnership name.',
        },
        {
          step: '03',
          title: 'FiLLiP Incorporation Filing',
          description: 'Submit FiLLiP form with ROC along with partner consents, subscriber sheet, and office proof.',
        },
        {
          step: '04',
          title: 'Certificate of Incorporation Issuance',
          description: 'Registrar of Companies scrutinizes filings and issues Certificate of Incorporation with LLPIN.',
        },
        {
          step: '05',
          title: 'LLP Agreement Execution & Form 3',
          description: 'Draft customized LLP Agreement, execute on state stamp paper, and file Form 3 within 30 days.',
        },
      ],
      faqs: [
        {
          question: 'What is the minimum number of partners required for an LLP?',
          answer: 'A minimum of 2 designated partners is required. At least one designated partner must be a resident of India. There is no upper limit on the maximum number of partners.',
        },
        {
          question: 'When is an audit mandatory for an LLP?',
          answer: 'An LLP is exempt from mandatory audit unless its annual turnover exceeds ₹40 Lakhs or total partner capital contribution exceeds ₹25 Lakhs in a financial year.',
        },
        {
          question: 'Why is Form 3 filing mandatory after incorporation?',
          answer: 'Under the LLP Act, every LLP must execute its LLP Agreement on appropriate state stamp paper and file Form 3 with the ROC within 30 days of receiving the Certificate of Incorporation.',
        },
      ],
    },
  },
  {
    id: 'partnership-registration',
    slug: 'partnership-registration',
    category: 'company-registration',
    title: 'Partnership Registration',
    shortDesc: 'Partnership structure with customized Partnership Deed drafting and Registrar of Firms (ROF) filing.',
    fullDesc: 'Legally compliant partnership deed preparation, notarization guidance, stamp duty advisory, and ROF application for co-founders and traditional enterprises.',
    popular: false,
    timeline: '3 to 5 Working Days',
    startingPrice: '₹3,999',
    pricingType: 'fixed',
    features: [
      'Customized Partnership Deed Drafting',
      'Notarization & Stamp Duty Assistance',
      'PAN Card Application for Firm',
      'Registrar of Firms (ROF) Application Support',
    ],
    iconName: 'Users',
    aliases: ['Partnership Firm Registration', 'Partnership Deed'],
    landingPage: {
      headline: 'Form your Partnership Firm with custom deed drafting & Registrar of Firms (ROF) filing.',
      description: 'Establish your partnership firm with airtight legal clauses governing profit sharing, capital contribution, and banking authority.',
      overview: 'A Partnership Firm under the Indian Partnership Act, 1932 is a time-tested business structure for co-founders operating local or traditional commercial enterprises. LEGOMARK drafts tailored, legally airtight partnership deeds that clearly define profit-sharing ratios, capital contributions, dispute settlement mechanisms, and assists with Registrar of Firms (ROF) registration.',
      benefits: [
        'Quick Setup with Minimal Initial Procedural Documentation',
        'Complete Flexibility in Internal Management & Decision-Making',
        'Customizable Profit, Loss & Capital Contribution Ratios',
        'Ability to Register with ROF for Full Legal Enforceability of Contracts',
      ],
      deliverables: [
        'Custom Legal Drafting of Partnership Deed with Protective Clauses',
        'State-Specific Stamp Duty & Non-Judicial Stamp Paper Advisory',
        'Notarization Coordination & Attestation Support',
        'Application for Firm PAN Card with Income Tax Department',
        'Form 1 Application & Documentation for Registrar of Firms (ROF)',
      ],
      documents: [
        'PAN Card copies of all partners (Mandatory)',
        'Identity Proof (Aadhaar, Passport, or Voter ID) of all partners',
        'Address proof of all partners (Bank statement / Utility bill)',
        'Proof of principal place of business (Electricity Bill / Rent Agreement)',
        'No Objection Certificate (NOC) from property owner',
      ],
      process: [
        {
          step: '01',
          title: 'Requirement Gathering & Terms Formulation',
          description: 'Collate partner details, capital allocation, profit ratios, banking mandates, and business objectives.',
        },
        {
          step: '02',
          title: 'Custom Partnership Deed Drafting',
          description: 'Draft comprehensive partnership covenants, retirement, dispute resolution, and operational clauses.',
        },
        {
          step: '03',
          title: 'Execution & Stamp Duty Stamping',
          description: 'Execute deed on state stamp paper with signatures of all partners and notary attestation.',
        },
        {
          step: '04',
          title: 'Firm PAN & Bank Account Kit',
          description: 'Apply for Firm PAN card and compile documentation kit for current account opening.',
        },
        {
          step: '05',
          title: 'Registrar of Firms (ROF) Submission',
          description: 'Submit Form 1 with supporting certified deed to the local Registrar of Firms for formal registration.',
        },
      ],
      faqs: [
        {
          question: 'Is registration with Registrar of Firms (ROF) mandatory for partnerships?',
          answer: 'While an unregistered partnership is legally valid, registration with the ROF is strongly recommended because an unregistered firm cannot file civil suits against third parties or other partners in court.',
        },
        {
          question: 'What is the maximum number of partners allowed?',
          answer: 'Under the Companies (Miscellaneous) Rules, 2014, a partnership firm can have a maximum of 50 partners (with a minimum of 2 partners).',
        },
      ],
    },
  },
  {
    id: 'section-8-ngo',
    slug: 'section-8-ngo-registration',
    category: 'company-registration',
    title: 'Section 8 / NGO Registration',
    shortDesc: 'Non-profit organization formation with Central Government license under the Companies Act.',
    fullDesc: 'Incorporation of non-profit entities for promoting education, charity, social welfare, arts, and sciences with central MCA license.',
    popular: false,
    timeline: 'Standard MCA Processing',
    startingPrice: '₹11,999',
    pricingType: 'fixed',
    features: [
      'Section 8 License from Central Govt.',
      'Specialized MOA/AOA for Non-Profit Objectives',
      'Directors DIN & DSC Setup',
      '12A & 80G Filing Advisory',
    ],
    iconName: 'HeartHandshake',
    badge: 'Non-Profit',
    aliases: ['Section 8 NGO', 'Non-Profit Organization', 'Trust / NGO Registration'],
    landingPage: {
      headline: 'Incorporate a Section 8 Non-Profit Company with Central MCA license.',
      description: 'Establish a credible charitable entity with Central Government approval, tailored non-profit charter documents, and tax exemption advisory.',
      overview: 'A Section 8 Company is established under the Companies Act, 2013 for promoting commerce, art, science, sports, education, research, social welfare, religion, charity, or protection of the environment. Profits are applied solely toward promoting its charitable objectives, with no dividends paid to members.',
      benefits: [
        'Highest Institutional Credibility for Domestic Grants & Corporate CSR Funding',
        'Limited Liability Shield for Promoters, Trustees & Governing Council Members',
        'Statutory Exemption from Using "Limited" or "Private Limited" in Corporate Title',
        'Eligibility for 12A & 80G Tax Exemptions and FCRA Foreign Contribution Registration',
      ],
      deliverables: [
        '2 Class 3 Digital Signatures & Director Identification Numbers (DIN)',
        'Section 8 License (Form INC-12) from the Central Government / CRC',
        'Specialized Non-Profit MOA & AOA with Statutory Charitable Clauses',
        'Certificate of Incorporation (COI) issued by MCA',
        'Corporate PAN, TAN & 12A/80G Tax Exemption Roadmapping',
      ],
      documents: [
        'PAN Card and Identity Proof of proposed directors & members',
        'Address Proof of directors (Bank Statement/Utility Bill < 2 months)',
        'Passport-size photographs of all directors',
        'Projected 3-Year Income & Expenditure Budget with Charitable Plan',
        'Proof of Registered Office Address with Owner NOC and Utility Bill',
      ],
      process: [
        {
          step: '01',
          title: 'Charitable Mission Review & KYC',
          description: 'Define specific non-profit objects, governing body members, and issue Class 3 DSCs.',
        },
        {
          step: '02',
          title: 'Name Reservation (SPICe+ Part A)',
          description: 'Apply for suitable NGO title reflecting Foundation, Association, Society, or Forum.',
        },
        {
          step: '03',
          title: 'Section 8 License Application (SPICe+ Part B)',
          description: 'Submit specialized non-profit MOA/AOA, 3-year projected financial budget, and mission agenda.',
        },
        {
          step: '04',
          title: 'Scrutiny & Central License Grant',
          description: 'Central Registration Centre evaluates public interest objectives and grants non-profit license.',
        },
        {
          step: '05',
          title: 'COI Issuance & Tax Exemption Setup',
          description: 'Receive Certificate of Incorporation, PAN, TAN, and initiate 12A & 80G application roadmap.',
        },
      ],
      faqs: [
        {
          question: 'What is the main advantage of a Section 8 Company over a Trust or Society?',
          answer: 'Section 8 companies offer nationwide legal validity, rigorous governance transparency, higher credibility with CSR committees and global donors, and seamless succession.',
        },
        {
          question: 'Can directors draw salaries in a Section 8 Company?',
          answer: 'Directors cannot receive dividends or share in profits. However, reasonable remuneration for actual administrative services rendered may be drawn as permitted by law.',
        },
      ],
    },
  },

  // ==================================================
  // 2. GST & Taxation (5 Canonical Services)
  // ==================================================
  {
    id: 'gst-registration',
    slug: 'gst-registration',
    category: 'taxation-gst',
    title: 'GST Registration',
    shortDesc: 'Goods and Services Tax (GST) registration for businesses, traders, manufacturers, and service providers.',
    fullDesc: 'Application for GSTIN issuance with accurate business activity selection, HSN/SAC code mapping, and document verification on the GST portal.',
    popular: true,
    timeline: '3 to 5 Working Days',
    startingPrice: '₹1,499',
    pricingType: 'fixed',
    features: [
      'Application for GSTIN Issuance',
      'HSN / SAC Code Mapping',
      'Authorized Signatory Documentation',
      'Portal Verification & Certificate Delivery',
    ],
    iconName: 'ReceiptText',
    badge: 'Essential',
    aliases: ['New GST Registration', 'GSTIN Application'],
    landingPage: {
      headline: 'Get your GST registration handled correctly with complete portal verification.',
      description: 'Get your GSTIN issued quickly with accurate business activity classification, HSN/SAC code mapping, and Aadhaar authentication support.',
      overview: 'Goods and Services Tax (GST) registration is mandatory for businesses crossing the statutory aggregate turnover threshold (₹20/40 Lakhs for goods, ₹20 Lakhs for services), businesses engaged in inter-state supply, and e-commerce sellers. LEGOMARK ensures accurate classification under HSN/SAC codes, jurisdiction selection, and prompt GSTIN issuance.',
      benefits: [
        '100% Statutory Compliance with Central & State GST Acts',
        'Legal Authorization to Collect GST & Pass on Input Tax Credit (ITC)',
        'Seamless Inter-State Trading & E-Commerce Platform Onboarding',
        'Enhanced Commercial Credibility with Corporate Clients & Vendors',
      ],
      deliverables: [
        'Preparation & Online Filing of Form GST REG-01',
        'HSN (Goods) & SAC (Services) Classification Mapping',
        'Authorized Signatory Aadhaar Authentication Assistance',
        'Professional Response to Departmental Clarifications (Form GST REG-03)',
        'Official 3-Page GST Registration Certificate (Form GST REG-06)',
      ],
      documents: [
        'PAN Card of Business / Proprietor / Directors / Partners (Mandatory)',
        'Aadhaar Card and Passport Photos of Promoters & Authorized Signatory',
        'Proof of Business Premises (Electricity Bill, Property Tax Receipt)',
        'Rent Agreement & Landlord NOC (for rented premises)',
        'Bank Account Proof (Cancelled Cheque or Bank Statement with IFSC)',
        'Constitutional Documents (COI/MOA for Companies, Deed for Partnerships)',
      ],
      process: [
        {
          step: '01',
          title: 'Classification & Document Review',
          description: 'Determine business model, tax jurisdiction, and verify business premises proof.',
        },
        {
          step: '02',
          title: 'Application Preparation (REG-01)',
          description: 'Draft GST REG-01 with accurate HSN/SAC mappings and upload certified attachments.',
        },
        {
          step: '03',
          title: 'Aadhaar Biometric / OTP Authentication',
          description: 'Facilitate Aadhaar OTP verification for promoter and authorized signatory.',
        },
        {
          step: '04',
          title: 'Departmental Scrutiny & ARN Tracking',
          description: 'Monitor Application Reference Number (ARN) and respond promptly to departmental queries.',
        },
        {
          step: '05',
          title: 'GSTIN Issuance & Certificate Handover',
          description: 'Download Form GST REG-06 containing GSTIN and delivery of active credentials.',
        },
      ],
      faqs: [
        {
          question: 'Who is legally required to obtain GST registration?',
          answer: 'Businesses with aggregate annual turnover exceeding ₹40 Lakhs (for goods in normal states) or ₹20 Lakhs (for services), e-commerce sellers, and entities making inter-state supplies.',
        },
        {
          question: 'Can a startup register for GST voluntarily?',
          answer: 'Yes. Any business entity can register voluntarily to claim Input Tax Credit on capital goods/expenses and issue B2B tax invoices.',
        },
        {
          question: 'What is the turnaround time for receiving a GST number?',
          answer: 'Standard Aadhaar-authenticated applications are typically processed within 3 to 7 working days, unless flagged for departmental inspection.',
        },
      ],
    },
  },
  {
    id: 'gst-filing',
    slug: 'gst-return-filing',
    category: 'taxation-gst',
    title: 'GST Return Filing',
    shortDesc: 'Periodic GST compliance including monthly or quarterly GSTR-1, GSTR-3B filings, and ITC reconciliation.',
    fullDesc: 'Comprehensive return preparation with sales/purchase ledger reconciliation, Input Tax Credit (GSTR-2B) verification, and punctual return submissions.',
    popular: true,
    timeline: 'Monthly / Quarterly',
    startingPrice: '₹1,999 / mo',
    pricingType: 'recurring',
    features: [
      'GSTR-1 Outward Supplies Filing',
      'GSTR-3B Monthly Tax Computation',
      'Input Tax Credit (ITC) 2B Reconciliation',
      'Annual GSTR-9 Return Advisory',
    ],
    iconName: 'FileCheck',
    aliases: ['GST Return Filing', 'GSTR-1', 'GSTR-3B', 'GST Filing'],
    landingPage: {
      headline: 'Accurate monthly & quarterly GST return filing with automated ITC reconciliation.',
      description: 'Avoid late fees and maximize Input Tax Credit with timely GSTR-1 and GSTR-3B filings managed by tax professionals.',
      overview: 'Regular GST return filing is mandatory for all active GSTIN holders to maintain statutory compliance, avoid compounding late fees (up to ₹50/day), prevent GSTIN suspension, and ensure smooth Input Tax Credit (ITC) flow for your B2B customers. LEGOMARK performs rigorous GSTR-2B matching before every filing.',
      benefits: [
        'Zero Late Fees & Complete Protection against GSTIN Suspension',
        'Accurate GSTR-2B Input Tax Credit Matching to Prevent Tax Leakage',
        'Seamless B2B Relationships with Buyers Claiming Full Tax Credit',
        'Audit-Ready Financial Records for Annual Return (GSTR-9) Filing',
      ],
      deliverables: [
        'Monthly or Quarterly GSTR-1 Outward Supplies Filing',
        'Monthly GSTR-3B Summary Return & Tax Computation',
        'GSTR-2B Input Tax Credit (ITC) Invoice Reconciliation',
        'PMT-06 Challan Generation for Online Tax Payment',
        'Filing Acknowledgment Receipts & Annual Summary Reports',
      ],
      documents: [
        'Monthly Sales Registers and Tax Invoices issued to clients',
        'Purchase Invoices and Debit/Credit Notes from vendors',
        'Bank statements showing tax payments and customer receipts',
        'GST portal login credentials or OTP authorization',
      ],
      process: [
        {
          step: '01',
          title: 'Monthly Ledger Data Collection',
          description: 'Receive sales and purchase registers by the 5th-7th of every month.',
        },
        {
          step: '02',
          title: 'GSTR-2B Inward Invoice Reconciliation',
          description: 'Match inward supplier invoices against Government GSTR-2B to optimize ITC claim.',
        },
        {
          step: '03',
          title: 'GSTR-1 Return Preparation & Upload',
          description: 'Upload invoice-level B2B sales and summary B2C outward supply schedules.',
        },
        {
          step: '04',
          title: 'Tax Computation & Challan Creation',
          description: 'Offset ITC against output tax liability and generate PMT-06 challan if tax is payable.',
        },
        {
          step: '05',
          title: 'GSTR-3B Submission & Ack Generation',
          description: 'Submit GSTR-3B via EVC/DSC and deliver signed filing acknowledgment.',
        },
      ],
      faqs: [
        {
          question: 'Is GST return filing mandatory if there were zero transactions in a month?',
          answer: 'Yes. Filing a "Nil Return" is legally mandatory every single period. Failure to file attracts compounding daily late fees.',
        },
        {
          question: 'What is the penalty for late filing of GST returns?',
          answer: 'Late fees are ₹50 per day (₹20/day for Nil returns) plus 18% per annum interest on any unpaid net tax liability.',
        },
      ],
    },
  },
  {
    id: 'gst-refund',
    slug: 'gst-refund',
    category: 'taxation-gst',
    title: 'GST Refund',
    shortDesc: 'Processing and filing of GST refund applications for exports and inverted duty structures.',
    fullDesc: 'Filing RFD-01 for zero-rated supplies, inverted duty structure, and accumulated unutilized ITC with complete documentation and status tracking.',
    popular: false,
    timeline: 'Standard Departmental Processing',
    startingPrice: '₹4,499',
    pricingType: 'fixed',
    features: [
      'RFD-01 Refund Application Filing',
      'Inverted Duty Formula Computation',
      'Export Invoices Ledger Mapping',
      'Departmental Communication Support',
    ],
    iconName: 'BadgePercent',
    aliases: ['GST Refund Processing', 'RFD-01 Application'],
    landingPage: {
      headline: 'Expedite your GST refund claims under export zero-rating & inverted duty structure.',
      description: 'Unlock accumulated working capital with precision Form RFD-01 filings, statutory formula computations, and departmental representation.',
      overview: 'Exporters, SEZ suppliers, and businesses operating under an inverted duty structure (where tax on raw materials/inputs is higher than output sales) often accumulate substantial unutilized Input Tax Credit. LEGOMARK handles calculation, statement preparation, and Form RFD-01 submission on the GST portal.',
      benefits: [
        'Unlocks Blocked Working Capital & Significantly Improves Cash Flow',
        'Compliant Statutory Refund Computation under CGST Rules 89 & 96',
        'Professional Response to Deficiency Memos & Departmental Notices',
        'Direct Liaison with Jurisdictional GST Refund Sanctioning Officers',
      ],
      deliverables: [
        'Form RFD-01 Application Preparation & E-Filing on GST Portal',
        'Statement 1, Statement 2, or Statement 3 Calculation Annexures',
        'Reconciliation of Shipping Bills with ICEGATE & GSTR-1/3B Records',
        'Tracking for RFD-02 Acknowledgment & RFD-04 Provisional Sanction',
        'Drafting Written Responses to RFD-03 Deficiency Memos if issued',
      ],
      documents: [
        'GSTR-1, GSTR-3B & GSTR-2B data for the relevant refund period',
        'Export Invoices, Shipping Bills / Bills of Export',
        'Bank Realization Certificates (BRC) / FIRCs for service exports',
        'Purchase Invoices supporting the unutilized ITC claim',
        'Valid Letter of Undertaking (LUT) for zero-rated exports',
      ],
      process: [
        {
          step: '01',
          title: 'Eligibility Assessment & Formula Computation',
          description: 'Verify statutory entitlement and calculate exact refund amount using CGST Rule 89 formula.',
        },
        {
          step: '02',
          title: 'Ledger Audit & Document Cross-Matching',
          description: 'Reconcile shipping bills, FIRC/BRC remittances, and input purchase invoices.',
        },
        {
          step: '03',
          title: 'Form RFD-01 E-Filing on GST Portal',
          description: 'Upload certified calculation sheets and documentary proof to the GST portal.',
        },
        {
          step: '04',
          title: 'Scrutiny & RFD-02 Acknowledgment Tracking',
          description: 'Track jurisdictional tax officer scrutiny and respond to any verification queries.',
        },
        {
          step: '05',
          title: 'Sanction Order (RFD-06) & Disbursement',
          description: 'Facilitate final sanction order and direct credit into validated bank account.',
        },
      ],
      faqs: [
        {
          question: 'What is the time limit to file a GST refund application?',
          answer: 'A refund application must be filed within 2 years from the relevant date (e.g., date of export or end of the financial year for inverted duty claims).',
        },
        {
          question: 'Can service exporters claim a refund of unutilized ITC?',
          answer: 'Yes. Service exporters operating under a Letter of Undertaking (LUT) can claim 100% of accumulated input credit on input goods and services.',
        },
      ],
    },
  },
  {
    id: 'income-tax-itr',
    slug: 'income-tax-return-itr',
    category: 'taxation-gst',
    title: 'Income Tax Return / ITR',
    shortDesc: 'Income Tax Return preparation and filing for individuals, professionals, firms, and companies.',
    fullDesc: 'Computation of total taxable income, capital gains, business income, deduction optimization under the Income Tax Act, and e-filing with verification.',
    popular: true,
    timeline: 'Standard Tax Cycle',
    startingPrice: '₹999',
    pricingType: 'fixed',
    features: [
      'ITR-1 to ITR-7 Return Preparation',
      'Form 26AS & AIS/TIS Reconciliation',
      'Tax Computation & Deduction Advisory',
      'E-Verification & Acknowledgment',
    ],
    iconName: 'FileSpreadsheet',
    badge: 'Annual',
    aliases: ['Income Tax / ITR', 'ITR Filing', 'Corporate Income Tax'],
    landingPage: {
      headline: 'File your Income Tax Return with optimal deductions & AIS/26AS reconciliation.',
      description: 'Accurate tax computation, capital gains analysis, and compliant e-filing for individuals, professionals, firms, and corporate entities.',
      overview: 'Income Tax Return (ITR) filing is a mandatory annual legal obligation for individuals, businesses, LLPs, and companies. LEGOMARK’s tax professionals compute your total income across all heads, maximize statutory deductions, reconcile AIS/TIS data, and ensure 100% compliant e-filing.',
      benefits: [
        '100% Statutory Compliance & Avoidance of Penalties under Section 234F',
        'Crucial Financial Document for Bank Loans, Mortgages & Visa Applications',
        'Seamless Carry-Forward of Business, F&O, and Capital Losses',
        'Accurate Claim and Speedy Refund of Excess TDS / Advance Tax Paid',
      ],
      deliverables: [
        'Computation of Total Taxable Income Statement across all 5 Heads',
        'Detailed Form 26AS, AIS (Annual Information Statement) & TIS Reconciliation',
        'Preparation & E-Filing of Applicable ITR Form (ITR-1 through ITR-7)',
        'E-Verification Assistance via Aadhaar OTP or Net Banking',
        'Official ITR-V Filing Acknowledgment Receipt Delivery',
      ],
      documents: [
        'PAN Card and Aadhaar Card of Assessee (Mandatory)',
        'Form 16 (for salaried individuals) or Financial Statements (for business/professionals)',
        'Bank Account Statements for all active bank accounts held during the FY',
        'Capital Gains Statements from Stock / Mutual Fund brokers (if applicable)',
        'Proof of Tax-Saving Deductions (80C, 80D, 80G, NPS, Home Loan Interest)',
      ],
      process: [
        {
          step: '01',
          title: 'Income Evaluation & Document Review',
          description: 'Assess income sources across salary, house property, business, capital gains, and other sources.',
        },
        {
          step: '02',
          title: 'AIS, TIS & Form 26AS Reconciliation',
          description: 'Cross-verify reported bank interest, dividends, securities trades, and TDS credits.',
        },
        {
          step: '03',
          title: 'Tax Computation (Old vs New Regime)',
          description: 'Compare tax liabilities under both regimes to recommend the most tax-efficient structure.',
        },
        {
          step: '04',
          title: 'E-Filing on Income Tax Portal',
          description: 'Upload validated ITR utility on the official Income Tax Department portal.',
        },
        {
          step: '05',
          title: 'E-Verification & Acknowledgment',
          description: 'Complete Aadhaar OTP verification and deliver official ITR-V acknowledgment.',
        },
      ],
      faqs: [
        {
          question: 'Which tax regime should I choose: Old or New?',
          answer: 'We evaluate your specific income levels and eligible deductions (HRA, 80C, 80D, home loan) to calculate which regime results in the lowest tax liability.',
        },
        {
          question: 'Why is AIS/TIS reconciliation essential before filing?',
          answer: 'The Income Tax Department automatically matches your return against data reported in AIS. Unreconciled figures trigger automated defect notices.',
        },
      ],
    },
  },
  {
    id: 'audit-services',
    slug: 'audit-related-services',
    category: 'taxation-gst',
    title: 'Audit-related Services',
    shortDesc: 'Assistance and documentation for statutory audit, tax audit, and internal financial verification.',
    fullDesc: 'Coordination and financial documentation preparation for statutory audits under the Companies Act and tax audits under Section 44AB of the Income Tax Act.',
    popular: false,
    timeline: 'Custom Project',
    startingPrice: '₹14,999',
    pricingType: 'fixed',
    features: [
      'Financial Statement Schedules Preparation',
      'Tax Audit (Form 3CA / 3CB / 3CD) Coordination',
      'Internal Controls & Books Review',
      'Statutory Audit Documentation',
    ],
    iconName: 'Award',
    aliases: ['Tax Audit', 'Statutory Audit Support'],
    landingPage: {
      headline: 'Statutory, Tax & Internal audit documentation and professional coordination.',
      description: 'Prepare audit-ready balance sheets, Form 3CD schedules, and statutory registers in full compliance with accounting standards.',
      overview: 'Statutory audits under the Companies Act, 2013 and Tax Audits under Section 44AB of the Income Tax Act are mandatory legal verifications ensuring that an entity’s books of accounts present a true and fair view. LEGOMARK prepares audit schedules, verifies internal controls, and facilitates seamless audit sign-offs.',
      benefits: [
        '100% Compliance with Companies Act & Income Tax Provisions',
        'Identification & Mitigation of Financial & Tax Leakages',
        'Assurance & Reliability for Shareholders, Lenders & Directors',
        'Timely Filing of Form 3CA/3CB and Form 3CD Reports',
      ],
      deliverables: [
        'Financial Statement Schedules & Balance Sheet Finalization',
        'Tax Audit Form 3CA / 3CB / 3CD Documentation Preparation',
        'Statutory Audit Workpapers & Internal Control Review',
        'Fixed Asset Register & Depreciation Verification as per Schedule II',
        'Coordination with Independent Statutory / Tax Auditors',
      ],
      documents: [
        'Trial Balance, General Ledger & Books of Accounts',
        'Previous year’s audited financials and tax audit report',
        'Bank Reconciliation Statements (BRS) for all active bank accounts',
        'Statutory registers, Board meeting minutes, and ROC filings',
        'GST 2A/2B and 3B reconciliations and TDS return records',
      ],
      process: [
        {
          step: '01',
          title: 'Scope Definition & Planning',
          description: 'Review business operations, turnover thresholds, and statutory reporting requirements.',
        },
        {
          step: '02',
          title: 'Books Finalization & Schedule Drafting',
          description: 'Finalize balance sheet, profit & loss statement, and draft relevant disclosure notes.',
        },
        {
          step: '03',
          title: 'Internal Controls & Transaction Testing',
          description: 'Perform sample testing on revenue recognition, expense vouchers, and TDS compliance.',
        },
        {
          step: '04',
          title: 'Form 3CD Preparation & Scrutiny',
          description: 'Populate statutory clauses in Form 3CD for tax audit compliance.',
        },
        {
          step: '05',
          title: 'Sign-Off & Regulatory Upload',
          description: 'Facilitate final report signing and portal upload before statutory deadlines.',
        },
      ],
      faqs: [
        {
          question: 'When is a Tax Audit under Section 44AB mandatory?',
          answer: 'A tax audit is mandatory if business turnover exceeds ₹1 Crore (or ₹10 Crores if cash transactions are under 5%), or professional gross receipts exceed ₹50 Lakhs.',
        },
        {
          question: 'Is statutory audit mandatory for all Private Limited Companies?',
          answer: 'Yes. Every company incorporated in India must have its financial statements audited by an independent Chartered Accountant annually, irrespective of turnover.',
        },
      ],
    },
  },

  // ==================================================
  // 3. Trademark & IP (2 Canonical Services)
  // ==================================================
  {
    id: 'trademark-registration',
    slug: 'trademark-registration',
    category: 'trademark-ip',
    title: 'Trademark Registration',
    shortDesc: 'Protect your brand name, logo, slogan, and visual identity with trademark registration across India.',
    fullDesc: 'Comprehensive trademark search across 45 classes, Form TM-A drafting and filing with the Controller General of Patents, Designs and Trade Marks (IP India).',
    popular: true,
    timeline: 'Immediate Application Filing',
    startingPrice: '₹2,499',
    pricingType: 'fixed',
    governmentFeeNote: '+ Govt. Fees (₹4,500 Individual/MSME or ₹9,00,0 Others)',
    features: [
      'Pre-Filing Trademark Registry Search (Classes 1–45)',
      'Class Identification & Legal Drafting',
      'Form TM-A Preparation & Online Submission',
      'Right to Use ™ Symbol upon Filing',
    ],
    iconName: 'Sparkles',
    badge: 'Brand Protection',
    aliases: ['Trademark Filing', 'Logo Registration', 'Brand Name Registration', 'Trademark Search'],
    landingPage: {
      headline: 'Protect your brand name, logo & slogan with legal exclusivity across India.',
      description: 'Get exclusive legal ownership of your brand with professional pre-filing clearance search and Form TM-A submission.',
      overview: 'A Trademark is your business’s most valuable intangible asset, protecting your brand name, logo, device, or tagline from unauthorized copycats and unfair commercial infringement. LEGOMARK conducts comprehensive pre-filing searches across all 45 NICE classes and files Form TM-A with the Trade Marks Registry (IP India).',
      benefits: [
        'Exclusive Legal Ownership of Brand Identity Across the Entire Territory of India',
        'Immediate Legal Right to Use the ™ Symbol on Products and Marketing Materials',
        'Statutory Power to Restrain Counterfeits and File Infringement Lawsuits',
        'Valuable Corporate Intangible Asset that Can Be Licensed, Sold, or Franchised',
      ],
      deliverables: [
        'Comprehensive Pre-Filing Trademark Database Search Report',
        'Identification of Appropriate NICE Trademark Classes (1 to 45)',
        'Drafting of Form TM-A with Goods/Services Specifications',
        'Filing with Trade Marks Registry (IP India Online Portal)',
        'Official Filing Receipt / Application Number with ™ Authorization',
      ],
      documents: [
        'Logo / Wordmark artwork in high resolution (JPEG/PNG format)',
        'Identity & Address Proof of Applicant (Proprietor/Director/Partner)',
        'Udyam / MSME Certificate (for 50% Government fee concession)',
        'User Affidavit & Documentary Proof of Prior Commercial Use (if claiming prior use)',
        'Power of Attorney (Form TM-48) authorizing trademark attorney representation',
      ],
      process: [
        {
          step: '01',
          title: 'Trademark Clearance Search',
          description: 'Conduct deep search across IP India database to ensure no conflicting marks exist.',
        },
        {
          step: '02',
          title: 'Class Selection & TM-48 Authorization',
          description: 'Map business activities into appropriate NICE classes and execute power of attorney.',
        },
        {
          step: '03',
          title: 'Form TM-A Drafting & Filing',
          description: 'Prepare application with user date and submit via IP India online portal.',
        },
        {
          step: '04',
          title: 'Application Number Allotment',
          description: 'Receive instant government filing receipt and begin using the ™ symbol.',
        },
        {
          step: '05',
          title: 'Registry Examination & Publication Tracking',
          description: 'Monitor application status through examination, journal publication, and certificate issuance (®).',
        },
      ],
      faqs: [
        {
          question: 'When can I start using the ™ and ® symbols?',
          answer: 'You can use the ™ symbol immediately upon filing Form TM-A. The ® symbol can ONLY be used after the Trade Marks Registry officially issues the registration certificate.',
        },
        {
          question: 'How long does trademark registration remain valid?',
          answer: 'A registered trademark is valid for 10 years from the date of application and can be renewed indefinitely every 10 years.',
        },
        {
          question: 'How does an MSME certificate reduce government filing fees?',
          answer: 'Government fee for individuals, startups, and MSME certificate holders is ₹4,500 per class, compared to ₹9,000 per class for non-MSME companies.',
        },
      ],
    },
  },
  {
    id: 'trademark-protection',
    slug: 'trademark-protection',
    category: 'trademark-ip',
    title: 'Trademark Protection',
    shortDesc: 'Comprehensive trademark protection including examination replies, objection responses, and monitoring.',
    fullDesc: 'Legal drafting and formal responses to examination reports issued under Section 9 and Section 11 of the Trade Marks Act, and status monitoring until registration.',
    popular: false,
    timeline: 'As per Registry Timelines',
    startingPrice: '₹2,999',
    pricingType: 'fixed',
    features: [
      'Examination Report Analysis',
      'Section 9 & 11 Legal Rebuttal Drafting',
      'Submission with Trademarks Registry',
      'Status Monitoring & Hearing Support',
    ],
    iconName: 'Shield',
    aliases: ['Trademark Objection Reply', 'Trademark Hearing Representation'],
    landingPage: {
      headline: 'Defend your brand against examination objections, oppositions & infringement.',
      description: 'Overcome Registry objections under Section 9 & 11 with persuasive legal rebuttals and representation by trademark attorneys.',
      overview: 'Filing a trademark is the first step, but overcoming objections raised by the Trade Marks Registry under Section 9 (Absolute Grounds) or Section 11 (Relative Grounds with similar marks) requires persuasive legal rebuttals. LEGOMARK drafts legal responses, attends hearings, and protects your IP rights.',
      benefits: [
        'Professional Legal Drafting of Rebuttal Submissions Citing Judicial Precedents',
        'Protection against Trademark Abandonment & Summary Refusal',
        'Representation by Experienced IP Attorneys in Show Cause Hearings',
        'Brand Monitoring against Confusingly Similar Trademark Filings',
      ],
      deliverables: [
        'Legal Scrutiny of Examination Report / Notice of Objection',
        'Drafting Formal Written Reply to Section 9 & 11 Objections',
        'Compilation of Evidence of Distinctiveness and Prior Commercial Use',
        'Online Submission with the Trade Marks Registry within Statutory Timelines',
        'Preparation & Legal Representation for Virtual / Physical Show Cause Hearings',
      ],
      documents: [
        'Examination Report issued by the Trade Marks Registry',
        'Invoices, Marketing Materials & Inward Bills establishing prior use',
        'Turnover Figures & CA Certificate verifying brand publicity expenditure',
        'Website, Social Media, and Domain Registration proof',
      ],
      process: [
        {
          step: '01',
          title: 'Examination Notice Analysis',
          description: 'Analyze grounds of objection (descriptive nature, lack of distinctiveness, or cited marks).',
        },
        {
          step: '02',
          title: 'Legal Rebuttal & Case Law Research',
          description: 'Draft comprehensive counter-arguments citing high court and IPAB judicial precedents.',
        },
        {
          step: '03',
          title: 'Evidence Docket Compilation',
          description: 'Collate documentary proof of continuous commercial use, sales turnover, and brand reputation.',
        },
        {
          step: '04',
          title: 'E-Filing of Written Reply',
          description: 'Submit formal response on the IP India portal within the mandatory 30-day window.',
        },
        {
          step: '05',
          title: 'Hearing & Order Securing',
          description: 'Represent before Hearing Officer if scheduled to secure acceptance and journal advertisement.',
        },
      ],
      faqs: [
        {
          question: 'What happens if I do not reply to a Trademark Examination Report in 30 days?',
          answer: 'Failing to submit a response within 30 days results in the Trade Marks Registry treating your application as "Abandoned", terminating your legal rights.',
        },
        {
          question: 'What is the difference between Section 9 and Section 11 objections?',
          answer: 'Section 9 objections relate to marks deemed descriptive, generic, or non-distinctive. Section 11 is raised when existing identical or deceptively similar marks are on record.',
        },
      ],
    },
  },

  // ==================================================
  // 4. ROC & Annual Compliance (2 Canonical Services)
  // ==================================================
  {
    id: 'roc-filing',
    slug: 'roc-filing',
    category: 'compliance-roc',
    title: 'ROC Filing',
    shortDesc: 'Mandatory statutory filings and secretarial compliance with the Registrar of Companies (ROC).',
    fullDesc: 'Preparation and submission of statutory forms with the MCA, including Director KYC, Auditor appointment, registered office changes, and share capital updates.',
    popular: false,
    timeline: 'Statutory Timelines',
    startingPrice: '₹2,499',
    pricingType: 'fixed',
    features: [
      'Director DIR-3 KYC Submissions',
      'Auditor Appointment (Form ADT-1)',
      'Statutory Secretarial Form Filings',
      'MCA Portal Compliance Updates',
    ],
    iconName: 'ShieldAlert',
    aliases: ['Annual ROC Filing', 'Director Compliance', 'DIR-3 KYC'],
    landingPage: {
      headline: 'Mandatory corporate secretarial filings & statutory updates with the MCA.',
      description: 'Keep your company in active MCA standing with prompt DIR-3 KYC, auditor appointments, and event-based secretarial filings.',
      overview: 'Every registered Company and LLP is required under the Companies Act, 2013 to notify the Registrar of Companies (ROC) of routine and event-based corporate changes such as director appointments/resignations, registered office shifting, share capital alterations, and annual director KYC.',
      benefits: [
        'Avoid Massive Compounding MCA Late Filing Penalties (₹100/day)',
        'Maintain Active Corporate Status & Flawless Good Standing with MCA',
        'Prevent Director Disqualification & DIN Deactivation',
        'Ensure Smooth Due Diligence for Corporate Loans and Equity Investments',
      ],
      deliverables: [
        'Annual Director DIR-3 KYC Submissions on MCA V3 Portal',
        'Auditor Appointment Filing (Form ADT-1)',
        'Director Appointment or Resignation Filings (Form DIR-12)',
        'Change in Registered Office Location (Form INC-22)',
        'Allotment of Shares & Capital Increase Filings (Form PAS-3 / SH-7)',
      ],
      documents: [
        'PAN and Aadhaar Cards of Directors / Designated Partners',
        'Certified Board Resolutions & Notices of General Meetings',
        'Proof of corporate changes (Consent letters, rent agreements, share allotments)',
        'Valid Class 3 Digital Signatures of Director & CS/CA',
      ],
      process: [
        {
          step: '01',
          title: 'Event Assessment & Form Identification',
          description: 'Identify required statutory MCA e-form and statutory filing deadlines.',
        },
        {
          step: '02',
          title: 'Secretarial Documentation & Resolutions',
          description: 'Draft board resolutions, minutes, and statutory declarations.',
        },
        {
          step: '03',
          title: 'Form Preparation on MCA V3 Portal',
          description: 'Fill statutory e-form and attach certified true copies of resolutions.',
        },
        {
          step: '04',
          title: 'Digital Signatures & Filing',
          description: 'Affix DSC of director and practicing professional (CA/CS).',
        },
        {
          step: '05',
          title: 'SRN Generation & Approval Tracking',
          description: 'Track Service Request Number (SRN) until approved by the ROC.',
        },
      ],
      faqs: [
        {
          question: 'What is DIR-3 KYC and who must file it?',
          answer: 'DIR-3 KYC is an annual mandatory verification for every individual holding an active Director Identification Number (DIN), due by September 30th every year.',
        },
        {
          question: 'What is the penalty for filing ROC forms late?',
          answer: 'MCA levies an additional fee of ₹100 per day of delay without any upper ceiling for major statutory forms.',
        },
      ],
    },
  },
  {
    id: 'annual-compliance',
    slug: 'annual-compliance',
    category: 'compliance-roc',
    title: 'Annual Compliance',
    shortDesc: 'Complete annual compliance package for Private Limited Companies and LLPs under the Companies Act.',
    fullDesc: 'Preparation of Director Report, Financial Statements (Form AOC-4), Annual Return (Form MGT-7/7A), and annual secretarial documentation.',
    popular: true,
    timeline: 'Annual Retainer',
    startingPrice: '₹9,999 / yr',
    pricingType: 'recurring',
    features: [
      'Form AOC-4 Financial Statements Filing',
      'Form MGT-7 / 7A Annual Return Filing',
      'Annual General Meeting (AGM) Documentation',
      'Director KYC Verification',
    ],
    iconName: 'FileText',
    badge: 'Mandatory',
    aliases: ['Annual ROC Compliance', 'Corporate Annual Compliance'],
    landingPage: {
      headline: 'Comprehensive end-to-end annual secretarial compliance for Companies & LLPs.',
      description: 'Protect your entity from penalties and disqualification with full-year secretarial compliance, AGM drafting, and AOC-4 / MGT-7 filings.',
      overview: 'Under the Companies Act, 2013 and LLP Act, 2008, all registered companies and LLPs must complete their annual secretarial obligations every year, including convening Board Meetings and AGMs, preparing Director’s Reports, and filing annual accounts (AOC-4 / Form 8) and annual returns (MGT-7 / Form 11).',
      benefits: [
        'Guaranteed 100% Statutory Compliance All Year Round',
        'Complete Protection against Director Disqualification under Section 164',
        'Prevention of Involuntary Company Strike-Off from MCA Register',
        'Audit-Ready Secretarial Records, Registers & Board Minutes',
      ],
      deliverables: [
        'Preparation of Financial Statements & Form AOC-4 Filing',
        'Drafting of Annual Return & Form MGT-7 / 7A Filing',
        'LLP Statement of Account & Solvency (Form 8) and Annual Return (Form 11)',
        'Drafting of Notice, Directors’ Report, and AGM Minutes',
        'Maintenance of Statutory Registers (Members, Directors, Loans)',
        'DIR-3 KYC for 2 Directors',
      ],
      documents: [
        'Audited Financial Statements (Balance Sheet, P&L, Auditor Report)',
        'Bank statements of the company for the entire financial year',
        'List of Shareholders and Directors with shareholding details',
        'Details of Board Meetings held during the year',
        'Valid DSCs of Directors',
      ],
      process: [
        {
          step: '01',
          title: 'Financial Review & Secretarial Audit',
          description: 'Review audited financial statements and determine applicable MCA disclosures.',
        },
        {
          step: '02',
          title: 'Drafting Notice, Directors’ Report & Resolutions',
          description: 'Prepare AGM notice, Director’s Report, and statutory extracts.',
        },
        {
          step: '03',
          title: 'DIR-3 KYC & Preliminary Compliance',
          description: 'File annual director KYC before statutory cut-off dates.',
        },
        {
          step: '04',
          title: 'Filing AOC-4 (Financials)',
          description: 'Submit financial statements within 30 days of holding the Annual General Meeting.',
        },
        {
          step: '05',
          title: 'Filing MGT-7 / 7A (Annual Return)',
          description: 'Submit annual return within 60 days of the AGM and obtain Challan receipts.',
        },
      ],
      faqs: [
        {
          question: 'Can a non-operational or dormant company skip annual compliance?',
          answer: 'No. Even if a company has zero revenue or no active bank transactions, annual ROC filing is mandatory until the company is legally closed or granted dormant status.',
        },
        {
          question: 'What are the key due dates for annual corporate compliance?',
          answer: 'Director KYC by Sept 30, Form AOC-4 within 30 days of AGM (typically Oct 29), and Form MGT-7 within 60 days of AGM (typically Nov 28).',
        },
      ],
    },
  },

  // ==================================================
  // 5. Licenses & Registrations (2 Canonical Services)
  // ==================================================
  {
    id: 'fssai-license',
    slug: 'fssai-license-registration',
    category: 'licenses-registrations',
    title: 'FSSAI License / Registration',
    shortDesc: 'Food safety registration and licensing for food business operators, manufacturers, traders, and restaurants.',
    fullDesc: 'Basic FSSAI registration, State License, and Central License applications via the FoSCoS portal with complete food category mapping.',
    popular: true,
    timeline: 'Standard FoSCoS Processing',
    startingPrice: '₹1,999',
    pricingType: 'fixed',
    features: [
      'Basic, State or Central FSSAI Application',
      'FoSCoS Documentation & Category Selection',
      'Compliance Guidance for Food Standards',
      'License Certificate Delivery',
    ],
    iconName: 'Utensils',
    badge: 'Food Safety',
    aliases: ['FSSAI Registration', 'FSSAI License', 'Food License'],
    landingPage: {
      headline: 'Get your Food Safety License (Basic, State, or Central) via FoSCoS portal.',
      description: 'Obtain your 14-digit FSSAI license with professional food category mapping, FSMS plan drafting, and FoSCoS approval.',
      overview: 'Any business handling food, from home-based cloud kitchens, restaurants, food packaging units, to manufacturers and importers, requires mandatory registration or licensing under the Food Safety and Standards Act (FSSAI). LEGOMARK assists with category mapping, facility documentation, and FoSCoS portal approval.',
      benefits: [
        'Mandatory Legal License to Manufacture, Store, or Sell Food in India',
        'Required for Onboarding on Food Delivery Apps (Zomato, Swiggy, Blinkit, Zepto)',
        'Builds Consumer Trust through Official 14-Digit FSSAI License Display',
        'Protection against Heavy Fines & Business Closure Notices',
      ],
      deliverables: [
        'Evaluation of Eligibility (Basic Registration vs State/Central License)',
        'Food Category & Kind of Business (KoB) Mapping',
        'Preparation & Filing of Form A or Form B on FoSCoS',
        'Drafting of Food Safety Management Plan (FSMS) Declaration',
        '14-Digit FSSAI License / Registration Certificate Delivery',
      ],
      documents: [
        'Photo and ID proof of Food Business Operator (FBO) / Authorized Signatory',
        'Proof of Business Premises (Electricity Bill / Rent Agreement & Landlord NOC)',
        'Layout plan and list of food machinery/equipment (for manufacturing units)',
        'List of food categories and products manufactured or traded',
        'Water test report from accredited lab (for manufacturing units)',
      ],
      process: [
        {
          step: '01',
          title: 'Turnover & Scale Evaluation',
          description: 'Determine whether Basic (<₹12L), State (₹12L–₹20Cr), or Central (>₹20Cr/Importers) applies.',
        },
        {
          step: '02',
          title: 'Documentation & FSMS Preparation',
          description: 'Collate premises proofs, list of food categories, and food safety declarations.',
        },
        {
          step: '03',
          title: 'FoSCoS Application Filing',
          description: 'Submit Form A/B application online with requisite government fees.',
        },
        {
          step: '04',
          title: 'Departmental Inspection & Query Response',
          description: 'Address queries from Food Safety Officer (FSO) during processing.',
        },
        {
          step: '05',
          title: 'License Issuance & Delivery',
          description: 'Download 14-digit digital FSSAI license certificate with validity up to 5 years.',
        },
      ],
      faqs: [
        {
          question: 'Which FSSAI license category do I need?',
          answer: 'Basic Registration is for turnover up to ₹12 Lakhs/year. State License is for turnover between ₹12 Lakhs to ₹20 Crores. Central License is for turnover exceeding ₹20 Crores or multi-state/import operations.',
        },
        {
          question: 'Can I sell food on Zomato or Swiggy without an FSSAI license?',
          answer: 'No. E-commerce food aggregators strictly mandate an active 14-digit FSSAI license before approving your restaurant or cloud kitchen listing.',
        },
      ],
    },
  },
  {
    id: 'other-business-licenses',
    slug: 'other-business-licenses-registrations',
    category: 'licenses-registrations',
    title: 'Other Business Licenses / Registrations',
    shortDesc: 'Registration services for MSME / Udyam, Import Export Code (IEC), and Shop & Establishment licenses.',
    fullDesc: 'End-to-end guidance for obtaining statutory commercial permissions including Udyam MSME certificate, DGFT Import Export Code (IEC), and municipal registrations.',
    popular: false,
    timeline: '1 to 5 Working Days',
    startingPrice: '₹1,499',
    pricingType: 'fixed',
    features: [
      'MSME / Udyam Certificate Registration',
      'Import Export Code (IEC) from DGFT',
      'Shop & Establishment License Guidance',
      'Statutory Commercial Documentation',
    ],
    iconName: 'Briefcase',
    aliases: ['MSME / Udyam', 'Other Business Registrations', 'IEC Registration', 'Trade Licenses'],
    landingPage: {
      headline: 'Obtain MSME/Udyam, Import Export Code (IEC), and Trade Licenses.',
      description: 'Secure operational permits for MSME Udyam, DGFT Import Export Code (IEC), and local commercial registrations.',
      overview: 'Starting and operating a business in India requires various general and industry-specific licenses. LEGOMARK provides complete registration support for Udyam MSME, DGFT Import Export Code (IEC), Shop & Establishment, and Professional Tax to ensure your business operations remain fully compliant.',
      benefits: [
        'Access to Government Subsidies, Collateral-Free Bank Loans & Tender Benefits',
        'Lifetime Validity for MSME Udyam & Import Export Code (IEC)',
        'Essential for Global Cross-Border Export/Import Operations',
        'Local Municipal Compliance for Commercial Premises',
      ],
      deliverables: [
        'Udyam MSME Registration Certificate (Lifetime validity)',
        'DGFT Import Export Code (IEC) Issuance',
        'Shop & Establishment (Gumasta) License Guidance',
        'Professional Tax Registration (Employer & Employee)',
        'Comprehensive Regulatory Licensing Compliance Checklist',
      ],
      documents: [
        'Aadhaar Card and PAN Card of Business Owner / Promoters (Mandatory)',
        'Business Entity Incorporation Certificate or Partnership Deed',
        'Registered Office Address Proof (Utility Bill, Rent Agreement, NOC)',
        'Active Bank Account details (Cancelled Cheque)',
        'Employee headcount details (where applicable for Shop Act)',
      ],
      process: [
        {
          step: '01',
          title: 'Licensing Requirements Assessment',
          description: 'Identify all necessary operational permits according to business nature, location, and scale.',
        },
        {
          step: '02',
          title: 'Document Compilation & KYC',
          description: 'Collate ownership credentials and premises proofs.',
        },
        {
          step: '03',
          title: 'Portal Submission',
          description: 'Submit applications on respective official portals (Udyam, DGFT, State Labor).',
        },
        {
          step: '04',
          title: 'Verification & Tracking',
          description: 'Monitor status and fulfill department clarifications if requested.',
        },
        {
          step: '05',
          title: 'Certificate Handover',
          description: 'Deliver verified certificates and provide renewal schedules where applicable.',
        },
      ],
      faqs: [
        {
          question: 'What are the primary benefits of Udyam MSME registration?',
          answer: 'Benefits include priority bank lending at concessional interest rates, exemption from tender earnest money deposit (EMD), 50% discount on government trademark fees, and protection against delayed buyer payments.',
        },
        {
          question: 'Is an Import Export Code (IEC) mandatory for services export?',
          answer: 'Yes. IEC is mandatory for receiving foreign inward remittances and claiming export benefits under foreign trade policies.',
        },
      ],
    },
  },

  // ==================================================
  // 6. Advisory & Secretarial (1 Canonical Service)
  // ==================================================
  {
    id: 'advisory-secretarial-consultation',
    slug: 'advisory-secretarial-consultation',
    category: 'advisory-secretarial',
    title: 'Advisory & Secretarial Consultation',
    shortDesc: 'Direct consultation with practicing Company Secretaries & corporate legal advisors on structural governance.',
    fullDesc: 'Specialized advisory covering equity structuring, secretarial board resolutions, statutory registers, corporate compliance roadmaps, and regulatory advisory.',
    popular: false,
    timeline: 'Custom / On Request',
    startingPrice: 'Custom / On Request',
    pricingType: 'custom',
    features: [
      'Corporate Secretarial Support & Minutes Drafting',
      'Shareholding & Capital Structuring Advisory',
      'Statutory Regulatory Governance & Due Diligence',
      'Custom Corporate Compliance Roadmap',
    ],
    iconName: 'Briefcase',
    aliases: ['Corporate Compliance', 'Secretarial Support', 'Business Advisory', 'Corporate Secretarial Support'],
    landingPage: {
      headline: 'Strategic legal, corporate governance & secretarial advisory for enterprises.',
      description: 'Direct consultation with senior practicing Company Secretaries on equity structuring, board governance, and regulatory due diligence.',
      overview: 'As businesses scale, complex corporate restructuring, equity capitalization, founder vesting, cross-border investments (FDI/ODI), and regulatory compliance require expert counsel. LEGOMARK’s senior practicing Company Secretaries and legal advisors provide bespoke advisory tailored to your strategic roadmap.',
      benefits: [
        'Direct Access to Practicing Senior Company Secretaries & Corporate Lawyers',
        'Risk Mitigation in Shareholding Agreements & Commercial Contracts',
        'Strategic Structuring for Venture Capital & Private Equity Funding',
        'Custom Governance Roadmaps for Enterprise Scale & Due Diligence',
      ],
      deliverables: [
        'One-on-One Corporate Legal & Secretarial Advisory Session',
        'Review & Drafting of Shareholders’ Agreements (SHA) & Term Sheets',
        'Capital Structuring, ESOP Schemes & Cap Table Advisory',
        'FDI / ODI Regulatory Compliance under RBI & FEMA Guidelines',
        'Detailed Actionable Compliance Roadmap & Legal Opinion Memo',
      ],
      documents: [
        'Existing Constitutional Documents (MOA/AOA, LLP Agreement)',
        'Latest Cap Table and Shareholding Pattern',
        'Proposed Transaction Term Sheet or Investment Agreement (if applicable)',
        'Specific Legal / Regulatory Query Brief',
      ],
      process: [
        {
          step: '01',
          title: 'Confidential Brief & Scope Analysis',
          description: 'Review background materials, corporate structure, and specific strategic objectives.',
        },
        {
          step: '02',
          title: 'Research & Regulatory Mapping',
          description: 'Examine provisions of Companies Act, FEMA, SEBI, or relevant commercial statutes.',
        },
        {
          step: '03',
          title: 'Advisory Consultation Session',
          description: 'Conduct in-depth strategy session with founders and leadership team.',
        },
        {
          step: '04',
          title: 'Documentation & Drafting',
          description: 'Draft custom resolutions, agreements, legal opinions, or governance frameworks.',
        },
        {
          step: '05',
          title: 'Implementation & Execution Support',
          description: 'Assist with regulatory filings and execution of agreed corporate actions.',
        },
      ],
      faqs: [
        {
          question: 'What types of advisory do you provide for startups?',
          answer: 'We provide founder vesting structuring, ESOP pool creation, cap table advisory, term sheet vetting, and pre-funding corporate clean-up.',
        },
        {
          question: 'How is the advisory engagement structured?',
          answer: 'We offer both project-based advisory for specific transactions and ongoing retainer-based corporate secretarial advisory.',
        },
      ],
    },
  },
];

/**
 * Find canonical service item by its unique URL slug or ID
 */
export function getServiceBySlug(slug: string): ServiceItem | undefined {
  if (!slug) return undefined;
  const normalizedSlug = slug.toLowerCase().trim();
  return SERVICES.find(
    (s) => s.slug.toLowerCase() === normalizedSlug || s.id.toLowerCase() === normalizedSlug
  );
}

/**
 * Get related services dynamically based on category and popularity
 */
export function getRelatedServices(currentService: ServiceItem): ServiceItem[] {
  // 1. Same category services excluding current
  const sameCategory = SERVICES.filter(
    (s) => s.category === currentService.category && s.slug !== currentService.slug
  );

  // 2. Cross-category popular services if same category has fewer than 3
  if (sameCategory.length >= 3) {
    return sameCategory.slice(0, 3);
  }

  const otherServices = SERVICES.filter(
    (s) => s.category !== currentService.category && s.slug !== currentService.slug
  );

  return [...sameCategory, ...otherServices].slice(0, 3);
}

export const PACKAGES: PackageTier[] = [
  {
    id: 'starter',
    name: 'Starter Incorporation',
    tagline: 'Company registration essentials for new ventures and founders',
    price: '₹6,999',
    idealFor: 'New businesses & 2-Director Startups',
    features: [
      '2 Class 3 Digital Signature Certificates (DSC)',
      '2 Director Identification Numbers (DIN)',
      'SPICe+ Part A Name Reservation',
      'Standard MOA & AOA Drafting',
      'Certificate of Incorporation (COI)',
      'Company PAN & TAN Allotment',
      'Bank Account Opening Documentation Kit',
    ],
    ctaLabel: 'Choose Starter',
  },
  {
    id: 'growth',
    name: 'Growth & Compliance',
    tagline: 'Incorporation paired with GST registration and initial statutory setup',
    price: '₹16,999',
    popular: true,
    badge: 'Recommended',
    idealFor: 'Growing ventures needing tax & trademark registration',
    features: [
      'Everything in Starter Incorporation',
      'GST Registration Filing',
      'MSME / Udyam Registration',
      '1 Trademark (™) Application Filing',
      'First Auditor Appointment Documentation (ADT-1)',
      'Director DIR-3 KYC for 2 Directors',
    ],
    ctaLabel: 'Select Growth',
  },
  {
    id: 'enterprise',
    name: 'Corporate Annual Retainer',
    tagline: 'Comprehensive annual secretarial, ROC and tax compliance management',
    price: '₹29,999',
    period: '/ year',
    idealFor: 'Operating companies & multi-director firms',
    features: [
      'Annual ROC Filings (Form AOC-4 & MGT-7)',
      'Monthly / Quarterly GST Return Filings',
      'Corporate Income Tax Return Filing',
      'Director DIR-3 KYC Updates',
      'Secretarial Documentation & Resolutions Kit',
      'Statutory Audit Coordination Support',
    ],
    ctaLabel: 'Select Retainer',
  },
];

export const PACKAGE_MATRIX: MatrixRow[] = [
  // Incorporation Essentials
  {
    category: 'Incorporation & Legal Setup',
    featureName: 'Digital Signature Certificates (DSC)',
    starter: '2 Certificates',
    growth: '2 Certificates',
    enterprise: 'As Required',
  },
  {
    category: 'Incorporation & Legal Setup',
    featureName: 'Director Identification Number (DIN)',
    starter: '2 Directors',
    growth: '2 Directors',
    enterprise: 'As Required',
  },
  {
    category: 'Incorporation & Legal Setup',
    featureName: 'Company Name Reservation (SPICe+)',
    starter: true,
    growth: true,
    enterprise: true,
  },
  {
    category: 'Incorporation & Legal Setup',
    featureName: 'MOA & AOA Drafting',
    starter: 'Standard',
    growth: 'Customized',
    enterprise: 'Comprehensive',
  },
  {
    category: 'Incorporation & Legal Setup',
    featureName: 'Certificate of Incorporation (COI)',
    starter: true,
    growth: true,
    enterprise: true,
  },
  {
    category: 'Incorporation & Legal Setup',
    featureName: 'Company PAN & TAN Allotment',
    starter: true,
    growth: true,
    enterprise: true,
  },

  // Tax & Regulatory Registrations
  {
    category: 'Tax & Regulatory Registrations',
    featureName: 'GST Registration',
    starter: 'Optional Add-on',
    growth: true,
    enterprise: true,
  },
  {
    category: 'Tax & Regulatory Registrations',
    featureName: 'MSME / Udyam Registration',
    starter: 'Optional Add-on',
    growth: true,
    enterprise: true,
  },
  {
    category: 'Tax & Regulatory Registrations',
    featureName: 'Trademark (™) Application',
    starter: 'Optional Add-on',
    growth: '1 Brand / Class',
    enterprise: 'Included',
  },

  // Annual Compliance & Secretarial
  {
    category: 'Statutory Secretarial & Annual Filing',
    featureName: 'First Auditor Appointment (Form ADT-1)',
    starter: false,
    growth: true,
    enterprise: true,
  },
  {
    category: 'Statutory Secretarial & Annual Filing',
    featureName: 'Annual ROC Returns (AOC-4 & MGT-7)',
    starter: false,
    growth: false,
    enterprise: true,
  },
  {
    category: 'Statutory Secretarial & Annual Filing',
    featureName: 'Director DIR-3 KYC Filings',
    starter: false,
    growth: '2 Directors',
    enterprise: 'Included',
  },
  {
    category: 'Statutory Secretarial & Annual Filing',
    featureName: 'GST Return Filings',
    starter: false,
    growth: 'Optional Add-on',
    enterprise: 'Annual Retainer',
  },
  {
    category: 'Statutory Secretarial & Annual Filing',
    featureName: 'Corporate Income Tax Return',
    starter: false,
    growth: false,
    enterprise: true,
  },
];

// Industry Sectors Supported (Neutral, non-invented)
export const INDUSTRY_SECTORS = [
  { id: 'sec-1', name: 'Technology & IT' },
  { id: 'sec-2', name: 'Retail & E-Commerce' },
  { id: 'sec-3', name: 'Manufacturing & Trade' },
  { id: 'sec-4', name: 'Food & Hospitality' },
  { id: 'sec-5', name: 'Healthcare & Pharma' },
  { id: 'sec-6', name: 'Logistics & Supply' },
  { id: 'sec-7', name: 'Professional Services' },
  { id: 'sec-8', name: 'Import & Export' },
];

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'incorporation',
    question: 'What are the main steps to register a Private Limited Company in India?',
    answer:
      'Private Limited Company registration is processed digitally through the Ministry of Corporate Affairs (MCA) SPICe+ form. The key steps include obtaining Digital Signature Certificates (DSC), reserving the company name via RUN, drafting the Memorandum and Articles of Association (MOA/AOA), and submitting statutory forms for Certificate of Incorporation (COI), PAN, and TAN allotment.',
  },
  {
    id: 'faq-2',
    category: 'incorporation',
    question: 'Can a residential address be used as the registered office for a company?',
    answer:
      'Yes, a residential address can be designated as the registered office of a company in India, provided a valid utility bill (electricity, water, or gas bill) and a No Objection Certificate (NOC) from the property owner are submitted with the MCA incorporation filing.',
  },
  {
    id: 'faq-3',
    category: 'tax',
    question: 'When is GST registration required for a business?',
    answer:
      'GST registration is mandatory for businesses exceeding the statutory turnover threshold (₹40 Lakhs for goods / ₹20 Lakhs for services in standard states). It is also mandatory for businesses making inter-state taxable supplies, operating through e-commerce platforms, or making export transactions.',
  },
  {
    id: 'faq-4',
    category: 'trademark',
    question: 'What is the difference between the ™ and ® symbols?',
    answer:
      'The ™ symbol can be used as soon as a trademark application is filed with the Trademarks Registry (IP India) and an application number is issued. The ® symbol can only be legally used once the trademark registration certificate is officially granted by the registry.',
  },
  {
    id: 'faq-5',
    category: 'incorporation',
    question: 'What are the minimum requirements to register a Private Limited Company?',
    answer:
      'A Private Limited Company in India requires a minimum of 2 Directors (at least one must be a resident of India), 2 Shareholders (who can be the same individuals as the directors), PAN and identity proofs, and address proof for the registered office. There is no statutory minimum paid-up capital requirement.',
  },
  {
    id: 'faq-6',
    category: 'tax',
    question: 'What are the annual ROC compliance requirements for a Private Limited Company?',
    answer:
      'Private Limited Companies must file Form AOC-4 (Financial Statements) and Form MGT-7/MGT-7A (Annual Return) annually with the Registrar of Companies (ROC), complete annual DIR-3 KYC for all directors, and conduct statutory board meetings and an Annual General Meeting (AGM).',
  },
];

