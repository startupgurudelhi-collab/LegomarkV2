import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  User,
  ArrowLeft,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Receipt,
  Award,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Clock,
  Sparkles,
  Phone,
  Mail,
} from 'lucide-react';
import { BlogPost } from '../../types/blog';
import { fetchPublicBlogBySlug, fetchPublicBlogs } from '../../services/blog.service';
import { RichContentRenderer } from './RichContentRenderer';

interface BlogDetailPageProps {
  slug: string;
  onOpenConsultation?: (serviceName?: string) => void;
  onNavigateResources?: () => void;
  onNavigateBlogDetail?: (slug: string) => void;
  onNavigateHome?: () => void;
}

export const BlogDetailPage: React.FC<BlogDetailPageProps> = ({
  slug,
  onOpenConsultation,
  onNavigateResources,
  onNavigateBlogDetail,
  onNavigateHome,
}) => {
  const [article, setArticle] = useState<BlogPost | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const found = await fetchPublicBlogBySlug(slug);
        if (isMounted) {
          setArticle(found);
          if (found) {
            // Load related articles in same category
            const allInCat = await fetchPublicBlogs(found.category);
            if (isMounted) {
              setRelatedArticles(allInCat.filter((a) => a.slug !== found.slug).slice(0, 3));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load blog detail:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-50 min-h-screen py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 animate-pulse space-y-6">
            <div className="w-32 h-6 bg-slate-200 rounded-md"></div>
            <div className="w-full h-10 bg-slate-200 rounded-md"></div>
            <div className="w-3/4 h-6 bg-slate-200 rounded-md"></div>
            <div className="w-full h-72 bg-slate-200 rounded-xl"></div>
            <div className="space-y-3 pt-4">
              <div className="w-full h-4 bg-slate-200 rounded-md"></div>
              <div className="w-full h-4 bg-slate-200 rounded-md"></div>
              <div className="w-4/5 h-4 bg-slate-200 rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="bg-slate-50 min-h-screen py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-xs">
            <BookOpen className="w-12 h-12 text-orange-500 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl font-bold text-[#0B132B]">Article Not Found</h2>
            <p className="text-sm text-slate-600 mt-2">
              The statutory guide or resource you are looking for might have been moved, updated, or unpublished.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={onNavigateResources}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Resources</span>
              </button>
              <button
                onClick={onNavigateHome}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Article Header Container */}
      <header className="bg-[#0B132B] text-white py-12 sm:py-16 border-b border-slate-800 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {article.category}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Published {formatDate(article.publishedAt || article.createdAt)}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed font-normal">
              {article.excerpt}
            </p>
          )}

          {/* Author & Verification Meta */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">{article.author}</span>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Statutory Legal Counsel
                  </span>
                  <span>•</span>
                  <span>LEGOMARK INDIA</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                title="Copy Article Link"
              >
                {isCopied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Share Guide</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Reading Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <article className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-10 lg:p-12">
          {/* Featured Image */}
          {article.featuredImage && (
            <div className="w-full h-64 sm:h-96 rounded-xl overflow-hidden mb-8 bg-slate-100 border border-slate-200">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Core Article Body Content */}
          <div className="article-body-wrapper">
            <RichContentRenderer content={article.content} />
          </div>

          {/* In-Article Legal Disclaimer */}
          <div className="mt-12 p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-800 mb-1">Statutory Notice & Professional Disclaimer:</p>
            <p>
              The information presented in this resource is published for statutory awareness and business reference under Indian company law, the Goods and Services Tax Act, and Trade Marks Act, 1999. It does not constitute a formal advocate-client relationship. For company-specific filings, consult with LEGOMARK's legal team.
            </p>
          </div>

          {/* Integrated Consultation Banner */}
          <div className="mt-10 p-8 rounded-2xl bg-[#0B132B] text-white flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3 h-3 text-orange-400" />
                <span>ADVISORY ASSISTANCE</span>
              </div>
              <h3 className="text-xl font-bold text-white">Need Assistance with {article.category}?</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Our company secretaries and advocates assist with end-to-end documentation, MCA portal filing, and government approvals.
              </p>
            </div>
            <button
              onClick={() => onOpenConsultation && onOpenConsultation(article.category)}
              className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
            >
              Book Free Consultation
            </button>
          </div>
        </article>

        {/* 4. Related Publications Section */}
        {relatedArticles.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#0B132B]">Related Statutory Publications</h3>
              <button
                onClick={onNavigateResources}
                className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
              >
                View all in {article.category} →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => (
                <article
                  key={rel.id}
                  onClick={() => onNavigateBlogDetail && onNavigateBlogDetail(rel.slug)}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-orange-500/30 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200">
                      {rel.category}
                    </span>
                    <h4 className="text-sm font-bold text-[#0B132B] group-hover:text-orange-600 transition-colors mt-2.5 line-clamp-2">
                      {rel.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                      {rel.excerpt || rel.content.substring(0, 100)}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{formatDate(rel.publishedAt || rel.createdAt)}</span>
                    <span className="text-orange-600 font-bold group-hover:translate-x-0.5 transition-transform">Read →</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
