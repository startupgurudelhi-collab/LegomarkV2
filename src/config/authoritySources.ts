import { AuthoritySource } from '../types/authorityLink';

/**
 * Curated Official Registry of Trusted Indian Statutory & Government Portals
 * Used exclusively by the Authority Link Suggester.
 * All URLs are immutable and verified.
 */
export const CURATED_AUTHORITY_SOURCES: AuthoritySource[] = [
  // 1. MCA (Ministry of Corporate Affairs)
  {
    id: 'auth-mca-portal',
    sourceName: 'Ministry of Corporate Affairs (MCA)',
    authorityCategory: 'MCA',
    domain: 'mca.gov.in',
    targetUrl: 'https://www.mca.gov.in',
    isGovernmentPortal: true,
    defaultAnchorText: 'official MCA statutory filing portal',
    primaryCategories: [
      'Company Registration',
      'Compliance & ROC',
      'Startups & Funding',
      'Corporate Advisory',
      'Legal Drafting',
    ],
    statutoryKeywords: [
      'spice+',
      'mca',
      'roc',
      'registrar of companies',
      'companies act',
      'din',
      'director identification number',
      'aoc-4',
      'mgt-7',
      'dir-3',
      'dir-3 kyc',
      'inc-20a',
      'commencement of business',
      'private limited',
      'one person company',
      'section 8',
      'annual return',
      'statutory audit',
    ],
    rationaleTemplate:
      'Official statutory gateway under the Ministry of Corporate Affairs for company filings and RoC compliance.',
    contextSnippetTemplate:
      'For formal filings, verify details and submit statutory e-forms directly through the [official MCA statutory filing portal](https://www.mca.gov.in).',
    recommendedPlacement: 'Under procedural guidelines or annual compliance checklist section',
  },
  {
    id: 'auth-mca-llp',
    sourceName: 'MCA - Limited Liability Partnership Services',
    authorityCategory: 'MCA',
    domain: 'mca.gov.in',
    targetUrl: 'https://www.mca.gov.in/content/mca/global/en/home.html',
    isGovernmentPortal: true,
    defaultAnchorText: 'MCA Portal for LLP e-filing',
    primaryCategories: ['Company Registration', 'Compliance & ROC', 'Corporate Advisory'],
    statutoryKeywords: ['llp', 'limited liability partnership', 'form 11', 'form 8', 'llp agreement', 'dpin'],
    rationaleTemplate:
      'Statutory platform for Limited Liability Partnership annual return filings (Form 11 & Form 8).',
    contextSnippetTemplate:
      'LLP partners must submit their annual statement of accounts and solvency via the [MCA Portal for LLP e-filing](https://www.mca.gov.in/content/mca/global/en/home.html).',
    recommendedPlacement: 'Under statutory filing deadlines or LLP annual obligations',
  },

  // 2. GST & CBIC (Goods and Services Tax / Indirect Taxes)
  {
    id: 'auth-gst-portal',
    sourceName: 'Goods and Services Tax Network (GSTN)',
    authorityCategory: 'GST',
    domain: 'gst.gov.in',
    targetUrl: 'https://www.gst.gov.in',
    isGovernmentPortal: true,
    defaultAnchorText: 'official GST Common Portal',
    primaryCategories: ['Taxation & GST', 'Compliance & ROC', 'Startups & Funding'],
    statutoryKeywords: [
      'gst',
      'gstin',
      'gstr-1',
      'gstr-3b',
      'gstr-9',
      'gstr-9c',
      'input tax credit',
      'itc',
      'reverse charge',
      'rcm',
      'e-way bill',
      'lut',
      'letter of undertaking',
      'hsn',
      'sac',
      'cgst',
      'sgst',
      'igst',
    ],
    rationaleTemplate:
      'The single official government common gateway for Indian GST registration, returns, and compliance.',
    contextSnippetTemplate:
      'Taxpayers can register, file monthly returns, and claim input credit on the [official GST Common Portal](https://www.gst.gov.in).',
    recommendedPlacement: 'In sections discussing GST registration thresholds or monthly return filing',
  },
  {
    id: 'auth-cbic-portal',
    sourceName: 'Central Board of Indirect Taxes and Customs (CBIC)',
    authorityCategory: 'GST',
    domain: 'cbic.gov.in',
    targetUrl: 'https://www.cbic.gov.in',
    isGovernmentPortal: true,
    defaultAnchorText: 'Central Board of Indirect Taxes and Customs (CBIC)',
    primaryCategories: ['Taxation & GST', 'Corporate Advisory'],
    statutoryKeywords: ['cbic', 'customs', 'central excise', 'gst notification', 'indirect tax circular'],
    rationaleTemplate:
      'Regulatory authority publishing official GST notifications, circulars, and tax policy decisions.',
    contextSnippetTemplate:
      'Refer to official circulars and tariff notifications issued by the [Central Board of Indirect Taxes and Customs (CBIC)](https://www.cbic.gov.in).',
    recommendedPlacement: 'In regulatory guidance or notification citations',
  },

  // 3. Income Tax Department (Direct Taxes)
  {
    id: 'auth-incometax-portal',
    sourceName: 'Income Tax Department (e-Filing Portal)',
    authorityCategory: 'Income Tax',
    domain: 'incometax.gov.in',
    targetUrl: 'https://www.incometax.gov.in',
    isGovernmentPortal: true,
    defaultAnchorText: 'Income Tax Department e-Filing Portal',
    primaryCategories: ['Taxation & GST', 'Compliance & ROC', 'Startups & Funding'],
    statutoryKeywords: [
      'income tax',
      'itr',
      'itr-1',
      'itr-2',
      'itr-3',
      'itr-4',
      'itr-6',
      'itr-7',
      'pan',
      'tan',
      'tds',
      'tcs',
      'form 26as',
      'ais',
      'tis',
      'advance tax',
      'tax audit',
      'section 44ad',
      'section 44ada',
      'section 115baa',
      'section 80c',
      'section 80-iac',
    ],
    rationaleTemplate:
      'The central government e-filing gateway for Indian income tax returns, tax payments, and AIS/26AS verifications.',
    contextSnippetTemplate:
      'Corporate and individual returns must be filed electronically through the [Income Tax Department e-Filing Portal](https://www.incometax.gov.in).',
    recommendedPlacement: 'Under income tax return filing or corporate advance tax procedures',
  },

  // 4. IP India (Patents, Designs & Trademarks)
  {
    id: 'auth-ipindia-portal',
    sourceName: 'Controller General of Patents, Designs and Trade Marks (IP India)',
    authorityCategory: 'IP India',
    domain: 'ipindia.gov.in',
    targetUrl: 'https://ipindia.gov.in',
    isGovernmentPortal: true,
    defaultAnchorText: 'official IP India Registry',
    primaryCategories: ['Trademark & IP', 'Startups & Funding', 'Corporate Advisory'],
    statutoryKeywords: [
      'trademark',
      'tm',
      'patent',
      'copyright',
      'ip india',
      'intellectual property',
      'tm-a',
      'tm-m',
      'trademark objection',
      'trademark hearing',
      'nice classification',
      'class 9',
      'class 35',
      'class 42',
      'brand registration',
      'public search',
    ],
    rationaleTemplate:
      'Official statutory office for trademark search, patent registration, and design protection in India.',
    contextSnippetTemplate:
      'Before filing an application, conduct an exhaustive trademark availability search on the [official IP India Registry](https://ipindia.gov.in).',
    recommendedPlacement: 'Under brand search, classification, or trademark filing steps',
  },

  // 5. FSSAI & FoSCoS (Food Safety & Licensing)
  {
    id: 'auth-fssai-portal',
    sourceName: 'Food Safety and Standards Authority of India (FSSAI / FoSCoS)',
    authorityCategory: 'FSSAI',
    domain: 'foscos.fssai.gov.in',
    targetUrl: 'https://foscos.fssai.gov.in',
    isGovernmentPortal: true,
    defaultAnchorText: 'official FSSAI FoSCoS portal',
    primaryCategories: ['FSSAI & Licensing', 'Compliance & ROC'],
    statutoryKeywords: [
      'fssai',
      'food license',
      'foscos',
      'food safety',
      'fbo',
      'food business operator',
      'central license',
      'state license',
      'basic registration',
      'food packaging',
      'nutritional labeling',
    ],
    rationaleTemplate:
      'The designated statutory portal for Food Safety and Standards compliance, basic registration, and state/central licensing.',
    contextSnippetTemplate:
      'All food business operators must secure mandatory licensing and file annual returns on the [official FSSAI FoSCoS portal](https://foscos.fssai.gov.in).',
    recommendedPlacement: 'In food business compliance or licensing prerequisites',
  },

  // 6. RBI (Reserve Bank of India - Foreign Exchange & Banking)
  {
    id: 'auth-rbi-portal',
    sourceName: 'Reserve Bank of India (RBI)',
    authorityCategory: 'RBI',
    domain: 'rbi.org.in',
    targetUrl: 'https://www.rbi.org.in',
    isGovernmentPortal: true,
    defaultAnchorText: 'Reserve Bank of India (RBI)',
    primaryCategories: ['Corporate Advisory', 'Startups & Funding', 'Compliance & ROC'],
    statutoryKeywords: [
      'rbi',
      'fema',
      'foreign exchange management act',
      'fdi',
      'foreign direct investment',
      'fc-gpr',
      'fc-trs',
      'flair',
      'firms portal',
      'nbfc',
      'external commercial borrowing',
      'ecb',
    ],
    rationaleTemplate:
      'Apex regulatory body governing cross-border capital inflows, FEMA reporting, and financial entity compliances.',
    contextSnippetTemplate:
      'Foreign capital receipts and share allocations must comply with foreign investment guidelines mandated by the [Reserve Bank of India (RBI)](https://www.rbi.org.in).',
    recommendedPlacement: 'Under foreign investment, FDI reporting, or FEMA guidelines',
  },

  // 7. DGFT (Directorate General of Foreign Trade - Import/Export)
  {
    id: 'auth-dgft-portal',
    sourceName: 'Directorate General of Foreign Trade (DGFT)',
    authorityCategory: 'DGFT',
    domain: 'dgft.gov.in',
    targetUrl: 'https://www.dgft.gov.in',
    isGovernmentPortal: true,
    defaultAnchorText: 'official DGFT Foreign Trade portal',
    primaryCategories: ['FSSAI & Licensing', 'Corporate Advisory', 'Compliance & ROC'],
    statutoryKeywords: [
      'dgft',
      'iec',
      'importer exporter code',
      'export import',
      'foreign trade policy',
      'ftp',
      'export incentive',
      'rodtep',
      'advance authorization',
    ],
    rationaleTemplate:
      'Official statutory department issuing 10-digit Importer Exporter Codes (IEC) and administering Foreign Trade Policy.',
    contextSnippetTemplate:
      'Enterprises engaged in international trade can apply for and renew their 10-digit IEC directly through the [official DGFT Foreign Trade portal](https://www.dgft.gov.in).',
    recommendedPlacement: 'Under import/export licensing or cross-border trade readiness',
  },

  // 8. Udyam / MSME (Ministry of Micro, Small & Medium Enterprises)
  {
    id: 'auth-udyam-portal',
    sourceName: 'Ministry of MSME - Udyam Registration Portal',
    authorityCategory: 'MSME',
    domain: 'udyamregistration.gov.in',
    targetUrl: 'https://udyamregistration.gov.in',
    isGovernmentPortal: true,
    defaultAnchorText: 'official Udyam Registration Portal',
    primaryCategories: ['Startups & Funding', 'Company Registration', 'Corporate Advisory'],
    statutoryKeywords: [
      'udyam',
      'msme',
      'micro small medium enterprise',
      'udyam certificate',
      'msme registration',
      'priority sector lending',
      'delayed payments',
      'msme samadhaan',
    ],
    rationaleTemplate:
      'The zero-fee national portal for formal MSME classification and statutory registration certificates in India.',
    contextSnippetTemplate:
      'Eligible enterprises can complete zero-cost government registration and claim subsidies on the [official Udyam Registration Portal](https://udyamregistration.gov.in).',
    recommendedPlacement: 'In government subsidies, small enterprise benefits, or registration steps',
  },

  // 9. Labor & Social Security (EPFO & ESIC)
  {
    id: 'auth-epfo-portal',
    sourceName: "Employees' Provident Fund Organisation (EPFO)",
    authorityCategory: 'Labor & PF',
    domain: 'epfindia.gov.in',
    targetUrl: 'https://www.epfindia.gov.in',
    isGovernmentPortal: true,
    defaultAnchorText: "official EPFO Unified Portal",
    primaryCategories: ['Compliance & ROC', 'Corporate Advisory'],
    statutoryKeywords: [
      'epfo',
      'provident fund',
      'pf',
      'pf registration',
      'uan',
      'universal account number',
      'ecr',
      'electronic challan return',
      'employee social security',
    ],
    rationaleTemplate:
      'Statutory social security organization administering mandatory provident fund compliance for establishments.',
    contextSnippetTemplate:
      'Establishments reaching 20 or more employees must register and deposit monthly statutory contributions via the [official EPFO Unified Portal](https://www.epfindia.gov.in).',
    recommendedPlacement: 'Under labor compliance, employee benefits, or monthly statutory deductions',
  },
  {
    id: 'auth-esic-portal',
    sourceName: "Employees' State Insurance Corporation (ESIC)",
    authorityCategory: 'Labor & PF',
    domain: 'esic.gov.in',
    targetUrl: 'https://www.esic.gov.in',
    isGovernmentPortal: true,
    defaultAnchorText: 'Employees State Insurance Corporation (ESIC)',
    primaryCategories: ['Compliance & ROC', 'Corporate Advisory'],
    statutoryKeywords: ['esic', 'esi', 'employee state insurance', 'esic registration', 'health insurance scheme'],
    rationaleTemplate:
      'Self-financing social security and health insurance scheme for Indian workers earning below statutory wage ceiling.',
    contextSnippetTemplate:
      'Mandatory medical and disability insurance compliance is managed through the [Employees State Insurance Corporation (ESIC)](https://www.esic.gov.in).',
    recommendedPlacement: 'Under payroll compliance or worker insurance obligations',
  },
];
