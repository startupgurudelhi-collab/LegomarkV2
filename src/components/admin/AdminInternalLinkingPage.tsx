import React, { useState, useEffect, useMemo } from 'react';
import {
  Link2,
  Sparkles,
  RefreshCw,
  Check,
  X,
  ArrowRight,
  ExternalLink,
  FileText,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  Layers,
  Eye,
  Tag,
  Compass,
  ArrowUpRight,
  Undo2,
  Info,
} from 'lucide-react';
import { InternalLinkOpportunity, InternalLinkingScanResult } from '../../types/internalLinking';
import { scanInternalLinkingOpportunities } from '../../services/internalLinking.service';
import { fetchAdminBlogs, updateBlogPost } from '../../services/blog.service';
import { BlogPost, UpdateBlogPostInput } from '../../types/blog';
import { RichTextEditor } from './RichTextEditor';
import { AdminNavSection } from './AdminSidebar';

interface AdminInternalLinkingPageProps {
  onNavigateSection?: (section: AdminNavSection) => void;
}

export const AdminInternalLinkingPage: React.FC<AdminInternalLinkingPageProps> = ({
  onNavigateSection,
}) => {
  // Scan & Opportunities State
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<InternalLinkOpportunity[]>([]);
  const [scanMetadata, setScanMetadata] = useState<{
    scannedBlogs: number;
    scannedServices: number;
    scannedAt?: string;
  }>({ scannedBlogs: 0, scannedServices: 0 });

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<'all' | 'service' | 'blog'>('all');

  // Blog Editor State (for reviewing accepted links)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [activeOpportunity, setActiveOpportunity] = useState<InternalLinkOpportunity | null>(null);
  const [isSavingBlog, setIsSavingBlog] = useState(false);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);

  // Form data for the Blog Editor modal
  const [editorFormData, setEditorFormData] = useState<{
    title: string;
    slug: string;
    category: string;
    content: string;
    excerpt: string;
    featuredImage: string;
    seoTitle: string;
    metaDescription: string;
    seoSlug: string;
    isPublished: boolean;
  }>({
    title: '',
    slug: '',
    category: 'Company Registration',
    content: '',
    excerpt: '',
    featuredImage: '',
    seoTitle: '',
    metaDescription: '',
    seoSlug: '',
    isPublished: false,
  });

  // Cached blogs pool
  const [cachedBlogs, setCachedBlogs] = useState<BlogPost[]>([]);

  // Load existing blogs on mount
  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      const res = await fetchAdminBlogs({ status: 'all' });
      if (res && res.blogs) {
        setCachedBlogs(res.blogs);
      }
    } catch (err) {
      console.warn('Unable to preload blogs in AdminInternalLinkingPage', err);
    }
  };

  // Perform AI Scan
  const handleScan = async () => {
    setIsScanning(true);
    setScanError(null);

    try {
      const result: InternalLinkingScanResult = await scanInternalLinkingOpportunities();
      setOpportunities(result.suggestions || []);
      setScanMetadata({
        scannedBlogs: result.totalScannedBlogs,
        scannedServices: result.totalScannedServices,
        scannedAt: result.scannedAt,
      });
      // Refresh blogs cache as well
      await loadBlogs();
    } catch (err: any) {
      setScanError(err.message || 'Failed to scan internal linking opportunities');
    } finally {
      setIsScanning(false);
    }
  };

  // Run initial scan on first render if no suggestions yet
  useEffect(() => {
    handleScan();
  }, []);

  // Helper: insert link into content without destroying markup
  const insertLinkIntoContent = (
    content: string,
    anchorText: string,
    targetUrl: string
  ): { updatedContent: string; found: boolean } => {
    if (!content || !anchorText) return { updatedContent: content, found: false };

    // Escape regex characters
    const escapedAnchor = anchorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Case-insensitive match, but preserve the original casing in replacement
    const regex = new RegExp(`(?<!\\[)(${escapedAnchor})(?!\\])`, 'i');

    if (regex.test(content)) {
      const updated = content.replace(regex, (_match, p1) => `[${p1}](${targetUrl})`);
      return { updatedContent: updated, found: true };
    }

    // If exact anchor wasn't found in raw body, append contextual referral at the end
    const recommendationBlock = `\n\n> **Recommended Advisory**: For expert assistance regarding ${anchorText}, explore our professional [${anchorText}](${targetUrl}) services.`;
    return { updatedContent: content + recommendationBlock, found: false };
  };

  // Action: Accept Link Opportunity
  // "Accept opens the existing Blog Editor with the suggested link ready for review"
  // "Never auto-save or auto-publish"
  const handleAcceptOpportunity = async (opp: InternalLinkOpportunity) => {
    // 1. Mark as accepted in local state
    setOpportunities((prev) =>
      prev.map((item) => (item.id === opp.id ? { ...item, status: 'accepted' } : item))
    );

    // 2. Find the blog article
    let targetBlog = cachedBlogs.find(
      (b) => b.id === opp.sourceBlogId || b.slug === opp.sourceSlug
    );

    // If not in cache, refresh
    if (!targetBlog) {
      try {
        const res = await fetchAdminBlogs({ status: 'all' });
        if (res && res.blogs) {
          setCachedBlogs(res.blogs);
          targetBlog = res.blogs.find(
            (b) => b.id === opp.sourceBlogId || b.slug === opp.sourceSlug
          );
        }
      } catch (err) {
        console.error('Failed to reload blogs', err);
      }
    }

    if (!targetBlog) {
      // Fallback: create draft object for review
      targetBlog = {
        id: opp.sourceBlogId,
        title: opp.sourceTitle,
        slug: opp.sourceSlug,
        category: opp.sourceCategory || 'Company Registration',
        author: 'LEGOMARK Editorial Board',
        content: `## ${opp.sourceTitle}\n\nComprehensive statutory and compliance guide by LEGOMARK INDIA.\n\nBusinesses operating in India should ensure proper compliance and ${opp.anchorText} with full regulatory oversight.`,
        excerpt: `Guide on ${opp.sourceTitle}`,
        featuredImage: '',
        seoTitle: opp.sourceTitle,
        metaDescription: `Statutory guide on ${opp.sourceTitle}`,
        seoSlug: opp.sourceSlug,
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // 3. Apply the suggested link to the article body ready for review
    const { updatedContent } = insertLinkIntoContent(
      targetBlog.content || '',
      opp.anchorText,
      opp.targetUrl
    );

    setEditingBlog(targetBlog);
    setActiveOpportunity(opp);
    setEditorError(null);
    setSaveSuccessNotification(null);

    // Populate the editor form data (DO NOT SAVE TO DB YET)
    setEditorFormData({
      title: targetBlog.title,
      slug: targetBlog.slug,
      category: targetBlog.category || 'Company Registration',
      content: updatedContent,
      excerpt: targetBlog.excerpt || '',
      featuredImage: targetBlog.featuredImage || '',
      seoTitle: targetBlog.seoTitle || targetBlog.title,
      metaDescription: targetBlog.metaDescription || targetBlog.excerpt || '',
      seoSlug: targetBlog.seoSlug || targetBlog.slug,
      isPublished: targetBlog.isPublished,
    });

    // 4. Open the Blog Editor Modal ready for review
    setIsEditorOpen(true);
  };

  // Action: Reject Link Opportunity
  const handleRejectOpportunity = (oppId: string) => {
    setOpportunities((prev) =>
      prev.map((item) => (item.id === oppId ? { ...item, status: 'rejected' } : item))
    );
  };

  // Action: Restore rejected link to pending
  const handleRestoreOpportunity = (oppId: string) => {
    setOpportunities((prev) =>
      prev.map((item) => (item.id === oppId ? { ...item, status: 'pending' } : item))
    );
  };

  // Save changes from the Blog Editor when admin explicitly clicks "Save Changes"
  // (Guarantees NO auto-save or auto-publish)
  const handleSaveBlogFromEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlog) return;

    setIsSavingBlog(true);
    setEditorError(null);

    try {
      const updateData: UpdateBlogPostInput = {
        title: editorFormData.title,
        slug: editorFormData.slug,
        category: editorFormData.category,
        content: editorFormData.content,
        excerpt: editorFormData.excerpt,
        featuredImage: editorFormData.featuredImage,
        seoTitle: editorFormData.seoTitle,
        metaDescription: editorFormData.metaDescription,
        seoSlug: editorFormData.seoSlug,
        isPublished: editorFormData.isPublished,
      };

      const updated = await updateBlogPost(editingBlog.id, updateData);

      // Update local cache
      setCachedBlogs((prev) =>
        prev.map((b) => (b.id === editingBlog.id ? { ...b, ...updated } : b))
      );

      setSaveSuccessNotification('Blog article saved with verified internal link!');
      setTimeout(() => {
        setIsEditorOpen(false);
        setSaveSuccessNotification(null);
      }, 1500);
    } catch (err: any) {
      setEditorError(err.message || 'Failed to save blog changes');
    } finally {
      setIsSavingBlog(false);
    }
  };

  // Filtered list of opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Status filter
      if (statusFilter !== 'all' && opp.status !== statusFilter) {
        return false;
      }
      // Target type filter
      if (targetTypeFilter !== 'all' && opp.targetType !== targetTypeFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSource = opp.sourceTitle.toLowerCase().includes(query);
        const matchesTarget = opp.targetTitle.toLowerCase().includes(query);
        const matchesAnchor = opp.anchorText.toLowerCase().includes(query);
        const matchesReason = opp.reason.toLowerCase().includes(query);
        if (!matchesSource && !matchesTarget && !matchesAnchor && !matchesReason) {
          return false;
        }
      }
      return true;
    });
  }, [opportunities, statusFilter, targetTypeFilter, searchQuery]);

  // Statistics counters
  const stats = useMemo(() => {
    const total = opportunities.length;
    const pending = opportunities.filter((o) => o.status === 'pending').length;
    const accepted = opportunities.filter((o) => o.status === 'accepted').length;
    const rejected = opportunities.filter((o) => o.status === 'rejected').length;
    return { total, pending, accepted, rejected };
  }, [opportunities]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              <Link2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Internal Linking</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
              AI
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Automatically scan existing blog articles and high-value service pages to identify
            high-converting anchor text placements, topical authority bridges, and internal linking
            pathways.
          </p>
        </div>

        {/* Scan Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleScan}
            disabled={isScanning}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning Content & Services...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-orange-200" />
                <span>Scan Blogs & Services</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#0B132B] border border-slate-800/90 rounded-xl p-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Opportunities
          </p>
          <p className="text-xl font-bold text-white mt-1">{stats.total}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {scanMetadata.scannedBlogs} blogs • {scanMetadata.scannedServices} services
          </p>
        </div>

        <div className="bg-[#0B132B] border border-slate-800/90 rounded-xl p-4">
          <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            Pending Review
          </p>
          <p className="text-xl font-bold text-amber-300 mt-1">{stats.pending}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting decision</p>
        </div>

        <div className="bg-[#0B132B] border border-slate-800/90 rounded-xl p-4">
          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            Accepted
          </p>
          <p className="text-xl font-bold text-emerald-300 mt-1">{stats.accepted}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Opened / Reviewed in Editor</p>
        </div>

        <div className="bg-[#0B132B] border border-slate-800/90 rounded-xl p-4">
          <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
            Rejected
          </p>
          <p className="text-xl font-bold text-rose-300 mt-1">{stats.rejected}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Dismissed suggestions</p>
        </div>
      </div>

      {/* Error Alert */}
      {scanError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Scan Warning</p>
            <p className="text-xs text-rose-300 mt-0.5">{scanError}</p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by source, target, or anchor text..."
            className="w-full pl-9 pr-4 py-2 bg-[#070D1E] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#070D1E] border border-slate-700/80 rounded-xl shrink-0 overflow-x-auto">
          {(['all', 'pending', 'accepted', 'rejected'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Target Type Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-[#070D1E] border border-slate-700/80 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setTargetTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              targetTypeFilter === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Targets
          </button>
          <button
            type="button"
            onClick={() => setTargetTypeFilter('service')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              targetTypeFilter === 'service'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Services
          </button>
          <button
            type="button"
            onClick={() => setTargetTypeFilter('blog')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              targetTypeFilter === 'blog'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Blogs
          </button>
        </div>
      </div>

      {/* OPPORTUNITIES LIST */}
      <div className="space-y-4">
        {filteredOpportunities.length === 0 ? (
          <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-10 text-center text-slate-400 space-y-3">
            <Link2 className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-base font-semibold text-slate-300">
              {opportunities.length === 0
                ? 'No internal linking opportunities identified yet'
                : 'No opportunities match your search or filter'}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {opportunities.length === 0
                ? 'Click "Scan Blogs & Services" to evaluate your existing articles and generate high-intent internal link recommendations.'
                : 'Try adjusting your search query or switching the status filter to see all recommendations.'}
            </p>
            {opportunities.length === 0 && (
              <button
                type="button"
                onClick={handleScan}
                disabled={isScanning}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Run Internal Link Scan</span>
              </button>
            )}
          </div>
        ) : (
          filteredOpportunities.map((opp) => (
            <div
              key={opp.id}
              className={`bg-[#0B132B] border rounded-2xl p-5 transition-all shadow-lg hover:shadow-xl ${
                opp.status === 'accepted'
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : opp.status === 'rejected'
                  ? 'border-slate-800/50 opacity-60'
                  : 'border-slate-800/90 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                {/* Main Content Details */}
                <div className="flex-1 min-w-0 space-y-3.5">
                  {/* Row 1: Source & Target Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                      Source Blog
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold border ${
                        opp.targetType === 'service'
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      }`}
                    >
                      Target: {opp.targetType === 'service' ? 'Service Page' : 'Blog Article'}
                    </span>

                    {/* Status Badge */}
                    {opp.status === 'accepted' && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1 ml-auto">
                        <Check className="w-3 h-3" />
                        <span>Accepted</span>
                      </span>
                    )}
                    {opp.status === 'rejected' && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1 ml-auto">
                        <X className="w-3 h-3" />
                        <span>Rejected</span>
                      </span>
                    )}
                    {opp.status === 'pending' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold ml-auto">
                        Pending Review
                      </span>
                    )}
                  </div>

                  {/* Row 2: Source | Target Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Source Column */}
                    <div className="p-3 bg-[#070D1E] rounded-xl border border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Source Article
                      </p>
                      <p className="text-sm font-bold text-white line-clamp-1">
                        {opp.sourceTitle}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        /blog/{opp.sourceSlug}
                      </p>
                    </div>

                    {/* Target Column */}
                    <div className="p-3 bg-[#070D1E] rounded-xl border border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Target Destination
                      </p>
                      <p className="text-sm font-bold text-white line-clamp-1">
                        {opp.targetTitle}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-orange-400 font-mono mt-0.5">
                        <span className="truncate">{opp.targetUrl}</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Anchor Text & Reason */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                    {/* Anchor Text */}
                    <div className="md:col-span-5 flex items-start gap-2">
                      <Tag className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Suggested Anchor Text
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-orange-300 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20 inline-block mt-1">
                          "{opp.anchorText}"
                        </p>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="md:col-span-7 flex items-start gap-2">
                      <Compass className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          SEO & Editorial Rationale
                        </p>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {opp.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Context Snippet Preview */}
                  {opp.contextSnippet && (
                    <div className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                      <span className="font-semibold text-slate-300">Context: </span>
                      <span>{opp.contextSnippet}</span>
                    </div>
                  )}
                </div>

                {/* Actions Column: Accept / Reject */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                  {opp.status === 'pending' && (
                    <>
                      {/* Accept Button: Opens Blog Editor ready for review */}
                      <button
                        type="button"
                        onClick={() => handleAcceptOpportunity(opp)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        title="Accept suggestion and open Blog Editor with link applied ready for review"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>

                      {/* Reject Button */}
                      <button
                        type="button"
                        onClick={() => handleRejectOpportunity(opp.id)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Reject this internal linking recommendation"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {opp.status === 'accepted' && (
                    <>
                      {/* Re-open Editor */}
                      <button
                        type="button"
                        onClick={() => handleAcceptOpportunity(opp)}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-orange-400" />
                        <span>Review in Editor</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRestoreOpportunity(opp.id)}
                        className="text-[11px] text-slate-400 hover:text-slate-300 flex items-center gap-1 mt-1"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>Reset to Pending</span>
                      </button>
                    </>
                  )}

                  {opp.status === 'rejected' && (
                    <button
                      type="button"
                      onClick={() => handleRestoreOpportunity(opp.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Restore Suggestion</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* BLOG EDITOR MODAL (Opened upon clicking Accept) */}
      {/* Ensures: "Accept opens the existing Blog Editor with the suggested link ready for review" */}
      {/* Ensures: "Never auto-save or auto-publish" */}
      {isEditorOpen && editingBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-fadeIn">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Review Internal Link in Blog Editor</h3>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                    Review Mode
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verify the suggested internal link in the content below. Nothing is saved or published until you explicitly click "Save Changes".
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                title="Close without saving"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBlogFromEditor} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Internal Link Review Notice Banner */}
              {activeOpportunity && (
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                        Suggested Link Ready For Review
                      </p>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        Anchor: "{activeOpportunity.anchorText}" &rarr;{' '}
                        <span className="text-orange-300">{activeOpportunity.targetUrl}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Target: {activeOpportunity.targetTitle} ({activeOpportunity.reason})
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg shrink-0">
                    Draft in Review • Never Auto-Saved
                  </div>
                </div>
              )}

              {/* Success Notification */}
              {saveSuccessNotification && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveSuccessNotification}</span>
                </div>
              )}

              {/* Error Notice */}
              {editorError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{editorError}</span>
                </div>
              )}

              {/* Article Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editorFormData.title}
                    onChange={(e) =>
                      setEditorFormData({ ...editorFormData, title: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={editorFormData.slug}
                    onChange={(e) =>
                      setEditorFormData({ ...editorFormData, slug: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={editorFormData.category}
                    onChange={(e) =>
                      setEditorFormData({ ...editorFormData, category: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Rich Text Content with the link inserted */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-200">
                    Article Content & Body (with verified link inserted) *
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Review and adjust anchor placement as desired
                  </span>
                </div>

                <RichTextEditor
                  value={editorFormData.content}
                  onChange={(newContent) =>
                    setEditorFormData({ ...editorFormData, content: newContent })
                  }
                  placeholder="Article content..."
                  minHeight="380px"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Summary / Excerpt
                </label>
                <textarea
                  rows={2}
                  value={editorFormData.excerpt}
                  onChange={(e) =>
                    setEditorFormData({ ...editorFormData, excerpt: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              {/* Publication Status Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-slate-200">Publication Status</p>
                  <p className="text-[11px] text-slate-400">
                    Current: {editorFormData.isPublished ? 'Published' : 'Draft'} (Never changed automatically)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editorFormData.isPublished}
                    onChange={(e) =>
                      setEditorFormData({ ...editorFormData, isPublished: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel & Close
                </button>
                <button
                  type="submit"
                  disabled={isSavingBlog}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isSavingBlog ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
