import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  ArrowUpDown,
  Search,
  Filter,
  ExternalLink,
  Edit2,
  Gauge,
  FileText,
  X,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Activity,
  TrendingUp,
  Landmark,
  Link2,
} from 'lucide-react';
import {
  ContentRefreshCandidate,
  ContentRefreshScanResult,
  RefreshUrgencyLevel,
  RefreshSignal,
} from '../../types/contentRefresh';
import { fetchContentRefreshAudit } from '../../services/contentRefresh.service';
import { AdminNavSection } from './AdminSidebar';

interface AdminContentRefreshViewProps {
  onNavigateSection?: (section: AdminNavSection) => void;
}

export const AdminContentRefreshView: React.FC<AdminContentRefreshViewProps> = ({
  onNavigateSection,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ContentRefreshScanResult | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | RefreshUrgencyLevel>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'days' | 'traffic'>('score');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Signal Inspection Modal
  const [inspectingCandidate, setInspectingCandidate] = useState<ContentRefreshCandidate | null>(null);

  const loadAudit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchContentRefreshAudit();
      setScanResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to analyze content refresh');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

  // Distinct categories from candidates
  const availableCategories = useMemo(() => {
    if (!scanResult?.candidates) return [];
    const set = new Set<string>();
    scanResult.candidates.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [scanResult]);

  // Filtered & Sorted candidates
  const filteredCandidates = useMemo(() => {
    if (!scanResult?.candidates) return [];
    let list = [...scanResult.candidates];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }

    // Urgency filter
    if (urgencyFilter !== 'all') {
      list = list.filter((c) => c.urgencyLevel === urgencyFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      list = list.filter((c) => c.category === categoryFilter);
    }

    // Sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'score') {
        comparison = a.urgencyScore - b.urgencyScore;
      } else if (sortBy === 'days') {
        comparison = a.daysSinceUpdate - b.daysSinceUpdate;
      } else if (sortBy === 'traffic') {
        comparison = a.totalPageViews - b.totalPageViews;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return list;
  }, [scanResult, searchQuery, urgencyFilter, categoryFilter, sortBy, sortOrder]);

  const summary = scanResult?.summary || {
    totalArticles: 0,
    criticalCount: 0,
    recommendedCount: 0,
    freshCount: 0,
    averageUrgencyScore: 0,
  };

  const getUrgencyBadge = (level: RefreshUrgencyLevel, score: number) => {
    if (level === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>{score} • CRITICAL</span>
        </span>
      );
    }
    if (level === 'RECOMMENDED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{score} • RECOMMENDED</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>{score} • FRESH</span>
      </span>
    );
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Never';
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Module Title & Subheader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
              LACS Module #11
            </span>
            <span className="text-xs text-slate-400 font-mono">SEO Content Refresh Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>SEO Content Refresh & Update Suggestions</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Deterministic audit scoring articles 0–100 by regulatory freshness, stale years, meta tag gaps, link equity, and traffic exposure.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAudit}
          disabled={isLoading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700/80 transition-colors shadow-xs cursor-pointer self-start sm:self-auto shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
          <span>Re-Scan Content Refresh</span>
        </button>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Audited */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Total Audited</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{summary.totalArticles}</div>
          <p className="text-[11px] text-slate-400">Published statutory guides</p>
        </div>

        {/* Critical Refresh */}
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-400 text-xs">
            <span className="font-medium">Critical Updates</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-300">{summary.criticalCount}</div>
          <p className="text-[11px] text-rose-400/80">Score 70–100 (Urgent decay)</p>
        </div>

        {/* Recommended */}
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-400 text-xs">
            <span className="font-medium">Recommended</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300">{summary.recommendedCount}</div>
          <p className="text-[11px] text-amber-400/80">Score 40–69 (Aging content)</p>
        </div>

        {/* Fresh & Healthy */}
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-400 text-xs">
            <span className="font-medium">Fresh & Current</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-300">{summary.freshCount}</div>
          <p className="text-[11px] text-emerald-400/80">Avg Urgency: {summary.averageUrgencyScore}/100</p>
        </div>
      </div>

      {/* Filter and Sorting Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, category, or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Urgency Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value as any)}
              className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">All Urgencies ({summary.totalArticles})</option>
              <option value="CRITICAL">Critical ({summary.criticalCount})</option>
              <option value="RECOMMENDED">Recommended ({summary.recommendedCount})</option>
              <option value="FRESH">Fresh ({summary.freshCount})</option>
            </select>
          </div>

          {/* Category Filter */}
          {availableCategories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-orange-500"
          >
            <option value="score">Urgency Score</option>
            <option value="days">Days Since Update</option>
            <option value="traffic">Traffic Volume</option>
          </select>
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={`Sort ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800">
          <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white">Running Content Refresh Engine</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Cross-referencing statutory dates, year patterns, internal linking equity, and traffic analytics...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-950/20 border border-rose-900/40 text-center space-y-2">
          <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto" />
          <h4 className="text-sm font-bold text-white">Unable to Complete Content Refresh Scan</h4>
          <p className="text-xs text-rose-300">{error}</p>
          <button
            type="button"
            onClick={loadAudit}
            className="mt-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Audit</span>
          </button>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h4 className="text-base font-bold text-white">No Refresh Candidates Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || urgencyFilter !== 'all' || categoryFilter !== 'all'
              ? 'No articles match the specified search or filter criteria.'
              : 'All published articles are fully up to date with zero critical freshness decay detected.'}
          </p>
          {(searchQuery || urgencyFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setUrgencyFilter('all');
                setCategoryFilter('all');
              }}
              className="mt-2 text-xs text-orange-400 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-xs space-y-3 group"
            >
              {/* Row Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getUrgencyBadge(candidate.urgencyLevel, candidate.urgencyScore)}
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {candidate.category}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      Updated {candidate.daysSinceUpdate}d ago ({formatDate(candidate.updatedAt || candidate.publishedAt)})
                    </span>
                    {candidate.totalPageViews > 0 && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        {candidate.totalPageViews.toLocaleString()} views
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">
                    {candidate.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                    <span className="text-slate-500">/resources/blog/</span>
                    <span className="text-slate-300">{candidate.slug}</span>
                  </div>
                </div>

                {/* Candidate Action Buttons */}
                <div className="flex items-center gap-2 self-start shrink-0">
                  {/* Inspect Signals Action */}
                  <button
                    type="button"
                    onClick={() => setInspectingCandidate(candidate)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700/60"
                    title="Inspect itemized signal breakdown"
                  >
                    <Activity className="w-3.5 h-3.5 text-orange-400" />
                    <span>Inspect Signals ({candidate.signals.length})</span>
                  </button>

                  {/* Open in Blog Editor Action */}
                  {onNavigateSection && (
                    <button
                      type="button"
                      onClick={() => onNavigateSection('blogs')}
                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      title="Open in Blog CMS Editor"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Open in Editor</span>
                    </button>
                  )}

                  {/* Quick Run SEO Optimizer Action */}
                  {onNavigateSection && (
                    <button
                      type="button"
                      onClick={() => onNavigateSection('ai-seo-optimizer')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
                      title="Run Full SEO Optimizer on this article"
                    >
                      <Gauge className="w-4 h-4 text-amber-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Triggered Signal Summary Tags */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/80">
                {candidate.signals.map((sig, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] bg-slate-950 border border-slate-800 text-slate-300"
                    title={sig.description}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                    <span className="font-semibold text-white">{sig.title}</span>
                    <span className="text-[10px] text-amber-400 font-mono">+{sig.points}pts</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Signal Inspection Modal */}
      {inspectingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Itemized Signal Inspection
                  </h3>
                  <p className="text-xs text-slate-400">
                    Audit breakdown for "{inspectingCandidate.title}"
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingCandidate(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Score summary bar */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Composite Urgency Score</div>
                  <div className="text-2xl font-extrabold text-white mt-0.5">
                    {inspectingCandidate.urgencyScore}
                    <span className="text-sm font-normal text-slate-500"> / 100</span>
                  </div>
                </div>
                <div>
                  {getUrgencyBadge(inspectingCandidate.urgencyLevel, inspectingCandidate.urgencyScore)}
                </div>
              </div>

              {/* Signals list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Triggered Decay Signals ({inspectingCandidate.signals.length})
                </h4>

                {inspectingCandidate.signals.map((sig, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                        <h5 className="text-xs font-bold text-white">{sig.title}</h5>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        +{sig.points} Points
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-4">
                      {sig.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Link Health & Authority stats */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-500 flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Inbound Link Equity</span>
                  </div>
                  <div className="font-bold text-white text-sm">
                    {inspectingCandidate.inboundLinkCount} Inbound Links
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {inspectingCandidate.isOrphaned ? 'Orphaned article' : 'Connected to site architecture'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-500 flex items-center gap-1">
                    <Landmark className="w-3.5 h-3.5 text-slate-400" />
                    <span>Statutory Authority Citations</span>
                  </div>
                  <div className="font-bold text-white text-sm">
                    {inspectingCandidate.hasAuthorityLink ? 'Verified Portal Linked' : 'Missing Official Citation'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {inspectingCandidate.hasAuthorityLink ? 'Includes .gov.in/.nic.in link' : 'Needs official portal reference'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40 shrink-0">
              <span className="text-xs text-slate-400 font-mono">
                Slug: {inspectingCandidate.slug}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingCandidate(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
                {onNavigateSection && (
                  <button
                    type="button"
                    onClick={() => {
                      setInspectingCandidate(null);
                      onNavigateSection('blogs');
                    }}
                    className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Open in Blog Editor</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
