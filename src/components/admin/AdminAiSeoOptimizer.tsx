import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Search,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  Edit2,
  Copy,
  Check,
  RefreshCw,
  Layers,
  FileText,
  Tag,
  Link2,
  Image as ImageIcon,
  Sliders,
  AlignLeft,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  Gauge,
  Info,
  ShieldCheck,
  CheckCheck,
  ListFilter,
  Save,
} from 'lucide-react';
import { BlogPost, UpdateBlogPostInput } from '../../types/blog';
import { fetchAdminBlogs, updateBlogPost } from '../../services/blog.service';
import { analyzeBlogSeo } from '../../services/seoOptimizer.service';
import {
  SeoAnalysisResult,
  SeoRecommendation,
  FaqOpportunity,
  SeoDimensionAudit,
} from '../../types/seoOptimizer';
import { AdminNavSection } from './AdminSidebar';
import { RichTextEditor } from './RichTextEditor';

interface AdminAiSeoOptimizerProps {
  onNavigateSection?: (section: AdminNavSection) => void;
}

export const AdminAiSeoOptimizer: React.FC<AdminAiSeoOptimizerProps> = ({
  onNavigateSection,
}) => {
  // Blog Selection State
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(true);
  const [selectedBlogId, setSelectedBlogId] = useState<string>('');
  const [blogSearchQuery, setBlogSearchQuery] = useState('');
  const [customFocusKeyword, setCustomFocusKeyword] = useState('');

  // SEO Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SeoAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Recommendations Review State
  const [reviewedRecommendationIds, setReviewedRecommendationIds] = useState<Set<string>>(
    new Set()
  );
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);

  // Active view tab for detailed diagnostics: 'overview' | 'recommendations' | 'dimensions' | 'faqs'
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'dimensions' | 'faqs'>('overview');

  // Blog Editor Modal State (reusing Blog Editor without auto-saving)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [isSavingBlog, setIsSavingBlog] = useState(false);
  const [editorNotification, setEditorNotification] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);

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
    category: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    seoTitle: '',
    metaDescription: '',
    seoSlug: '',
    isPublished: false,
  });

  // Load existing blogs on mount
  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    setIsLoadingBlogs(true);
    try {
      const res = await fetchAdminBlogs({ status: 'all' });
      if (res && res.blogs) {
        setBlogs(res.blogs);
        if (res.blogs.length > 0 && !selectedBlogId) {
          setSelectedBlogId(res.blogs[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load blogs in AI SEO Optimizer', err);
    } finally {
      setIsLoadingBlogs(false);
    }
  };

  const selectedBlog = useMemo(() => {
    return blogs.find((b) => b.id === selectedBlogId) || null;
  }, [blogs, selectedBlogId]);

  // Filtered blogs for selector search
  const filteredBlogs = useMemo(() => {
    if (!blogSearchQuery.trim()) return blogs;
    const query = blogSearchQuery.toLowerCase();
    return blogs.filter(
      (b) =>
        b.title.toLowerCase().includes(query) ||
        b.slug.toLowerCase().includes(query) ||
        b.category.toLowerCase().includes(query)
    );
  }, [blogs, blogSearchQuery]);

  // Handle SEO Analysis
  const handleRunAnalysis = async () => {
    if (!selectedBlogId && !selectedBlog) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeBlogSeo({
        blogId: selectedBlogId,
        focusKeyword: customFocusKeyword.trim() || undefined,
      });
      setAnalysisResult(result);
      // Reset reviewed states on fresh analysis
      setReviewedRecommendationIds(new Set());
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to complete SEO analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle recommendation reviewed status
  const handleToggleReviewed = (recId: string) => {
    setReviewedRecommendationIds((prev) => {
      const next = new Set(prev);
      if (next.has(recId)) {
        next.delete(recId);
      } else {
        next.add(recId);
      }
      return next;
    });
  };

  // Quick copy to clipboard
  const handleCopyText = (text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedFieldId(fieldId);
    setTimeout(() => {
      setCopiedFieldId(null);
    }, 2000);
  };

  // Open the blog in the existing Editor modal
  const handleOpenBlogEditor = () => {
    if (!selectedBlog) return;
    setEditingBlog(selectedBlog);
    setEditorFormData({
      title: selectedBlog.title || '',
      slug: selectedBlog.slug || '',
      category: selectedBlog.category || 'Company Registration',
      content: selectedBlog.content || '',
      excerpt: selectedBlog.excerpt || '',
      featuredImage: selectedBlog.featuredImage || '',
      seoTitle: selectedBlog.seoTitle || selectedBlog.title || '',
      metaDescription: selectedBlog.metaDescription || selectedBlog.excerpt || '',
      seoSlug: selectedBlog.seoSlug || selectedBlog.slug || '',
      isPublished: Boolean(selectedBlog.isPublished),
    });
    setEditorNotification(null);
    setEditorError(null);
    setIsEditorOpen(true);
  };

  // Explicit manual save inside Blog Editor
  const handleSaveBlogFromEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlog) return;

    setIsSavingBlog(true);
    setEditorError(null);

    try {
      const payload: UpdateBlogPostInput = {
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

      const updated = await updateBlogPost(editingBlog.id, payload);
      setEditorNotification('Blog post updated successfully.');

      // Update in local state
      setBlogs((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setEditingBlog(updated);

      setTimeout(() => {
        setIsEditorOpen(false);
        setEditorNotification(null);
        // Automatically re-run audit on updated blog
        handleRunAnalysis();
      }, 1200);
    } catch (err: any) {
      setEditorError(err.message || 'Failed to update blog article');
    } finally {
      setIsSavingBlog(false);
    }
  };

  // Filter recommendations
  const filteredRecommendations = useMemo(() => {
    if (!analysisResult) return [];
    if (priorityFilter === 'all') return analysisResult.recommendations;
    return analysisResult.recommendations.filter((r) => r.priority === priorityFilter);
  }, [analysisResult, priorityFilter]);

  const reviewedCount = useMemo(() => {
    if (!analysisResult) return 0;
    return analysisResult.recommendations.filter((r) =>
      reviewedRecommendationIds.has(r.id)
    ).length;
  }, [analysisResult, reviewedRecommendationIds]);

  // Color helper for LEGOMARK Score
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 70) return 'text-blue-400 border-blue-500/40 bg-blue-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const getDimensionStatusBadge = (status: 'good' | 'warning' | 'critical') => {
    if (status === 'good') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          Optimal
        </span>
      );
    }
    if (status === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3" />
          Needs Work
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
        <AlertCircle className="w-3 h-3" />
        Critical
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Banner & Diagnostic Disclaimer */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0D1527] to-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                AI SEO Optimizer
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                On-Page Audit
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Diagnostic on-page SEO intelligence for Legomark legal insights and advisory articles.
              Evaluate headings, title tags, meta snippets, semantic keywords, readability, and FAQ opportunities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateSection && (
              <button
                onClick={() => onNavigateSection('blogs')}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span>All Articles</span>
              </button>
            )}

            {selectedBlog && (
              <button
                onClick={handleOpenBlogEditor}
                className="px-3.5 py-2 text-xs font-medium text-white bg-orange-600 hover:bg-orange-500 rounded-xl transition flex items-center gap-2 shadow-lg shadow-orange-600/20 font-semibold"
              >
                <Edit2 className="w-4 h-4" />
                <span>Open in Blog Editor</span>
              </button>
            )}
          </div>
        </div>

        {/* Explicit Diagnostic Notice */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
          <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-200">Diagnostic Notice:</strong> The LEGOMARK SEO Score is our proprietary in-house diagnostic metric (0–100) assessing structural completeness, E-E-A-T depth, and snippet health. It is{' '}
            <span className="underline decoration-slate-600 font-semibold text-slate-300">not a Google ranking score</span> or rank guarantee. All recommendations are presented for editorial review; no articles are automatically altered or published.
          </span>
        </div>
      </div>

      {/* ARTICLE SELECTION CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          {/* Article Picker */}
          <div className="flex-1 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Article for SEO Diagnostics
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dropdown selector */}
              <div>
                <select
                  value={selectedBlogId}
                  onChange={(e) => {
                    setSelectedBlogId(e.target.value);
                    setAnalysisResult(null);
                  }}
                  disabled={isLoadingBlogs || isAnalyzing}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-hidden focus:border-orange-500 font-medium"
                >
                  {isLoadingBlogs ? (
                    <option value="">Loading existing blogs...</option>
                  ) : blogs.length === 0 ? (
                    <option value="">No articles found</option>
                  ) : (
                    blogs.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.isPublished ? '● Published' : '○ Draft'} | {b.title.slice(0, 60)}...
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Optional Custom Focus Keyword */}
              <div>
                <input
                  type="text"
                  placeholder="Optional Focus Keyword (or leave blank for AI detection)"
                  value={customFocusKeyword}
                  onChange={(e) => setCustomFocusKeyword(e.target.value)}
                  disabled={isAnalyzing}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-orange-500"
                />
              </div>
            </div>

            {/* Selected Blog Snapshot */}
            {selectedBlog && (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Category: {selectedBlog.category}</span>
                <span className="text-slate-600">•</span>
                <span>Slug: /blog/{selectedBlog.slug}</span>
                <span className="text-slate-600">•</span>
                <span
                  className={`inline-flex items-center gap-1 font-medium ${
                    selectedBlog.isPublished ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {selectedBlog.isPublished ? 'Live on Website' : 'Draft'}
                </span>
                {selectedBlog.seoTitle && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 truncate max-w-xs">
                      SEO Title: {selectedBlog.seoTitle}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing || !selectedBlogId}
              className="px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-orange-600/20 flex items-center gap-2.5 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Analyzing SEO Metrics...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-orange-200" />
                  <span>Analyze Current SEO</span>
                </>
              )}
            </button>
          </div>
        </div>

        {analysisError && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{analysisError}</span>
          </div>
        )}
      </div>

      {/* ANALYSIS RESULTS DASHBOARD */}
      {analysisResult ? (
        <div className="space-y-6">
          {/* HERO SCORE & SUMMARY PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 1. Score Gauge Card */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-orange-400" />
                    LEGOMARK SEO Score
                  </span>
                  <span className="text-xs text-slate-400">Diagnostic</span>
                </div>
                <h3 className="text-sm font-medium text-slate-300">
                  Overall On-Page Health
                </h3>
              </div>

              {/* Big Score Display */}
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <div
                  className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center transition-all ${getScoreColor(
                    analysisResult.legomarkScore
                  )}`}
                >
                  <span className="text-4xl font-extrabold tracking-tight">
                    {analysisResult.legomarkScore}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">/ 100</span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      analysisResult.scoreGrade === 'Excellent'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : analysisResult.scoreGrade === 'Good'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : analysisResult.scoreGrade === 'Needs Improvement'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {analysisResult.scoreGrade}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2 max-w-xs">
                  {analysisResult.scoreGrade === 'Excellent'
                    ? 'Superb on-page foundation! Snippets, keywords, and structural hierarchy are fully aligned.'
                    : analysisResult.scoreGrade === 'Good'
                    ? 'Solid foundation with minor optimization opportunities in meta tags or internal links.'
                    : analysisResult.scoreGrade === 'Needs Improvement'
                    ? 'Key on-page dimensions need attention before maximizing organic search traction.'
                    : 'Critical SEO gaps detected. Review high-priority fixes below.'}
                </p>
              </div>

              {/* Mini Diagnostic Tag */}
              <div className="pt-3 border-t border-slate-800 text-center">
                <span className="text-[11px] text-slate-400">
                  Audited at {new Date(analysisResult.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Read-only
                </span>
              </div>
            </div>

            {/* 2. Key Metrics & Search Intent Card */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                      Semantic Keyword Context
                    </span>
                    <h3 className="text-base font-semibold text-white">
                      Target Focus Keyword & Search Intent
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200">
                      {analysisResult.searchIntent}
                    </span>
                  </div>
                </div>

                {/* Focus Keyword & LSI terms */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <div className="text-xs text-slate-400 font-medium">Primary Focus Keyword</div>
                    <div className="text-sm font-bold text-orange-400 flex items-center justify-between">
                      <span>"{analysisResult.focusKeyword}"</span>
                      <button
                        onClick={() => handleCopyText(analysisResult.focusKeyword, 'focusKw')}
                        className="text-slate-400 hover:text-white p-1 rounded transition"
                        title="Copy keyword"
                      >
                        {copiedFieldId === 'focusKw' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="text-xs text-slate-400">
                      Density:{' '}
                      <span className="font-semibold text-slate-200">
                        {analysisResult.metrics.keywordDensityPercent}%
                      </span>{' '}
                      ({analysisResult.metrics.keywordOccurrences} exact occurrences)
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <div className="text-xs text-slate-400 font-medium">Secondary Semantic Targets</div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.secondaryKeywords && analysisResult.secondaryKeywords.length > 0 ? (
                        analysisResult.secondaryKeywords.slice(0, 4).map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-xs bg-slate-800 text-slate-300 border border-slate-700"
                          >
                            {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">None detected</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Quick Stat Chips */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                    <div className="text-xs text-slate-400">Word Count</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {analysisResult.metrics.wordCount.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      ~{analysisResult.metrics.readingTimeMinutes} min read
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                    <div className="text-xs text-slate-400">Headings (H1/H2/H3)</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {analysisResult.metrics.h1Count} / {analysisResult.metrics.h2Count} /{' '}
                      {analysisResult.metrics.h3Count}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {analysisResult.metrics.h2Count >= 3 ? 'Structured' : 'Needs subheadings'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                    <div className="text-xs text-slate-400">Internal Links</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {analysisResult.metrics.internalLinkCount}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {analysisResult.metrics.externalLinkCount} external reference(s)
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                    <div className="text-xs text-slate-400">Readability Score</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {analysisResult.metrics.fleschReadingEase}/100
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {analysisResult.metrics.readabilityLevel}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Banner to Review Recommendations */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  <strong className="text-white">{analysisResult.recommendations.length}</strong> recommendations found (
                  <span className="text-orange-400 font-semibold">{reviewedCount}</span> reviewed)
                </span>
                <button
                  onClick={() => setActiveTab('recommendations')}
                  className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition"
                >
                  <span>Review Recommendations</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* NAVIGATION TABS */}
          <div className="border-b border-slate-800 flex items-center gap-2 overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-orange-500 text-orange-400 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gauge className="w-4 h-4" />
              <span>11 Core Dimensions Audit</span>
            </button>

            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'recommendations'
                  ? 'border-orange-500 text-orange-400 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCheck className="w-4 h-4" />
              <span>Actionable Recommendations ({analysisResult.recommendations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('faqs')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'faqs'
                  ? 'border-orange-500 text-orange-400 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>FAQ Opportunities ({analysisResult.faqOpportunities.length})</span>
            </button>
          </div>

          {/* TAB 1: 11 CORE DIMENSIONS AUDIT */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* GOOGLE SEARCH SERP PREVIEW BOX */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>Google Desktop & Mobile SERP Snippet Preview</span>
                  </div>
                  <span className="text-xs text-slate-400">Real-time rendering</span>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800/80 max-w-3xl space-y-1">
                  <div className="text-[12px] text-slate-400 flex items-center gap-1.5 truncate">
                    <span className="font-medium text-slate-300">https://legomark.com</span>
                    <span>›</span>
                    <span className="text-slate-400">blog</span>
                    <span>›</span>
                    <span className="text-slate-400">{analysisResult.dimensions.urlSlug.currentValue || selectedBlog?.slug}</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold text-blue-400 hover:underline cursor-pointer truncate">
                    {analysisResult.dimensions.seoTitle.currentValue || selectedBlog?.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {analysisResult.dimensions.metaDescription.currentValue ||
                      'No meta description provided. Google will extract arbitrary text snippet from body content.'}
                  </p>
                </div>
              </div>

              {/* 11 DIMENSIONS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. SEO Title */}
                <DimensionCard
                  dimension={analysisResult.dimensions.seoTitle}
                  icon={FileText}
                  onCopy={(val) => handleCopyText(val, 'seoTitleRec')}
                  copied={copiedFieldId === 'seoTitleRec'}
                />

                {/* 2. Meta Description */}
                <DimensionCard
                  dimension={analysisResult.dimensions.metaDescription}
                  icon={AlignLeft}
                  onCopy={(val) => handleCopyText(val, 'metaDescRec')}
                  copied={copiedFieldId === 'metaDescRec'}
                />

                {/* 3. Focus Keyword */}
                <DimensionCard
                  dimension={analysisResult.dimensions.focusKeyword}
                  icon={Tag}
                  onCopy={(val) => handleCopyText(val, 'focusKwRec')}
                  copied={copiedFieldId === 'focusKwRec'}
                />

                {/* 4. Keyword Usage */}
                <DimensionCard
                  dimension={analysisResult.dimensions.keywordUsage}
                  icon={Sliders}
                />

                {/* 5. H1/H2/H3 Structure */}
                <DimensionCard
                  dimension={analysisResult.dimensions.headingStructure}
                  icon={Layers}
                  extraContent={
                    analysisResult.metrics.headings.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Heading Outline Detected
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
                          {analysisResult.metrics.headings.map((h, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2 py-0.5 ${
                                h.level === 1 ? 'text-white font-bold' : h.level === 2 ? 'pl-3 text-slate-300 font-medium' : 'pl-6 text-slate-400'
                              }`}
                            >
                              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                                H{h.level}
                              </span>
                              <span className="truncate">{h.text}</span>
                              {h.hasKeyword && (
                                <span className="text-[10px] text-emerald-400 font-semibold px-1 rounded bg-emerald-500/10 shrink-0">
                                  KW
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                />

                {/* 6. Content Length */}
                <DimensionCard
                  dimension={analysisResult.dimensions.contentLength}
                  icon={Clock}
                />

                {/* 7. Readability */}
                <DimensionCard
                  dimension={analysisResult.dimensions.readability}
                  icon={BookOpen}
                />

                {/* 8. Internal Links */}
                <DimensionCard
                  dimension={analysisResult.dimensions.internalLinks}
                  icon={Link2}
                  extraContent={
                    analysisResult.suggestedInternalLinkTargets &&
                    analysisResult.suggestedInternalLinkTargets.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                        <div className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">
                          Recommended Service Link Targets
                        </div>
                        <div className="space-y-1.5">
                          {analysisResult.suggestedInternalLinkTargets.map((target, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-0.5"
                            >
                              <div className="font-semibold text-white flex items-center justify-between">
                                <span>{target.serviceTitle}</span>
                                <span className="text-[11px] text-orange-400 font-mono">
                                  /services/{target.serviceSlug}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Anchor Text:{' '}
                                <strong className="text-slate-200">"{target.recommendedAnchorText}"</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                />

                {/* 9. Image / Alt Text */}
                <DimensionCard
                  dimension={analysisResult.dimensions.imagesAlt}
                  icon={ImageIcon}
                />

                {/* 10. URL Slug */}
                <DimensionCard
                  dimension={analysisResult.dimensions.urlSlug}
                  icon={ExternalLink}
                  onCopy={(val) => handleCopyText(val, 'slugRec')}
                  copied={copiedFieldId === 'slugRec'}
                />

                {/* 11. FAQ Opportunities */}
                <DimensionCard
                  dimension={analysisResult.dimensions.faqOpportunities}
                  icon={HelpCircle}
                  extraContent={
                    <button
                      onClick={() => setActiveTab('faqs')}
                      className="mt-3 text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
                    >
                      <span>View Suggested Question Outline</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  }
                />
              </div>
            </div>
          )}

          {/* TAB 2: ACTIONABLE RECOMMENDATIONS REVIEW */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              {/* Filter & Review Progress Bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ListFilter className="w-3.5 h-3.5 text-orange-400" />
                    Filter Priority:
                  </span>
                  {(['all', 'high', 'medium', 'low'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                        priorityFilter === p
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-400">
                    Reviewed:{' '}
                    <strong className="text-white">
                      {reviewedCount} of {analysisResult.recommendations.length}
                    </strong>
                  </div>
                  <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{
                        width: `${
                          analysisResult.recommendations.length > 0
                            ? (reviewedCount / analysisResult.recommendations.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Recommendations List */}
              <div className="space-y-3">
                {filteredRecommendations.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
                    No recommendations matching the "{priorityFilter}" priority filter.
                  </div>
                ) : (
                  filteredRecommendations.map((rec) => {
                    const isReviewed = reviewedRecommendationIds.has(rec.id);
                    return (
                      <div
                        key={rec.id}
                        className={`bg-slate-900 border rounded-2xl p-5 transition shadow-md ${
                          isReviewed
                            ? 'border-emerald-500/30 bg-slate-900/60 opacity-80'
                            : rec.priority === 'high'
                            ? 'border-rose-500/30'
                            : rec.priority === 'medium'
                            ? 'border-amber-500/30'
                            : 'border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                                  rec.priority === 'high'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : rec.priority === 'medium'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}
                              >
                                {rec.priority} Priority
                              </span>
                              <span className="text-xs font-semibold text-slate-400">
                                {rec.dimension}
                              </span>
                              {isReviewed && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                  <Check className="w-3 h-3" /> Reviewed
                                </span>
                              )}
                            </div>

                            <h4 className="text-base font-bold text-white tracking-tight">
                              {rec.title}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                              {rec.description}
                            </p>
                          </div>

                          {/* Reviewed Checkbox Button */}
                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              onClick={() => handleToggleReviewed(rec.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                                isReviewed
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-700'
                              }`}
                            >
                              {isReviewed ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Reviewed</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-3.5 h-3.5 rounded border border-slate-500" />
                                  <span>Mark Reviewed</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Current vs Recommended Comparison */}
                        {(rec.currentValue || rec.recommendedValue) && (
                          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            {rec.currentValue && (
                              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                                <span className="font-semibold text-slate-400">Current Value:</span>
                                <div className="text-slate-300 font-mono text-[11px] break-all">
                                  {rec.currentValue}
                                </div>
                              </div>
                            )}

                            {rec.recommendedValue && (
                              <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/20 space-y-1 relative">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-orange-400">
                                    Recommended Value:
                                  </span>
                                  <button
                                    onClick={() => handleCopyText(rec.recommendedValue || '', rec.id)}
                                    className="text-slate-400 hover:text-white p-1 rounded transition"
                                    title="Copy recommended text"
                                  >
                                    {copiedFieldId === rec.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                                <div className="text-slate-200 font-mono text-[11px] break-all">
                                  {rec.recommendedValue}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Suggested Editorial Action */}
                        <div className="mt-3 text-xs text-slate-400 flex items-start gap-2">
                          <span className="font-semibold text-slate-300 shrink-0">Action:</span>
                          <span>{rec.suggestedAction}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FAQ OPPORTUNITIES */}
          {activeTab === 'faqs' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    High-Intent FAQ & People Also Ask (PAA) Opportunities
                  </h3>
                </div>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Adding structured FAQ accordions targeting real customer questions captures featured snippet positions in Google SERPs and voice search results. Review and copy these suggested questions into your Blog Editor.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {analysisResult.faqOpportunities.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
                    No FAQ opportunities generated.
                  </div>
                ) : (
                  analysisResult.faqOpportunities.map((faq, i) => (
                    <div
                      key={i}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-500/20 text-orange-300 border border-orange-500/30">
                              FAQ #{i + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                              {faq.relevance} Relevance
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white">
                            {faq.question}
                          </h4>
                        </div>

                        <button
                          onClick={() =>
                            handleCopyText(
                              `Q: ${faq.question}\n\nA: ${faq.suggestedAnswerOutline}`,
                              `faq-${i}`
                            )
                          }
                          className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition shrink-0"
                          title="Copy FAQ"
                        >
                          {copiedFieldId === `faq-${i}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Q&A</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                        <div className="text-xs font-semibold text-orange-400">Suggested Answer Outline:</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {faq.suggestedAnswerOutline}
                        </p>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-500" />
                        <span>Search Intent: {faq.intentRationale}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty Prompt State */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">
              Ready for Deep SEO Diagnostics
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Select an article above and click <strong className="text-slate-200">"Analyze Current SEO"</strong> to inspect on-page health, title/meta snippets, heading hierarchy, keyword density, and FAQ opportunities.
            </p>
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
                  <Edit2 className="w-4 h-4 text-orange-400" />
                  <span>Edit Article in Blog Editor</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review SEO recommendations and refine your article. Changes are only saved when you explicitly click "Save Changes".
                </p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBlogFromEditor} className="flex-1 overflow-y-auto p-6 space-y-6">
              {editorNotification && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{editorNotification}</span>
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
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editorFormData.title}
                    onChange={(e) => setEditorFormData({ ...editorFormData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={editorFormData.slug}
                    onChange={(e) => setEditorFormData({ ...editorFormData, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editorFormData.category}
                    onChange={(e) => setEditorFormData({ ...editorFormData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              {/* SEO Title & Meta Description */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Search Engine Metadata
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      SEO Title Tag
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {editorFormData.seoTitle.length} / 60 chars
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter optimized title tag"
                    value={editorFormData.seoTitle}
                    onChange={(e) => setEditorFormData({ ...editorFormData, seoTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Meta Description Snippet
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {editorFormData.metaDescription.length} / 160 chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Enter engaging meta description with call to action..."
                    value={editorFormData.metaDescription}
                    onChange={(e) =>
                      setEditorFormData({ ...editorFormData, metaDescription: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500 resize-none"
                  />
                </div>
              </div>

              {/* Body Content Editor */}
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300">
                  Article Body (Rich Text)
                </label>
                <RichTextEditor
                  value={editorFormData.content}
                  onChange={(val) => setEditorFormData({ ...editorFormData, content: val })}
                  minHeight="350px"
                />
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white">Publication Status</span>
                  <p className="text-[11px] text-slate-400">
                    Live articles are immediately visible on public /blog
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
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl transition"
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
                      <Save className="w-3.5 h-3.5" />
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

// Reusable Dimension Card Component
interface DimensionCardProps {
  dimension: SeoDimensionAudit;
  icon: React.ElementType;
  extraContent?: React.ReactNode;
  onCopy?: (val: string) => void;
  copied?: boolean;
}

const DimensionCard: React.FC<DimensionCardProps> = ({
  dimension,
  icon: Icon,
  extraContent,
  onCopy,
  copied,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-3">
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-800 text-orange-400">
              <Icon className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">{dimension.title}</h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">
              {dimension.score} / {dimension.maxScore} pts
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                dimension.status === 'good'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : dimension.status === 'warning'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {dimension.status === 'good'
                ? 'Optimal'
                : dimension.status === 'warning'
                ? 'Warning'
                : 'Critical'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 mt-2 font-medium leading-relaxed">
          {dimension.summary}
        </p>

        {/* Current vs Recommended */}
        {(dimension.currentValue || dimension.recommendedValue) && (
          <div className="mt-3 space-y-1.5 text-xs">
            {dimension.currentValue && (
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300">
                <span className="text-slate-400 font-semibold">Current: </span>
                <span className="break-all">{dimension.currentValue}</span>
              </div>
            )}

            {dimension.recommendedValue && (
              <div className="p-2.5 rounded-lg bg-orange-950/20 border border-orange-500/20 text-[11px] text-orange-200 flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-orange-400 font-semibold">Recommended: </span>
                  <span className="break-all">{dimension.recommendedValue}</span>
                </div>
                {onCopy && (
                  <button
                    onClick={() => onCopy(dimension.recommendedValue || '')}
                    className="p-1 text-slate-400 hover:text-white shrink-0 transition"
                    title="Copy recommendation"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Expandable Details */}
        {dimension.details.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-semibold transition"
            >
              <span>{isExpanded ? 'Hide audit breakdown' : 'View audit breakdown'}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {isExpanded && (
              <ul className="mt-2 space-y-1 pl-4 list-disc text-slate-400 text-xs">
                {dimension.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {extraContent}
      </div>
    </div>
  );
};
