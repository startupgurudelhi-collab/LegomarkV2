import React, { useState } from 'react';
import {
  Search,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Info,
  Briefcase,
  Layers,
  Scale,
  FileText,
  AlertOctagon,
  ChevronRight,
  Activity,
  Award,
  Sparkles,
  Download,
  FileDown,
  Globe,
  ExternalLink,
  ShieldAlert,
  X,
  User,
  Phone,
  Mail,
  Loader2,
  Check,
} from 'lucide-react';
import { searchCompanyName } from '../../services/company-search.service';
import { EntityType, NameSearchResponse } from '../../types/company-search';
import { submitPublicConsultation } from '../../services/lead.service';
import {
  generateCompanyNameReportPdf,
  CompanyReportLeadData,
} from '../../utils/company-name-search-pdf';

interface CompanyNameSearchPageProps {
  onOpenConsultation?: (serviceName?: string) => void;
  onNavigateHome?: () => void;
}

const ENTITY_CONFIG: Record<
  EntityType,
  {
    label: string;
    suffix: string;
    fullName: string;
    actReference: string;
    minDirectors: string;
    description: string;
  }
> = {
  private_limited: {
    label: 'Private Limited Company',
    suffix: 'Pvt Ltd',
    fullName: 'Private Limited',
    actReference: 'Companies Act 2013 · Section 2(68)',
    minDirectors: 'Min. 2 Directors & 2 Shareholders',
    description: 'Most popular structure for startups and growing enterprises with limited liability.',
  },
  llp: {
    label: 'Limited Liability Partnership',
    suffix: 'LLP',
    fullName: 'Limited Liability Partnership',
    actReference: 'Limited Liability Partnership Act 2008',
    minDirectors: 'Min. 2 Designated Partners',
    description: 'Combines organizational flexibility of partnerships with limited liability protection.',
  },
  opc: {
    label: 'One Person Company',
    suffix: '(OPC) Pvt Ltd',
    fullName: '(OPC) Private Limited',
    actReference: 'Companies Act 2013 · Section 2(62)',
    minDirectors: '1 Director / 1 Shareholder + 1 Nominee',
    description: 'Sole-founder structure with corporate identity and limited financial liability.',
  },
  public_limited: {
    label: 'Public Limited Company',
    suffix: 'Limited',
    fullName: 'Limited',
    actReference: 'Companies Act 2013 · Section 2(71)',
    minDirectors: 'Min. 3 Directors & 7 Shareholders',
    description: 'Statutory structure for capital-intensive enterprises and public equity listing.',
  },
  section_8: {
    label: 'Section 8 (Non-Profit)',
    suffix: 'Foundation',
    fullName: 'Foundation / Association',
    actReference: 'Companies Act 2013 · Section 8',
    minDirectors: 'Min. 2 Directors',
    description: 'Non-profit entity incorporated for charitable, scientific, or social objectives.',
  },
};

const ENTITY_OPTIONS: Array<{
  type: EntityType;
  label: string;
  suffix: string;
}> = [
  { type: 'private_limited', label: 'Private Limited', suffix: 'Pvt Ltd' },
  { type: 'llp', label: 'LLP', suffix: 'LLP' },
  { type: 'opc', label: 'One Person Company', suffix: '(OPC) Pvt Ltd' },
  { type: 'public_limited', label: 'Public Limited', suffix: 'Limited' },
  { type: 'section_8', label: 'Section 8 Non-Profit', suffix: 'Foundation' },
];

