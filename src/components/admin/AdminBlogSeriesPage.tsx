import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ListOrdered,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Tag,
  Target,
  FileText,
  Compass,
  ArrowRight,
  Layers,
  CheckCircle2,
  Trash2,
  BookOpen,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { SERVICES } from '../../data/websiteData';
import { generateBlogSeries } from '../../services/blogSeries.service';
import { BlogSeriesResult, BlogSeriesArticle } from '../../types/blogSeries';
import { AdminAiBlogFactory } from './AdminAiBlogFactory';
import { AdminNavSection } from './AdminSidebar';

interface AdminBlogSeriesPageProps {
  onNavigateSection?: (section: AdminNavSection) => void;
}

const SAMPLE_SERIES_TOPICS = [
  'Private Limited Company Registration & Post-Incorporation Compliance Guide',
  'Comprehensive Trademark Registration, Objection & Brand Defense Roadmap',
  'GST Compliance, Invoicing Thresholds & Annual Return (GSTR-9) Playbook',
  'Startup India DPIIT Recognition, Section 80-IAC Tax Exemption & Angel Tax',
  'Director KYC, Board Resolutions & Mandatory MCA Annual Filings under Companies Act',
  'FSSAI Food Business Licensing, Hygiene Audits & Statutory Renewal Masterclass',
];

