import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Link2,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  FileText,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  X,
  Layers,
  ArrowRight,
  ShieldAlert,
  Compass,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { OrphanPageItem, OrphanPageScanResult, PotentialLinkSource } from '../../types/orphanPage';
import { scanOrphanPages } from '../../services/orphanPage.service';
import { AdminNavSection } from './AdminSidebar';

interface AdminOrphanPageDetectorProps {
  onNavigateSection?: (section: AdminNavSection) => void;
}

export const AdminOrphanPageDetector: React.FC<AdminOrphanPageDetectorProps> = ({
  onNavigateSection,
}) => {
  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [pages, setPages] = useState<OrphanPageItem[]>([]);
  const [summary, setSummary] = useState({
    totalPages: 0,
    totalBlogs: 0,
    totalServices: 0,
    orphanedCount: 0,
    lowLinksCount: 0,
    healthyCount: 0,
  });
  const [lastScannedAt, setLastScannedAt] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'orphaned' | 'low_links' | 'healthy'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'blog' | 'service'>('all');

  // Review Modal State
  const [reviewingPage, setReviewingPage] = useState<OrphanPageItem | null>(null);

  // Expanded sources toggle per card
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  // Copied state indicator
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => {
      setCopiedLink(null);
    }, 2000);
  };

  const toggleSources = (id: string) => {
    setExpandedSources((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Perform Scan
  const handleScan = async () => {
    setIsScanning(true);
    setScanError(null);

    try {
      const result: OrphanPageScanResult = await scanOrphanPages();
      setPages(result.pages || []);
      setSummary(result.summary);
      setLastScannedAt(result.scannedAt);
    } catch (err: any) {
      setScanError(err.message || 'Failed to scan orphan pages');
    } finally {
      setIsScanning(false);
    }
  };

  // Scan on mount
  useEffect(() => {
    handleScan();
  }, []);

  // Filtered pages
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      // Status filter
      if (statusFilter !== 'all' && page.status !== statusFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'all' && page.type !== typeFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = page.title.toLowerCase().includes(query);
        const matchesUrl = page.url.toLowerCase().includes(query);
        const matchesCategory = page.category.toLowerCase().includes(query);
        const matchesAction = page.suggestedAction.toLowerCase().includes(query);
        if (!matchesTitle && !matchesUrl && !matchesCategory && !matchesAction) {
          return false;
        }
      }
      return true;
    });
  }, [pages, statusFilter, typeFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Orphan Page Detector</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
              AI SEO
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Audit your website's internal linking topology to detect orphan articles and service pages with zero or low inbound links. Review actionable recommendations and discover existing articles that can link to them.
          </p>
        </div>

        {/* Scan Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleScan}
            disabled={isScanning}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Auditing Link Topology...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Scan Orphan Pages</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#0B132B] border border-slate-800/90 rounded-xl p-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Pages Scanned
          </p>
          <p className="text-xl font-bold text-white mt-1">{summary.totalPages}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {summary.totalBlogs} blogs • {summary.totalServices} services
          </p>
        </div>

        <div className="bg-[#0B132B] border border-rose-900/40 rounded-xl p-4 bg-rose-950/10">
          <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Orphaned (0 Links)</span>
          </p>
          <p className="text-xl font-bold text-rose-300 mt-1">{summary.orphanedCount}</p>
          <p className="text-[11px] text-rose-400/80 mt-0.5">Unreachable via internal links</p>
        </div>

        <div className="bg-[#0B132B] border border-amber-900/40 rounded-xl p-4 bg-amber-950/10">
          <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Low Links (1 Link)</span>
          </p>
          <p className="text-xl font-bold text-amber-300 mt-1">{summary.lowLinksCount}</p>
          <p className="text-[11px] text-amber-400/80 mt-0.5">At risk of weak link equity</p>
        </div>

        <div className="bg-[#0B132B] border border-emerald-900/40 rounded-xl p-4 bg-emerald-950/10">
          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Healthy (2+ Links)</span>
          </p>
          <p className="text-xl font-bold text-emerald-300 mt-1">{summary.healthyCount}</p>
          <p className="text-[11px] text-emerald-400/80 mt-0.5">Well integrated in hierarchy</p>
        </div>
      </div>

      {/* Error Alert */}
      {scanError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Scan Notice</p>
            <p className="text-xs text-rose-300 mt-0.5">{scanError}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pages by title, URL or category..."
            className="w-full pl-9 pr-4 py-2 bg-[#070D1E] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-[#070D1E] border border-slate-700/80 rounded-xl shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Statuses
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('orphaned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
              statusFilter === 'orphaned'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            Orphaned (0)
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('low_links')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
              statusFilter === 'low_links'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            Low Links (1)
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('healthy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
              statusFilter === 'healthy'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            Healthy (2+)
          </button>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-[#070D1E] border border-slate-700/80 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Types
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('blog')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              typeFilter === 'blog'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Blogs
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('service')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              typeFilter === 'service'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Services
          </button>
        </div>
      </div>

      {/* Pages List: Page | Type | Incoming Links | Status | Suggested Action */}
      <div className="space-y-4">
        {filteredPages.length === 0 ? (
          <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-10 text-center text-slate-400 space-y-3">
            <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-base font-semibold text-slate-300">
              {pages.length === 0
                ? 'No pages audited yet'
                : 'No pages match your selected filters'}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {pages.length === 0
                ? 'Click "Scan Orphan Pages" to analyze incoming link architecture across all published/draft blogs and services.'
                : 'Try clearing search or changing status filter.'}
            </p>
            {pages.length === 0 && (
              <button
                type="button"
                onClick={handleScan}
                disabled={isScanning}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Run Orphan Audit</span>
              </button>
            )}
          </div>
        ) : (
          filteredPages.map((page) => {
            const isExpanded = !!expandedSources[page.id];

            return (
              <div
                key={page.id}
                className={`bg-[#0B132B] border rounded-2xl p-5 transition-all shadow-lg hover:shadow-xl ${
                  page.status === 'orphaned'
                    ? 'border-rose-500/40 bg-rose-950/5'
                    : page.status === 'low_links'
                    ? 'border-amber-500/40 bg-amber-950/5'
                    : 'border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  {/* Left Main Content */}
                  <div className="flex-1 min-w-0 space-y-3.5">
                    {/* Top Row: Page Title, Type & Status */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Type Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-md font-semibold border flex items-center gap-1.5 ${
                          page.type === 'service'
                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                            : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                        }`}
                      >
                        {page.type === 'service' ? (
                          <Briefcase className="w-3.5 h-3.5" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                        <span>{page.type === 'service' ? 'Service Page' : 'Blog Article'}</span>
                      </span>

                      {/* Publication Status */}
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                        {page.publicationStatus}
                      </span>

                      {/* Category */}
                      {page.category && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 text-[11px] border border-slate-800">
                          {page.category}
                        </span>
                      )}

                      {/* Status Badge */}
                      <div className="ml-auto">
                        {page.status === 'orphaned' && (
                          <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1 text-xs">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>Orphaned (0 Links)</span>
                          </span>
                        )}
                        {page.status === 'low_links' && (
                          <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1 text-xs">
                            <AlertCircle className="w-3 h-3 text-amber-400" />
                            <span>Low Links (1 Link)</span>
                          </span>
                        )}
                        {page.status === 'healthy' && (
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1 text-xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Healthy ({page.incomingLinkCount} Links)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Page Title & URL */}
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                        {page.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                        <span className="text-amber-400">{page.url}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(page.url, `url-${page.id}`)}
                          className="hover:text-white transition-colors cursor-pointer"
                          title="Copy relative URL"
                        >
                          {copiedLink === `url-${page.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Incoming Links Details */}
                    <div className="p-3 bg-[#070D1E] rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                          Incoming Internal Links:
                        </span>
                        <span
                          className={`font-semibold ${
                            page.incomingLinkCount === 0
                              ? 'text-rose-400'
                              : page.incomingLinkCount === 1
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {page.incomingLinkCount} detected inbound link(s)
                        </span>
                      </div>

                      {page.incomingLinks.length > 0 ? (
                        <div className="mt-2 space-y-1.5">
                          {page.incomingLinks.map((inLink, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-slate-400 flex items-center gap-2 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800"
                            >
                              <Link2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="text-white font-medium truncate">
                                {inLink.sourceTitle}
                              </span>
                              <span className="text-slate-500 font-mono text-[10px] truncate ml-auto">
                                {inLink.sourceUrl}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-rose-300/80 mt-1 italic">
                          No existing blog articles currently link to this page.
                        </p>
                      )}
                    </div>

                    {/* Suggested Action */}
                    <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 flex items-start gap-2.5">
                      <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Suggested Action & Editorial Strategy
                        </p>
                        <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                          {page.suggestedAction}
                        </p>
                      </div>
                    </div>

                    {/* Relevant Existing Pages That Could Link to It */}
                    {page.potentialSources.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={() => toggleSources(page.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {page.potentialSources.length} Candidate Linking Pages Available
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="space-y-2 p-3 bg-[#070D1E] rounded-xl border border-slate-800 animate-fadeIn">
                            <p className="text-[11px] text-slate-400">
                              These existing articles share high topical relevance and could naturally incorporate an internal link to this page:
                            </p>

                            {page.potentialSources.map((source, sIdx) => {
                              const mdSnippet = `[${source.suggestedAnchorText}](${page.url})`;
                              return (
                                <div
                                  key={sIdx}
                                  className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-white truncate">
                                      {source.sourceTitle}
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-mono shrink-0">
                                      {source.sourceUrl}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <Tag className="w-3 h-3 text-amber-400 shrink-0" />
                                      <span className="text-slate-400 text-[11px]">
                                        Suggested Anchor:
                                      </span>
                                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold text-xs">
                                        "{source.suggestedAnchorText}"
                                      </span>
                                    </div>

                                    {/* Copy Markdown Link Button */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCopy(mdSnippet, `snippet-${page.id}-${sIdx}`)
                                      }
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-medium border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                                      title="Copy markdown link to clipboard"
                                    >
                                      {copiedLink === `snippet-${page.id}-${sIdx}` ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-400" />
                                          <span className="text-emerald-300">Copied Link!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span>Copy Link Markdown</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  <p className="text-[11px] text-slate-400 italic">
                                    {source.relevanceReason}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                    <button
                      type="button"
                      onClick={() => setReviewingPage(page)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Open read-only review modal for this page"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Review Page</span>
                    </button>

                    {page.type === 'service' && (
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
                        title="View live service page"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Live</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* READ-ONLY REVIEW MODAL */}
      {/* Ensures: "Read-only recommendations only. Never automatically modify, save or publish content." */}
      {reviewingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-fadeIn">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Review Page & Inbound Link Analysis</h3>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                    Read-Only Review
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inspect page metadata, existing link coverage, and suggested internal linking opportunities.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingPage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                title="Close review"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Notice Banner */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Safety Notice:</strong> This audit provides read-only recommendations. Content is never automatically modified, saved, or published.
                </span>
              </div>

              {/* Page Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#070D1E] p-4 rounded-xl border border-slate-800">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Page Title
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5">{reviewingPage.title}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Relative URL
                  </p>
                  <p className="text-xs font-mono text-amber-400 mt-0.5">{reviewingPage.url}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Type & Status
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5 capitalize">
                    {reviewingPage.type} ({reviewingPage.publicationStatus})
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Internal Link Coverage
                  </p>
                  <p
                    className={`text-xs font-bold mt-0.5 ${
                      reviewingPage.status === 'orphaned'
                        ? 'text-rose-400'
                        : reviewingPage.status === 'low_links'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {reviewingPage.incomingLinkCount} incoming link(s) •{' '}
                    <span className="uppercase">{reviewingPage.status.replace('_', ' ')}</span>
                  </p>
                </div>
              </div>

              {/* Action Plan */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                  Strategic Recommendation
                </p>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {reviewingPage.suggestedAction}
                </p>
              </div>

              {/* Candidate linking pages */}
              {reviewingPage.potentialSources.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-200">
                    Candidate Linking Pages & Ready-to-use Anchors:
                  </p>

                  <div className="space-y-2">
                    {reviewingPage.potentialSources.map((cand, idx) => {
                      const snippet = `[${cand.suggestedAnchorText}](${reviewingPage.url})`;
                      return (
                        <div
                          key={idx}
                          className="p-3 bg-[#070D1E] rounded-xl border border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">
                              {cand.sourceTitle}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {cand.sourceUrl}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-amber-300 font-medium">
                              Anchor: "{cand.suggestedAnchorText}"
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(snippet, `modal-copy-${idx}`)
                              }
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-medium border border-slate-700 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedLink === `modal-copy-${idx}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-300">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Markdown Link</span>
                                </>
                              )}
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-400 italic">
                            {cand.relevanceReason}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Content Preview if Blog */}
              {reviewingPage.type === 'blog' && reviewingPage.rawContent && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-200">Content Preview:</p>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 max-h-48 overflow-y-auto text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
                    {reviewingPage.rawContent}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setReviewingPage(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
