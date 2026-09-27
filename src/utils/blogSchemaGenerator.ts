/**
 * Utility for generating and validating Google-compliant Schema.org JSON-LD structured data
 * for BlogPosting and BreadcrumbList.
 */

export interface BlogSchemaInput {
  title?: string;
  slug?: string;
  category?: string;
  author?: string;
  content?: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  jsonString: string;
  graph: any;
}

/**
 * Derives the active base URL from environment or browser window
 * NEVER hardcodes any single domain.
 */
export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return '';
}

/**
 * Normalizes an image path to an absolute URL
 */
function toAbsoluteUrl(urlOrPath: string | null | undefined, baseUrl: string): string | undefined {
  if (!urlOrPath) return undefined;
  const clean = urlOrPath.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  const prefix = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${prefix.replace(/\/$/, '')}/${clean.replace(/^\//, '')}`;
}

/**
 * Normalizes ISO date string or falls back to valid ISO format
 */
function toIsoDate(dateVal: string | null | undefined, fallback: string): string {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch {
    // fallback
  }
  return fallback;
}

/**
 * Builds Google-compliant BlogPosting Schema
 * Author rule:
 * - "LEGOMARK Editorial Board" => Organization
 * - Individual author name => Person
 */
export function buildBlogPostingSchema(input: BlogSchemaInput, baseUrl?: string) {
  const base = baseUrl || getAppBaseUrl();
  const slug = (input.slug || '').trim();
  const canonicalUrl = `${base}/resources/blog/${slug}`;
  const now = new Date().toISOString();

  const authorName = (input.author || 'LEGOMARK Editorial Board').trim();
  const isEditorialBoard =
    authorName.toLowerCase() === 'legomark editorial board' ||
    authorName.toLowerCase().includes('editorial board');

  const authorSchema = isEditorialBoard
    ? {
        '@type': 'Organization',
        name: 'LEGOMARK Editorial Board',
        url: base || undefined,
      }
    : {
        '@type': 'Person',
        name: authorName,
        affiliation: {
          '@type': 'Organization',
          name: 'LEGOMARK INDIA',
          url: base || undefined,
        },
      };

  const publishedIso = toIsoDate(input.publishedAt || input.createdAt, now);
  const modifiedIso = toIsoDate(input.updatedAt || input.publishedAt || input.createdAt, publishedIso);

  const headline = (input.seoTitle || input.title || 'Legal Insight').trim();
  const description = (input.metaDescription || input.excerpt || '').trim();
  const imageUrl = toAbsoluteUrl(input.featuredImage, base);

  return {
    '@type': 'BlogPosting',
    '@id': `${canonicalUrl}#article`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    headline,
    description: description || undefined,
    image: imageUrl ? [imageUrl] : undefined,
    datePublished: publishedIso,
    dateModified: modifiedIso,
    author: authorSchema,
    publisher: {
      '@type': 'Organization',
      name: 'LEGOMARK INDIA',
      url: base || undefined,
      logo: {
        '@type': 'ImageObject',
        url: toAbsoluteUrl('/uploads/logos/legomark-india-official-logo.svg', base),
      },
    },
    articleSection: input.category || 'Corporate Advisory',
    inLanguage: 'en-IN',
  };
}

/**
 * Builds BreadcrumbList Schema for blog hierarchy:
 * Home > Resources & Legal Insights > Article Title
 */
export function buildBreadcrumbSchema(input: BlogSchemaInput, baseUrl?: string) {
  const base = baseUrl || getAppBaseUrl();
  const slug = (input.slug || '').trim();
  const title = (input.title || input.seoTitle || 'Legal Insight').trim();

  return {
    '@type': 'BreadcrumbList',
    '@id': `${base}/resources/blog/${slug}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${base}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Resources & Legal Insights',
        item: `${base}/resources/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: `${base}/resources/blog/${slug}`,
      },
    ],
  };
}

/**
 * Generates the full Schema.org Graph containing BlogPosting + BreadcrumbList
 */
export function generateBlogSchemaGraph(
  input: BlogSchemaInput,
  baseUrl?: string
): SchemaValidationResult {
  const base = baseUrl || getAppBaseUrl();
  const blogPosting = buildBlogPostingSchema(input, base);
  const breadcrumb = buildBreadcrumbSchema(input, base);

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [breadcrumb, blogPosting],
  };

  const validation = validateBlogSchema(graph);
  return {
    isValid: validation.isValid,
    errors: validation.errors,
    jsonString: validation.jsonString,
    graph,
  };
}

/**
 * Validates generated JSON structure against schema.org requirements
 */
export function validateBlogSchema(schema: any): { isValid: boolean; errors: string[]; jsonString: string } {
  const errors: string[] = [];

  if (!schema || typeof schema !== 'object') {
    return { isValid: false, errors: ['Schema must be a valid JSON object.'], jsonString: '' };
  }

  if (schema['@context'] !== 'https://schema.org') {
    errors.push('Missing or invalid @context: must be "https://schema.org"');
  }

  const items = Array.isArray(schema['@graph']) ? schema['@graph'] : [schema];

  const hasPosting = items.some((i) => i['@type'] === 'BlogPosting');
  const hasBreadcrumbs = items.some((i) => i['@type'] === 'BreadcrumbList');

  if (!hasPosting) {
    errors.push('Missing BlogPosting entity in schema graph.');
  }

  if (!hasBreadcrumbs) {
    errors.push('Missing BreadcrumbList entity in schema graph.');
  }

  // Validate BlogPosting specifics
  const posting = items.find((i) => i['@type'] === 'BlogPosting');
  if (posting) {
    if (!posting.headline || typeof posting.headline !== 'string' || posting.headline.trim() === '') {
      errors.push('BlogPosting headline is required.');
    }
    if (!posting.author || !posting.author['@type'] || !posting.author.name) {
      errors.push('BlogPosting author with @type and name is required.');
    }
    if (!posting.publisher || !posting.publisher.name) {
      errors.push('BlogPosting publisher organization is required.');
    }
    if (!posting.datePublished) {
      errors.push('BlogPosting datePublished is required.');
    }
  }

  let jsonString = '';
  try {
    jsonString = JSON.stringify(schema, null, 2);
  } catch (err: any) {
    errors.push(`JSON serialization failed: ${err?.message || err}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    jsonString,
  };
}
