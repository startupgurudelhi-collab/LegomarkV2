import React, { useState, useEffect, useMemo } from 'react';
import {
  ExternalLink,
  ShieldCheck,
  Check,
  Copy,
  PlusCircle,
  X,
  Sparkles,
  RefreshCw,
  Landmark,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { authorityLinksService } from '../../services/authorityLinks.service';
import { AuthorityLinkSuggestion } from '../../types/authorityLink';

interface AuthorityLinkSuggesterProps {
  title: string;
  category?: string;
  content: string;
  onInsertLink: (markdownSnippet: string, suggestion: AuthorityLinkSuggestion) => void;
  className?: string;
}

export const AuthorityLinkSuggester: React.FC<AuthorityLinkSuggesterProps> = ({
  title,
  category,
  content,
  onInsertLink,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insertedId, setInsertedId] = useState<string | null>(null);

  // Compute suggestions deterministically
  const rawSuggestions = useMemo(() => {
    if (!title && !content) return [];
    return authorityLinksService.generateSuggestions({ title, category, content });
  }, [title, category, content]);

  // Filter out dismissed suggestions
  const visibleSuggestions = useMemo(() => {
    return rawSuggestions.filter((s) => !dismissedIds.has(s.id));
  }, [rawSuggestions, dismissedIds]);

  const handleCopyMarkdown = (suggestion: AuthorityLinkSuggestion) => {
    const md = `[${suggestion.suggestedAnchorText}](${suggestion.targetUrl})`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(md);
      setCopiedId(suggestion.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleInsert = (suggestion: AuthorityLinkSuggestion) => {
    onInsertLink(suggestion.contextSnippet, suggestion);
    setInsertedId(suggestion.id);
    setTimeout(() => {
      setDismissedIds((prev) => new Set(prev).add(suggestion.id));
      setInsertedId(null);
    }, 1500);
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const handleResetDismissed = () => {
    setDismissedIds(new Set());
  };

  if (rawSuggestions.length === 0) {
    return (
      <div
        className={`rounded-xl border border-slate-800 bg-[#0B1528]/80 p-3.5 shadow-md ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
            <Landmark className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white tracking-wide">
                Authority Link Suggestions
              </h4>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                0 New
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              No new authority references found for this article.
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              If an official source is already linked, it will not be suggested again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-sky-500/30 bg-gradient-to-b from-[#0B1528] to-[#0A1020] overflow-hidden shadow-lg shadow-sky-950/20 ${className}`}
    >
      {/* Header Bar */}
      <div className="p-3.5 bg-sky-950/40 border-b border-sky-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                Authority Link Suggestions
              </h4>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {visibleSuggestions.length} Available
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Verified statutory portals (MCA, GST, Income Tax, etc.) based on your topic.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dismissedIds.size > 0 && (
            <button
              type="button"
              onClick={handleResetDismissed}
              className="text-[11px] text-slate-400 hover:text-sky-300 underline transition-colors cursor-pointer"
              title="Restore dismissed suggestions"
            >
              Reset ({dismissedIds.size})
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            aria-label={isExpanded ? 'Collapse suggestions' : 'Expand suggestions'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Suggestion Cards Container */}
      {isExpanded && (
        <div className="p-3.5 space-y-3">
          {visibleSuggestions.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400 italic">
              All authority suggestions have been applied or dismissed for this draft.
            </div>
          ) : (
            visibleSuggestions.map((item) => {
              const isCopied = copiedId === item.id;
              const isInserted = insertedId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 transition-all space-y-2.5 group"
                >
                  {/* Top Line: Authority Source & Domain */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          {item.authorityCategory}
                        </span>
                        <h5 className="text-xs font-bold text-white flex items-center gap-1">
                          {item.sourceName}
                        </h5>
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified Portal</span>
                        </span>
                      </div>

                      {/* Target URL */}
                      <a
                        href={item.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:text-sky-300 hover:underline transition-colors"
                        title="Open statutory portal in new tab"
                      >
                        <span>{item.targetUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      type="button"
                      onClick={() => handleDismiss(item.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer shrink-0"
                      title="Dismiss this suggestion"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Anchor Text & Rationale */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
                      <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-0.5">
                        Suggested Anchor Text
                      </span>
                      <span className="font-semibold text-amber-300">
                        "{item.suggestedAnchorText}"
                      </span>
                    </div>

                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
                      <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-0.5">
                        Relevance Rationale
                      </span>
                      <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                        {item.relevanceReason}
                      </p>
                    </div>
                  </div>

                  {/* Context Snippet Preview */}
                  <div className="p-2 rounded bg-[#070E1E] border border-slate-800 text-[11px] text-slate-300">
                    <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-0.5">
                      Recommended Placement Context
                    </span>
                    <p className="italic text-slate-300 font-mono text-[10.5px]">
                      {item.contextSnippet}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopyMarkdown(item)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy Markdown link syntax"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Markdown</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInsert(item)}
                      disabled={isInserted}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ${
                        isInserted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-950/30'
                      }`}
                    >
                      {isInserted ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Inserted into Draft</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Insert into Article</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
