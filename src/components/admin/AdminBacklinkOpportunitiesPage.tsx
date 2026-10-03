import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Share2,
  Target,
  TrendingUp,
  Sparkles,
  Link2,
  Filter,
  Search,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Layers,
  AlertCircle,
  CheckCircle2,
  Mail,
  ChevronDown,
  ChevronUp,
  Globe,
  SlidersHorizontal,
  X,
  Compass,
} from 'lucide-react';
import { fetchBacklinkOpportunities } from '../../services/backlink.service';
import {
  BacklinkOpportunityCandidate,
  BacklinkOpportunityResult,
  BacklinkOutreachType,
  BacklinkPriority,
} from '../../types/backlink';

export const AdminBacklinkOpportunitiesPage: React.FC = () => {
  const [data, setData] = useState<BacklinkOpportunityResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [onlyStrikingDistance, setOnlyStrikingDistance] = useState<boolean>(false);

  // Expanded pitch template per candidate ID
  const [expandedPitchId, setExpandedPitchId] = useState<string | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  const loadOpportunities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchBacklinkOpportunities();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load backlink opportunities');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  const copyToClipboard = async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItemId(identifier);
      setTimeout(() => {
        setCopiedItemId((curr) => (curr === identifier ? null : curr));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  // Filter candidates locally for instantaneous responsive UI
  const filteredCandidates = useMemo(() => {
    if (!data?.candidates) return [];

    return data.candidates.filter((candidate) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = candidate.targetTitle.toLowerCase().includes(q);
        const matchesUrl = candidate.targetUrl.toLowerCase().includes(q);
        const matchesCategory = candidate.category.toLowerCase().includes(q);
        const matchesQuery = candidate.gscMetrics?.primaryQuery.toLowerCase().includes(q);
        const matchesReason = candidate.rationale.toLowerCase().includes(q);
        if (!matchesTitle && !matchesUrl && !matchesCategory && !matchesQuery && !matchesReason) {
          return false;
        }
      }

      // 2. Type filter
      if (selectedType !== 'all' && candidate.outreachType !== selectedType) {
        return false;
      }

      // 3. Priority filter
      if (selectedPriority !== 'all' && candidate.priority !== selectedPriority) {
        return false;
      }

      // 4. Striking distance filter
      if (onlyStrikingDistance && !candidate.gscMetrics?.isStrikingDistance) {
        return false;
      }

      return true;
    });
  }, [data, searchQuery, selectedType, selectedPriority, onlyStrikingDistance]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedPriority('all');
    setOnlyStrikingDistance(false);
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedType !== 'all' ||
    selectedPriority !== 'all' ||
    onlyStrikingDistance;

  // Outreach type badge formatting helper
  const renderOutreachTypeBadge = (type: BacklinkOutreachType) => {
    switch (type) {
      case 'striking_distance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            Striking Distance (SERP Breakout)
          </span>
        );
      case 'statutory_citation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            Statutory Citation
          </span>
        );
      case 'commercial_intent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            Commercial Intent
          </span>
        );
      case 'unlinked_brand_mention':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Brand Mention Reclaim
          </span>
        );
      case 'resource_guide':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            Resource Guide
          </span>
        );
    }
  };

  const renderPriorityBadge = (priority: BacklinkPriority, score: number) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            HIGH • {score}
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            MEDIUM • {score}
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            LOW • {score}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-orange-600/15 text-orange-400 border border-orange-500/20">
                <Share2 className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Backlink Opportunities & SERP Elevation
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                LACS #21
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 max-w-3xl">
              Deterministic inbound link acquisition candidates derived from real Google Search Console
              SERP rankings (positions 5.0–20.0 striking distance) and published catalog architecture.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={loadOpportunities}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
              title="Refresh backlink candidates"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* GSC Status Bar */}
        {data && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Data Source:</span>
              {data.summary.gscConnected && data.summary.gscDataAvailable ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Google Search Console ({data.summary.selectedProperty || 'Connected'}) • Active Ranking Data
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  <Compass className="w-3.5 h-3.5" />
                  Catalog Architecture Baseline {data.summary.gscConnected ? '(Awaiting GSC sync)' : '(GSC unlinked)'}
                </span>
              )}
            </div>

            {data.summary.totalGscImpressionsAnalyzed > 0 && (
              <span className="text-slate-400">
                Analyzed{' '}
                <strong className="text-slate-200 font-semibold">
                  {data.summary.totalGscImpressionsAnalyzed.toLocaleString()}
                </strong>{' '}
                search impressions across 28 days
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to generate backlink opportunities</p>
            <p className="text-xs text-rose-300/90 mt-1">{error}</p>
          </div>
          <button
            onClick={loadOpportunities}
            className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold text-rose-300 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metric Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Total Opportunities</span>
              <div className="p-1.5 rounded-md bg-slate-800 text-slate-300">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-2">
              {data.summary.totalCandidates}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Qualified catalog pages
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Striking Distance (Pos 5–20)</span>
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-400 mt-2">
              {data.summary.strikingDistanceCount}
            </p>
            <p className="text-[11px] text-emerald-400/80 mt-1">
              Immediate Top 3 breakout potential
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">High Priority Targets</span>
              <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-rose-400 mt-2">
              {data.summary.highPriorityCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Score ≥ 65 (Prime outreach ROI)
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Medium Priority</span>
              <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Link2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-400 mt-2">
              {data.summary.mediumPriorityCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Score 45–64 (Secondary acquisition)
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search target pages, queries, URLs, or topics..."
              className="w-full pl-9 pr-8 py-2 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Striking Distance Toggle */}
          <button
            onClick={() => setOnlyStrikingDistance((prev) => !prev)}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition shrink-0 ${
              onlyStrikingDistance
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            Striking Distance Only (Pos 5–20)
          </button>
        </div>

        {/* Dropdowns Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filters:</span>
            </div>

            {/* Type selector */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500/50 transition"
            >
              <option value="all">All Outreach Types</option>
              <option value="striking_distance">Striking Distance (SERP Breakout)</option>
              <option value="statutory_citation">Statutory Citation</option>
              <option value="resource_guide">Resource Guide</option>
              <option value="commercial_intent">Commercial Intent</option>
              <option value="unlinked_brand_mention">Brand Mention Reclaim</option>
            </select>

            {/* Priority selector */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500/50 transition"
            >
              <option value="all">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">
              Showing <strong className="text-slate-200">{filteredCandidates.length}</strong> of{' '}
              {data?.candidates.length || 0} candidates
            </span>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-orange-400 hover:text-orange-300 font-medium transition"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-48 bg-slate-800 rounded" />
                <div className="h-5 w-24 bg-slate-800 rounded" />
              </div>
              <div className="h-4 w-72 bg-slate-800/60 rounded" />
              <div className="h-16 w-full bg-slate-800/40 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredCandidates.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No matching backlink opportunities</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No candidates matched your current filter criteria. Try adjusting or clearing your filters.'
              : 'No qualified catalog pages found for backlink opportunities.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Opportunities List */}
      {!isLoading && filteredCandidates.length > 0 && (
        <div className="space-y-4">
          {filteredCandidates.map((candidate) => {
            const isPitchOpen = expandedPitchId === candidate.id;
            const hasGsc = Boolean(candidate.gscMetrics);

            return (
              <div
                key={candidate.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 shadow-sm transition space-y-4"
              >
                {/* Header row: Target Page & Priority Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        {candidate.targetTitle}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {candidate.targetType === 'service' ? 'Practice Area' : 'Editorial Guide'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/60 text-slate-400">
                        {candidate.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <span>{candidate.targetUrl}</span>
                      <a
                        href={candidate.canonicalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-orange-400 transition"
                        title="Open canonical page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start">
                    {renderPriorityBadge(candidate.priority, candidate.priorityScore)}
                  </div>
                </div>

                {/* Performance & Classification Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs">
                  {/* Outreach Classification */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">Outreach Type</span>
                    <div>{renderOutreachTypeBadge(candidate.outreachType)}</div>
                  </div>

                  {/* Real GSC Ranking Metrics (No fake DA/DR) */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">GSC SERP Position</span>
                    {hasGsc ? (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">
                          Pos #{candidate.gscMetrics!.position.toFixed(1)}
                        </span>
                        {candidate.gscMetrics!.isStrikingDistance && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Striking Distance
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-400 italic">Catalog baseline (No GSC query row)</div>
                    )}
                  </div>

                  {/* GSC Search Impressions & Clicks */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">Search Volume (28d)</span>
                    {hasGsc ? (
                      <div className="text-slate-200 font-medium">
                        <strong>{candidate.gscMetrics!.impressions.toLocaleString()}</strong> impressions
                        <span className="text-slate-400 ml-1.5">
                          ({candidate.gscMetrics!.clicks} clicks • {(candidate.gscMetrics!.ctr * 100).toFixed(1)}% CTR)
                        </span>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic">Organic baseline evaluation</div>
                    )}
                  </div>
                </div>

                {/* Query & Rationale Block */}
                <div className="space-y-2 text-xs">
                  {candidate.gscMetrics?.primaryQuery && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-slate-400 font-medium">Primary Ranking Query:</span>
                      <code className="px-2 py-0.5 rounded bg-slate-950 text-orange-300 font-mono text-[11px] border border-slate-800">
                        "{candidate.gscMetrics.primaryQuery}"
                      </code>
                    </div>
                  )}

                  <div className="text-slate-300 leading-relaxed">
                    <strong className="text-slate-400 font-semibold mr-1">Opportunity Reason:</strong>
                    {candidate.rationale}
                  </div>
                </div>

                {/* Outreach Angle & Prospect Archetype */}
                <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
                  <div className="text-slate-200">
                    <span className="text-orange-400 font-semibold mr-1.5">Recommended Outreach Angle:</span>
                    {candidate.outreachStrategy.angle}
                  </div>

                  <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <span className="font-medium text-slate-400">Target Prospects:</span>
                    <span className="text-slate-300">{candidate.outreachStrategy.targetProspectType}</span>
                  </div>

                  {/* Recommended Anchors */}
                  {candidate.recommendedAnchors.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium mr-1">
                        Recommended Anchors:
                      </span>
                      {candidate.recommendedAnchors.map((anchor, idx) => (
                        <button
                          key={idx}
                          onClick={() => copyToClipboard(anchor, `${candidate.id}-anchor-${idx}`)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-700/80 transition"
                          title="Click to copy anchor text"
                        >
                          <span>{anchor}</span>
                          {copiedItemId === `${candidate.id}-anchor-${idx}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pitch Template Action Toggle */}
                <div className="pt-1 flex items-center justify-between">
                  <button
                    onClick={() =>
                      setExpandedPitchId((curr) => (curr === candidate.id ? null : candidate.id))
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {isPitchOpen ? 'Hide Outreach Email Pitch' : 'View Recommended Outreach Pitch'}
                    {isPitchOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() =>
                      copyToClipboard(
                        `Subject: ${candidate.outreachStrategy.suggestedSubjectLine}\n\n${candidate.outreachStrategy.pitchTemplate}`,
                        `${candidate.id}-fullpitch`
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                  >
                    {copiedItemId === `${candidate.id}-fullpitch` ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied Pitch</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copy Pitch</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Expandable Outreach Email Pitch Drawer */}
                {isPitchOpen && (
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 animate-in fade-in-50 duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-bold text-white">Outreach Email Template</span>
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            candidate.outreachStrategy.suggestedSubjectLine,
                            `${candidate.id}-subject`
                          )
                        }
                        className="text-[11px] text-slate-400 hover:text-orange-400 flex items-center gap-1 transition"
                      >
                        {copiedItemId === `${candidate.id}-subject` ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Copied subject
                          </span>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Subject
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        Subject Line
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800/80 text-xs text-slate-200 font-medium">
                        {candidate.outreachStrategy.suggestedSubjectLine}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        Email Body (Verified Editorial / Reference Pitch)
                      </div>
                      <pre className="p-3 rounded bg-slate-900 border border-slate-800/80 text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                        {candidate.outreachStrategy.pitchTemplate}
                      </pre>
                    </div>

                    <div className="text-[11px] text-slate-400 italic">
                      * Replace bracketed placeholders like <code>[Editor Name]</code> and{' '}
                      <code>[Publication Name]</code> with recipient details before sending.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
