import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  User,
  ArrowRight,
  Search,
  Tag,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  Share2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { BlogPost } from '../../types/blog';
import { fetchPublicBlogs } from '../../services/blog.service';

interface BlogSectionProps {
  onOpenConsultation?: (serviceName?: string) => void;
  onNavigateBlogDetail?: (slug: string) => void;
  onNavigateResources?: () => void;
}

export const BlogSection: React.FC<BlogSectionProps> = ({
  onOpenConsultation,
  onNavigateBlogDetail,
  onNavigateResources,
}) => {
  const [articles, setArticles] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const items = await fetchPublicBlogs(
          selectedCategory !== 'all' ? selectedCategory : undefined,
          searchQuery.trim() !== '' ? searchQuery : undefined
        );
        if (isMounted) setArticles(items);
      } catch (err) {
        console.error('Failed to load blog articles:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory, searchQuery]);

  const categories = [
    'all',
    'Company Registration',
    'Taxation & GST',
    'Trademark & IP',
    'Compliance & ROC',
  ];

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleCardClick = (slug: string) => {
    if (onNavigateBlogDetail) {
      onNavigateBlogDetail(slug);
    } else if (onNavigateResources) {
      onNavigateResources();
    }
  };

  return (
    <section id="resources" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-xs font-bold uppercase tracking-wider mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knowledge Hub & Insights</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B132B] tracking-tight">
            Statutory Guides & Advisory Insights
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Clear, actionable frameworks for company incorporation, MCA filings, GST thresholds, and trademark protection curated by our corporate legal counsel.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0B132B] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Guides' : cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search legal articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-orange-500 transition-colors shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200 p-6 h-72 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-24 h-4 bg-slate-200 rounded-md"></div>
                  <div className="w-full h-6 bg-slate-200 rounded-md"></div>
                  <div className="w-4/5 h-4 bg-slate-200 rounded-md"></div>
                </div>
                <div className="w-1/3 h-4 bg-slate-200 rounded-md"></div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto">
            <BookOpen className="w-10 h-10 text-orange-500 mx-auto mb-3 opacity-80" />
            <h4 className="text-base font-bold text-slate-800">No resources found</h4>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or switching to another category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <article
                key={article.id}
                onClick={() => handleCardClick(article.slug)}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 hover:shadow-lg hover:border-orange-500/30 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {article.featuredImage && (
                    <div className="w-full h-44 rounded-xl overflow-hidden mb-4 bg-slate-100 border border-slate-100">
                      <img
                        src={article.featuredImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-600 border border-orange-200">
                      {article.category}
                    </span>
                    <span className="text-[11px] text-slate-400">•</span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(article.publishedAt || article.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0B132B] group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {article.excerpt || article.content.substring(0, 140) + '...'}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-[140px]">{article.author}</span>
                  </span>

                  <span className="text-xs font-bold text-orange-600 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Read Guide</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* View All Resources CTA */}
        {onNavigateResources && (
          <div className="mt-12 text-center">
            <button
              onClick={onNavigateResources}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B132B] hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              <span>Explore All Resources & Statutory Guides</span>
              <ArrowRight className="w-4 h-4 text-orange-400" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
