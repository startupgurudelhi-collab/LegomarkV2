import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Eye,
  TrendingUp,
  Calendar,
  BarChart3,
  Globe,
  RefreshCw,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  Layers,
  Clock,
  Search,
  Compass,
  FileText,
  Briefcase,
  Award,
  ExternalLink,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Unlink2,
  Lock,
} from 'lucide-react';
import {
  fetchGscStatus,
  fetchGscProperties,
  selectGscProperty,
  disconnectGsc,
  GscConnectionMetadata,
  GscSiteProperty,
} from '../../services/adminGsc.service';

interface PeriodMetric {
  uniqueVisitors: number;
  pageViews: number;
}

interface DailyStat {
  date: string;
  label: string;
  uniqueVisitors: number;
  pageViews: number;
}

interface PageStat {
  path: string;
  views: number;
  percentage: number;
}

interface ReferrerStat {
  referrer: string;
  count: number;
}

interface AnalyticsData {
  today: PeriodMetric;
  yesterday: PeriodMetric;
  last7Days: PeriodMetric;
  last30Days: PeriodMetric;
  totalAllTime: PeriodMetric;
  dailyTrend: DailyStat[];
  topPages: PageStat[];
  topReferrers: ReferrerStat[];
  generatedAt: string;
}

// ==========================================
// LACS #17: SEO Analytics Definitions
// ==========================================

export type CanonicalSearchEngine =
  | 'Google'
  | 'Bing'
  | 'Yahoo'
  | 'DuckDuckGo'
  | 'Ecosia'
  | 'Baidu'
  | 'Yandex'
  | 'Other Search';

export interface SeoSearchEngineDistribution {
  engine: CanonicalSearchEngine;
  sessions: number;
  percentage: number;
}

export interface SeoOrganicLandingPage {
  path: string;
  organicSessions: number;
  uniqueOrganicVisitors: number;
  percentage: number;
  dominantEngine: CanonicalSearchEngine;
  contentType: 'blog' | 'service' | 'core';
}

export interface SeoContentTypeTraffic {
  contentType: 'blog' | 'service' | 'core';
  label: string;
  organicSessions: number;
  totalSessions: number;
  organicSharePercentage: number;
}

export interface SeoDailyOrganicTrend {
  date: string;
  label: string;
  organicLandings: number;
  totalLandings: number;
  organicSharePercentage: number;
}

export interface SeoAnalyticsSummaryStats {
  periodDays: number;
  startDate: string;
  endDate: string;
  organicLandings: {
    today: number;
    yesterday: number;
    last7Days: number;
    last30Days: number;
    totalPeriod: number;
  };
  totalLandings: {
    today: number;
    yesterday: number;
    last7Days: number;
    last30Days: number;
    totalPeriod: number;
  };
  organicSharePercentage: number;
  searchEngineDistribution: SeoSearchEngineDistribution[];
  topLandingPages: SeoOrganicLandingPage[];
  contentTypeTraffic: SeoContentTypeTraffic[];
  dailyOrganicTrend: SeoDailyOrganicTrend[];
  generatedAt: string;
}

export interface ArticleSeoTrafficMetric {
  articleId: string;
  title: string;
  slug: string;
  category: string;
  score: number;
  grade: 'Excellent' | 'Good' | 'Needs Improvement' | 'Critical' | 'Unrated';
  organicSessions: number;
  uniqueOrganicVisitors: number;
  percentageOfOrganicTraffic: number;
  primaryPath: string;
}

export interface SeoAnalyticsDashboardData {
  stats: SeoAnalyticsSummaryStats;
  articlesSeoTraffic: ArticleSeoTrafficMetric[];
  catalogAuditMetadata: {
    auditedAt: string | null;
    totalAuditedArticles: number;
    averageScore: number;
  };
  generatedAt: string;
}

