import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquareQuote,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  User,
  X,
  Video,
  Eye,
  Star,
  RefreshCw,
  Search,
  ArrowUp,
  ArrowDown,
  Filter,
  Check,
  AlertTriangle,
  Play,
  Calendar,
} from 'lucide-react';
import {
  TestimonialItem,
  TestimonialStats,
  CreateTestimonialInput,
  UpdateTestimonialInput,
} from '../../types/testimonial';
import {
  fetchAdminTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  reorderTestimonials,
  AdminTestimonialFilters,
} from '../../services/testimonial.service';
import { MediaUploadDropzone } from './MediaUploadDropzone';

export const AdminTestimonialsCMS: React.FC = () => {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [stats, setStats] = useState<TestimonialStats>({
    total: 0,
    published: 0,
    draft: 0,
    withVideo: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [videoFilter, setVideoFilter] = useState(false);

  // Modals
  const [editingItem, setEditingItem] = useState<TestimonialItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<TestimonialItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    clientName: string;
    company: string;
    designation: string;
    quote: string;
    rating: number;
    avatarUrl: string;
    videoUrl: string;
    isActive: boolean;
    displayOrder: number;
  }>({
    clientName: '',
    company: '',
    designation: '',
    quote: '',
    rating: 5,
    avatarUrl: '',
    videoUrl: '',
    isActive: true,
    displayOrder: 1,
  });

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const loadTestimonials = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: AdminTestimonialFilters = {
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        hasVideo: videoFilter ? true : undefined,
        sortBy: 'displayOrder',
        sortOrder: 'asc',
      };
      const res = await fetchAdminTestimonials(filters);
      setTestimonials(res.testimonials);
      setStats(res.stats);
    } catch (err: any) {
      console.error('Failed to load testimonials:', err);
      setError(err.message || 'Unable to connect to testimonials repository');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, videoFilter]);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  const handleOpenAdd = () => {
    const nextOrder = testimonials.length > 0 ? Math.max(...testimonials.map((t) => t.displayOrder)) + 1 : 1;
    setEditingItem(null);
    setFormData({
      clientName: '',
      company: '',
      designation: '',
      quote: '',
      rating: 5,
      avatarUrl: '',
      videoUrl: '',
      isActive: true,
      displayOrder: nextOrder,
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (item: TestimonialItem) => {
    setEditingItem(item);
    setFormData({
      clientName: item.clientName,
      company: item.company || '',
      designation: item.designation || '',
      quote: item.quote,
      rating: item.rating || 5,
      avatarUrl: item.avatarUrl || '',
      videoUrl: item.videoUrl || '',
      isActive: item.isActive,
      displayOrder: item.displayOrder,
    });
    setIsEditorOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      setError('Client name is required');
      return;
    }
    if (!formData.quote.trim()) {
      setError('Testimonial quote text is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (editingItem) {
        // Update
        const payload: UpdateTestimonialInput = {
          clientName: formData.clientName.trim(),
          company: formData.company.trim() || undefined,
          designation: formData.designation.trim() || undefined,
          quote: formData.quote.trim(),
          rating: formData.rating,
          avatarUrl: formData.avatarUrl || null,
          videoUrl: formData.videoUrl || null,
          isActive: formData.isActive,
          displayOrder: formData.displayOrder,
        };
        await updateTestimonial(editingItem.id, payload);
        showToast('Client review updated successfully.');
      } else {
        // Create
        const payload: CreateTestimonialInput = {
          clientName: formData.clientName.trim(),
          company: formData.company.trim() || undefined,
          designation: formData.designation.trim() || undefined,
          quote: formData.quote.trim(),
          rating: formData.rating,
          avatarUrl: formData.avatarUrl || null,
          videoUrl: formData.videoUrl || null,
          isActive: formData.isActive,
          displayOrder: formData.displayOrder,
        };
        await createTestimonial(payload);
        showToast('New client testimonial published.');
      }
      setIsEditorOpen(false);
      await loadTestimonials();
    } catch (err: any) {
      console.error('Error saving testimonial:', err);
      setError(err.message || 'Failed to save testimonial');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (item: TestimonialItem) => {
    try {
      const newStatus = !item.isActive;
      await updateTestimonial(item.id, { isActive: newStatus });
      showToast(`Testimonial marked as ${newStatus ? 'Published' : 'Draft / Inactive'}.`);
      await loadTestimonials();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleMoveOrder = async (item: TestimonialItem, direction: 'up' | 'down') => {
    const currentIndex = testimonials.findIndex((t) => t.id === item.id);
    if (currentIndex < 0) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= testimonials.length) return;

    const currentItem = testimonials[currentIndex];
    const targetItem = testimonials[targetIndex];

    const newOrders = [
      { id: currentItem.id, displayOrder: targetItem.displayOrder },
      { id: targetItem.id, displayOrder: currentItem.displayOrder },
    ];

    try {
      await reorderTestimonials(newOrders);
      showToast('Display sequence updated.');
      await loadTestimonials();
    } catch (err: any) {
      setError('Failed to reorder testimonials');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteTestimonial(deletingId);
      showToast('Testimonial deleted successfully.');
      setDeletingId(null);
      await loadTestimonials();
    } catch (err: any) {
      setError('Failed to delete testimonial');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setVideoFilter(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <MessageSquareQuote className="w-6 h-6 text-orange-500" />
            Reviews & Testimonials
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage client reviews, testimonials and social proof displayed across the LEGOMARK INDIA website.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Client Testimonial
        </button>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-3.5 bg-emerald-950/70 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="p-3.5 bg-rose-950/70 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Top Metrics (Using Real Database Records) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total */}
        <button
          onClick={() => {
            setStatusFilter('all');
            setVideoFilter(false);
          }}
          className={`text-left bg-slate-900 border rounded-xl p-4 transition-all ${
            statusFilter === 'all' && !videoFilter
              ? 'border-orange-500/60 bg-slate-900/90'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Testimonials</span>
            <MessageSquareQuote className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {isLoading ? '...' : stats.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">All client reviews</div>
        </button>

        {/* Published */}
        <button
          onClick={() => {
            setStatusFilter('published');
            setVideoFilter(false);
          }}
          className={`text-left bg-slate-900 border rounded-xl p-4 transition-all ${
            statusFilter === 'published'
              ? 'border-emerald-500/60 bg-slate-900/90'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-medium">Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {isLoading ? '...' : stats.published}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Live on website</div>
        </button>

        {/* Draft / Inactive */}
        <button
          onClick={() => {
            setStatusFilter('draft');
            setVideoFilter(false);
          }}
          className={`text-left bg-slate-900 border rounded-xl p-4 transition-all ${
            statusFilter === 'draft'
              ? 'border-slate-500/60 bg-slate-900/90'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Draft / Inactive</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-300">
            {isLoading ? '...' : stats.draft}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Hidden from public</div>
        </button>

        {/* With Video */}
        <button
          onClick={() => {
            setVideoFilter(true);
            setStatusFilter('all');
          }}
          className={`text-left bg-slate-900 border rounded-xl p-4 transition-all ${
            videoFilter
              ? 'border-orange-500/60 bg-slate-900/90'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-orange-400 mb-2">
            <span className="text-xs font-medium">With Native Video</span>
            <Video className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-400">
            {isLoading ? '...' : stats.withVideo}
          </div>
          <div className="text-[11px] text-orange-400/80 mt-1">Video reviews attached</div>
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, company, quote..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-hidden focus:border-orange-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="draft">Draft / Inactive</option>
          </select>

          {/* Video Toggle */}
          <button
            onClick={() => setVideoFilter(!videoFilter)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
              videoFilter
                ? 'bg-orange-600/20 text-orange-300 border-orange-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video Only</span>
          </button>

          {/* Clear Filters */}
          {(searchQuery || statusFilter !== 'all' || videoFilter) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 4. Table (Desktop) / Cards (Mobile) */}
      {isLoading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading client testimonials...</p>
        </div>
      ) : testimonials.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400 shadow-xs">
            <MessageSquareQuote className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">No testimonials yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || videoFilter
              ? 'No testimonials matched your active search and filter criteria.'
              : 'Published client reviews will appear here once added.'}
          </p>
          <div className="pt-2">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add First Testimonial
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-14 text-center">Order</th>
                  <th className="py-3 px-4">Client & Role</th>
                  <th className="py-3 px-4">Testimonial Quote</th>
                  <th className="py-3 px-3 text-center">Media</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {testimonials.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Order & Reorder arrows */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="font-mono text-[11px] text-slate-400 font-bold">
                          #{item.displayOrder}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveOrder(item, 'up')}
                            disabled={index === 0}
                            className="p-0.5 text-slate-500 hover:text-orange-400 disabled:opacity-20 disabled:hover:text-slate-500"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveOrder(item, 'down')}
                            disabled={index === testimonials.length - 1}
                            className="p-0.5 text-slate-500 hover:text-orange-400 disabled:opacity-20 disabled:hover:text-slate-500"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Client & Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                          {item.avatarUrl ? (
                            <img
                              src={item.avatarUrl}
                              alt={item.clientName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{item.clientName}</div>
                          <div className="text-[11px] text-orange-400/90 font-medium">
                            {item.designation || 'Client'}
                            {item.company ? ` • ${item.company}` : ''}
                          </div>
                          {/* Rating Stars */}
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-2.5 h-2.5 ${
                                  i < (item.rating || 5)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Quote */}
                    <td className="py-3 px-4 max-w-sm">
                      <p className="text-slate-300 text-xs line-clamp-2 italic leading-relaxed">
                        "{item.quote}"
                      </p>
                    </td>

                    {/* Media Badges */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.avatarUrl ? (
                          <span
                            className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded text-[10px] font-semibold"
                            title="Client portrait uploaded"
                          >
                            Photo
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px]">No Photo</span>
                        )}

                        {item.videoUrl ? (
                          <button
                            onClick={() => setPreviewItem(item)}
                            className="px-2 py-0.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                            title="Click to preview native video"
                          >
                            <Play className="w-2.5 h-2.5 fill-orange-400" />
                            <span>Video</span>
                          </button>
                        ) : null}
                      </div>
                    </td>

                    {/* Status Badge & Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                          item.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                        title="Click to toggle status"
                      >
                        {item.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Published</span>
                          </>
                        ) : (
                          <span>Draft</span>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview */}
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Preview Testimonial"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-orange-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Edit Testimonial"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Delete Testimonial"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {testimonials.map((item, index) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                      {item.avatarUrl ? (
                        <img
                          src={item.avatarUrl}
                          alt={item.clientName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.clientName}</h4>
                      <p className="text-xs text-orange-400">
                        {item.designation} {item.company ? `• ${item.company}` : ''}
                      </p>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-2.5 h-2.5 ${
                              i < (item.rating || 5)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      item.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {item.isActive ? 'Published' : 'Draft'}
                  </button>
                </div>

                <p className="text-xs text-slate-300 italic bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  "{item.quote}"
                </p>

                {item.videoUrl && (
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="w-full flex items-center justify-center gap-2 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 py-2 rounded-lg"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Watch Native Video Testimonial</span>
                  </button>
                )}

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-500">
                    <span>Order #{item.displayOrder}</span>
                    <button
                      onClick={() => handleMoveOrder(item, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:text-white disabled:opacity-20"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveOrder(item, 'down')}
                      disabled={index === testimonials.length - 1}
                      className="p-1 hover:text-white disabled:opacity-20"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-orange-400 text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 text-rose-300 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 5. Comprehensive Testimonial Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                  <MessageSquareQuote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingItem ? 'Edit Client Testimonial' : 'Add Client Testimonial'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Configure client details, endorsement text, and native media uploads.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-5">
              {/* SECTION: CLIENT INFORMATION */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                  1. Client Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Client Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Founder & CEO / Director"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Company / Enterprise
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Apex Innovations Pvt Ltd"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Client Star Rating
                    </label>
                    <select
                      value={formData.rating}
                      onChange={(e) =>
                        setFormData({ ...formData, rating: parseInt(e.target.value, 10) })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-orange-500 cursor-pointer"
                    >
                      <option value={5}>5 Stars (Exceptional)</option>
                      <option value={4}>4 Stars (Very Good)</option>
                      <option value={3}>3 Stars (Satisfactory)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION: TESTIMONIAL TEXT */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                  2. Client Endorsement Text
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Testimonial / Review Quote <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.quote}
                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                    placeholder="Share feedback on incorporation, compliance, or tax advisory services..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-orange-500 leading-relaxed"
                    required
                  />
                </div>
              </div>

              {/* SECTION: MEDIA (NATIVE UPLOAD ONLY - ZERO EXTERNAL URLS) */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                    3. Client Media (Native Storage Only)
                  </div>
                  <span className="text-[10px] text-slate-500">No external URLs</span>
                </div>

                {/* Client Portrait Photo Upload */}
                <MediaUploadDropzone
                  label="Client Portrait / Headshot"
                  helperText="Upload official client portrait (PNG, JPG, WEBP)"
                  category="testimonials"
                  accept="image"
                  currentValue={formData.avatarUrl}
                  onUploaded={(url) => setFormData({ ...formData, avatarUrl: url })}
                  onRemove={() => setFormData({ ...formData, avatarUrl: '' })}
                />

                {/* Testimonial Video File Upload */}
                <MediaUploadDropzone
                  label="Testimonial Video File (Native Video Upload Only)"
                  helperText="Upload genuine client video review (MP4, WEBM, MOV)"
                  category="testimonials"
                  accept="video"
                  maxSizeMB={50}
                  currentValue={formData.videoUrl}
                  onUploaded={(url) => setFormData({ ...formData, videoUrl: url })}
                  onRemove={() => setFormData({ ...formData, videoUrl: '' })}
                />
              </div>

              {/* SECTION: PUBLISHING & ORDER */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                  4. Publishing & Sequence
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Publication Status
                    </label>
                    <select
                      value={formData.isActive ? 'published' : 'draft'}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.value === 'published' })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-orange-500 cursor-pointer"
                    >
                      <option value="published">Published (Visible on Website)</option>
                      <option value="draft">Draft / Inactive (Hidden)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.displayOrder}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          displayOrder: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Publish Testimonial'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Public Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Eye className="w-4 h-4 text-orange-500" />
                <span>Public Website Preview</span>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Public Card Mockup */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 text-slate-900 space-y-4">
              {/* Rating Stars */}
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < (previewItem.rating || 5)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-slate-500 ml-1.5">
                  Verified Client Review
                </span>
              </div>

              {/* Quote */}
              <p className="text-sm text-slate-700 italic leading-relaxed">
                "{previewItem.quote}"
              </p>

              {/* Video Player if available */}
              {previewItem.videoUrl && (
                <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-200 mt-2">
                  <video
                    src={previewItem.videoUrl}
                    controls
                    playsInline
                    className="w-full max-h-56 object-contain"
                  />
                </div>
              )}

              {/* Client Profile Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {previewItem.avatarUrl ? (
                    <img
                      src={previewItem.avatarUrl}
                      alt={previewItem.clientName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{previewItem.clientName}</h4>
                  <p className="text-xs text-orange-600 font-medium">
                    {previewItem.designation}
                    {previewItem.company ? ` • ${previewItem.company}` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-bold text-white">Delete Testimonial?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This action will permanently remove this client review from the website and admin database.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="w-full px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
