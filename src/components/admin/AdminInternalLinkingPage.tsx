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
  ShieldAlert,
  Briefcase,
  Copy,
  Sliders,
  Share2,
  ListFilter,
  CheckCheck,
} from 'lucide-react';
import {
  InternalLinkOpportunity,
  InternalLinkingScanResult,
  InternalLinkType,
  InboundLinkAuditItem,
} from '../../types/internalLinking';
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
  // Main View Mode: 'opportunities' or 'orphan_audit'
  const [activeViewTab, setActiveViewTab] = useState<'opportunities' | 'orphan_audit'>(
    'opportunities'
  );

  // Scan & Opportunities State
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<InternalLinkOpportunity[]>([]);
  const [scanMetadata, setScanMetadata] = useState<{
    scannedBlogs: number;
    scannedServices: number;
    scannedAt?: string;
  }>({ scannedBlogs: 0, scannedServices: 0 });

  // Inbound Link Equity & Orphan Page State
  const [inboundAuditPages, setInboundAuditPages] = useState<InboundLinkAuditItem[]>([]);
  const [inboundSummary, setInboundSummary] = useState({
    totalPages: 0,
    totalServices: 0,
    totalBlogs: 0,
    orphanedCount: 0,
    lowLinksCount: 0,
    healthyCount: 0,
  });

  // Filter & Search State for Opportunities
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [linkTypeFilter, setLinkTypeFilter] = useState<'all' | InternalLinkType>('all');

  // Filter & Search State for Inbound Audit
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditStatusFilter, setAuditStatusFilter] = useState<'all' | 'orphaned' | 'low_links' | 'healthy'>('all');
  const [auditTypeFilter, setAuditTypeFilter] = useState<'all' | 'service' | 'blog'>('all');

  // Blog Editor State (for reviewing accepted links)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [activeOpportunity, setActiveOpportunity] = useState<InternalLinkOpportunity | null>(null);
  const [isSavingBlog, setIsSavingBlog] = useState(false);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);

  // Service Link Review Modal
  const [reviewingServiceOpportunity, setReviewingServiceOpportunity] =
    useState<InternalLinkOpportunity | null>(null);

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
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Perform AI Scan across all active services and blogs
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

      if (result.inboundAudit) {
        setInboundSummary(result.inboundAudit.summary);
        setInboundAuditPages(result.inboundAudit.pages);
      }

      // Refresh blogs cache
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

    const escapedAnchor = anchorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!\\[)(${escapedAnchor})(?!\\])`, 'i');

    if (regex.test(content)) {
      const updated = content.replace(regex, (_match, p1) => `[${p1}](${targetUrl})`);
      return { updatedContent: updated, found: true };
    }

    const recommendationBlock = `\n\n> **Recommended Advisory**: For expert assistance regarding ${anchorText}, explore our professional [${anchorText}](${targetUrl}) services.`;
    return { updatedContent: content + recommendationBlock, found: false };
  };

  // Action: Accept Link Opportunity
  const handleAcceptOpportunity = async (opp: InternalLinkOpportunity) => {
    setOpportunities((prev) =>
      prev.map((item) => (item.id === opp.id ? { ...item, status: 'accepted' } : item))
    );

    // If source is a Blog, open Blog Editor for review
    if (opp.sourceType === 'blog') {
      let targetBlog = cachedBlogs.find(
        (b) => b.id === opp.sourceId || b.id === opp.sourceBlogId || b.slug === opp.sourceSlug
      );

      if (!targetBlog) {
        try {
          const res = await fetchAdminBlogs({ status: 'all' });
          if (res && res.blogs) {
            setCachedBlogs(res.blogs);
            targetBlog = res.blogs.find(
              (b) => b.id === opp.sourceId || b.id === opp.sourceBlogId || b.slug === opp.sourceSlug
            );
          }
        } catch (err) {
          console.error('Failed to reload blogs', err);
        }
      }

      if (!targetBlog) {
        targetBlog = {
          id: opp.sourceId || opp.sourceBlogId || 'temp-id',
          title: opp.sourceTitle,
          slug: opp.sourceSlug,
          category: opp.sourceCategory || 'Corporate Advisory',
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

      const { updatedContent } = insertLinkIntoContent(
        targetBlog.content || '',
        opp.anchorText,
        opp.targetUrl
      );

      setEditingBlog(targetBlog);
      setActiveOpportunity(opp);
      setEditorError(null);
      setSaveSuccessNotification(null);

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

      setIsEditorOpen(true);
    } else {
      // Source is a Service page: open the Service Link Review Drawer
      setReviewingServiceOpportunity(opp);
    }
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

  // Copy text to clipboard helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
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
      // Link Type filter
      if (linkTypeFilter !== 'all' && opp.linkType !== linkTypeFilter) {
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
  }, [opportunities, statusFilter, linkTypeFilter, searchQuery]);

  // Filtered list of Inbound Audit pages
  const filteredAuditPages = useMemo(() => {
    return inboundAuditPages.filter((page) => {
      if (auditStatusFilter !== 'all' && page.status !== auditStatusFilter) {
        return false;
      }
      if (auditTypeFilter !== 'all' && page.type !== auditTypeFilter) {
        return false;
      }
      if (auditSearchQuery.trim()) {
        const query = auditSearchQuery.toLowerCase();
        const matchTitle = page.title.toLowerCase().includes(query);
        const matchSlug = page.slug.toLowerCase().includes(query);
        const matchCat = page.category.toLowerCase().includes(query);
        if (!matchTitle && !matchSlug && !matchCat) return false;
      }
      return true;
    });
  }, [inboundAuditPages, auditStatusFilter, auditTypeFilter, auditSearchQuery]);

  // Statistics counters
  const stats = useMemo(() => {
    const total = opportunities.length;
    const pending = opportunities.filter((o) => o.status === 'pending').length;
    const accepted = opportunities.filter((o) => o.status === 'accepted').length;
    const rejected = opportunities.filter((o) => o.status === 'rejected').length;

    const s2s = opportunities.filter((o) => o.linkType === 'service_to_service').length;
    const b2s = opportunities.filter((o) => o.linkType === 'blog_to_service').length;
    const b2b = opportunities.filter((o) => o.linkType === 'blog_to_blog').length;

    return { total, pending, accepted, rejected, s2s, b2s, b2b };
  }, [opportunities]);

  // Link type styling helper
  const getLinkTypeBadge = (linkType: InternalLinkType) => {
    if (linkType === 'service_to_service') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
          <Briefcase className="w-3 h-3" />
          Service → Service
        </span>
      );
    }
    if (linkType === 'blog_to_blog') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
          <FileText className="w-3 h-3" />
          Blog → Blog
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center gap-1">
        <Share2 className="w-3 h-3" />
        Blog → Service
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
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
            Unified dynamic internal linking across your entire website. Scans all active services
            and blog articles to suggest high-impact <strong className="text-slate-300">Service → Service</strong>,{' '}
            <strong className="text-slate-300">Blog → Service</strong>, and{' '}
            <strong className="text-slate-300">Blog → Blog</strong> pathways, and audits inbound link equity.
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
                <span>Scanning All Services & Blogs...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-orange-200" />
                <span>Scan Entire Website</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main View Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-px">
        <button
          onClick={() => setActiveViewTab('opportunities')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeViewTab === 'opportunities'
              ? 'border-orange-500 text-orange-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>Internal Link Opportunities ({stats.total})</span>
        </button>

        <button
          onClick={() => setActiveViewTab('orphan_audit')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeViewTab === 'orphan_audit'
              ? 'border-orange-500 text-orange-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Inbound Link Equity & Orphan Audit ({inboundSummary.totalPages})</span>
          {inboundSummary.orphanedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {inboundSummary.orphanedCount} orphaned
            </span>
          )}
        </button>
      </div>

      {/* ERROR ALERT */}
      {scanError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Scan Notice</p>
            <p className="text-xs text-rose-300 mt-0.5">{scanError}</p>
          </div>
        </div>
      )}

      {/* VIEW 1: INTERNAL LINK OPPORTUNITIES */}
      {activeViewTab === 'opportunities' && (
        <div className="space-y-6">
          {/* Stats Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-[#0B132B] border border-slate-800/90 rounded-xl p-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Suggestions
              </p>
              <p className="text-xl font-bold text-white mt-1">{stats.total}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {scanMetadata.scannedBlogs} blogs • {scanMetadata.scannedServices} services active
              </p>
            </div>

            <div className="bg-[#0B132B] border border-slate-800/90 rounded-xl p-4">
              <p className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                Service → Service
              </p>
              <p className="text-xl font-bold text-purple-300 mt-1">{stats.s2s}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Cross-service pathways</p>
            </div>

            <div className="bg-[#0B132B] border border-slate-800/90 rounded-xl p-4">
              <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                Blog → Service
              </p>
              <p className="text-xl font-bold text-orange-300 mt-1">{stats.b2s}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Commercial intent bridges</p>
            </div>

            <div className="bg-[#0B132B] border border-slate-800/90 rounded-xl p-4">
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                Blog → Blog
              </p>
              <p className="text-xl font-bold text-blue-300 mt-1">{stats.b2b}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Topical semantic clusters</p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-lg">
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

            {/* Link Type Filter */}
            <div className="flex items-center gap-1.5 p-1 bg-[#070D1E] border border-slate-700/80 rounded-xl shrink-0 overflow-x-auto">
              <span className="text-[11px] text-slate-400 px-2 font-medium flex items-center gap-1">
                <ListFilter className="w-3 h-3 text-orange-400" /> Type:
              </span>
              <button
                type="button"
                onClick={() => setLinkTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  linkTypeFilter === 'all'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setLinkTypeFilter('service_to_service')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  linkTypeFilter === 'service_to_service'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Service → Service
              </button>
              <button
                type="button"
                onClick={() => setLinkTypeFilter('blog_to_service')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  linkTypeFilter === 'blog_to_service'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Blog → Service
              </button>
              <button
                type="button"
                onClick={() => setLinkTypeFilter('blog_to_blog')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  linkTypeFilter === 'blog_to_blog'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Blog → Blog
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 p-1 bg-[#070D1E] border border-slate-700/80 rounded-xl shrink-0">
              {(['all', 'pending', 'accepted', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Editorial Review Assurance Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-orange-400 shrink-0" />
              <span>
                <strong className="text-slate-200">Editorial Control:</strong> Suggestions never automatically modify or publish your live content. Review anchor text placements and apply them explicitly in the editor.
              </span>
            </div>
            <span className="text-slate-500 shrink-0">
              Showing {filteredOpportunities.length} of {opportunities.length}
            </span>
          </div>

          {/* Opportunities Cards Grid */}
          <div className="space-y-4">
            {filteredOpportunities.length === 0 ? (
              <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-12 text-center text-slate-400">
                <Link2 className="w-10 h-10 mx-auto mb-3 text-slate-600 opacity-60" />
                <p className="text-sm font-semibold text-slate-300">No link opportunities match the current filter.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting search keywords or selecting "All" link types.
                </p>
              </div>
            ) : (
              filteredOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className={`bg-[#0B132B] border rounded-2xl p-5 sm:p-6 transition shadow-md relative overflow-hidden ${
                    opp.status === 'accepted'
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : opp.status === 'rejected'
                      ? 'border-slate-800 opacity-60'
                      : 'border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  {/* Top Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      {getLinkTypeBadge(opp.linkType)}

                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                          opp.status === 'accepted'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : opp.status === 'rejected'
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {opp.status}
                      </span>
                    </div>

                    {/* Actions: Accept, Reject, Review in Editor */}
                    <div className="flex items-center gap-2">
                      {opp.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAcceptOpportunity(opp)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept & Review</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectOpportunity(opp.id)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {opp.status === 'accepted' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAcceptOpportunity(opp)}
                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review in Editor</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRestoreOpportunity(opp.id)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                            title="Reset to pending"
                          >
                            <Undo2 className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {opp.status === 'rejected' && (
                        <button
                          type="button"
                          onClick={() => handleRestoreOpportunity(opp.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Main Source & Target Linking Bridge */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Source Box */}
                    <div className="md:col-span-5 p-3.5 rounded-xl bg-[#070D1E] border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                        <span>Source ({opp.sourceType})</span>
                        {opp.sourceCategory && (
                          <span className="text-slate-500 lowercase">#{opp.sourceCategory}</span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{opp.sourceTitle}</h4>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{opp.sourceUrl}</p>
                    </div>

                    {/* Middle Linking Icon */}
                    <div className="md:col-span-2 flex flex-col items-center justify-center text-center py-1">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-400">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold mt-1">Links to</span>
                    </div>

                    {/* Target Box */}
                    <div className="md:col-span-5 p-3.5 rounded-xl bg-[#070D1E] border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                        <span className="text-orange-400">Target ({opp.targetType})</span>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{opp.targetTitle}</h4>
                      <p className="text-[11px] text-orange-300 font-mono truncate">{opp.targetUrl}</p>
                    </div>
                  </div>

                  {/* Anchor Text & Context Details */}
                  <div className="mt-4 pt-3.5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                    {/* Suggested Anchor */}
                    <div className="md:col-span-4 p-3 rounded-xl bg-orange-950/20 border border-orange-500/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-orange-400">Suggested Anchor Text:</span>
                        <button
                          onClick={() => handleCopy(opp.anchorText, opp.id)}
                          className="text-slate-400 hover:text-white p-0.5 rounded transition"
                          title="Copy anchor text"
                        >
                          {copiedId === opp.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm font-bold text-white">"{opp.anchorText}"</p>
                    </div>

                    {/* Rationale & Snippet */}
                    <div className="md:col-span-8 space-y-2">
                      {opp.contextSnippet && (
                        <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                          <span className="text-slate-400 font-semibold">Integration Context: </span>
                          <span>{opp.contextSnippet}</span>
                        </div>
                      )}
                      <div className="text-xs text-slate-400 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-slate-300">SEO Rationale:</strong> {opp.reason}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: INBOUND LINK EQUITY & ORPHAN AUDIT */}
      {activeViewTab === 'orphan_audit' && (
        <div className="space-y-6">
          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-[#0B132B] border border-slate-800/90 rounded-xl p-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Monitored Pages
              </p>
              <p className="text-xl font-bold text-white mt-1">{inboundSummary.totalPages}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {inboundSummary.totalServices} services • {inboundSummary.totalBlogs} blogs
              </p>
            </div>

            <div className="bg-[#0B132B] border border-slate-800/90 rounded-xl p-4">
              <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Orphaned Pages
              </p>
              <p className="text-xl font-bold text-rose-400 mt-1">{inboundSummary.orphanedCount}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">0 inbound internal links</p>
            </div>

            <div className="bg-[#0B132B] border border-slate-800/90 rounded-xl p-4">
              <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Low Inbound Links
              </p>
              <p className="text-xl font-bold text-amber-300 mt-1">{inboundSummary.lowLinksCount}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Only 1 inbound link</p>
            </div>

            <div className="bg-[#0B132B] border border-slate-800/90 rounded-xl p-4">
              <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Healthy Pages
              </p>
              <p className="text-xl font-bold text-emerald-300 mt-1">{inboundSummary.healthyCount}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">2+ inbound internal links</p>
            </div>
          </div>

          {/* Audit Filter & Search */}
          <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                placeholder="Search page by title or URL..."
                className="w-full pl-9 pr-4 py-2 bg-[#070D1E] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={auditTypeFilter}
                onChange={(e) => setAuditTypeFilter(e.target.value as any)}
                className="px-3 py-2 bg-[#070D1E] border border-slate-700/80 rounded-xl text-xs text-slate-300 focus:outline-hidden"
              >
                <option value="all">All Page Types</option>
                <option value="service">Services Only</option>
                <option value="blog">Blogs Only</option>
              </select>

              <select
                value={auditStatusFilter}
                onChange={(e) => setAuditStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-[#070D1E] border border-slate-700/80 rounded-xl text-xs text-slate-300 focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="orphaned">Orphaned (0 links)</option>
                <option value="low_links">Low Links (1 link)</option>
                <option value="healthy">Healthy (2+ links)</option>
              </select>
            </div>
          </div>

          {/* Audit Table List */}
          <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl overflow-hidden shadow-lg">
            <div className="divide-y divide-slate-800/80">
              {filteredAuditPages.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  No pages match your filter criteria.
                </div>
              ) : (
                filteredAuditPages.map((page) => (
                  <div
                    key={page.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            page.type === 'service'
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {page.type}
                        </span>

                        <span className="text-xs text-slate-500 font-medium">#{page.category}</span>
                      </div>

                      <h4 className="text-sm font-bold text-white">{page.title}</h4>
                      <p className="text-xs text-slate-400 font-mono truncate">{page.url}</p>

                      {page.incomingSources.length > 0 && (
                        <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1.5">
                          <span className="text-slate-500">Inbound links from:</span>
                          <span className="text-slate-300 font-medium">
                            {page.incomingSources.map((s) => s.sourceTitle).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Inbound Link Counter Badge */}
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-medium">Inbound Links</div>
                        <div className="flex items-center gap-1.5 justify-end mt-0.5">
                          <span
                            className={`text-sm font-bold ${
                              page.status === 'orphaned'
                                ? 'text-rose-400'
                                : page.status === 'low_links'
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {page.incomingLinkCount} links
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              page.status === 'orphaned'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : page.status === 'low_links'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {page.status === 'orphaned'
                              ? 'Orphaned'
                              : page.status === 'low_links'
                              ? 'Low'
                              : 'Healthy'}
                          </span>
                        </div>
                      </div>

                      {/* Quick Link Action: Switch to opportunities filtered by this page */}
                      <button
                        onClick={() => {
                          setSearchQuery(page.title);
                          setActiveViewTab('opportunities');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-orange-600 hover:text-white text-slate-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                      >
                        <span>Find Link Opportunities</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* REUSED BLOG EDITOR MODAL (Manual Review & Edits) */}
      {isEditorOpen && editingBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl animate-fadeIn">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-orange-400" />
                  <span>Review Link Placement in Blog Editor</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review the suggested internal link insertion below. Changes are saved only when you click "Save Changes".
                </p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification / Error */}
            <form onSubmit={handleSaveBlogFromEditor} className="flex-1 overflow-y-auto p-6 space-y-6">
              {saveSuccessNotification && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{saveSuccessNotification}</span>
                </div>
              )}

              {editorError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{editorError}</span>
                </div>
              )}

              {/* Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Article Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editorFormData.title}
                    onChange={(e) => setEditorFormData({ ...editorFormData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Body Content Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Content with Suggested Internal Link
                  </label>
                  {activeOpportunity && (
                    <span className="text-xs text-orange-400 font-medium">
                      Linking: "{activeOpportunity.anchorText}" → {activeOpportunity.targetUrl}
                    </span>
                  )}
                </div>
                <RichTextEditor
                  value={editorFormData.content}
                  onChange={(val) => setEditorFormData({ ...editorFormData, content: val })}
                  minHeight="380px"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBlog}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  {isSavingBlog ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SERVICE OPPORTUNITY REVIEW MODAL */}
      {reviewingServiceOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-400" />
                <span>Service Link Review</span>
              </h3>
              <button
                onClick={() => setReviewingServiceOpportunity(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              This opportunity links from service <strong className="text-white">"{reviewingServiceOpportunity.sourceTitle}"</strong> to{' '}
              <strong className="text-white">"{reviewingServiceOpportunity.targetTitle}"</strong>.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-purple-400">Formatted Anchor Snippet:</div>
              <div className="font-mono text-xs text-slate-200 bg-slate-900 p-2.5 rounded border border-slate-800 break-all select-all">
                &lt;a href="{reviewingServiceOpportunity.targetUrl}"&gt;{reviewingServiceOpportunity.anchorText}&lt;/a&gt;
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    `<a href="${reviewingServiceOpportunity.targetUrl}">${reviewingServiceOpportunity.anchorText}</a>`,
                    'service-snippet'
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
              >
                {copiedId === 'service-snippet' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied Link Code</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-xs text-slate-400">
              <strong>Context & Reason:</strong> {reviewingServiceOpportunity.reason}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setReviewingServiceOpportunity(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