export const AdminAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'traffic' | 'seo'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'seo' || params.get('gsc') || params.get('gsc_error')) {
        return 'seo';
      }
    }
    return 'traffic';
  });

  // Existing Website Analytics state
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<'7d' | '14d' | '30d'>('14d');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // LACS #17 SEO Analytics state
  const [seoData, setSeoData] = useState<SeoAnalyticsDashboardData | null>(null);
  const [isSeoLoading, setIsSeoLoading] = useState<boolean>(false);
  const [seoError, setSeoError] = useState<string | null>(null);
  const [hoveredSeoIndex, setHoveredSeoIndex] = useState<number | null>(null);
  const [articleSearchQuery, setArticleSearchQuery] = useState<string>('');
  const [articleGradeFilter, setArticleGradeFilter] = useState<string>('all');

  // LACS #19 Google Search Console state
  const [gscMetadata, setGscMetadata] = useState<GscConnectionMetadata | null>(null);
  const [isGscConfigured, setIsGscConfigured] = useState<boolean>(false);
  const [isGscLoading, setIsGscLoading] = useState<boolean>(false);
  const [isGscDisconnecting, setIsGscDisconnecting] = useState<boolean>(false);
  const [gscNotification, setGscNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // LACS #19 GSC Property Selection state
  const [gscProperties, setGscProperties] = useState<GscSiteProperty[]>([]);
  const [isGscPropertiesLoading, setIsGscPropertiesLoading] = useState<boolean>(false);
  const [gscPropertiesError, setGscPropertiesError] = useState<string | null>(null);
  const [selectedPropertyInput, setSelectedPropertyInput] = useState<string>('');
  const [isGscSavingProperty, setIsGscSavingProperty] = useState<boolean>(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/admin/analytics/stats', {
        headers: {
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to load analytics (HTTP ${res.status})`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.error || 'Failed to parse analytics payload');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve visitor analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSeoAnalytics = useCallback(async () => {
    try {
      setIsSeoLoading(true);
      setSeoError(null);
      const res = await fetch('/api/admin/analytics/seo-stats?rangeDays=30', {
        headers: {
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to load SEO analytics (HTTP ${res.status})`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setSeoData(json.data);
      } else {
        throw new Error(json.error || 'Failed to parse SEO analytics payload');
      }
    } catch (err: any) {
      setSeoError(err?.message || 'Unable to retrieve SEO analytics');
    } finally {
      setIsSeoLoading(false);
    }
  }, []);

  const loadGscProperties = useCallback(async () => {
    try {
      setIsGscPropertiesLoading(true);
      setGscPropertiesError(null);
      const res = await fetchGscProperties();
      if (res.success && res.data) {
        setGscProperties(res.data.properties || []);
        if (res.data.selectedProperty) {
          setSelectedPropertyInput(res.data.selectedProperty);
        }
      } else {
        throw new Error(res.error || 'Failed to retrieve Search Console properties');
      }
    } catch (err: any) {
      setGscPropertiesError(err?.message || 'Failed to load Search Console properties.');
    } finally {
      setIsGscPropertiesLoading(false);
    }
  }, []);

  const loadGscStatus = useCallback(async () => {
    try {
      setIsGscLoading(true);
      const res = await fetchGscStatus();
      if (res.success) {
        setGscMetadata(res.data);
        setIsGscConfigured(Boolean(res.isConfigured));
        if (res.data?.selectedProperty) {
          setSelectedPropertyInput(res.data.selectedProperty);
        }
        if (res.data?.isConnected) {
          loadGscProperties();
        }
      }
    } catch {
      // Non-fatal fallback
    } finally {
      setIsGscLoading(false);
    }
  }, [loadGscProperties]);

  const handleSelectProperty = async (propertyUrlToSave?: string) => {
    const propertyUrl = (propertyUrlToSave ?? selectedPropertyInput).trim();
    if (!propertyUrl) {
      setGscNotification({
        type: 'error',
        message: 'Please select a Search Console property to save.',
      });
      return;
    }

    try {
      setIsGscSavingProperty(true);
      const res = await selectGscProperty(propertyUrl);
      if (res.success && res.data) {
        setGscMetadata(res.data);
        setSelectedPropertyInput(res.data.selectedProperty || propertyUrl);
        setGscNotification({
          type: 'success',
          message: `Active Search Console property saved: ${res.data.selectedProperty || propertyUrl}`,
        });
      }
    } catch (err: any) {
      setGscNotification({
        type: 'error',
        message: err?.message || 'Failed to save Google Search Console property.',
      });
    } finally {
      setIsGscSavingProperty(false);
    }
  };

  const handleDisconnectGsc = async () => {
    if (
      !window.confirm(
        'Are you sure you want to disconnect Google Search Console? Token authorization grants will be revoked.'
      )
    ) {
      return;
    }

    try {
      setIsGscDisconnecting(true);
      await disconnectGsc();
      setGscMetadata(null);
      setGscProperties([]);
      setSelectedPropertyInput('');
      setGscNotification({
        type: 'success',
        message: 'Google Search Console successfully disconnected and revoked.',
      });
    } catch (err: any) {
      setGscNotification({
        type: 'error',
        message: err?.message || 'Failed to disconnect Google Search Console.',
      });
    } finally {
      setIsGscDisconnecting(false);
    }
  };

  const handleConnectGsc = () => {
    window.location.href = '/api/admin/gsc/auth-url';
  };

  // Inspect OAuth callback redirect query params (?gsc=connected or ?gsc_error=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const gscStatus = params.get('gsc');
    const gscErr = params.get('gsc_error');
    const tabParam = params.get('tab');

    if (tabParam === 'seo' || gscStatus || gscErr) {
      setActiveTab('seo');
    }

    if (gscStatus === 'connected') {
      setGscNotification({
        type: 'success',
        message:
          'Google Search Console account successfully connected. Access and refresh tokens are securely encrypted.',
      });
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('gsc');
      window.history.replaceState({}, '', newUrl.toString());
    } else if (gscErr) {
      let friendlyError = 'Failed to connect Google Search Console. Please try again.';
      switch (gscErr) {
        case 'access_denied':
          friendlyError = 'Google account authorization was cancelled or denied.';
          break;
        case 'invalid_grant':
          friendlyError = 'Google authorization has expired or was revoked. Please reconnect.';
          break;
        case 'missing_refresh_token':
          friendlyError =
            'Google did not return a refresh token. Revoke app access in your Google Account security settings and reconnect.';
          break;
        case 'oauth_not_configured':
          friendlyError =
            'Google Search Console OAuth is not configured on the server. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.';
          break;
        case 'state_mismatch':
        case 'invalid_state':
          friendlyError =
            'OAuth security verification failed (state mismatch or expired). Please try connecting again.';
          break;
        case 'missing_code':
          friendlyError = 'Google authorization code was missing in the callback.';
          break;
        default:
          friendlyError = `Google connection error: ${gscErr.replace(/_/g, ' ')}`;
      }
      setGscNotification({
        type: 'error',
        message: friendlyError,
      });
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('gsc_error');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (activeTab === 'seo') {
      if (!seoData && !isSeoLoading) {
        fetchSeoAnalytics();
      }
      loadGscStatus();
    }
  }, [activeTab, seoData, isSeoLoading, fetchSeoAnalytics, loadGscStatus]);

  // Filter daily trend data for chart range
  const filteredTrend = React.useMemo(() => {
    if (!data?.dailyTrend || data.dailyTrend.length === 0) return [];
    const count = chartRange === '7d' ? 7 : chartRange === '14d' ? 14 : 30;
    return data.dailyTrend.slice(-count);
  }, [data?.dailyTrend, chartRange]);

  // Chart max value calculation
  const maxChartValue = React.useMemo(() => {
    if (filteredTrend.length === 0) return 10;
    const peak = Math.max(
      ...filteredTrend.map((d) => Math.max(d.pageViews, d.uniqueVisitors))
    );
    return peak === 0 ? 10 : Math.ceil(peak * 1.15);
  }, [filteredTrend]);

  // Max value calculation for SEO 30-day chart
  const maxSeoChartValue = React.useMemo(() => {
    if (!seoData?.stats.dailyOrganicTrend || seoData.stats.dailyOrganicTrend.length === 0) return 10;
    const peak = Math.max(
      ...seoData.stats.dailyOrganicTrend.map((d) => Math.max(d.totalLandings, d.organicLandings))
    );
    return peak === 0 ? 10 : Math.ceil(peak * 1.15);
  }, [seoData?.stats.dailyOrganicTrend]);

  // Filtered articles list for SEO score vs traffic correlation table
  const filteredArticles = React.useMemo(() => {
    if (!seoData?.articlesSeoTraffic) return [];
    return seoData.articlesSeoTraffic.filter((art) => {
      const q = articleSearchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        art.title.toLowerCase().includes(q) ||
        art.slug.toLowerCase().includes(q) ||
        art.category.toLowerCase().includes(q);

      const matchesGrade =
        articleGradeFilter === 'all' ||
        art.grade.toLowerCase() === articleGradeFilter.toLowerCase();

      return matchesSearch && matchesGrade;
    });
  }, [seoData?.articlesSeoTraffic, articleSearchQuery, articleGradeFilter]);

  const getGradeBadgeClass = (grade: string) => {
    switch (grade) {
      case 'Excellent':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Good':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Needs Improvement':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-amber-400';
    if (score > 0) return 'text-rose-400';
    return 'text-slate-500';
  };

  // Helper to format friendly page titles
  const formatPageTitle = (path: string): string => {
    if (path === '/' || path === '') return 'Homepage';
    if (path.startsWith('/services/')) {
      const slug = path.replace('/services/', '').replace(/\/$/, '');
      return (
        slug
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ') + ' (Service)'
      );
    }
    if (path.startsWith('/resources/blog/') || path.startsWith('/blog/')) {
      return 'Blog Article';
    }
    if (path.startsWith('/packages')) return 'Packages & Pricing';
    if (path.startsWith('/contact')) return 'Contact & Offices';
    return path;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Refresh Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              {activeTab === 'seo' ? <Sparkles className="w-6 h-6 text-amber-400" /> : <BarChart3 className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                {activeTab === 'seo' ? 'SEO Analytics & Search Performance' : 'Website Visitor Analytics'}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {activeTab === 'seo'
                  ? 'Organic search acquisitions, landing path attribution, and on-page SEO score correlation (LACS #17)'
                  : 'Privacy-centric traffic intelligence, daily unique visitors, and page view metrics'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero PII / IP Tracking</span>
          </div>

          <button
            onClick={activeTab === 'seo' ? () => { fetchSeoAnalytics(); loadGscStatus(); } : fetchAnalytics}
            disabled={activeTab === 'seo' ? (isSeoLoading || isGscLoading) : isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${(activeTab === 'seo' ? (isSeoLoading || isGscLoading) : isLoading) ? 'animate-spin text-orange-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation: Website Traffic vs SEO Analytics */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('traffic')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'traffic'
              ? 'border-orange-500 text-orange-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Website Traffic</span>
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'seo'
              ? 'border-orange-500 text-orange-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>SEO Analytics</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/20">
            LACS #17
          </span>
        </button>
      </div>

      {/* TAB 1: WEBSITE VISITOR ANALYTICS (EXISTING) */}
      {activeTab === 'traffic' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Error state */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchAnalytics}
                className="text-xs text-rose-200 underline font-medium hover:text-white"
              >
                Retry
              </button>
            </div>
          )}

      {/* Key Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Today Unique Visitors */}
        <div className="p-5 rounded-xl bg-[#0B132B] border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Today Visitors
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
            ) : (
              (data?.today.uniqueVisitors || 0).toLocaleString()
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span>Unique IP-safe clients</span>
          </div>
        </div>

        {/* Today Page Views */}
        <div className="p-5 rounded-xl bg-[#0B132B] border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Today Page Views
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
            ) : (
              (data?.today.pageViews || 0).toLocaleString()
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">Total pages rendered</div>
        </div>

        {/* Yesterday Unique Visitors */}
        <div className="p-5 rounded-xl bg-[#0B132B] border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Yesterday
            </span>
            <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-200 tracking-tight">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
            ) : (
              (data?.yesterday.uniqueVisitors || 0).toLocaleString()
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {data?.yesterday.pageViews || 0} page views
          </div>
        </div>

        {/* Last 7 Days */}
        <div className="p-5 rounded-xl bg-[#0B132B] border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Last 7 Days
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
            ) : (
              (data?.last7Days.uniqueVisitors || 0).toLocaleString()
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {data?.last7Days.pageViews || 0} total views
          </div>
        </div>

        {/* Last 30 Days */}
        <div className="p-5 rounded-xl bg-[#0B132B] border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Last 30 Days
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
            ) : (
              (data?.last30Days.uniqueVisitors || 0).toLocaleString()
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {data?.last30Days.pageViews || 0} total views
          </div>
        </div>

        {/* Total All-Time Visitors */}
        <div className="p-5 rounded-xl bg-[#0B132B] border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-orange-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Total Visitors
            </span>
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
            ) : (
              (data?.totalAllTime.uniqueVisitors || 0).toLocaleString()
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {data?.totalAllTime.pageViews || 0} all-time views
          </div>
        </div>
      </div>

      {/* Daily Visitor Trend Chart */}
      <div className="p-6 rounded-2xl bg-[#0B132B] border border-slate-800/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span>Daily Visitor Trend</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily unique visitors (emerald bars) and total page views (blue overlay)
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            {(['7d', '14d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setChartRange(range)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  chartRange === range
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Interactive SVG Chart */}
        <div className="relative pt-6 pb-2">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-orange-400 mr-2" />
              <span>Loading trend metrics...</span>
            </div>
          ) : filteredTrend.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <Clock className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">No visitor traffic recorded yet</p>
              <p className="text-xs text-slate-600 mt-1">
                Visits to public pages will automatically appear here
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[540px] h-64 flex flex-col justify-end">
                {/* Visual Grid Lines */}
                <div className="relative flex-1 flex items-end gap-2 sm:gap-3 border-b border-slate-800 pb-2">
                  {filteredTrend.map((day, idx) => {
                    const uvHeightPercent = Math.max(
                      (day.uniqueVisitors / maxChartValue) * 100,
                      day.uniqueVisitors > 0 ? 8 : 2
                    );
                    const pvHeightPercent = Math.max(
                      (day.pageViews / maxChartValue) * 100,
                      day.pageViews > 0 ? 8 : 2
                    );
                    const isHovered = hoveredIndex === idx;

                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Hover Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-14 z-20 bg-slate-900 border border-slate-700 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap pointer-events-none transform -translate-x-1/2 left-1/2">
                            <div className="font-semibold text-slate-300">{day.label}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-emerald-400">
                                {day.uniqueVisitors} visitors
                              </span>
                              <span className="text-slate-500">•</span>
                              <span className="text-blue-400">{day.pageViews} views</span>
                            </div>
                          </div>
                        )}

                        {/* Dual Bar Container */}
                        <div className="w-full flex items-end justify-center gap-1 h-full">
                          {/* Unique Visitors Bar */}
                          <div
                            style={{ height: `${uvHeightPercent}%` }}
                            className={`w-1/2 max-w-[16px] rounded-t-sm transition-all duration-300 ${
                              isHovered
                                ? 'bg-emerald-400 shadow-md shadow-emerald-500/20'
                                : 'bg-emerald-500/80 hover:bg-emerald-400'
                            }`}
                          />
                          {/* Page Views Bar */}
                          <div
                            style={{ height: `${pvHeightPercent}%` }}
                            className={`w-1/2 max-w-[16px] rounded-t-sm transition-all duration-300 ${
                              isHovered
                                ? 'bg-blue-400 shadow-md shadow-blue-500/20'
                                : 'bg-blue-500/60 hover:bg-blue-400'
                            }`}
                          />
                        </div>

                        {/* Date Label */}
                        <div className="text-[10px] text-slate-500 mt-2 truncate w-full text-center">
                          {day.label.split(',')[0]}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-6 pt-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
                    <span>Unique Visitors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-blue-500/70 inline-block" />
                    <span>Total Page Views</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Split Grid: Top Pages & Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Visited Pages (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0B132B] border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">
                Most Visited Pages
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Top landing pages ranked by total view counts
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Total Pages: {data?.topPages.length || 0}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Page / URL</th>
                  <th className="py-3 px-4 w-28 text-right">Views</th>
                  <th className="py-3 px-4 w-44">Traffic Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-4">
                        <div className="w-4 h-4 bg-slate-800 rounded" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-48 h-4 bg-slate-800 rounded" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="w-12 h-4 bg-slate-800 rounded ml-auto" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-full h-3 bg-slate-800 rounded" />
                      </td>
                    </tr>
                  ))
                ) : data?.topPages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">
                      No page traffic recorded yet.
                    </td>
                  </tr>
                ) : (
                  data?.topPages.map((page, index) => (
                    <tr key={page.path} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-white text-xs sm:text-sm">
                          {formatPageTitle(page.path)}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 truncate max-w-xs sm:max-w-md">
                          {page.path}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-200">
                        {page.views.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${Math.min(page.percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-9 text-right font-mono">
                            {page.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Traffic Sources / Referrers (1 col) */}
        <div className="p-6 rounded-2xl bg-[#0B132B] border border-slate-800/80 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <Globe className="w-4 h-4 text-orange-400" />
              <span>Traffic Referrers</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Acquisition sources and inbound referrers
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-start">
            {isLoading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-800 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : !data?.topReferrers || data.topReferrers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-8">
                <Globe className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">Direct visits / No external referrers yet</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.topReferrers.map((ref) => (
                  <div
                    key={ref.referrer}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-xs shrink-0">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {ref.referrer}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-300 ml-2">
                      {ref.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Referrers stripped of query parameters for visitor privacy</span>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* TAB 2: LACS #17 SEO ANALYTICS & SEARCH ENGINE PERFORMANCE */}
  {activeTab === 'seo' && (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* LACS #19: GSC OAuth Feedback Alert */}
      {gscNotification && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between transition-all ${
            gscNotification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {gscNotification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{gscNotification.message}</span>
          </div>
          <button
            onClick={() => setGscNotification(null)}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* LACS #19: Compact Google Search Console Connection Card */}
      <div className="p-5 rounded-xl bg-[#0B132B] border border-slate-800/80 shadow-sm transition-colors hover:border-slate-700/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 shrink-0 mt-0.5">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Google Search Console
                </h2>
                <div className="flex items-center gap-1.5 text-xs">
                  {isGscLoading ? (
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
                      Checking connection...
                    </span>
                  ) : gscMetadata?.isConnected ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Connected
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      Not Connected
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-1 text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                {gscMetadata?.isConnected ? (
                  <>
                    <span className="text-slate-200 font-medium font-mono">
                      {gscMetadata.connectedEmail || 'Authenticated Google Account'}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span>Tokens Encrypted (AES-256-GCM)</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span>Read-Only Scope</span>
                  </>
                ) : (
                  <>
                    <span>
                      Connect official Google Search Console to import live SERP queries, rankings, impressions & CTR
                    </span>
                    {!isGscConfigured && (
                      <>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-amber-400/90">Requires GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in .env</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            {gscMetadata?.isConnected ? (
              <button
                onClick={handleDisconnectGsc}
                disabled={isGscDisconnecting}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/25 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                <Unlink2 className={`w-3.5 h-3.5 ${isGscDisconnecting ? 'animate-spin' : ''}`} />
                <span>{isGscDisconnecting ? 'Revoking...' : 'Disconnect'}</span>
              </button>
            ) : isGscConfigured ? (
              <button
                onClick={handleConnectGsc}
                disabled={isGscLoading}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>Connect Google Account</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                disabled
                title="OAuth credentials are missing in server environment"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-500 border border-slate-700/60 text-xs font-medium cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>OAuth Not Configured</span>
              </button>
            )}
          </div>
        </div>

        {/* LACS #19: Active Property Selection Sub-panel */}
        {gscMetadata?.isConnected && (
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 shrink-0">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-300">Active Property:</span>
                </div>

                {isGscPropertiesLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
                    <span>Discovering verified properties from Search Console...</span>
                  </div>
                ) : gscPropertiesError ? (
                  <div className="flex items-center gap-2 text-xs text-rose-300">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{gscPropertiesError}</span>
                    <button
                      onClick={loadGscProperties}
                      className="text-xs underline text-rose-200 hover:text-white cursor-pointer ml-1"
                    >
                      Retry
                    </button>
                  </div>
                ) : gscProperties.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-amber-300">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>No verified properties found in this Google account.</span>
                    <button
                      onClick={loadGscProperties}
                      className="text-xs underline text-amber-200 hover:text-white cursor-pointer ml-1"
                    >
                      Refresh
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1 max-w-lg min-w-0">
                    <select
                      value={selectedPropertyInput}
                      onChange={(e) => setSelectedPropertyInput(e.target.value)}
                      disabled={isGscSavingProperty}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                    >
                      <option value="" disabled>-- Select a verified Search Console property --</option>
                      {gscProperties.map((prop) => (
                        <option key={prop.siteUrl} value={prop.siteUrl}>
                          {prop.siteUrl} ({prop.permissionLevel})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleSelectProperty()}
                      disabled={
                        isGscSavingProperty ||
                        !selectedPropertyInput ||
                        selectedPropertyInput === gscMetadata.selectedProperty
                      }
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedPropertyInput === gscMetadata.selectedProperty
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 cursor-default'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm'
                      }`}
                    >
                      {isGscSavingProperty ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : selectedPropertyInput === gscMetadata.selectedProperty ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </>
                      ) : (
                        <span>Save Property</span>
                      )}
                    </button>

                    <button
                      onClick={loadGscProperties}
                      disabled={isGscPropertiesLoading}
                      title="Refresh properties list from Google Search Console"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                      aria-label="Refresh properties list"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGscPropertiesLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                )}
              </div>

              {gscMetadata.selectedProperty && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                  <span className="text-slate-500">Selected:</span>
                  <span className="font-mono text-emerald-300 font-medium px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    {gscMetadata.selectedProperty}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {seoError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
          <span>{seoError}</span>
          <button
            onClick={fetchSeoAnalytics}
            className="text-xs text-rose-200 underline font-medium hover:text-white cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top 4 Organic KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Organic Landing Sessions */}
        <div className="p-5 rounded-xl bg-[#0B132B] border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Organic Landings (30d)
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isSeoLoading ? (
              <div className="h-8 w-20 bg-slate-800 animate-pulse rounded" />
            ) : (
              (seoData?.stats.organicLandings.totalPeriod || 0).toLocaleString()
            )}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
            <span>Today: {seoData?.stats.organicLandings.today || 0}</span>
            <span>·</span>
            <span>7d: {seoData?.stats.organicLandings.last7Days || 0}</span>
          </div>
        </div>

        {/* Organic Search Share % */}
        <div className="p-5 rounded-xl bg-[#0B132B] border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Organic Search Share
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-300 tracking-tight">
            {isSeoLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
            ) : (
              `${seoData?.stats.organicSharePercentage || 0}%`
            )}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>of {seoData?.stats.totalLandings.totalPeriod || 0} total entry sessions</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, seoData?.stats.organicSharePercentage || 0)}%` }}
            />
          </div>
        </div>

        {/* Top Search Provider */}
        <div className="p-5 rounded-xl bg-[#0B132B] border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Leading Search Engine
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isSeoLoading ? (
              <div className="h-8 w-24 bg-slate-800 animate-pulse rounded" />
            ) : (
              seoData?.stats.searchEngineDistribution[0]?.engine || 'No Data'
            )}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {seoData?.stats.searchEngineDistribution[0] ? (
              <span>
                {seoData.stats.searchEngineDistribution[0].sessions} sessions ({seoData.stats.searchEngineDistribution[0].percentage}%)
              </span>
            ) : (
              <span>No search acquisitions yet</span>
            )}
          </div>
        </div>

        {/* Top Organic Content Channel */}
        <div className="p-5 rounded-xl bg-[#0B132B] border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Top Content Channel
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight truncate">
            {isSeoLoading ? (
              <div className="h-8 w-28 bg-slate-800 animate-pulse rounded" />
            ) : (
              seoData?.stats.contentTypeTraffic.slice().sort((a, b) => b.organicSessions - a.organicSessions)[0]?.label || 'Blog & Knowledge'
            )}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {seoData?.stats.contentTypeTraffic ? (
              <span>
                {seoData.stats.contentTypeTraffic.slice().sort((a, b) => b.organicSessions - a.organicSessions)[0]?.organicSessions || 0} organic entries
              </span>
            ) : (
              <span>Awaiting organic hits</span>
            )}
          </div>
        </div>
      </div>

      {/* 30-Day Organic Trend Chart */}
      <div className="p-6 rounded-2xl bg-[#0B132B] border border-slate-800/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>30-Day Organic Search Trend</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Daily organic search landing sessions compared against total website session entrances
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-emerald-500" />
              <span className="text-slate-300">Organic Search</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-slate-700" />
              <span className="text-slate-400">Total Entries</span>
            </div>
          </div>
        </div>

        {/* SVG Chart Visualization */}
        <div className="relative pt-6">
          {isSeoLoading ? (
            <div className="h-56 w-full flex items-center justify-center bg-slate-900/40 rounded-xl">
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
                <span className="text-xs">Loading 30-day search trend...</span>
              </div>
            </div>
          ) : !seoData?.stats.dailyOrganicTrend || seoData.stats.dailyOrganicTrend.length === 0 ? (
            <div className="h-56 w-full flex items-center justify-center bg-slate-900/40 rounded-xl text-slate-500 text-xs">
              No trend data available for current window
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-56 w-full flex items-end justify-between gap-1.5 px-2">
                {seoData.stats.dailyOrganicTrend.map((d, i) => {
                  const organicHeight =
                    d.organicLandings > 0
                      ? Math.max(4, Math.round((d.organicLandings / maxSeoChartValue) * 100))
                      : 0;
                  const totalHeight =
                    d.totalLandings > 0
                      ? Math.max(4, Math.round((d.totalLandings / maxSeoChartValue) * 100))
                      : 2;
                  const isHovered = hoveredSeoIndex === i;

                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                      onMouseEnter={() => setHoveredSeoIndex(i)}
                      onMouseLeave={() => setHoveredSeoIndex(null)}
                    >
                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-24 z-30 p-2.5 rounded-lg bg-slate-900 border border-slate-700 shadow-xl text-xs whitespace-nowrap min-w-[150px] pointer-events-none">
                          <p className="font-semibold text-white border-b border-slate-800 pb-1 mb-1.5">
                            {d.label} ({d.date})
                          </p>
                          <div className="flex justify-between items-center text-emerald-400 text-[11px]">
                            <span>Organic Search:</span>
                            <span className="font-mono font-bold">{d.organicLandings}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300 text-[11px] mt-0.5">
                            <span>Total Landings:</span>
                            <span className="font-mono font-bold">{d.totalLandings}</span>
                          </div>
                          <div className="flex justify-between items-center text-amber-300 text-[11px] mt-0.5 pt-0.5 border-t border-slate-800">
                            <span>Organic Share:</span>
                            <span className="font-mono font-bold">{d.organicSharePercentage}%</span>
                          </div>
                        </div>
                      )}

                      {/* Bar Group */}
                      <div className="w-full max-w-[20px] flex items-end justify-center relative h-full">
                        {/* Background total bar */}
                        <div
                          className={`w-full rounded-t-xs transition-all duration-200 ${
                            isHovered ? 'bg-slate-600' : 'bg-slate-800'
                          }`}
                          style={{ height: `${totalHeight}%` }}
                        />
                        {/* Overlay organic bar */}
                        {d.organicLandings > 0 && (
                          <div
                            className={`w-full absolute bottom-0 rounded-t-xs transition-all duration-200 ${
                              isHovered ? 'bg-emerald-400' : 'bg-emerald-500'
                            }`}
                            style={{ height: `${organicHeight}%` }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Date Labels */}
              <div className="flex justify-between text-[10px] text-slate-500 pt-3 border-t border-slate-800/80 px-2 font-mono">
                <span>{seoData.stats.dailyOrganicTrend[0]?.label}</span>
                <span>{seoData.stats.dailyOrganicTrend[Math.floor(seoData.stats.dailyOrganicTrend.length / 2)]?.label}</span>
                <span>{seoData.stats.dailyOrganicTrend[seoData.stats.dailyOrganicTrend.length - 1]?.label}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Grid: Search Engine Distribution & Content Architecture Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Engine Distribution */}
        <div className="p-6 rounded-2xl bg-[#0B132B] border border-slate-800/80 shadow-sm flex flex-col">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-400" />
              <span>Search Engine Distribution</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Distribution of organic visitors acquired from canonical search engines
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-start">
            {isSeoLoading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-800 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : !seoData?.stats.searchEngineDistribution || seoData.stats.searchEngineDistribution.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-10">
                <Globe className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">No search engine acquisitions detected yet in this period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {seoData.stats.searchEngineDistribution.map((item) => (
                  <div
                    key={item.engine}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{item.engine}</span>
                        <span className="text-[11px] text-slate-400">
                          {item.sessions.toLocaleString()} sessions
                        </span>
                      </div>
                      <span className="font-mono font-bold text-blue-400">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Traffic by Content Architecture */}
        <div className="p-6 rounded-2xl bg-[#0B132B] border border-slate-800/80 shadow-sm flex flex-col">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Traffic by Content Architecture</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Organic search volume and capture rate across structural page categories
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-start">
            {isSeoLoading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 bg-slate-800 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : !seoData?.stats.contentTypeTraffic || seoData.stats.contentTypeTraffic.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-10">
                <Layers className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">No content type metrics recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {seoData.stats.contentTypeTraffic.map((c) => {
                  const getIcon = () => {
                    if (c.contentType === 'blog') return <FileText className="w-4 h-4 text-emerald-400" />;
                    if (c.contentType === 'service') return <Briefcase className="w-4 h-4 text-blue-400" />;
                    return <Layers className="w-4 h-4 text-slate-400" />;
                  };

                  return (
                    <div
                      key={c.contentType}
                      className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-slate-800 shrink-0">{getIcon()}</div>
                          <div>
                            <span className="font-semibold text-slate-200 block">{c.label}</span>
                            <span className="text-[11px] text-slate-400">
                              {c.organicSessions.toLocaleString()} organic of {c.totalSessions.toLocaleString()} total entrances
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-purple-300 text-sm block">
                            {c.organicSharePercentage}%
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Search Share</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-purple-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, c.organicSharePercentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Organic Landing Pages Table */}
      <div className="p-6 rounded-2xl bg-[#0B132B] border border-slate-800/80 shadow-sm">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <Compass className="w-4 h-4 text-orange-400" />
              <span>Top Organic Landing Pages</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Top specific URL destinations entered directly via search engine queries
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {seoData?.stats.topLandingPages.length || 0} active landing paths
          </span>
        </div>

        <div className="overflow-x-auto">
          {isSeoLoading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-800 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !seoData?.stats.topLandingPages || seoData.stats.topLandingPages.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No organic search landing paths recorded in this period
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 pl-2">Landing URL Route</th>
                  <th className="pb-3 px-3">Content Type</th>
                  <th className="pb-3 px-3">Top Search Engine</th>
                  <th className="pb-3 px-3 text-right">Organic Sessions</th>
                  <th className="pb-3 px-3 text-right">Unique Visitors</th>
                  <th className="pb-3 pr-2 text-right">Search Share %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {seoData.stats.topLandingPages.map((page) => (
                  <tr key={page.path} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pl-2 font-sans font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[320px]">{page.path}</span>
                        <a
                          href={page.path}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-orange-400 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                        {page.contentType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {page.dominantEngine}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-400">
                      {page.organicSessions.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">
                      {page.uniqueOrganicVisitors.toLocaleString()}
                    </td>
                    <td className="py-3 pr-2 text-right font-bold text-amber-300">
                      {page.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Article SEO Score vs. Organic Traffic Correlation Matrix Table */}
      <div className="p-6 rounded-2xl bg-[#0B132B] border border-slate-800/80 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Article SEO Score vs. Organic Traffic Matrix</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/20">
                LACS #18 Correlation
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Factual alignment of deterministic on-page SEO scores (#18) against measured search engine landings (#17)
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
              <span className="text-slate-500">Catalog Articles:</span>
              <span className="font-bold text-white font-mono">{seoData?.catalogAuditMetadata.totalAuditedArticles || 0}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
              <span className="text-slate-500">Catalog Avg Score:</span>
              <span className="font-bold text-emerald-400 font-mono">{seoData?.catalogAuditMetadata.averageScore || 0}/100</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter articles by title, slug, or category..."
              value={articleSearchQuery}
              onChange={(e) => setArticleSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs focus:outline-hidden focus:border-orange-500/60 placeholder:text-slate-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={articleGradeFilter}
              onChange={(e) => setArticleGradeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs focus:outline-hidden focus:border-orange-500/60 cursor-pointer"
            >
              <option value="all">All Grades</option>
              <option value="excellent">Excellent (85+)</option>
              <option value="good">Good (70-84)</option>
              <option value="needs improvement">Needs Improvement (50-69)</option>
              <option value="critical">Critical (&lt;50)</option>
              <option value="unrated">Unrated</option>
            </select>
          </div>
        </div>

        {/* Articles Table */}
        <div className="overflow-x-auto">
          {isSeoLoading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-800 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No articles match the current filter criteria
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 pl-2">Article Title & Slug</th>
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3 text-center">SEO Score (#18)</th>
                  <th className="pb-3 px-3 text-center">Quality Grade</th>
                  <th className="pb-3 px-3 text-right">Organic Sessions (30d)</th>
                  <th className="pb-3 px-3 text-right">Unique Visitors</th>
                  <th className="pb-3 pr-2 text-right">Share of Organic %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredArticles.map((art) => (
                  <tr key={art.articleId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pl-2 max-w-[280px]">
                      <div className="font-medium text-slate-200 truncate">{art.title}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                        <span className="truncate">/blog/{art.slug}</span>
                        <a
                          href={art.primaryPath}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-orange-400 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {art.category}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`font-mono font-bold text-sm ${getScoreColorClass(art.score)}`}>
                        {art.score > 0 ? `${art.score}/100` : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getGradeBadgeClass(art.grade)}`}>
                        {art.grade}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                      {art.organicSessions.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {art.uniqueOrganicVisitors.toLocaleString()}
                    </td>
                    <td className="py-3 pr-2 text-right font-mono font-bold text-amber-300">
                      {art.percentageOfOrganicTraffic}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )}
    </div>
  );
};
