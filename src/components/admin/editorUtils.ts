// Utility to convert Markdown to HTML and HTML to Markdown for rich-text document editing

export function markdownToHtml(md: string): string {
  if (!md) return '<p><br></p>';

  // If the content is already HTML (e.g. starts with <p>, <h1>, <div>, etc.)
  if (md.trim().startsWith('<') && (md.includes('</p>') || md.includes('</div>') || md.includes('</h1>') || md.includes('</h2>') || md.includes('</h3>'))) {
    return md;
  }

  const lines = md.split('\n');
  const htmlBlocks: string[] = [];

  let inList: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];

  const flushList = () => {
    if (inList === 'ul' && listItems.length > 0) {
      htmlBlocks.push(`<ul>${listItems.map(item => `<li>${formatInlineToHtml(item)}</li>`).join('')}</ul>`);
    } else if (inList === 'ol' && listItems.length > 0) {
      htmlBlocks.push(`<ol>${listItems.map(item => `<li>${formatInlineToHtml(item)}</li>`).join('')}</ol>`);
    }
    inList = null;
    listItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check for image markdown: ![alt](url)
    const imgMdMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMdMatch) {
      flushList();
      const alt = imgMdMatch[1] || 'Article image';
      const src = imgMdMatch[2];
      htmlBlocks.push(`<figure class="article-image-block"><img src="${src}" alt="${alt}" /><figcaption>${alt}</figcaption></figure><p><br></p>`);
      continue;
    }

    // Check for standard HTML image tag
    const imgHtmlMatch = trimmed.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*\/?>/i);
    if (imgHtmlMatch) {
      flushList();
      const src = imgHtmlMatch[1];
      const altMatch = trimmed.match(/alt=["']([^"']+)["']/i);
      const alt = altMatch ? altMatch[1] : 'Article illustration';
      htmlBlocks.push(`<figure class="article-image-block"><img src="${src}" alt="${alt}" /><figcaption>${alt}</figcaption></figure><p><br></p>`);
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      flushList();
      htmlBlocks.push(`<h3>${formatInlineToHtml(trimmed.substring(4))}</h3>`);
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      htmlBlocks.push(`<h2>${formatInlineToHtml(trimmed.substring(3))}</h2>`);
      continue;
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      htmlBlocks.push(`<h1>${formatInlineToHtml(trimmed.substring(2))}</h1>`);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushList();
      htmlBlocks.push(`<blockquote>${formatInlineToHtml(trimmed.substring(2))}</blockquote>`);
      continue;
    }

    // Unordered list
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (inList !== 'ul') {
        flushList();
        inList = 'ul';
      }
      listItems.push(ulMatch[1]);
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (inList !== 'ol') {
        flushList();
        inList = 'ol';
      }
      listItems.push(olMatch[1]);
      continue;
    }

    // Empty line
    if (!trimmed) {
      flushList();
      continue;
    }

    // Regular paragraph
    flushList();
    htmlBlocks.push(`<p>${formatInlineToHtml(trimmed)}</p>`);
  }

  flushList();

  return htmlBlocks.length > 0 ? htmlBlocks.join('') : '<p><br></p>';
}

function formatInlineToHtml(text: string): string {
  if (!text) return '';

  let res = text;

  // Links: [Text](url)
  res = res.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  // Bold: **text** or __text__
  res = res.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');

  // Italic: *text* or _text_
  res = res.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');

  // Strikethrough: ~~text~~
  res = res.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // Underline <u>text</u> is already HTML

  return res;
}

export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  // Use DOMParser if available in browser
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    return parseNodeToMarkdown(body).trim();
  } catch (err) {
    console.error('Failed to parse HTML to Markdown:', err);
    return html;
  }
}

function parseNodeToMarkdown(node: Node): string {
  let output = '';

  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];

    if (child.nodeType === Node.TEXT_NODE) {
      output += child.textContent || '';
      continue;
    }

    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      switch (tagName) {
        case 'h1':
          output += `\n\n# ${parseInlineChildren(el)}\n\n`;
          break;
        case 'h2':
          output += `\n\n## ${parseInlineChildren(el)}\n\n`;
          break;
        case 'h3':
          output += `\n\n### ${parseInlineChildren(el)}\n\n`;
          break;
        case 'p':
        case 'div': {
          const content = parseInlineChildren(el).trim();
          if (content) {
            output += `\n\n${content}\n\n`;
          }
          break;
        }
        case 'blockquote': {
          const quoteText = parseInlineChildren(el).trim();
          if (quoteText) {
            output += `\n\n> ${quoteText}\n\n`;
          }
          break;
        }
        case 'ul': {
          output += '\n\n';
          el.querySelectorAll(':scope > li').forEach(li => {
            output += `* ${parseInlineChildren(li).trim()}\n`;
          });
          output += '\n';
          break;
        }
        case 'ol': {
          output += '\n\n';
          let idx = 1;
          el.querySelectorAll(':scope > li').forEach(li => {
            output += `${idx}. ${parseInlineChildren(li).trim()}\n`;
            idx++;
          });
          output += '\n';
          break;
        }
        case 'figure': {
          const img = el.querySelector('img');
          if (img) {
            const src = img.getAttribute('src') || '';
            const alt = img.getAttribute('alt') || 'Article illustration';
            output += `\n\n![${alt}](${src})\n\n`;
          }
          break;
        }
        case 'img': {
          const src = el.getAttribute('src') || '';
          const alt = el.getAttribute('alt') || 'Article illustration';
          output += `\n\n![${alt}](${src})\n\n`;
          break;
        }
        case 'br':
          output += '\n';
          break;
        default:
          output += parseInlineChildren(el);
          break;
      }
    }
  }

  // Clean up duplicate excess blank lines
  return output.replace(/\n{3,}/g, '\n\n');
}

function parseInlineChildren(node: Node): string {
  let output = '';

  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];

    if (child.nodeType === Node.TEXT_NODE) {
      output += child.textContent || '';
      continue;
    }

    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      switch (tagName) {
        case 'strong':
        case 'b':
          output += `**${parseInlineChildren(el)}**`;
          break;
        case 'em':
        case 'i':
          output += `*${parseInlineChildren(el)}*`;
          break;
        case 'u':
          output += `<u>${parseInlineChildren(el)}</u>`;
          break;
        case 'del':
        case 's':
        case 'strike':
          output += `~~${parseInlineChildren(el)}~~`;
          break;
        case 'a': {
          const href = el.getAttribute('href') || '';
          output += `[${parseInlineChildren(el)}](${href})`;
          break;
        }
        case 'img': {
          const src = el.getAttribute('src') || '';
          const alt = el.getAttribute('alt') || 'Article illustration';
          output += `![${alt}](${src})`;
          break;
        }
        case 'br':
          output += '\n';
          break;
        default:
          output += parseInlineChildren(el);
          break;
      }
    }
  }

  return output;
}
