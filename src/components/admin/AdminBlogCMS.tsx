import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  Edit2,
  Trash2,
  Eye,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  X,
  Calendar,
  User,
  Tag,
  Globe,
  Sparkles,
  ChevronRight,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { BlogPost, BlogStats, CreateBlogPostInput, UpdateBlogPostInput } from '../../types/blog';
import {
  fetchAdminBlogs,
  createBlogPost,
  updateBlogPost,
  toggleBlogPublish,
  deleteBlogPost,
} from '../../services/blog.service';
import { MediaUploadDropzone } from './MediaUploadDropzone';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { RichTextEditor } from './RichTextEditor';
import { RichContentRenderer } from '../blog/RichContentRenderer';

const BLOG_CATEGORIES = [
  'Company Registration',
  'Taxation & GST',
  'Trademark & IP',
  'Compliance & ROC',
  'Startups & Funding',
  'Corporate Advisory',
  'Legal Drafting',
  'FSSAI & Licensing',
];

export const AdminBlogCMS: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<BlogStats>({ total: 0, published: 0, drafts: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title' | 'publishedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [previewBlog, setPreviewBlog] = useState<BlogPost | null>(null);
  const [deletingBlog, setDeletingBlog] = useState<BlogPost | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Editor Form Data
  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    category: string;
    author: string;
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
    author: 'LEGOMARK Editorial Board',
    content: '',
    excerpt: '',
    featuredImage: '',
    seoTitle: '',
    metaDescription: '',
    seoSlug: '',
    isPublished: false,
  });

  const loadBlogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAdminBlogs({
        search,
        status: statusFilter,
        category: categoryFilter,
        sortBy,
        sortOrder,
      });
      setBlogs(res.blogs);
      setStats(res.stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load blog articles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, [search, statusFilter, categoryFilter, sortBy, sortOrder]);

  const handleOpenCreate = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      slug: '',
      category: 'Company Registration',
      author: 'LEGOMARK Editorial Board',
      content: '',
      excerpt: '',
      featuredImage: '',
      seoTitle: '',
      metaDescription: '',
      seoSlug: '',
      isPublished: false,
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (blog: BlogPost) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      category: blog.category,
      author: blog.author || 'LEGOMARK Editorial Board',
      content: blog.content,
      excerpt: blog.excerpt || '',
      featuredImage: blog.featuredImage || '',
      seoTitle: blog.seoTitle || blog.title,
      metaDescription: blog.metaDescription || blog.excerpt || '',
      seoSlug: blog.seoSlug || blog.slug,
      isPublished: blog.isPublished,
    });
    setIsEditorOpen(true);
  };

  const handleAutoGenerateSlug = () => {
    const generated = formData.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData((prev) => ({
      ...prev,
      slug: generated,
      seoSlug: prev.seoSlug || generated,
    }));
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Article title is required');
      return;
    }
    if (!formData.content.trim()) {
      setError('Article content cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editingBlog) {
        await updateBlogPost(editingBlog.id, {
          title: formData.title,
          slug: formData.slug || undefined,
          category: formData.category,
          author: formData.author,
          content: formData.content,
          excerpt: formData.excerpt || null,
          featuredImage: formData.featuredImage || null,
          seoTitle: formData.seoTitle || null,
          metaDescription: formData.metaDescription || null,
          seoSlug: formData.seoSlug || null,
          isPublished: formData.isPublished,
        });
        setSuccessMessage('Article updated successfully.');
      } else {
        await createBlogPost({
          title: formData.title,
          slug: formData.slug || undefined,
          category: formData.category,
          author: formData.author,
          content: formData.content,
          excerpt: formData.excerpt || null,
          featuredImage: formData.featuredImage || null,
          seoTitle: formData.seoTitle || null,
          metaDescription: formData.metaDescription || null,
          seoSlug: formData.seoSlug || null,
          isPublished: formData.isPublished,
        });
        setSuccessMessage('Article created successfully.');
      }

      setIsEditorOpen(false);
      await loadBlogs();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save blog article');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (blog: BlogPost) => {
    try {
      await toggleBlogPublish(blog.id);
      setSuccessMessage(`Article ${!blog.isPublished ? 'published' : 'moved to drafts'}.`);
      await loadBlogs();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle publication status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBlog) return;
    try {
      await deleteBlogPost(deletingBlog.id);
      setSuccessMessage('Article removed.');
      setDeletingBlog(null);
      await loadBlogs();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete article');
    }
  };

  const formatDate = (dStr?: string | null) => {
    if (!dStr) return '—';
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Blog & Resources</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
              CMS
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Create, manage and publish LEGOMARK INDIA's business, tax and compliance resources.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadBlogs()}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Refresh articles"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-orange-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Article</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Real Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Articles</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{stats.total}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-orange-400">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Editorial knowledge repository</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Published</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{stats.published}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-950/50 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span>Active on public website</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Drafts</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{stats.drafts}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-950/50 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Unpublished / Under review</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, excerpt, author, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">All Statuses ({stats.total})</option>
              <option value="published">Published Only ({stats.published})</option>
              <option value="draft">Drafts Only ({stats.drafts})</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">All Categories</option>
              {BLOG_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sorting Controls */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-white">{blogs.length}</strong> articles</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-hidden"
            >
              <option value="createdAt">Date Created</option>
              <option value="publishedAt">Publish Date</option>
              <option value="updatedAt">Last Updated</option>
              <option value="title">Title</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Blog Articles Table / Card View */}
      {isLoading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">Loading resources catalog...</p>
        </div>
      ) : blogs.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-400 mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No articles published yet</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
              Create your first LEGOMARK INDIA resource to begin building the knowledge hub.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Article</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Article</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Author</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Dates</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Article Details */}
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-3">
                        {blog.featuredImage ? (
                          <img
                            src={blog.featuredImage}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-500 shrink-0">
                            <BookOpen className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 max-w-md">
                          <h4 className="text-white font-semibold text-sm line-clamp-1 hover:text-orange-400 cursor-pointer" onClick={() => setPreviewBlog(blog)}>
                            {blog.title}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {blog.excerpt || 'No summary excerpt provided.'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                            <span>/{blog.slug}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                        {blog.category}
                      </span>
                    </td>

                    {/* Author */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{blog.author}</span>
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublish(blog)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                          blog.isPublished
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/80'
                            : 'bg-amber-950/60 text-amber-300 border-amber-800 hover:bg-amber-900/80'
                        }`}
                        title="Click to toggle publication status"
                      >
                        {blog.isPublished ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Dates */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-400">
                      <div>
                        <span className="text-slate-500">Pub: </span>
                        <span>{formatDate(blog.publishedAt)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Updated {formatDate(blog.updatedAt)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewBlog(blog)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                          title="Preview Public Card"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(blog)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                          title="Edit Article"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingBlog(blog)}
                          className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800/60 transition-colors"
                          title="Delete Article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BLOG EDITOR MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-fadeIn">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingBlog ? 'Edit Blog Article' : 'Create New Article'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Publish authoritative business and compliance guidance for Indian entrepreneurs.
                </p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveBlog} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* SECTION 1: CONTENT */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-semibold text-orange-400">
                  <FileText className="w-4 h-4" />
                  <span>Article Content</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Article Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Private Limited Company Registration in India: Step-by-Step Guide"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        URL Slug *
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoGenerateSlug}
                        className="text-[11px] text-orange-400 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Generate from Title</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. private-limited-company-registration"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-hidden focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                    >
                      {BLOG_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Author / Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Nomaan Rizvi or LEGOMARK Editorial Board"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Short Summary / Excerpt
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief overview summarizing key statutory steps and statutory requirements..."
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500 resize-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Full Article Body & Rich Visual Content *</span>
                      <span className="text-[11px] text-slate-500 font-normal">Headings, Lists, Quotes, Links & Native Inline Media</span>
                    </label>
                    <RichTextEditor
                      value={formData.content}
                      onChange={(newContent) => setFormData({ ...formData, content: newContent })}
                      placeholder="Write comprehensive statutory guide with headings (#, ##), bullet points (*), quotations (>), and inline illustrations..."
                      minHeight="420px"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: FEATURED MEDIA (NATIVE FILE UPLOAD ONLY) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-sm font-semibold text-orange-400">
                    <Tag className="w-4 h-4" />
                    <span>Featured Media (Native Upload Only)</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Zero external URLs permitted</span>
                </div>

                <MediaUploadDropzone
                  currentValue={formData.featuredImage}
                  onUploaded={(url) => setFormData({ ...formData, featuredImage: url })}
                  onRemove={() => setFormData({ ...formData, featuredImage: '' })}
                  category="media"
                  accept="image"
                  label="Featured Header Image"
                  helperText="Recommended: 1200x630 (PNG, JPG, WEBP under 10MB)"
                />
              </div>

              {/* SECTION 3: SEO METADATA */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-semibold text-orange-400">
                  <Globe className="w-4 h-4" />
                  <span>SEO & Meta Tag Configuration</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      placeholder="Defaults to article title if left blank"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Meta Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="150-160 character description optimized for search engine snippets..."
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-orange-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: PUBLISHING STATE */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-semibold text-orange-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publication State</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Publish to Public Knowledge Hub</h4>
                    <p className="text-xs text-slate-400">
                      When enabled, this article will be immediately visible on the public website.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl shadow-md transition-colors flex items-center gap-2"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{editingBlog ? 'Save Changes' : 'Create Article'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-fadeIn">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-400" />
                <h3 className="text-base font-bold text-white">Public Article Preview</h3>
              </div>
              <button
                onClick={() => setPreviewBlog(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {previewBlog.featuredImage && (
                <div className="w-full h-56 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                  <img
                    src={previewBlog.featuredImage}
                    alt={previewBlog.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    {previewBlog.category}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {previewBlog.author}
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(previewBlog.publishedAt || previewBlog.createdAt)}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-white">{previewBlog.title}</h2>
                {previewBlog.excerpt && (
                  <p className="text-sm text-slate-300 mt-2 font-medium leading-relaxed border-l-2 border-orange-500 pl-3 py-1 bg-slate-950/40 rounded-r-lg">
                    {previewBlog.excerpt}
                  </p>
                )}
              </div>

              <div className="border-t border-slate-800 pt-6">
                <RichContentRenderer
                  content={previewBlog.content}
                  className="prose prose-invert max-w-none text-slate-200"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingBlog && (
        <DeleteConfirmModal
          isOpen={Boolean(deletingBlog)}
          title="Delete Blog Article"
          message={`Are you sure you want to delete "${deletingBlog.title}"? This action is permanent and cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingBlog(null)}
        />
      )}
    </div>
  );
};
