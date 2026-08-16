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
  ShieldCheck,
  Building2,
  Receipt,
  Award,
  Briefcase,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { BlogPost } from '../../types/blog';
import { fetchPublicBlogs } from '../../services/blog.service';

interface BlogLandingPageProps {
  onOpenConsultation?: (serviceName?: string) => void;
  onNavigateBlogDetail?: (slug: string) => void;
  onNavigateHome?: () => void;
}

export const BlogLandingPage: React.FC<BlogLandingPageProps> = ({
  onOpenConsultation,
  onNavigateBlogDetail,
  onNavigateHome,
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
    'Startups & Funding',
    'Corporate Advisory',
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

  const handleArticleClick = (slug: string) => {
    if (onNavigateBlogDetail) {
      onNavigateBlogDetail(slug);
    }
  };

  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const gridArticles = articles.length > 1 ? articles.slice(1) : (searchQuery || selectedCategory !== 'all' ? articles : []);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. Breadcrumbs Strip */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onNavigateHome}
              className="hover:text-orange-600 font-medium transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-slate-900 font-bold">Resources & Statutory Guides</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-slate-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Curated by Chartered Accountants & Corporate Lawyers</span>
          </div>
        </div>
      </div>

      {/* 2. Hero Publication Header */}
      <div className="bg-[#0B132B] text-white py-16 sm:py-20 relative overflow-hidden border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4">
              <BookOpen className="w-3.5 h-3.5 text-orange-400" />
              <span>LEGOMARK KNOWLEDGE & ADVISORY HUB</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Statutory Insights, Legal Frameworks & Tax Advisory
            </h1>
            <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed font-normal">
              Authoritative, step-by-step publications on Indian company incorporation, MCA regulatory compliance, trademark protection, and direct & indirect taxation for growing enterprises.
            </p>
          </div>

          {/* Search & Filter Bar Embedded in Hero */}
          <div className="mt-8 pt-8 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                  }`}
                >
                  {cat === 'all' ? 'All Publications' : cat}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search legal guides, GST, MCA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-orange-500 transition-colors shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200 p-6 h-80 animate-pulse flex flex-col justify-between"
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
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center max-w-xl mx-auto shadow-xs">
            <BookOpen className="w-12 h-12 text-orange-500 mx-auto mb-4 opacity-80" />
            <h3 className="text-lg font-bold text-[#0B132B]">No articles match your criteria</h3>
            <p className="text-sm text-slate-600 mt-1.5">
              Try searching with different legal or compliance terms, or clear the category filters.
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-6 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Article Card (When not filtering by text or when list is full) */}
            {featuredArticle && !searchQuery && selectedCategory === 'all' && (
              <section aria-label="Featured Publication">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Lead Editorial Publication
                  </span>
                </div>

                <article
                  onClick={() => handleArticleClick(featuredArticle.slug)}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-orange-500/40 transition-all duration-200 cursor-pointer group grid grid-cols-1 lg:grid-cols-12"
                >
                  <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
                          {featuredArticle.category}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(featuredArticle.publishedAt || featuredArticle.createdAt)}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B132B] group-hover:text-orange-600 transition-colors leading-tight">
                        {featuredArticle.title}
                      </h2>

                      <p className="text-sm text-slate-600 mt-4 leading-relaxed line-clamp-3 font-normal">
                        {featuredArticle.excerpt || featuredArticle.content.substring(0, 220) + '...'}
                      </p>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#0B132B] block">{featuredArticle.author}</span>
                          <span className="text-[11px] text-slate-500">Corporate Legal Counsel</span>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-orange-600 inline-flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                        <span>Read Full Guide</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-slate-100 min-h-[260px] lg:min-h-full relative overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-100">
                    {featuredArticle.featuredImage ? (
                      <img
                        src={featuredArticle.featuredImage}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-slate-400 bg-linear-to-br from-slate-100 to-slate-200">
                        <BookOpen className="w-16 h-16 text-slate-300 mb-2" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">LEGOMARK Publication</span>
                      </div>
                    )}
                  </div>
                </article>
              </section>
            )}

            {/* Articles Catalog Grid */}
            <section aria-label="Statutory Articles Catalog">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-600" />
                  <h3 className="text-lg font-bold text-[#0B132B]">
                    {searchQuery || selectedCategory !== 'all' ? 'Filtered Publications' : 'Recent Guides & Advisory Papers'}
                  </h3>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  Showing <strong>{articles.length}</strong> resources
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(searchQuery || selectedCategory !== 'all' ? articles : gridArticles).map((article) => (
                  <article
                    key={article.id}
                    onClick={() => handleArticleClick(article.slug)}
                    className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-orange-500/30 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      {article.featuredImage && (
                        <div className="w-full h-48 rounded-xl overflow-hidden mb-5 bg-slate-100 border border-slate-100">
                          <img
                            src={article.featuredImage}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-600 border border-orange-200">
                          {article.category}
                        </span>
                        <span className="text-[11px] text-slate-400">•</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(article.publishedAt || article.createdAt)}
                        </span>
                      </div>

                      <h4 className="text-lg font-bold text-[#0B132B] group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h4>

                      <p className="text-xs text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
                        {article.excerpt || article.content.substring(0, 150) + '...'}
                      </p>
                    </div>

                    <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[130px]">{article.author}</span>
                      </span>

                      <span className="text-xs font-bold text-orange-600 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Read Guide</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Advisory Consultation Callout at bottom of Landing Page */}
            <div className="p-8 sm:p-10 rounded-2xl bg-[#0B132B] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-slate-800">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <span>DIRECT COUNSEL DESK</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Have Specific Legal or Tax Questions for Your Company?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  Speak directly with our chartered accountants, company secretaries, and trademark attorneys for a structured statutory assessment.
                </p>
              </div>
              <button
                onClick={() => onOpenConsultation && onOpenConsultation('Statutory Resource Consultation')}
                className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
              >
                Schedule Free Consultation
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
