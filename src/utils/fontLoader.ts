/**
 * Dynamic Website Font Loader & Applicator
 * Applies Admin-configured typography in real-time across the public website and Admin CMS
 */

export interface FontOption {
  name: string;
  category: 'sans-serif' | 'serif' | 'display';
  description: string;
  weights: string;
}

export const APPROVED_FONTS: FontOption[] = [
  {
    name: 'Plus Jakarta Sans',
    category: 'sans-serif',
    description: 'Modern Geometric — Clean, high-authority corporate typography (Default)',
    weights: '300;400;500;600;700;800',
  },
  {
    name: 'Inter',
    category: 'sans-serif',
    description: 'Neutral Neo-Grotesque — Exceptional digital legibility and density',
    weights: '300;400;500;600;700;800',
  },
  {
    name: 'Outfit',
    category: 'sans-serif',
    description: 'Contemporary Sans — Elegant letterforms with distinctive modern styling',
    weights: '300;400;500;600;700;800',
  },
  {
    name: 'Poppins',
    category: 'sans-serif',
    description: 'Geometric Sans — Approachable, bold, and contemporary corporate aesthetic',
    weights: '300;400;500;600;700;800',
  },
  {
    name: 'DM Sans',
    category: 'sans-serif',
    description: 'Precision Sans — Crisp, low-contrast letterforms for executive interfaces',
    weights: '400;500;700',
  },
  {
    name: 'Manrope',
    category: 'sans-serif',
    description: 'Semi-Geometric — Tech-forward corporate typography with balanced metrics',
    weights: '300;400;500;600;700;800',
  },
  {
    name: 'Montserrat',
    category: 'sans-serif',
    description: 'Architectural Sans — Broad, distinguished corporate heading letterforms',
    weights: '300;400;500;600;700;800',
  },
  {
    name: 'Roboto',
    category: 'sans-serif',
    description: 'Workhorse Sans — Universal accessibility and clean mechanical curves',
    weights: '300;400;500;700',
  },
  {
    name: 'Playfair Display',
    category: 'serif',
    description: 'Editorial Serif — High-prestige classical legal and corporate elegance',
    weights: '400;500;600;700;800',
  },
  {
    name: 'Lora',
    category: 'serif',
    description: 'Contemporary Serif — Distinguished literary appeal with modern readability',
    weights: '400;500;600;700',
  },
];

const DEFAULT_FONT = 'Plus Jakarta Sans';

/**
 * Dynamically loads and applies the chosen font family to the public website.
 */
export function applyWebsiteFont(rawFontName?: string | null): string {
  if (typeof window === 'undefined') return DEFAULT_FONT;

  const fontName = (rawFontName || '').trim() || DEFAULT_FONT;
  
  // Find configured weights or fallback
  const matched = APPROVED_FONTS.find(
    (f) => f.name.toLowerCase() === fontName.toLowerCase()
  );
  const resolvedFontName = matched ? matched.name : fontName;
  const weights = matched ? matched.weights : '300;400;500;600;700;800';

  try {
    // 1. Ensure preconnect links exist
    if (!document.getElementById('google-fonts-preconnect-1')) {
      const preconnect1 = document.createElement('link');
      preconnect1.id = 'google-fonts-preconnect-1';
      preconnect1.rel = 'preconnect';
      preconnect1.href = 'https://fonts.googleapis.com';
      document.head.appendChild(preconnect1);
    }
    if (!document.getElementById('google-fonts-preconnect-2')) {
      const preconnect2 = document.createElement('link');
      preconnect2.id = 'google-fonts-preconnect-2';
      preconnect2.rel = 'preconnect';
      preconnect2.href = 'https://fonts.gstatic.com';
      preconnect2.crossOrigin = 'anonymous';
      document.head.appendChild(preconnect2);
    }

    // 2. Inject or update the dynamic stylesheet for the selected font
    const fontHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      resolvedFontName
    )}:wght@300;400;500;600;700;800&display=swap`;

    let dynamicLink = document.getElementById('dynamic-website-font') as HTMLLinkElement | null;
    if (!dynamicLink) {
      dynamicLink = document.createElement('link');
      dynamicLink.id = 'dynamic-website-font';
      dynamicLink.rel = 'stylesheet';
      dynamicLink.href = fontHref;
      document.head.appendChild(dynamicLink);
    } else if (dynamicLink.href !== fontHref) {
      dynamicLink.href = fontHref;
    }

    // 3. Apply to document root CSS variable & body
    const fallbackStack = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";
    const fullFamilyStack = `'${resolvedFontName}', ${fallbackStack}`;

    document.documentElement.style.setProperty('--site-font-family', fullFamilyStack);
    if (document.body) {
      document.body.style.fontFamily = fullFamilyStack;
    }
  } catch (err) {
    console.warn('Could not dynamically apply website font:', err);
  }

  return resolvedFontName;
}
