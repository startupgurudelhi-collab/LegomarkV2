import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  X,
  Trash2,
  CornerDownRight,
  Reply,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Send,
  User,
  Mail,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { BlogComment, BlogCommentStats } from '../../types/blogComment';
import {
  fetchAdminBlogComments,
  updateAdminBlogCommentStatus,
  replyAdminBlogComment,
  deleteAdminBlogComment,
} from '../../services/blogComment.service';

export const AdminBlogCommentsPage: React.FC = () => {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [stats, setStats] = useState<BlogCommentStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Reply Modal State
  const [replyingComment, setReplyingComment] = useState<BlogComment | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Delete Modal State
  const [deletingComment, setDeletingComment] = useState<BlogComment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action Loading state map
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [statusFilter]);

  const loadComments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminBlogComments({
        status: statusFilter,
        search: search.trim() || undefined,
      });
      setComments(data.comments);
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load blog comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadComments();
  };

  const handleStatusChange = async (
    id: string,
    newStatus: 'approved' | 'rejected' | 'pending'
  ) => {
    setProcessingId(id);
    try {
      const updated = await updateAdminBlogCommentStatus(id, newStatus);
      setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));

      // Update local stats
      setStats((prev) => {
        const oldComment = comments.find((c) => c.id === id);
        if (!oldComment) return prev;
        const oldStatus = oldComment.status;
        return {
          ...prev,
          [oldStatus]: Math.max(0, (prev as any)[oldStatus] - 1),
          [newStatus]: (prev as any)[newStatus] + 1,
        };
      });

      setNotification(`Comment successfully marked as ${newStatus}.`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setError(err.message || `Failed to update status to ${newStatus}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenReplyModal = (comment: BlogComment) => {
    setReplyingComment(comment);
    setReplyText(comment.adminReply || '');
    setReplyError(null);
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingComment) return;

    if (!replyText.trim()) {
      setReplyError('Please write a reply before submitting.');
      return;
    }

    setIsSubmittingReply(true);
    setReplyError(null);

    try {
      const updated = await replyAdminBlogComment(replyingComment.id, replyText.trim());
      setComments((prev) => prev.map((c) => (c.id === replyingComment.id ? updated : c)));

      setNotification('Official reply saved and associated with the comment.');
      setReplyingComment(null);
      setReplyText('');
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setReplyError(err.message || 'Failed to save reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!deletingComment) return;

    setIsDeleting(true);
    try {
      await deleteAdminBlogComment(deletingComment.id);
      setComments((prev) => prev.filter((c) => c.id !== deletingComment.id));

      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        [deletingComment.status]: Math.max(0, (prev as any)[deletingComment.status] - 1),
      }));

      setNotification('Comment deleted successfully.');
      setDeletingComment(null);
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete comment');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Toast Notification */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#0B132B] border border-slate-800/90 rounded-xl p-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Comments
          </p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across all legal publications</p>
        </div>

        <div className="bg-[#0B132B] border border-slate-800/90 rounded-xl p-4">
          <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending Moderation
          </p>
          <p className="text-2xl font-bold text-amber-300 mt-1">{stats.pending}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Hidden from public view</p>
        </div>

        <div className="bg-[#0B132B] border border-slate-800/90 rounded-xl p-4">
          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </p>
          <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.approved}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Live on respective blogs</p>
        </div>

        <div className="bg-[#0B132B] border border-slate-800/90 rounded-xl p-4">
          <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <X className="w-3 h-3" />
            Rejected
          </p>
          <p className="text-2xl font-bold text-rose-300 mt-1">{stats.rejected}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Spam / discarded</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by commenter, email, comment, or blog title..."
            className="w-full pl-9 pr-4 py-2 bg-[#070D1E] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500 transition-colors"
          />
        </form>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#070D1E] border border-slate-700/80 rounded-xl shrink-0 overflow-x-auto">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === st
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{st}</span>
              {st === 'pending' && stats.pending > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={loadComments}
          disabled={isLoading}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shrink-0"
          title="Refresh comments"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Moderation Assurance Note */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-slate-200">Moderation Policy:</strong> All public comments are submitted as Pending by default. Only comments marked as <strong className="text-emerald-400">Approved</strong> are rendered publicly on the article page.
          </span>
        </div>
      </div>

      {/* COMMENTS LIST */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
            <span>Loading blog comments...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-12 text-center text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-600 opacity-60" />
            <p className="text-sm font-semibold text-slate-300">No comments found.</p>
            <p className="text-xs text-slate-500 mt-1">
              {statusFilter !== 'all'
                ? `No comments currently in "${statusFilter}" status.`
                : 'Reader comments submitted on public blog articles will appear here for review.'}
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`bg-[#0B132B] border rounded-2xl p-5 sm:p-6 transition shadow-md space-y-4 ${
                comment.status === 'pending'
                  ? 'border-amber-500/40 bg-amber-950/5'
                  : comment.status === 'approved'
                  ? 'border-slate-800/90 hover:border-slate-700'
                  : 'border-slate-800 opacity-60'
              }`}
            >
              {/* Header: Blog Context & Date & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                    <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                    <span>Article:</span>
                    <span className="text-white font-bold">{comment.blogTitle}</span>
                  </div>
                  <a
                    href={`/blog/${comment.blogSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-orange-400 hover:text-orange-300 hover:underline inline-flex items-center gap-1 font-mono"
                  >
                    <span>/blog/{comment.blogSlug}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {formatDate(comment.createdAt)}
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      comment.status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : comment.status === 'rejected'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
                    }`}
                  >
                    {comment.status}
                  </span>
                </div>
              </div>

              {/* Author & Comment Content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Author Info */}
                <div className="md:col-span-4 p-3 rounded-xl bg-[#070D1E] border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-orange-400 flex items-center justify-center text-xs font-bold">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {comment.authorName}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1 truncate">
                    <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{comment.authorEmail || 'No email provided'}</span>
                  </div>
                </div>

                {/* Comment Text */}
                <div className="md:col-span-8 p-3.5 rounded-xl bg-[#070D1E] border border-slate-800 space-y-2">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    Comment:
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                    {comment.content}
                  </p>
                </div>
              </div>

              {/* Associated Admin Reply (if exists) */}
              {comment.adminReply && (
                <div className="p-3.5 rounded-xl bg-orange-950/20 border border-orange-500/20 space-y-1.5 ml-2 sm:ml-6">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-orange-300 font-semibold">
                      <CornerDownRight className="w-3.5 h-3.5 text-orange-400" />
                      <span className="flex items-center gap-1 text-orange-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                        {comment.adminRepliedBy || 'LEGOMARK Legal Team'} (Official Reply)
                      </span>
                    </div>
                    {comment.adminRepliedAt && (
                      <span className="text-[11px] text-orange-400/80 font-mono">
                        {formatDate(comment.adminRepliedAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-orange-100 leading-relaxed pl-5 whitespace-pre-line">
                    {comment.adminReply}
                  </p>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  {/* Approve */}
                  {comment.status !== 'approved' && (
                    <button
                      onClick={() => handleStatusChange(comment.id, 'approved')}
                      disabled={processingId === comment.id}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {/* Reject */}
                  {comment.status !== 'rejected' && (
                    <button
                      onClick={() => handleStatusChange(comment.id, 'rejected')}
                      disabled={processingId === comment.id}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}

                  {/* Mark Pending */}
                  {comment.status !== 'pending' && (
                    <button
                      onClick={() => handleStatusChange(comment.id, 'pending')}
                      disabled={processingId === comment.id}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Mark Pending</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Reply Button */}
                  <button
                    onClick={() => handleOpenReplyModal(comment)}
                    className="px-3 py-1.5 rounded-lg bg-orange-600/90 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>{comment.adminReply ? 'Edit Reply' : 'Reply'}</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => setDeletingComment(comment)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* REPLY MODAL */}
      {replyingComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-[#0B132B] border border-slate-800 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl animate-fadeIn">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Reply className="w-4 h-4 text-orange-400" />
                  <span>Reply to Reader Comment</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Associated with: <strong className="text-slate-200">{replyingComment.blogTitle}</strong>
                </p>
              </div>
              <button
                onClick={() => setReplyingComment(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReply} className="p-6 space-y-4">
              {replyError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{replyError}</span>
                </div>
              )}

              {/* Reader's Comment Snapshot */}
              <div className="p-3.5 rounded-xl bg-[#070D1E] border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-400 font-semibold">
                  From: {replyingComment.authorName}
                </div>
                <p className="text-xs text-slate-300 italic line-clamp-3">
                  "{replyingComment.content}"
                </p>
              </div>

              {/* Reply Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Official LEGOMARK Response *
                </label>
                <textarea
                  required
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Provide authoritative clarification, advisory guidance, or next compliance steps..."
                  className="w-full px-3.5 py-2.5 bg-[#070D1E] border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReplyingComment(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReply}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  {isSubmittingReply ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Reply...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Save & Publish Reply</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-[#0B132B] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fadeIn space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Delete Comment?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to permanently delete this comment by{' '}
                <strong className="text-white">{deletingComment.authorName}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#070D1E] border border-slate-800 text-xs text-slate-300 italic line-clamp-2">
              "{deletingComment.content}"
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingComment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteComment}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