export const AdminBlogSeriesPage: React.FC<AdminBlogSeriesPageProps> = ({
  onNavigateSection,
}) => {
  // Main form state
  const [topic, setTopic] = useState('');
  const [targetService, setTargetService] = useState('');
  const [articleCount, setArticleCount] = useState<number>(5);

  // Status & results
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BlogSeriesResult | null>(null);

  // Active view: 'series' (planner results) or 'factory' (drafting with existing AI Blog Factory)
  const [activeView, setActiveView] = useState<'series' | 'factory'>('series');

  // Passing topic into existing AI Blog Factory
  const [selectedTopicForFactory, setSelectedTopicForFactory] = useState<string>('');
  const [selectedServiceForFactory, setSelectedServiceForFactory] = useState<string>('');
  const [activeArticleNumber, setActiveArticleNumber] = useState<number | null>(null);

  // Copy feedback tracker
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Safe setter to populate existing AdminAiBlogFactory without modifying it
  useEffect(() => {
    if (activeView === 'factory' && selectedTopicForFactory) {
      const applyInputs = () => {
        const input = document.getElementById('ai-topic-input') as HTMLInputElement;
        if (input) {
          const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;
          nativeSetter?.call(input, selectedTopicForFactory);
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        if (selectedServiceForFactory) {
          const select = document.getElementById('ai-service-select') as HTMLSelectElement;
          if (select) {
            const nativeSelectSetter = Object.getOwnPropertyDescriptor(
              window.HTMLSelectElement.prototype,
              'value'
            )?.set;
            nativeSelectSetter?.call(select, selectedServiceForFactory);
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      };

      // Try immediately and shortly after mount
      applyInputs();
      const timer = setTimeout(applyInputs, 80);
      return () => clearTimeout(timer);
    }
  }, [activeView, selectedTopicForFactory, selectedServiceForFactory]);

  const copyToClipboard = async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(identifier);
      setTimeout(() => {
        setCopiedId((curr) => (curr === identifier ? null : curr));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTopic = topic.trim();
    if (!cleanTopic) {
      setError('Please enter a Series Topic / Main Theme');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setActiveView('series');

    try {
      const data = await generateBlogSeries({
        topic: cleanTopic,
        targetService: targetService || undefined,
        articleCount,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI blog series');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setTopic('');
    setTargetService('');
    setArticleCount(5);
    setResult(null);
    setError(null);
    setActiveView('series');
    setSelectedTopicForFactory('');
    setSelectedServiceForFactory('');
    setActiveArticleNumber(null);
  };

  // Build full series plain text / Markdown for copying
  const getFullSeriesFormatted = (series: BlogSeriesResult): string => {
    let output = `# AI Blog Series Plan: ${series.topic}\n`;
    if (series.targetService) {
      output += `Target Practice Area: ${series.targetService}\n`;
    }
    output += `Total Articles: ${series.articleCount}\n\n`;

    if (series.seriesOverview) {
      output += `## Series Overview\n${series.seriesOverview}\n\n`;
    }

    output += `## Articles Roadmap\n\n`;

    series.articles.forEach((art) => {
      output += `### Part ${art.sequenceNumber}: ${art.suggestedTitle}\n`;
      output += `- Primary Keyword: ${art.primaryKeyword}\n`;
      output += `- Search Intent: ${art.searchIntent}\n`;
      output += `- Content Angle: ${art.contentAngle}\n`;
      if (art.keyTakeaways && art.keyTakeaways.length > 0) {
        output += `- Key Learnings:\n`;
        art.keyTakeaways.forEach((k) => {
          output += `  * ${k}\n`;
        });
      }
      output += `\n`;
    });

    output += `---\nPlanned via LEGOMARK INDIA AI Editorial Suite\n`;
    return output;
  };

  // "Use in AI Blog Factory" action handler
  const handleUseInAiBlogFactory = (article: BlogSeriesArticle) => {
    setSelectedTopicForFactory(article.suggestedTitle);
    setSelectedServiceForFactory(targetService || '');
    setActiveArticleNumber(article.sequenceNumber);
    setActiveView('factory');

    // Also persist in sessionStorage for convenience
    try {
      sessionStorage.setItem('legomark_pending_ai_topic', article.suggestedTitle);
      if (targetService) {
        sessionStorage.setItem('legomark_pending_ai_service', targetService);
      }
    } catch (e) {
      // Ignore storage errors
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              <ListOrdered className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Blog Series</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
              Editorial Planner
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Design cohesive, multi-part statutory and legal article series with structured
            sequences, primary keywords, search intent, and non-overlapping content angles for
            LEGOMARK INDIA.
          </p>
        </div>

        {/* View Switcher Tabs (if in factory mode or have active topic) */}
        {result && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveView('series')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeView === 'series'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Series Plan ({result.articles.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedTopicForFactory) {
                  setActiveView('factory');
                } else if (result.articles[0]) {
                  handleUseInAiBlogFactory(result.articles[0]);
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeView === 'factory'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>AI Blog Factory</span>
              {activeArticleNumber && (
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                  #{activeArticleNumber}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: Active Series Generator & Plan */}
      {activeView === 'series' && (
        <>
          {/* Main Input Configuration Card */}
          <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl">
            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Row 1: Series Topic Input */}
              <div>
                <label
                  htmlFor="series-topic-input"
                  className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2"
                >
                  Series Topic / Main Theme *
                </label>
                <div className="relative">
                  <input
                    id="series-topic-input"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Complete Private Limited Company Registration & Post-Incorporation Compliance Guide"
                    disabled={isGenerating}
                    className="w-full px-4 py-3 bg-[#070D1E] border border-slate-700/80 hover:border-slate-600 focus:border-orange-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden transition-colors"
                  />
                  {topic && !isGenerating && (
                    <button
                      type="button"
                      onClick={() => setTopic('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-md transition-colors"
                      title="Clear topic input"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Target Service Dropdown & Number of Articles Selector */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Optional Target Service */}
                <div className="md:col-span-7">
                  <label
                    htmlFor="series-service-select"
                    className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2"
                  >
                    Target Practice Area / Service (Optional)
                  </label>
                  <select
                    id="series-service-select"
                    value={targetService}
                    onChange={(e) => setTargetService(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-4 py-2.5 bg-[#070D1E] border border-slate-700/80 hover:border-slate-600 focus:border-orange-500 rounded-xl text-sm text-white focus:outline-hidden transition-colors"
                  >
                    <option value="">All Services / General Corporate & Legal Advisory</option>
                    {SERVICES.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Number of Articles Selector (3 to 8) */}
                <div className="md:col-span-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Number of Articles (3–8)
                    </label>
                    <span className="text-xs font-bold text-orange-400">
                      {articleCount} Installments
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 p-1 bg-[#070D1E] border border-slate-700/80 rounded-xl">
                    {[3, 4, 5, 6, 7, 8].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setArticleCount(num)}
                        disabled={isGenerating}
                        className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          articleCount === num
                            ? 'bg-orange-500 text-white shadow-xs'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sample Topic Pills */}
              <div className="pt-1">
                <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-orange-400" />
                  <span>Popular Corporate Legal Themes in India:</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_SERIES_TOPICS.map((seed, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTopic(seed)}
                      disabled={isGenerating}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-colors text-left"
                    >
                      {seed}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isGenerating || !topic.trim()}
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Structuring {articleCount}-Part Series with AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-orange-200" />
                        <span>Generate Series ({articleCount} Articles)</span>
                      </>
                    )}
                  </button>

                  {(topic || result) && !isGenerating && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium rounded-xl border border-slate-700 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                  <span>Sequential logical flow & non-overlapping scopes guaranteed</span>
                </div>
              </div>
            </form>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-200">Series Generation Notice</p>
                <p className="text-xs text-rose-300 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* RESULTS DISPLAY */}
          {result && (
            <div className="space-y-6 animate-fadeIn">
              {/* Overview & Quick Actions Bar */}
              <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30">
                      {result.articles.length}-Part Series Roadmap
                    </span>
                    {result.targetService && (
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/25">
                        {result.targetService}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mt-1.5 tracking-tight">
                    {result.topic}
                  </h2>
                  {result.seriesOverview && (
                    <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
                      {result.seriesOverview}
                    </p>
                  )}
                </div>

                {/* Top Action: Copy Full Series */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(getFullSeriesFormatted(result), 'full-series')
                    }
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-xs"
                    title="Copy complete structured series plan"
                  >
                    {copiedId === 'full-series' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300">Full Series Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-300" />
                        <span>Copy Full Series</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Articles Sequence Grid / Cards */}
              <div className="space-y-4">
                {result.articles.map((article) => {
                  const artId = `article-${article.sequenceNumber}`;
                  const titleCopyId = `title-${article.sequenceNumber}`;
                  const isTitleCopied = copiedId === titleCopyId;
                  const isFullArtCopied = copiedId === artId;

                  const articleSummaryText = `Part ${article.sequenceNumber}: ${article.suggestedTitle}\nPrimary Keyword: ${article.primaryKeyword}\nSearch Intent: ${article.searchIntent}\nContent Angle: ${article.contentAngle}`;

                  return (
                    <div
                      key={article.sequenceNumber}
                      className="bg-[#0B132B] border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-5 sm:p-6 transition-all shadow-lg hover:shadow-xl"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        {/* Main Article Details */}
                        <div className="flex-1 min-w-0">
                          {/* Sequence Badge & Search Intent */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-500 text-white shadow-xs">
                              Part {article.sequenceNumber} of {result.articles.length}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border ${
                                article.searchIntent.toLowerCase().includes('informational')
                                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                  : article.searchIntent.toLowerCase().includes('commercial')
                                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                  : article.searchIntent.toLowerCase().includes('procedural')
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              Intent: {article.searchIntent}
                            </span>
                          </div>

                          {/* Suggested Title */}
                          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                            {article.suggestedTitle}
                          </h3>

                          {/* Metadata Grid: Primary Keyword & Content Angle */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3.5 pt-3.5 border-t border-slate-800/80">
                            {/* Primary Keyword */}
                            <div className="md:col-span-5 flex items-start gap-2">
                              <Tag className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  Primary Keyword
                                </p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-100 truncate mt-0.5">
                                  {article.primaryKeyword}
                                </p>
                              </div>
                            </div>

                            {/* Content Angle */}
                            <div className="md:col-span-7 flex items-start gap-2">
                              <Compass className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  Content Angle & Scope
                                </p>
                                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                                  {article.contentAngle}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Key Takeaways */}
                          {article.keyTakeaways && article.keyTakeaways.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-800/60">
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Key Learnings in this Installment:
                              </p>
                              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
                                {article.keyTakeaways.map((takeaway, kIdx) => (
                                  <li key={kIdx} className="flex items-start gap-1.5">
                                    <span className="text-orange-400 font-bold">•</span>
                                    <span>{takeaway}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Actions Side Column */}
                        <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                          {/* Copy Title */}
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(article.suggestedTitle, titleCopyId)
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Copy article title"
                          >
                            {isTitleCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-300">Title Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy Title</span>
                              </>
                            )}
                          </button>

                          {/* Copy Topic Breakdown */}
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(articleSummaryText, artId)
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Copy full article plan summary"
                          >
                            {isFullArtCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-300">Topic Copied</span>
                              </>
                            ) : (
                              <>
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy Topic</span>
                              </>
                            )}
                          </button>

                          {/* REQUIRED ACTION: "Use in AI Blog Factory" */}
                          <button
                            type="button"
                            onClick={() => handleUseInAiBlogFactory(article)}
                            className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Load this article title into AI Blog Factory for drafting without creating blog"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-orange-200" />
                            <span>Use in AI Blog Factory</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW 2: Drafting within Existing AI Blog Factory */}
      {activeView === 'factory' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Active series topic banner */}
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                  Loaded from Series Plan {activeArticleNumber ? `(Part ${activeArticleNumber})` : ''}
                </p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  "{selectedTopicForFactory}"
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Review parameters below and click "Generate Article" when ready. No blog will be created automatically.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveView('series')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>&larr; Back to Series Plan</span>
              </button>
              {onNavigateSection && (
                <button
                  type="button"
                  onClick={() => onNavigateSection('blogs')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition-colors flex items-center gap-1.5"
                  title="Open Blogs Catalog"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Articles Catalog</span>
                </button>
              )}
            </div>
          </div>

          {/* Renders the existing AI Blog Factory component untouched */}
          <AdminAiBlogFactory
            onBlogSaved={() => {
              if (onNavigateSection) {
                onNavigateSection('blogs');
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}