export const CompanyNameSearchPage: React.FC<CompanyNameSearchPageProps> = ({
  onOpenConsultation,
  onNavigateHome,
}) => {
  const [nameInput, setNameInput] = useState<string>('');
  const [entityType, setEntityType] = useState<EntityType>('private_limited');
  const [activityCategory, setActivityCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NameSearchResponse | null>(null);

  // Lead Capture & Report Generation State
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [leadName, setLeadName] = useState<string>('');
  const [leadMobile, setLeadMobile] = useState<string>('');
  const [leadEmail, setLeadEmail] = useState<string>('');
  const [isSubmittingLead, setIsSubmittingLead] = useState<boolean>(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [isReportGenerated, setIsReportGenerated] = useState<boolean>(false);
  const [leadSubmittedData, setLeadSubmittedData] = useState<CompanyReportLeadData | null>(null);
  const [isReportSuccessView, setIsReportSuccessView] = useState<boolean>(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nameInput.trim()) {
      setError('Please enter a proposed company name to verify.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchRes = await searchCompanyName({
        name: nameInput.trim(),
        entityType,
        activityCategory: activityCategory.trim() || undefined,
      });
      setResult(searchRes);
      // Reset report flow for new search query
      setIsReportGenerated(false);
      setLeadSubmittedData(null);
      setIsReportSuccessView(false);
      setLeadError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to check company name availability. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReportFlow = () => {
    if (isReportGenerated && leadSubmittedData) {
      handleDownloadExistingReport();
      return;
    }
    setLeadError(null);
    setIsReportSuccessView(false);
    setIsReportModalOpen(true);
  };

  const handleDownloadExistingReport = () => {
    if (!result || !leadSubmittedData) return;
    try {
      const doc = generateCompanyNameReportPdf({
        searchResult: result,
        leadData: leadSubmittedData,
        entityType,
        entityLabel: selectedEntityConfig.label,
        entitySuffix: selectedEntityConfig.suffix,
        actReference: selectedEntityConfig.actReference,
        activityCategory: activityCategory.trim() || undefined,
      });

      const sanitized = result.fullProposedName
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 40);

      doc.save(`Company_Name_Report_${sanitized}.pdf`);
    } catch (err: any) {
      setError('Failed to download report PDF. Please try again.');
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;

    const trimmedName = leadName.trim();
    const trimmedMobile = leadMobile.trim();
    const trimmedEmail = leadEmail.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setLeadError('Please enter your full name (minimum 2 characters).');
      return;
    }

    const digitsOnly = trimmedMobile.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setLeadError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setLeadError('Please enter a valid email address.');
      return;
    }

    setIsSubmittingLead(true);
    setLeadError(null);

    const leadData: CompanyReportLeadData = {
      fullName: trimmedName,
      phone: trimmedMobile,
      email: trimmedEmail,
    };

    try {
      // 1. Submit through existing lead infrastructure
      await submitPublicConsultation({
        fullName: trimmedName,
        phone: trimmedMobile,
        email: trimmedEmail,
        serviceInterested: `Company Name Search: ${result.fullProposedName}`,
        source: 'Company Name Search - Detailed Report',
        message: `Detailed report requested for proposed name: ${result.fullProposedName} (${selectedEntityConfig.label}). Score: ${result.availabilityScore}/100.`,
      });

      // 2. Generate PDF using current analysis data (local heuristics)
      const doc = generateCompanyNameReportPdf({
        searchResult: result,
        leadData,
        entityType,
        entityLabel: selectedEntityConfig.label,
        entitySuffix: selectedEntityConfig.suffix,
        actReference: selectedEntityConfig.actReference,
        activityCategory: activityCategory.trim() || undefined,
      });

      const sanitized = result.fullProposedName
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 40);

      // 3. Trigger immediate download
      doc.save(`Company_Name_Report_${sanitized}.pdf`);

      setLeadSubmittedData(leadData);
      setIsReportGenerated(true);
      setIsReportSuccessView(true);
    } catch (err: any) {
      console.error('Lead / Report generation error:', err);
      setLeadError(
        err?.message ||
          'Failed to process report request. Please check your network connection and try again.'
      );
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const getScoreTheme = (
    score: number,
    hasMcaConflict = false,
    brandRisk: 'low' | 'medium' | 'high' = 'low'
  ) => {
    if (hasMcaConflict) {
      return {
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        ringColor: '#F43F5E',
        label: 'High MCA Conflict',
        verdict: 'Preliminary Assessment: Existing MCA Conflict Detected',
        verdictColor: 'text-rose-700',
      };
    }
    if (brandRisk === 'high') {
      return {
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        ringColor: '#F59E0B',
        label: 'Caution: Brand Conflict Signal',
        verdict: 'Preliminary Assessment: Significant Web Brand Presence Detected',
        verdictColor: 'text-amber-800',
      };
    }
    if (brandRisk === 'medium') {
      return {
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        ringColor: '#F59E0B',
        label: 'Moderate Name Strength',
        verdict: 'Preliminary Assessment: Moderate Web Presence Detected',
        verdictColor: 'text-amber-800',
      };
    }
    if (score >= 85) {
      return {
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        ringColor: '#10B981',
        label: 'High Name Strength',
        verdict: 'Preliminary Assessment: Favorable Baseline',
        verdictColor: 'text-emerald-700',
      };
    }
    if (score >= 65) {
      return {
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
        ringColor: '#3B82F6',
        label: 'Moderate Name Strength',
        verdict: 'Preliminary Assessment: Acceptable Baseline',
        verdictColor: 'text-blue-700',
      };
    }
    if (score >= 45) {
      return {
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        ringColor: '#F59E0B',
        label: 'Moderate Name Strength',
        verdict: 'Preliminary Assessment: Review Recommended',
        verdictColor: 'text-amber-800',
      };
    }
    return {
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      ringColor: '#F43F5E',
      label: 'Low Name Strength',
      verdict: 'Preliminary Assessment: Conflict Risk Flagged',
      verdictColor: 'text-rose-700',
    };
  };

  const renderRadialGauge = (score: number, ringColor: string) => {
    const radius = 48;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

    return (
      <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">{score}</span>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            / 100
          </span>
        </div>
      </div>
    );
  };

  const selectedEntityConfig = ENTITY_CONFIG[entityType];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* 1. Header Hero Banner */}
      <div className="bg-[#0B132B] text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            {onNavigateHome ? (
              <button
                onClick={onNavigateHome}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </button>
            ) : (
              <div />
            )}
            <div className="text-xs text-orange-400 font-semibold tracking-wider uppercase flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              MCA Rule 8 Intelligence
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Company Name Availability Search
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
              Preliminary assessment of your proposed business name against Ministry of Corporate Affairs (MCA) Rule 8 principles,
              prohibited emblems, suffix conventions, and local phonetic similarity benchmarks.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Interactive Search Form Card */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Entity Type Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
                Select Company / Entity Constitution
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {ENTITY_OPTIONS.map((opt) => {
                  const isSelected = entityType === opt.type;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setEntityType(opt.type)}
                      className={`px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {opt.label}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Suffix: {opt.suffix}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Row */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Proposed Business Name & Activity
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="e.g. Apex Global Innovations"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-slate-50/50"
                  />
                </div>

                <div className="sm:w-64">
                  <input
                    type="text"
                    value={activityCategory}
                    onChange={(e) => setActivityCategory(e.target.value)}
                    placeholder="Business Activity (e.g. Software, Advisory)"
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold text-sm transition-colors cursor-pointer shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 shrink-0 disabled:opacity-60"
                >
                  <Search className="w-4 h-4" />
                  {isLoading ? 'Checking Rule 8...' : 'Check Availability'}
                </button>
              </div>

              {error && (
                <div className="text-xs font-medium text-rose-600 flex items-center gap-1.5 pt-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {error}
                </div>
              )}
            </div>
          </form>

          {/* Quick Statutory Rule Guidance */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
            <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800">Statutory Architecture:</strong> Under Section 4(2) of the Companies Act 2013 and MCA Rule 8,
              an acceptable name comprises a <strong>Distinctive Coined Element</strong> + <strong>Activity Keyword</strong> (e.g. Technologies, Solutions, Advisory) + <strong>Mandatory Suffix</strong> ({selectedEntityConfig.suffix}).
            </div>
          </div>
        </div>

        {/* 3. Comprehensive Result & Analysis UI */}
        {result && (
          <div className="mt-8 space-y-6 pb-20">
            {/* Header / Primary Assessment Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 space-y-6">
              {/* Top Row: Proposed Name, Gauge & Verdict */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Award className="w-4 h-4 text-orange-600" />
                    <span>Overall Name Strength Assessment</span>
                  </div>

                  {/* 1. Proposed Company Name */}
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {result.fullProposedName}
                  </h2>

                  {/* 2 & 3. Business Activity and Company Type meta line */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <strong>Activity:</strong>{' '}
                      <span>{activityCategory.trim() || 'General Commercial / Technology Services'}</span>
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <strong>Type:</strong> <span>{selectedEntityConfig.label} ({selectedEntityConfig.suffix})</span>
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-500">
                      {selectedEntityConfig.actReference}
                    </span>
                  </div>

                  {/* 5. Overall Assessment Summary */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
                    {result.summary}
                  </p>
                </div>

                {/* 4. Overall Name Strength Score /100 with Radial Gauge */}
                {(() => {
                  const hasMcaConflict = Boolean(
                    result.mcaRegisteredNames?.some((m) => m.similarity >= 80)
                  );
                  const brandRisk = result.onlineBrandPresence?.riskLevel || 'low';
                  const displayScore = result.overallScore ?? result.availabilityScore;
                  const theme = getScoreTheme(displayScore, hasMcaConflict, brandRisk);

                  return (
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shrink-0">
                      {renderRadialGauge(displayScore, theme.ringColor)}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                            Overall Name Strength
                          </span>
                          {/* MCA Risk Badge */}
                          {hasMcaConflict ? (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                              MCA Conflict: HIGH
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              MCA Risk: LOW
                            </span>
                          )}
                          {/* Web/Brand Presence Risk Badge */}
                          {brandRisk === 'high' ? (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                              Web/Brand Risk: HIGH
                            </span>
                          ) : brandRisk === 'medium' ? (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                              Web/Brand Risk: MEDIUM
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Web/Brand Risk: LOW
                            </span>
                          )}
                          {/* Trademark Risk Diagnostic Badge */}
                          {result.trademarkResult && (
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                                result.trademarkResult.riskLevel === 'high'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : result.trademarkResult.riskLevel === 'medium'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}
                            >
                              Trademark Risk: {result.trademarkResult.riskLevel.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="text-base font-extrabold text-slate-900 leading-tight">
                          {theme.label}
                        </div>
                        <div className={`text-xs font-semibold ${theme.verdictColor}`}>
                          {theme.verdict}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-600 pt-0.5">
                          <span>
                            MCA Assessment: <strong>{result.mcaScore ?? displayScore}</strong>/100 <span className="text-[10px] text-slate-400">(70% weight)</span>
                          </span>
                          {result.brandScore !== undefined && (
                            <>
                              <span aria-hidden="true" className="text-slate-300">·</span>
                              <span>
                                Online Brand Presence: <strong>{result.brandScore}</strong>/100 <span className="text-[10px] text-slate-400">(30% weight)</span>
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Overall Name Strength: <strong>{displayScore}</strong> / 100 · Preliminary diagnostic assessment
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Entity Constitution Card Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium uppercase tracking-wider">
                    Constitution Type
                  </span>
                  <strong className="text-slate-900 block mt-0.5">
                    {selectedEntityConfig.label}
                  </strong>
                  <span className="text-slate-500 text-[11px]">
                    Suffix: {selectedEntityConfig.suffix}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium uppercase tracking-wider">
                    Statutory Framework
                  </span>
                  <strong className="text-slate-900 block mt-0.5">
                    {selectedEntityConfig.actReference}
                  </strong>
                  <span className="text-slate-500 text-[11px]">
                    {selectedEntityConfig.minDirectors}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium uppercase tracking-wider">
                    Entity Scope
                  </span>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">
                    {selectedEntityConfig.description}
                  </p>
                </div>
              </div>

              {/* Detailed Report Download Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#1E293B] to-[#0F172A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md border border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                    <FileDown className="w-4 h-4" />
                    <span>Statutory Diagnostic Report</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {isReportGenerated
                      ? 'Detailed Statutory Report Ready'
                      : 'Generate Detailed Company Name Report (PDF)'}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    {isReportGenerated
                      ? `Generated for ${leadSubmittedData?.fullName}. Download anytime with complete statutory checklist, local heuristics, and SPICe+ Part A roadmap.`
                      : 'Download a complete multi-page A4 statutory report with Rule 8 evaluation criteria, local phonetic proximity tables, and MoA drafting guidelines.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenReportFlow}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold text-sm transition-all shadow-md shadow-orange-600/30 shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isReportGenerated ? 'Download PDF Report' : 'Generate Detailed Report'}</span>
                </button>
              </div>

              {/* 6. Rule & Restricted Word Analysis */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-orange-600" />
                    MCA Rule 8 & Restricted Word Compliance Analysis
                  </h3>
                  <span className="text-xs text-slate-500">
                    Companies (Incorporation) Rules, 2014
                  </span>
                </div>

                {/* Restricted words alert if any detected */}
                {result.prohibitedWordsFound.length > 0 && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 text-rose-600" />
                      Prohibited Word(s) Detected under Section 4(2)
                    </div>
                    <p className="text-rose-700 leading-relaxed">
                      The proposed name contains protected government/emblem terms: <strong>"{result.prohibitedWordsFound.join(', ')}"</strong>.
                      Such names are reserved for governmental or statutory bodies under the Emblems and Names (Prevention of Improper Use) Act, 1950 and will be rejected by the Registrar of Companies.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {result.checks.map((chk) => (
                    <div
                      key={chk.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          {chk.severity === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : chk.severity === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span>{chk.title}</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                            chk.passed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : chk.severity === 'warning'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {chk.passed ? 'Compliant' : 'Review Required'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {chk.description}
                      </p>

                      {chk.mcaReference && (
                        <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                          Authority: {chk.mcaReference}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Similar Name Findings */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    {result.mcaSource === 'live_mca_api' ? (
                      <Building2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    <span>
                      {result.mcaSource === 'live_mca_api'
                        ? 'MCA Company Master Similarity Findings'
                        : 'Phonetic Similarity Findings (Local Heuristics)'}
                    </span>
                  </h3>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    {result.mcaSource === 'live_mca_api' ? (
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        MCA Master Data Source
                      </span>
                    ) : (
                      <span>Local Benchmark Dataset · Not Live MCA Master Data</span>
                    )}
                  </span>
                </div>

                {/* MCA Conflict Notice Banner if conflict detected */}
                {result.mcaRegisteredNames && result.mcaRegisteredNames.some((m) => m.similarity >= 80) && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-rose-800">
                      <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                      MCA Conflict Risk: HIGH — Modification Required
                    </div>
                    <p className="leading-relaxed text-rose-700">
                      Live MCA Master Data contains an exact or highly similar registered corporate entity. Under Section 4(2) of the Companies Act 2013 and MCA Rule 8(2)(a), identical or deceptively similar names are strictly prohibited. The proposed name has an existing MCA conflict and should be reviewed or changed prior to filing.
                    </p>
                  </div>
                )}

                {result.similarRegisteredNames.length > 0 ? (
                  <div className="space-y-3">
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                      {result.similarRegisteredNames.map((sim, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {sim.name}
                              </span>
                              {sim.source === 'mca_api' ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                                  MCA Master Data
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  Local Heuristic
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 text-[11px] flex flex-wrap items-center gap-1.5">
                              {sim.source === 'mca_api' ? (
                                <>
                                  <span>Source: MCA Company Master</span>
                                  {sim.cin && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="font-mono text-slate-700 font-semibold">CIN: {sim.cin}</span>
                                    </>
                                  )}
                                  {sim.companyStatus && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span>Status: {sim.companyStatus}</span>
                                    </>
                                  )}
                                  {sim.roc && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span>ROC: {sim.roc}</span>
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span>Source: Local Reference Benchmark</span>
                                  <span aria-hidden="true">·</span>
                                  <span>Evaluation: Heuristic Phonetic Match</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="sm:text-right">
                            <span className="font-extrabold text-slate-900 text-sm">
                              {sim.similarity}% Match
                            </span>
                            <span
                              className={`block text-[11px] font-semibold ${
                                sim.similarity >= 80
                                  ? 'text-rose-600'
                                  : sim.similarity >= 65
                                  ? 'text-amber-600'
                                  : 'text-slate-500'
                              }`}
                            >
                              {sim.similarity >= 80
                                ? (sim.source === 'mca_api' ? 'High Similarity (MCA Conflict Risk: HIGH)' : 'High Similarity (Potential Phonetic Conflict)')
                                : 'Moderate Phonetic Proximity'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Keep heuristic findings separate if MCA data was also returned */}
                    {result.mcaSource === 'live_mca_api' &&
                      result.heuristicRegisteredNames &&
                      result.heuristicRegisteredNames.length > 0 && (
                        <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2 text-xs">
                          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-slate-400" />
                            <span>Separate Local Benchmark Heuristics</span>
                          </div>
                          <div className="divide-y divide-slate-200/60 bg-white rounded-lg border border-slate-200/80">
                            {result.heuristicRegisteredNames.slice(0, 3).map((hSim, hIdx) => (
                              <div
                                key={hIdx}
                                className="p-2.5 sm:px-3 flex items-center justify-between text-xs"
                              >
                                <span className="font-medium text-slate-700">{hSim.name}</span>
                                <span className="text-slate-500 font-mono text-[11px]">
                                  {hSim.similarity}% match (heuristic)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-900">
                        {result.mcaSource === 'live_mca_api'
                          ? 'Zero Conflicting Records in MCA Master Data:'
                          : 'No High Phonetic Matches in Local Benchmark Index:'}
                      </strong>{' '}
                      {result.mcaSource === 'live_mca_api'
                        ? 'No direct identically named entities or deceptive conflicts were returned from the MCA registry search.'
                        : 'No names with high phonetic similarity were detected in the local reference dataset. Live MCA database verification must be conducted separately during official filing.'}
                    </div>
                  </div>
                )}
              </div>

              {/* 8. Business Activity Relevance */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Business Activity & Object Clause Relevance
                </h3>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600 leading-relaxed">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-800">
                    <span className="font-bold">
                      Designated Industry Category: {activityCategory.trim() ? `"${activityCategory.trim()}"` : 'Corporate Commercial / Technology'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      MCA Rule 8(2)(b)(ii)
                    </span>
                  </div>

                  <p>
                    Under MCA guidelines, a proposed company name should correlate directly with the primary industrial objects stated in Clause III(A) of the Memorandum of Association (MoA).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px]">
                    <div className="p-3 bg-white rounded-lg border border-slate-200/80">
                      <strong className="text-slate-800 block mb-1">Coined Prefix Presence:</strong>
                      {result.checks.find((c) => c.id === 'rule-distinctiveness')?.passed ? (
                        <span className="text-emerald-700 font-medium">
                          ✓ Contains distinctive coined identifier distinguishing it from generic entities.
                        </span>
                      ) : (
                        <span className="text-rose-700 font-medium">
                          ✗ Pure generic word detected. Must append a coined or distinctive prefix.
                        </span>
                      )}
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200/80">
                      <strong className="text-slate-800 block mb-1">Activity Indicator Suffix:</strong>
                      <span className="text-slate-700">
                        Pairing with activity keywords (e.g. Technologies, Solutions, Advisory, Logistics) prevents ROC resubmission delays.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Online Brand Presence Analysis (Layer 2) */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    Online Brand Presence Analysis
                  </h3>
                  {result.onlineBrandPresence && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Layer 2 Web Intelligence</span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border ${
                          result.onlineBrandPresence.riskLevel === 'high'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : result.onlineBrandPresence.riskLevel === 'medium'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        Web/Brand Presence Risk: {result.onlineBrandPresence.riskLevel.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {result.onlineBrandPresence ? (
                  <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-sm text-xs">
                    {/* Concise Finding / Summary */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Web Intelligence Summary
                      </span>
                      <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                        {result.onlineBrandPresence.findingSummary}
                      </p>
                    </div>

                    {/* Combined Preliminary Assessment Signal */}
                    {result.combinedAssessment && (
                      <div
                        className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          result.combinedAssessment.overallRisk === 'high'
                            ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                            : result.combinedAssessment.overallRisk === 'medium'
                            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                            : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold flex items-center gap-1.5 text-xs">
                            <ShieldCheck className="w-4 h-4 shrink-0" />
                            <span>Combined Preliminary Signal: {result.combinedAssessment.overallRisk.toUpperCase()} RISK</span>
                          </div>
                          <p className="text-[11px] leading-relaxed opacity-90">
                            {result.combinedAssessment.guidance}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Commercial Brands & Operating Entities Identified */}
                    {result.onlineBrandPresence.brandsFound.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            Identified Commercial Brands & Operating Entities
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Distinguishing commercial usage strength
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {result.onlineBrandPresence.brandsFound.map((brand, bIdx) => (
                            <div
                              key={bIdx}
                              className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-slate-900 text-xs truncate">
                                  {brand.name}
                                </span>
                                <span
                                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                    brand.usageStrength === 'strong'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                      : brand.usageStrength === 'moderate'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {brand.usageStrength === 'strong'
                                    ? 'Strong Commercial Usage'
                                    : brand.usageStrength === 'moderate'
                                    ? 'Moderate Usage'
                                    : 'Incidental Mention'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                                {brand.description}
                              </p>
                              {brand.url && (
                                <a
                                  href={brand.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline pt-0.5 truncate max-w-full"
                                >
                                  <span>{brand.url.replace(/^https?:\/\//, '').split('/')[0]}</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Relevant Web Sources with Clickable Citations */}
                    {result.onlineBrandPresence.sources.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                          Relevant Web Sources & Citations
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {result.onlineBrandPresence.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] transition-colors border border-slate-200/80 max-w-xs truncate"
                              title={src.title}
                            >
                              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{src.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* When no significant evidence was found */}
                    {result.onlineBrandPresence.brandsFound.length === 0 &&
                      result.onlineBrandPresence.sources.length === 0 && (
                        <div className="p-3 bg-slate-50 rounded-lg text-slate-600 text-xs flex items-center gap-2">
                          <Info className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>No significant web presence found for this specific proposed name across public search indexing.</span>
                        </div>
                      )}

                    {/* Statutory / Trademark Caveat Notice */}
                    <div className="text-[10px] text-slate-400 leading-relaxed pt-1 border-t border-slate-100">
                      <strong>Search Notice:</strong> This online brand presence analysis queries public web references in real-time via integrated search grounding. This is NOT an official trademark search and does NOT guarantee or certify trademark availability. Public web presence does not supersede statutory Ministry of Corporate Affairs (MCA) registration records.
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>No significant web presence found.</span>
                  </div>
                )}
              </div>

              {/* Layer 3: Trademark Conflict Analysis (TradeMarks Registry / TradeMarx) */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-purple-600" />
                    Layer 3: Trademark Conflict Analysis
                  </h3>
                  {result.trademarkResult && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Trade Marks Registry Data</span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border ${
                          result.trademarkResult.riskLevel === 'high'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : result.trademarkResult.riskLevel === 'medium'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        Trademark Risk: {result.trademarkResult.riskLevel.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {result.trademarkResult ? (
                  <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-sm text-xs">
                    {/* Concise Finding / Summary */}
                    {result.trademarkResult.findingSummary && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                          Registry Conflict Finding
                        </span>
                        <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                          {result.trademarkResult.findingSummary}
                        </p>
                      </div>
                    )}

                    {/* Meta Bar */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>
                        <strong>Target Mark:</strong> {result.normalizedName}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>
                        <strong>Nice Class:</strong>{' '}
                        {result.trademarkResult.searchedClass !== undefined
                          ? `Class ${result.trademarkResult.searchedClass}`
                          : 'Cross-Class Registry Search'}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>
                        <strong>Records Found:</strong> {result.trademarkResult.records.length}
                      </span>
                    </div>

                    {/* Records List / Table */}
                    {result.trademarkResult.records.length > 0 ? (
                      <div className="space-y-2.5 pt-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Identified Trademark Registry Records
                        </div>
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30">
                          {result.trademarkResult.records.map((rec, rIdx) => (
                            <div key={rIdx} className="p-3.5 space-y-2 hover:bg-slate-50 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm">
                                      {rec.name || 'Figurative / Device Mark'}
                                    </span>
                                    {rec.tmClass && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                        Class {rec.tmClass}
                                      </span>
                                    )}
                                    {rec.trademarkStatus && (
                                      <span
                                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                          /registered/i.test(rec.trademarkStatus)
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            : /objected|opposed/i.test(rec.trademarkStatus)
                                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                                            : /pending|advertised/i.test(rec.trademarkStatus)
                                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}
                                      >
                                        Status: {rec.trademarkStatus}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    {rec.applicationNo && (
                                      <span>Application No: <strong>{rec.applicationNo}</strong></span>
                                    )}
                                    {rec.applicationDate && (
                                      <>
                                        <span aria-hidden="true" className="text-slate-300">·</span>
                                        <span>Filed: {rec.applicationDate}</span>
                                      </>
                                    )}
                                    {rec.proprietorName && (
                                      <>
                                        <span aria-hidden="true" className="text-slate-300">·</span>
                                        <span>Proprietor: <strong>{rec.proprietorName}</strong></span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {rec.similarity !== undefined && (
                                  <div className="text-right shrink-0">
                                    <span
                                      className={`text-[10px] font-extrabold px-2 py-1 rounded-md border ${
                                        rec.similarity >= 80
                                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                                          : rec.similarity >= 60
                                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                                          : 'bg-slate-100 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      {rec.similarity}% Proximity
                                    </span>
                                  </div>
                                )}
                              </div>

                              {rec.details && (
                                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-white p-2 rounded border border-slate-100">
                                  <strong>Goods / Services:</strong> {rec.details}
                                </p>
                              )}

                              {rec.url && (
                                <div className="pt-0.5">
                                  <a
                                    href={rec.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-medium text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 hover:underline"
                                  >
                                    <span>View Trade Marks Registry Record</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-lg text-slate-600 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>No conflicting word marks or device marks found on record under this query.</span>
                      </div>
                    )}

                    {/* Statutory Distinction Notice */}
                    <div className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-100">
                      <strong>Registry Distinction Notice:</strong> Trademark Conflict Analysis checks the official Trade Marks Registry database via TradeMarx. This preliminary search distinguishes registered/pending intellectual property from MCA corporate names. This search does NOT constitute official trademark registration, guarantee of non-infringement, or legal opinion. Formal Form TM-A filings are subject to IP India examiner scrutiny under Sections 9 and 11 of the Trade Marks Act, 1999.
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Trademark search service is in standby or unconfigured.</span>
                  </div>
                )}
              </div>

              {/* 9. Clear Recommendations */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-orange-600" />
                  Clear Statutory Recommendations & Next Steps
                </h3>

                <div className="p-5 rounded-xl bg-gradient-to-r from-orange-50/70 via-amber-50/40 to-white border border-orange-200 space-y-3 text-xs">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    <span>
                      {result.mcaRegisteredNames?.some((m) => m.similarity >= 80)
                        ? 'Preliminary Next Step: Modify Proposed Name Elements Prior to Official Submission'
                        : result.onlineBrandPresence?.riskLevel === 'high'
                        ? 'Preliminary Next Step: Conduct Comprehensive Trademark & Common Law Brand Review'
                        : result.onlineBrandPresence?.riskLevel === 'medium'
                        ? 'Preliminary Next Step: Conduct Trademark Class & Distinctiveness Review'
                        : (result.overallScore ?? result.availabilityScore) >= 85
                        ? 'Preliminary Next Step: Suitable for Formal SPICe+ Part A / RUN Submission'
                        : (result.overallScore ?? result.availabilityScore) >= 65
                        ? 'Preliminary Next Step: Conduct Trademark Class & Distinctiveness Review'
                        : 'Preliminary Next Step: Modify Proposed Name Elements Prior to Official Submission'}
                    </span>
                  </div>

                  <div className="space-y-2 text-slate-700 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        1
                      </span>
                      <span>
                        <strong>Prepare Primary & Secondary Preferences:</strong> MCA SPICe+ Part A permits submission of 2 proposed name choices per filing. Always submit an alternate coined variation.
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        2
                      </span>
                      <span>
                        <strong>Verify Nice Trademark Class:</strong> Ensure no registered conflicting trademarks exist in the relevant NICE class corresponding to your primary business activity.
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        3
                      </span>
                      <span>
                        <strong>Draft Main Object Clause:</strong> Prepare precise objects aligning with your activity indicator for inclusion in SPICe+ MoA.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 10. Statutory Disclaimer */}
              <div className="p-4 rounded-xl bg-slate-100/90 border border-slate-200/90 text-slate-600 text-xs space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Statutory & Preliminary Assessment Disclaimer
                </div>
                <p className="leading-relaxed text-[11px] text-slate-600">
                  This tool provides a preliminary Name Strength Score and regulatory compliance assessment based on Ministry of Corporate Affairs (MCA) Rule 8 principles, prohibited words, and registered corporate data. Live MCA/company-master lookup is performed through the integrated data provider, but this preliminary assessment does not constitute official MCA name approval, reservation, or a legal guarantee of availability. Official reservation and final approval authority rests exclusively with the Central Registration Centre (CRC) under the Ministry of Corporate Affairs (MCA), Government of India, upon formal SPICe+ Part A / RUN submission.
                </p>
              </div>

              {/* Professional Filing Action CTA */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Need professional assistance filing SPICe+ Part A or drafting your MoA Object Clause?
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleOpenReportFlow}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-800 hover:bg-slate-50 font-semibold text-xs sm:text-sm transition-colors cursor-pointer shrink-0 shadow-sm"
                  >
                    <Download className="w-4 h-4 text-orange-600" />
                    <span>{isReportGenerated ? 'Download PDF Report' : 'Generate Detailed Report'}</span>
                  </button>

                  {onOpenConsultation && (
                    <button
                      onClick={() =>
                        onOpenConsultation(`Company Registration: ${result.fullProposedName}`)
                      }
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer shadow-md shadow-orange-600/20 shrink-0"
                    >
                      <span>Consult CS / CA for Name Filing</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Lead Capture & Report Download Modal */}
      {isReportModalOpen && result && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden relative my-8">
            {/* Modal Header */}
            <div className="bg-[#0B132B] text-white p-5 sm:p-6 border-b border-slate-800 relative">
              <button
                type="button"
                onClick={() => {
                  if (!isSubmittingLead) setIsReportModalOpen(false);
                }}
                disabled={isSubmittingLead}
                aria-label="Close modal"
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1">
                <FileDown className="w-4 h-4" />
                <span>Statutory Name Availability Report</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {isReportSuccessView ? 'Report Generated Successfully' : 'Generate Detailed Report'}
              </h3>
              <p className="text-xs text-slate-300 mt-1 truncate">
                {result.fullProposedName}
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-4">
              {isReportSuccessView ? (
                <div className="space-y-4 text-center py-2">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                    <Check className="w-8 h-8 stroke-[2.5]" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-900">
                      Your Official Report Has Been Downloaded!
                    </h4>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                      The comprehensive A4 statutory diagnostic for <strong>{result.fullProposedName}</strong> has been generated and saved to your device.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-left text-slate-700 space-y-1">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-orange-600" />
                      <span>Report Summary Snapshot</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Entity: {selectedEntityConfig.label} · Strength Score: {result.availabilityScore}/100
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Prepared for: {leadSubmittedData?.fullName} ({leadSubmittedData?.phone})
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleDownloadExistingReport}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md shadow-orange-600/20"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF Again</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsReportModalOpen(false)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl p-3 text-xs text-orange-900 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      Enter your contact information to unlock and immediately download the executive statutory PDF report for <strong>{result.fullProposedName}</strong>.
                    </div>
                  </div>

                  {leadError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{leadError}</span>
                    </div>
                  )}

                  {/* Name Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={leadName}
                        onChange={(e) => {
                          setLeadName(e.target.value);
                          if (leadError) setLeadError(null);
                        }}
                        placeholder="e.g. Rajesh Kumar"
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-900 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={leadMobile}
                        onChange={(e) => {
                          setLeadMobile(e.target.value);
                          if (leadError) setLeadError(null);
                        }}
                        placeholder="10-digit mobile number"
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-900 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={leadEmail}
                        onChange={(e) => {
                          setLeadEmail(e.target.value);
                          if (leadError) setLeadError(null);
                        }}
                        placeholder="rajesh@example.com"
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-900 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 leading-relaxed pt-1">
                    By submitting, you agree to receive consultation correspondence regarding statutory corporate compliance. We respect your confidentiality.
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isSubmittingLead}
                      onClick={() => setIsReportModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmittingLead}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md shadow-orange-600/20 disabled:opacity-60"
                    >
                      {isSubmittingLead ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Report...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Submit & Download PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CompanyNameSearchPage;
