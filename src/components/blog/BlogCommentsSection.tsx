import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  CornerDownRight,
  Info,
} from 'lucide-react';
import { BlogComment } from '../../types/blogComment';
import {
  fetchPublicBlogComments,
  submitPublicBlogComment,
} from '../../services/blogComment.service';

interface BlogCommentsSectionProps {
  blogSlug: string;
  blogTitle: string;
}

export const BlogCommentsSection: React.FC<BlogCommentsSectionProps> = ({
  blogSlug,
  blogTitle,
}) => {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [blogSlug]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPublicBlogComments(blogSlug);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments for blog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    const trimmedName = authorName.trim();
    const trimmedContent = content.trim();

    if (!trimmedName) {
      setSubmitError('Please enter your name.');
      return;
    }

    if (!trimmedContent) {
      setSubmitError('Please enter your comment.');
      return;
    }

    if (trimmedContent.length < 3) {
      setSubmitError('Comment must be at least 3 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitPublicBlogComment(blogSlug, {
        authorName: trimmedName,
        authorEmail: authorEmail.trim() || undefined,
        content: trimmedContent,
      });

      setSubmitSuccess(
        res.message ||
          'Thank you! Your comment has been submitted and will appear once approved by our moderation team.'
      );

      // Clear input fields
      setAuthorName('');
      setAuthorEmail('');
      setContent('');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section className="mt-10 pt-8 border-t border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0B132B]">
              Discussion & Comments
            </h3>
            <p className="text-xs text-slate-500">
              {comments.length === 1
                ? '1 approved comment'
                : `${comments.length} approved comments`}
            </p>
          </div>
        </div>
      </div>

      {/* COMPACT "LEAVE A COMMENT" FORM */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 mb-8 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
          <span>Leave a Comment</span>
        </h4>
        <p className="text-xs text-slate-500 mb-4">
          Have a question or perspective regarding this legal guide? Submit your thoughts below. Your email address will not be published.
        </p>

        {submitSuccess && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-900">Submission Received</p>
              <p className="mt-0.5 text-emerald-700 leading-relaxed">{submitSuccess}</p>
            </div>
          </div>
        )}

        {submitError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder="e.g. ramesh@example.com"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Your Comment <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your questions, queries, or thoughts on this article..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition resize-y"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Comments undergo moderation and appear publicly once approved.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Comment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* APPROVED COMMENTS LIST */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading discussion...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No public comments yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Be the first to share your thoughts or ask a question above!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {comment.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {comment.authorName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-10 whitespace-pre-line">
                {comment.content}
              </p>

              {/* ADMIN REPLY (if present) */}
              {comment.adminReply && (
                <div className="mt-3 ml-6 sm:ml-10 p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-950">
                    <CornerDownRight className="w-3.5 h-3.5 text-orange-600" />
                    <span className="flex items-center gap-1 text-orange-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                      {comment.adminRepliedBy || 'LEGOMARK Legal Team'}
                    </span>
                    {comment.adminRepliedAt && (
                      <span className="text-[10px] text-orange-600/70 font-normal ml-auto">
                        {formatDate(comment.adminRepliedAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-orange-950 leading-relaxed pl-5 whitespace-pre-line">
                    {comment.adminReply}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
};
