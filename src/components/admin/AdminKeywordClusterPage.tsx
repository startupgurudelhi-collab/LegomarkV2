import React, { useState } from 'react';
import {
  Sparkles,
  Search,
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
} from 'lucide-react';
import { SERVICES } from '../../data/websiteData';
import { generateKeywordCluster } from '../../services/keywordCluster.service';
import { KeywordClusterResult } from '../../types/keywordCluster';

const SAMPLE_SEEDS = [
  'Private Limited Company Registration',
  'Trademark Class 35 Objection Reply',
  'GST Registration for E-Commerce Sellers',
  'Section 8 NGO Company Incorporation',
  'FSSAI State Food License Renewal',
  'Mandatory Annual ROC Filing for Small Company',
];

export const AdminKeywordClusterPage: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [targetService, setTargetService] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<KeywordClusterResult | null>(null);

  // Copy feedback tracking: key can be an item identifier or 'full' or group names
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      setError('Please enter a main topic or seed keyword');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const data = await generateKeywordCluster({
        topic: cleanTopic,
        targetService: targetService || undefined,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate keyword cluster');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setTopic('');
    setTargetService('');
    setResult(null);
    setError(null);
  };

  // Build a formatted plain-text / Markdown summary of the entire cluster
  const getFullClusterFormatted = (cluster: KeywordClusterResult): string => {
    let report = `# AI Keyword Cluster: ${cluster.topic}\n`;
    if (cluster.targetService) {
      report += `Target Service: ${cluster.targetService}\n`;
    }
    report += `\n## 1. Search Intent\n`;
    report += `- Intent Type: ${cluster.searchIntent.primaryIntent}\n`;
    report += `- Explanation: ${cluster.searchIntent.explanation}\n`;
    report += `- Target Audience: ${cluster.searchIntent.targetAudience}\n`;

    report += `\n## 2. Primary Keyword\n`;
    report += `- Keyword: ${cluster.primaryKeyword.keyword}\n`;
    if (cluster.primaryKeyword.estimatedCompetition) {
      report += `- Competition: ${cluster.primaryKeyword.estimatedCompetition}\n`;
    }
    if (cluster.primaryKeyword.rationale) {
      report += `- Rationale: ${cluster.primaryKeyword.rationale}\n`;
    }

    report += `\n## 3. Secondary Keywords\n`;
    cluster.secondaryKeywords.forEach((k, idx) => {
      report += `${idx + 1}. ${k.keyword}${k.relevance ? ` (${k.relevance})` : ''}\n`;
    });

    report += `\n## 4. Long-tail Keywords\n`;
    cluster.longTailKeywords.forEach((k, idx) => {
      report += `${idx + 1}. ${k.keyword}${k.userQueryContext ? ` — Context: ${k.userQueryContext}` : ''}\n`;
    });

    report += `\n## 5. Question Keywords\n`;
    cluster.questionKeywords.forEach((q, idx) => {
      report += `${idx + 1}. ${q.question}${q.intentType ? ` [${q.intentType}]` : ''}\n`;
    });

    if (cluster.summary) {
      report += `\n## Strategic Summary\n${cluster.summary}\n`;
    }

    return report;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-[#0F1E3D] to-[#0B132B] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                AI Keyword Cluster
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 border border-amber-500/30 text-amber-300">
                SEO Intelligence
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Discover high-intent keyword clusters grouped into primary, secondary, long-tail, and question queries tailored for Indian corporate legal, taxation, and trademark searches.
            </p>
          </div>

          {result && (
            <button
              type="button"
              id="btn-copy-full-cluster"
              onClick={() => copyToClipboard(getFullClusterFormatted(result), 'full-cluster')}
              className="shrink-0 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              {copiedId === 'full-cluster' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Full Cluster Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy Full Cluster Report</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Input Form Card */}
      <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Main Topic / Seed Keyword */}
            <div className="md:col-span-7 space-y-1.5">
              <label htmlFor="seed-topic-input" className="block text-xs font-bold text-slate-200">
                Main Topic / Seed Keyword <span className="text-orange-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="seed-topic-input"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Private Limited Company Registration, Trademark Class 35..."
                  className="w-full bg-[#070D1E] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                  disabled={isGenerating}
                />
                {topic && (
                  <button
                    type="button"
                    onClick={() => setTopic('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 text-xs"
                    title="Clear input"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Optional Target Service Dropdown */}
            <div className="md:col-span-5 space-y-1.5">
              <label htmlFor="target-service-select" className="block text-xs font-bold text-slate-200">
                Target Service <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                id="target-service-select"
                value={targetService}
                onChange={(e) => setTargetService(e.target.value)}
                className="w-full bg-[#070D1E] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all cursor-pointer"
                disabled={isGenerating}
              >
                <option value="">Select Target Service (Optional)</option>
                {SERVICES.map((service) => (
                  <option key={service.id} value={service.title}>
                    {service.title} ({service.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Seed Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Search className="w-3 h-3 text-slate-400" /> Ideas:
            </span>
            {SAMPLE_SEEDS.map((seed) => (
              <button
                key={seed}
                type="button"
                onClick={() => setTopic(seed)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-850 transition-all cursor-pointer"
              >
                {seed}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">
                <span className="font-semibold">Error: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleClear}
              disabled={isGenerating || (!topic && !result)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400 transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="submit"
              id="btn-generate-keywords"
              disabled={isGenerating || !topic.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-orange-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-amber-400/30"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Clustering Keywords with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Generate Keywords</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results View Grouped into 5 Mandated Categories */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Section 1: Search Intent & Target Overview */}
          <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-500/15 border border-blue-500/25 rounded-lg text-blue-400">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Search Intent &amp; Target Audience
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Understanding user motivation and query classification
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {result.searchIntent.primaryIntent} Intent
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#070D1E] border border-slate-800/80 rounded-xl space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Query Explanation
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {result.searchIntent.explanation}
                </p>
              </div>

              <div className="p-4 bg-[#070D1E] border border-slate-800/80 rounded-xl space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Target Searcher Profile
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {result.searchIntent.targetAudience}
                </p>
              </div>
            </div>

            {result.summary && (
              <div className="mt-4 p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300">
                <span className="font-semibold text-amber-300">Strategic Tip: </span>
                {result.summary}
              </div>
            )}
          </div>

          {/* Section 2: Primary Keyword */}
          <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-orange-500/15 border border-orange-500/25 rounded-lg text-orange-400">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Primary Keyword
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Core anchor query recommended for primary H1 and canonical URL
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(result.primaryKeyword.keyword, 'primary-kw')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                title="Copy primary keyword"
              >
                {copiedId === 'primary-kw' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 to-[#0F1E3D] border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2.5 flex-wrap">
                  <span>{result.primaryKeyword.keyword}</span>
                  {result.primaryKeyword.estimatedCompetition && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                        result.primaryKeyword.estimatedCompetition === 'Low'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : result.primaryKeyword.estimatedCompetition === 'High'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {result.primaryKeyword.estimatedCompetition} Competition
                    </span>
                  )}
                </div>
                {result.primaryKeyword.rationale && (
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {result.primaryKeyword.rationale}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Secondary Keywords */}
          <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-500/15 border border-emerald-500/25 rounded-lg text-emerald-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Secondary Keywords ({result.secondaryKeywords?.length || 0})
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Semantic (LSI) terms for H2/H3 subheadings and body paragraphs
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    result.secondaryKeywords.map((k) => k.keyword).join(', '),
                    'secondary-all'
                  )
                }
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                title="Copy all secondary keywords comma-separated"
              >
                {copiedId === 'secondary-all' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">All Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy All</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {result.secondaryKeywords.map((item, index) => {
                const kwId = `sec-${index}`;
                return (
                  <div
                    key={index}
                    className="p-3 bg-[#070D1E] border border-slate-800/80 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 group transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                        {item.keyword}
                      </div>
                      {item.relevance && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.relevance}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.keyword, kwId)}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
                      title={`Copy "${item.keyword}"`}
                    >
                      {copiedId === kwId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Long-tail Keywords */}
          <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-purple-500/15 border border-purple-500/25 rounded-lg text-purple-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Long-Tail Keywords ({result.longTailKeywords?.length || 0})
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    High-conversion specific queries with high purchase/consultation intent
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    result.longTailKeywords.map((k) => k.keyword).join('\n'),
                    'longtail-all'
                  )
                }
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                title="Copy all long-tail keywords"
              >
                {copiedId === 'longtail-all' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">All Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy All</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2.5">
              {result.longTailKeywords.map((item, index) => {
                const kwId = `lt-${index}`;
                return (
                  <div
                    key={index}
                    className="p-3 bg-[#070D1E] border border-slate-800/80 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 group transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-semibold text-purple-200">
                        {item.keyword}
                      </div>
                      {item.userQueryContext && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.userQueryContext}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.keyword, kwId)}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
                      title={`Copy "${item.keyword}"`}
                    >
                      {copiedId === kwId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Question Keywords */}
          <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-500/15 border border-amber-500/25 rounded-lg text-amber-400">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Question Keywords ({result.questionKeywords?.length || 0})
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Frequent People-Also-Ask queries ideal for FAQ schemas and rich snippets
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    result.questionKeywords.map((q) => q.question).join('\n'),
                    'questions-all'
                  )
                }
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                title="Copy all question keywords"
              >
                {copiedId === 'questions-all' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">All Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy All</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2.5">
              {result.questionKeywords.map((item, index) => {
                const kwId = `q-${index}`;
                return (
                  <div
                    key={index}
                    className="p-3 bg-[#070D1E] border border-slate-800/80 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 group transition-all"
                  >
                    <div className="min-w-0 flex-1 flex items-start gap-2.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25 shrink-0 mt-0.5">
                        {item.intentType || 'FAQ'}
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-slate-200">
                        {item.question}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.question, kwId)}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
                      title={`Copy "${item.question}"`}
                    >
                      {copiedId === kwId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
