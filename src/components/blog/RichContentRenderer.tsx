import React from 'react';

interface RichContentRendererProps {
  content: string;
  className?: string;
}

export const RichContentRenderer: React.FC<RichContentRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split content into line-based segments or blocks
  // Support markdown headings (##, ###, #), bold (**), italic (*), lists (-, * or 1.), blockquotes (>), markdown images (![alt](url)), direct HTML/img tags
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];

  let inList: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];

  const flushList = () => {
    if (inList === 'ul' && listItems.length > 0) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-4 ml-6 list-disc space-y-1.5 text-slate-800">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ul>
      );
    } else if (inList === 'ol' && listItems.length > 0) {
      blocks.push(
        <ol key={`ol-${blocks.length}`} className="my-4 ml-6 list-decimal space-y-1.5 text-slate-800">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ol>
      );
    }
    inList = null;
    listItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check for image syntax: ![alt](url)
    const imgMdMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMdMatch) {
      flushList();
      const altText = imgMdMatch[1] || 'Article image';
      const imgSrc = imgMdMatch[2];
      blocks.push(
        <figure key={`img-${i}`} className="my-8 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs">
          <img
            src={imgSrc}
            alt={altText}
            className="w-full max-h-[520px] object-cover mx-auto"
            loading="lazy"
          />
          {altText && altText !== 'Article image' && (
            <figcaption className="text-center text-xs text-slate-500 py-2.5 px-4 bg-slate-100/60 border-t border-slate-200">
              {altText}
            </figcaption>
          )}
        </figure>
      );
      continue;
    }

    // Check for standard HTML image tag: <img src="..." alt="..." />
    const imgHtmlMatch = trimmed.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*\/?>/i);
    if (imgHtmlMatch) {
      flushList();
      const imgSrc = imgHtmlMatch[1];
      const altMatch = trimmed.match(/alt=["']([^"']+)["']/i);
      const altText = altMatch ? altMatch[1] : 'Article illustration';
      blocks.push(
        <figure key={`imghtml-${i}`} className="my-8 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs">
          <img
            src={imgSrc}
            alt={altText}
            className="w-full max-h-[520px] object-cover mx-auto"
            loading="lazy"
          />
          {altText && altText !== 'Article illustration' && (
            <figcaption className="text-center text-xs text-slate-500 py-2.5 px-4 bg-slate-100/60 border-t border-slate-200">
              {altText}
            </figcaption>
          )}
        </figure>
      );
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      flushList();
      blocks.push(
        <h3 key={`h3-${i}`} className="text-xl sm:text-2xl font-bold text-[#0B132B] mt-8 mb-3 tracking-tight">
          {renderInlineFormatting(trimmed.substring(4))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push(
        <h2 key={`h2-${i}`} className="text-2xl sm:text-3xl font-extrabold text-[#0B132B] mt-10 mb-4 pb-2 border-b border-slate-200 tracking-tight">
          {renderInlineFormatting(trimmed.substring(3))}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      blocks.push(
        <h1 key={`h1-${i}`} className="text-3xl sm:text-4xl font-black text-[#0B132B] mt-12 mb-6 tracking-tight">
          {renderInlineFormatting(trimmed.substring(2))}
        </h1>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushList();
      blocks.push(
        <blockquote key={`bq-${i}`} className="my-6 pl-4 border-l-4 border-orange-500 bg-orange-50/50 py-3 pr-4 rounded-r-xl text-slate-700 italic font-serif">
          {renderInlineFormatting(trimmed.substring(2))}
        </blockquote>
      );
      continue;
    }

    // Unordered List (- or *)
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (inList !== 'ul') {
        flushList();
        inList = 'ul';
      }
      listItems.push(ulMatch[1]);
      continue;
    }

    // Ordered List (1. 2. etc.)
    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (inList !== 'ol') {
        flushList();
        inList = 'ol';
      }
      listItems.push(olMatch[1]);
      continue;
    }

    // Empty line / paragraph break
    if (!trimmed) {
      flushList();
      continue;
    }

    // Standard Paragraph
    flushList();
    blocks.push(
      <p key={`p-${i}`} className="my-4 text-slate-700 leading-relaxed sm:text-base text-sm">
        {renderInlineFormatting(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className={`rich-content-renderer ${className}`}>{blocks}</div>;
};

// Helper for rendering inline formatting (Bold, Italic, Underline, Links, Inline Code)
function renderInlineFormatting(text: string): React.ReactNode {
  if (!text) return '';

  // Parse [Link Text](https://...)
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(formatInlineStyles(text.substring(lastIndex, match.index), `txt-${lastIndex}`));
    }
    const linkText = match[1];
    const linkUrl = match[2];
    parts.push(
      <a
        key={`link-${match.index}`}
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-orange-600 hover:text-orange-700 font-semibold underline underline-offset-2 transition-colors"
      >
        {linkText}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(formatInlineStyles(text.substring(lastIndex), `txt-${lastIndex}`));
  }

  return parts.length > 0 ? parts : formatInlineStyles(text, 'root');
}

function formatInlineStyles(text: string, keyPrefix: string): React.ReactNode {
  // Replace bold **text** or __text__
  const boldRegex = /(\*\*|__)(.*?)\1/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(formatItalicAndUnderline(text.substring(lastIdx, match.index), `${keyPrefix}-sub-${lastIdx}`));
    }
    parts.push(
      <strong key={`${keyPrefix}-b-${match.index}`} className="font-bold text-[#0B132B]">
        {formatItalicAndUnderline(match[2], `${keyPrefix}-bi-${match.index}`)}
      </strong>
    );
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(formatItalicAndUnderline(text.substring(lastIdx), `${keyPrefix}-sub-${lastIdx}`));
  }

  return parts.length > 0 ? parts : text;
}

function formatItalicAndUnderline(text: string, keyPrefix: string): React.ReactNode {
  // Italic *text* or _text_
  const italicRegex = /(\*|_)(.*?)\1/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = italicRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(formatStrikethrough(text.substring(lastIdx, match.index), `${keyPrefix}-it-${lastIdx}`));
    }
    parts.push(
      <em key={`${keyPrefix}-em-${match.index}`} className="italic">
        {formatStrikethrough(match[2], `${keyPrefix}-emi-${match.index}`)}
      </em>
    );
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(formatStrikethrough(text.substring(lastIdx), `${keyPrefix}-it-${lastIdx}`));
  }

  return parts.length > 0 ? parts : text;
}

function formatStrikethrough(text: string, keyPrefix: string): React.ReactNode {
  // Strikethrough ~~text~~
  const strikeRegex = /~~(.*?)~~/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = strikeRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    parts.push(
      <span key={`${keyPrefix}-del-${match.index}`} className="line-through text-slate-400">
        {match[1]}
      </span>
    );
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}
