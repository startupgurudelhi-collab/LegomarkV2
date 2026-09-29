import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Activity,
  BarChart2,
  ShieldCheck,
  TrendingUp,
  BookOpen,
  Sliders,
  Check,
  Zap,
} from 'lucide-react';
import { CatalogSeoAuditResult, ArticleDeterministicAudit } from '../../types/seoOptimizer';
import { fetchCatalogSeoAudit, runCatalogSeoAudit } from '../../services/seoOptimizer.service';
import { AdminNavSection } from './AdminSidebar';

interface AdminCatalogSeoAuditViewProps {
  onNavigateSection?: (section: AdminNavSection) => void;
}

export const AdminCatalogSeoAuditView: React.FC<AdminCatalogSeoAuditViewProps> = ({
  onNavigateSection,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<CatalogSeoAuditResult | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | 'Excellent' | 'Good' | 'Needs Improvement' | 'Critical'>('all');
  const [sortBy, setSortBy] = useState<'score_asc' | 'score_desc' | 'words_desc' | 'title_asc'>('score_asc');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);

  // Load saved audit on page open (strictly GET, does not run POST)
  useEffect(() => {
    let isMounted = true;
    async function loadSavedAudit() {
      setIsLoading(true);
      setError(null);
      try {
        const saved = await fetchCatalogSeoAudit(false);
        if (isMounted) {
          setAuditData(saved);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load saved catalog audit');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSavedAudit();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handler for explicit "Run Audit" action (triggers POST)
  const handleRunAudit = async () => {
    setIsRunningAudit(true);
    setError(null);
    try {
      const freshResult = await runCatalogSeoAudit();
      setAuditData(freshResult);
    } catch (err: any) {
      setError(err.message || 'Failed to execute catalog audit');
    } finally {
      setIsRunningAudit(false);
    }
  };

  // Format date helper
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Never';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Grade color helpers
  const getGradeBadge = (grade: ArticleDeterministicAudit['grade']) => {
    switch (grade) {
      case 'Excellent':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'Good':
        return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
      case 'Needs Improvement':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'Critical':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  // Filtered & Sorted Articles
  const filteredArticles = useMemo(() => {
    if (!auditData?.articles) return [];

    let list = [...auditData.articles];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.slug.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.focusKeyword.toLowerCase().includes(q)
      );
    }

    // Grade filter
    if (gradeFilter !== 'all') {
      list = list.filter((a) => a.grade === gradeFilter);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'score_asc') return a.score - b.score;
      if (sortBy === 'score_desc') return b.score - a.score;
      if (sortBy === 'words_desc') return b.wordCount - a.wordCount;
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
      return 0;
    });

    return list;
  }, [auditData, searchQuery, gradeFilter, sortBy]);

  // Aggregate totals
  const totalCriticalIssues = useMemo(() => {
    if (!auditData?.articles) return 0;
    return auditData.articles.reduce((acc, a) => acc + a.criticalIssuesCount, 0);
  }, [auditData]);

  const totalWarnings = useMemo(() => {
    if (!auditData?.articles) return 0;
    return auditData.articles.reduce((acc, a) => acc + a.warningsCount, 0);
  }, [auditData]);

  const dimensionNameMap: Record<string, string> = {
    seoTitle: 'SEO Title Tag',
    metaDescription: 'Meta Description',
    focusKeyword: 'Focus Keyword',
    keywordUsage: 'Keyword Density & Placement',
    headingStructure: 'Heading Hierarchy (H1/H2/H3)',
    contentLength: 'Content Length & Depth',
    readability: 'Plain English Readability',
    internalLinks: 'Internal Service Links',
    imagesAlt: 'Image Assets & Alt Text',
    urlSlug: 'Canonical URL Slug',
    faqOpportunities: 'FAQ Q&A Schema Section',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
              LACS Module #18
            </span>
            <span className="text-xs text-slate-400">Deterministic SEO Diagnostic</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Catalog SEO Health Audit</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated 11-dimension on-page audit evaluating every published article in the catalog.
          </p>
          {auditData && (
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
              <span>Saved audit snapshot:</span>
              <span className="text-slate-300 font-medium">{formatDate(auditData.auditedAt)}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRunAudit}
            disabled={isRunningAudit || isLoading}
            className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/10 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningAudit ? 'animate-spin' : ''}`} />
            <span>{isRunningAudit ? 'Auditing Catalog...' : 'Run Fresh Audit'}</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Initial Loading State */}
      {isLoading && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">Loading Catalog SEO Audit...</h3>
          <p className="text-xs text-slate-400 mt-1">Reading snapshot from system metadata repository.</p>
        </div>
      )}

      {/* Empty / Un-audited State */}
      {!isLoading && !auditData && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center">
          <BarChart2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Catalog Audit Saved Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
            Run an initial deterministic audit across your published articles to evaluate on-page title tags, meta descriptions, headings, internal links, and content depth.
          </p>
          <button
            type="button"
            onClick={handleRunAudit}
            disabled={isRunningAudit}
            className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningAudit ? 'animate-spin' : ''}`} />
            <span>{isRunningAudit ? 'Running Audit...' : 'Run Initial Catalog Audit'}</span>
          </button>
        </div>
      )}

      {/* Audit Dashboard Content */}
      {!isLoading && auditData && (
        <>
          {/* Key Metrics Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Average Catalog Score */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Average Catalog Score</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold ${getScoreColor(auditData.averageScore)}`}>
                  {auditData.averageScore}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ 100</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Overall health across {auditData.totalArticles} published article(s)
              </div>
            </div>

            {/* Total Articles Audited */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Articles Audited</span>
                <BookOpen className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{auditData.totalArticles}</span>
                <span className="text-xs text-emerald-400 font-medium">Published</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                100% of live blog articles evaluated
              </div>
            </div>

            {/* Critical Dimension Issues */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Critical Issues</span>
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-rose-400">{totalCriticalIssues}</span>
                <span className="text-xs text-slate-500 font-medium">items</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                High-priority blockers needing remediation
              </div>
            </div>

            {/* Total Warnings */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Warnings</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-400">{totalWarnings}</span>
                <span className="text-xs text-slate-500 font-medium">notices</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Sub-optimal meta lengths, density, or anchors
              </div>
            </div>
          </div>

          {/* Grade Distribution & Dimension Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Grade Distribution Card */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Grade Distribution</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  {auditData.totalArticles} total articles
                </span>
              </div>

              <div className="space-y-3">
                {/* Excellent */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Excellent (85-100)
                    </span>
                    <span className="text-slate-300 font-bold">
                      {auditData.gradeDistribution.excellent}{' '}
                      <span className="text-slate-500 font-normal">
                        (
                        {auditData.totalArticles > 0
                          ? Math.round(
                              (auditData.gradeDistribution.excellent / auditData.totalArticles) * 100
                            )
                          : 0}
                        %)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${
                          auditData.totalArticles > 0
                            ? (auditData.gradeDistribution.excellent / auditData.totalArticles) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Good */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-blue-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Good (70-84)
                    </span>
                    <span className="text-slate-300 font-bold">
                      {auditData.gradeDistribution.good}{' '}
                      <span className="text-slate-500 font-normal">
                        (
                        {auditData.totalArticles > 0
                          ? Math.round((auditData.gradeDistribution.good / auditData.totalArticles) * 100)
                          : 0}
                        %)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${
                          auditData.totalArticles > 0
                            ? (auditData.gradeDistribution.good / auditData.totalArticles) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Needs Improvement */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Needs Improvement (50-69)
                    </span>
                    <span className="text-slate-300 font-bold">
                      {auditData.gradeDistribution.needsImprovement}{' '}
                      <span className="text-slate-500 font-normal">
                        (
                        {auditData.totalArticles > 0
                          ? Math.round(
                              (auditData.gradeDistribution.needsImprovement / auditData.totalArticles) *
                                100
                            )
                          : 0}
                        %)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${
                          auditData.totalArticles > 0
                            ? (auditData.gradeDistribution.needsImprovement /
                                auditData.totalArticles) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Critical */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Critical (&lt; 50)
                    </span>
                    <span className="text-slate-300 font-bold">
                      {auditData.gradeDistribution.critical}{' '}
                      <span className="text-slate-500 font-normal">
                        (
                        {auditData.totalArticles > 0
                          ? Math.round(
                              (auditData.gradeDistribution.critical / auditData.totalArticles) * 100
                            )
                          : 0}
                        %)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{
                        width: `${
                          auditData.totalArticles > 0
                            ? (auditData.gradeDistribution.critical / auditData.totalArticles) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Catalog Defect Counters */}
              <div className="mt-5 pt-4 border-t border-slate-800">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Systemic Catalog Defects
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block">Thin Articles (&lt;800w)</span>
                    <span className="text-sm font-bold text-rose-400">
                      {auditData.catalogIssuesSummary.thinContentCount}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block">Zero Internal Links</span>
                    <span className="text-sm font-bold text-rose-400">
                      {auditData.catalogIssuesSummary.zeroInternalLinksCount}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block">Missing Meta Snippet</span>
                    <span className="text-sm font-bold text-amber-400">
                      {auditData.catalogIssuesSummary.missingMetaDescriptionCount}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block">Missing FAQ Block</span>
                    <span className="text-sm font-bold text-amber-400">
                      {auditData.catalogIssuesSummary.missingFaqSectionCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dimension Health Breakdown Card */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>11-Dimension Health Overview</span>
                </h3>
                <span className="text-[11px] text-slate-400">Average Scores across Catalog</span>
              </div>

              <div className="space-y-2.5">
                {Object.entries(auditData.dimensionSummaries).map(([dimKey, dimData]) => {
                  const percent = Math.round((dimData.averageScore / dimData.maxScore) * 100);
                  const isLow = percent < 60;
                  const isMed = percent >= 60 && percent < 80;

                  return (
                    <div
                      key={dimKey}
                      className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/70 hover:border-slate-700/80 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-200">
                          {dimensionNameMap[dimKey] || dimKey}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            {dimData.criticalCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded text-rose-400 bg-rose-500/10 font-bold">
                                {dimData.criticalCount} crit
                              </span>
                            )}
                            {dimData.warningCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded text-amber-400 bg-amber-500/10">
                                {dimData.warningCount} warn
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-white min-w-[50px] text-right">
                            {dimData.averageScore} / {dimData.maxScore}
                          </span>
                        </div>
                      </div>

                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isLow ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Article Diagnostics & Scores List */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>Article Diagnostics & Prioritized Action Items</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing {filteredArticles.length} of {auditData.articles.length} published articles.
                  Sorted by urgency (lowest scoring first).
                </p>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Bar */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, keyword, slug..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Grade Filter */}
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Grades</option>
                  <option value="Critical">Critical (&lt; 50)</option>
                  <option value="Needs Improvement">Needs Improvement (50-69)</option>
                  <option value="Good">Good (70-84)</option>
                  <option value="Excellent">Excellent (85+)</option>
                </select>

                {/* Sort Option */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="score_asc">Score: Lowest First</option>
                  <option value="score_desc">Score: Highest First</option>
                  <option value="words_desc">Word Count: High to Low</option>
                  <option value="title_asc">Title: A to Z</option>
                </select>
              </div>
            </div>

            {/* Articles List / Table */}
            {filteredArticles.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                <Search className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No articles match your search criteria.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredArticles.map((article) => {
                  const isExpanded = expandedArticleId === article.slug;

                  return (
                    <div
                      key={article.slug}
                      className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-xl overflow-hidden transition-colors"
                    >
                      {/* Row Header */}
                      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getGradeBadge(
                                article.grade
                              )}`}
                            >
                              {article.grade}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              • {article.category}
                            </span>
                            {article.focusKeyword && (
                              <span className="text-[11px] text-amber-400/90 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 truncate max-w-[220px]">
                                kw: {article.focusKeyword}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-white hover:text-amber-400 transition-colors truncate">
                            {article.title}
                          </h4>

                          {/* Quick Metrics Bar */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                            <span>{article.wordCount} words</span>
                            <span>• ~{article.readingTimeMinutes}m read</span>
                            <span>• {article.internalLinkCount} internal links</span>
                            <span>• {article.imageCount} images</span>
                            <span>• Flesch: {article.fleschScore}/100</span>
                          </div>
                        </div>

                        {/* Score & Controls */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="flex items-baseline justify-end gap-1">
                              <span className={`text-2xl font-black ${getScoreColor(article.score)}`}>
                                {article.score}
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold">/ 100</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {article.criticalIssuesCount} crit • {article.warningsCount} warn
                            </div>
                          </div>

                          {/* Expand Dimensions Toggle */}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedArticleId(isExpanded ? null : article.slug)
                            }
                            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                            title={isExpanded ? 'Collapse' : 'Expand full diagnostics'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-amber-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Dimension Breakdown Drawer */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-900/30 space-y-4">
                          {/* 11 Dimensions Grid */}
                          <div>
                            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                              11 On-Page Dimension Scores
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {Object.entries(article.dimensions).map(([key, dim]) => (
                                <div
                                  key={key}
                                  className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/60"
                                >
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="font-semibold text-slate-300 truncate pr-2">
                                      {dim.title}
                                    </span>
                                    <span
                                      className={`font-mono font-bold text-xs ${
                                        dim.status === 'critical'
                                          ? 'text-rose-400'
                                          : dim.status === 'warning'
                                          ? 'text-amber-400'
                                          : 'text-emerald-400'
                                      }`}
                                    >
                                      {dim.score}/{dim.maxScore}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 line-clamp-2">
                                    {dim.summary}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Actionable Recommendations */}
                          {article.recommendations && article.recommendations.length > 0 && (
                            <div>
                              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Top Recommendations ({article.recommendations.length})
                              </h5>
                              <div className="space-y-2">
                                {article.recommendations.slice(0, 4).map((rec) => (
                                  <div
                                    key={rec.id}
                                    className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/70 flex items-start gap-2.5"
                                  >
                                    <Zap
                                      className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                                        rec.priority === 'high' ? 'text-rose-400' : 'text-amber-400'
                                      }`}
                                    />
                                    <div className="text-xs space-y-0.5">
                                      <div className="font-bold text-white flex items-center gap-2">
                                        <span>{rec.title}</span>
                                        <span className="text-[10px] text-slate-500 font-normal">
                                          ({rec.dimension})
                                        </span>
                                      </div>
                                      <p className="text-slate-400 text-[11px]">
                                        {rec.suggestedAction}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Single Article AI Optimizer Link */}
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[11px] text-slate-500 font-mono">
                              Canonical: /blog/{article.slug}
                            </span>
                            {onNavigateSection && (
                              <button
                                type="button"
                                onClick={() => onNavigateSection('ai-seo-optimizer')}
                                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <span>Open in Single-Article AI Optimizer</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
