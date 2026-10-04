import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Link2,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  Trash2,
  Edit3,
  X,
  AlertCircle,
  Share2,
  Filter,
  Check,
  ChevronDown,
  Info,
  Globe,
  Tag,
  ArrowUpDown,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  TrackedBacklink,
  TrackedBacklinksSummaryStats,
  TrackedBacklinkStatus,
  TrackedBacklinkLinkType,
  CreateTrackedBacklinkInput,
  UpdateTrackedBacklinkInput,
} from '../../types/tracked-backlink';
import {
  fetchTrackedBacklinks,
  createTrackedBacklink,
  updateTrackedBacklink,
  deleteTrackedBacklink,
  verifyTrackedBacklink,
  verifyAllTrackedBacklinks,
} from '../../services/tracked-backlink.service';

interface AdminTrackedBacklinksPageProps {
  onNavigateSection?: (section: any) => void;
}

export const AdminTrackedBacklinksPage: React.FC<AdminTrackedBacklinksPageProps> = ({
  onNavigateSection,
}) => {
  // State
  const [backlinks, setBacklinks] = useState<TrackedBacklink[]>([]);
  const [summary, setSummary] = useState<TrackedBacklinksSummaryStats>({
    total: 0,
    active: 0,
    pending: 0,
    lost: 0,
    broken: 0,
    dofollow: 0,
    nofollow: 0,
    verified: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [linkTypeFilter, setLinkTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'lastCheckedAt' | 'domain'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals & Action States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingBacklink, setEditingBacklink] = useState<TrackedBacklink | null>(null);
  const [deletingBacklink, setDeletingBacklink] = useState<TrackedBacklink | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [isBatchVerifying, setIsBatchVerifying] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Add Form State
  const [addForm, setAddForm] = useState<CreateTrackedBacklinkInput>({
    sourceUrl: '',
    targetUrl: '',
    sourceDomain: '',
    anchorText: '',
    linkType: 'dofollow',
    status: 'active',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-dismiss success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTrackedBacklinks({
        search: searchQuery.trim() || undefined,
        status: statusFilter !== 'all' ? (statusFilter as TrackedBacklinkStatus) : undefined,
        linkType: linkTypeFilter !== 'all' ? (linkTypeFilter as TrackedBacklinkLinkType) : undefined,
      });
      setBacklinks(data.backlinks || []);
      setSummary(
        data.summary || {
          total: 0,
          active: 0,
          pending: 0,
          lost: 0,
          broken: 0,
          dofollow: 0,
          nofollow: 0,
          verified: 0,
        }
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to load tracked backlinks');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, linkTypeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Add Backlink
  const handleCreateBacklink = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const src = addForm.sourceUrl.trim();
    const tgt = addForm.targetUrl.trim();

    if (!src) {
      setFormError('Source URL is required.');
      return;
    }
    if (!src.startsWith('http://') && !src.startsWith('https://')) {
      setFormError('Source URL must start with http:// or https://');
      return;
    }
    if (!tgt) {
      setFormError('Target URL or path is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTrackedBacklink({
        ...addForm,
        sourceUrl: src,
        targetUrl: tgt,
        sourceDomain: addForm.sourceDomain?.trim() || undefined,
        anchorText: addForm.anchorText?.trim() || undefined,
        notes: addForm.notes?.trim() || undefined,
      });

      setIsAddModalOpen(false);
      setAddForm({
        sourceUrl: '',
        targetUrl: '',
        sourceDomain: '',
        anchorText: '',
        linkType: 'dofollow',
        status: 'active',
        notes: '',
      });
      setSuccessMessage('Tracked backlink added successfully.');
      loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create backlink');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Backlink
  const handleUpdateBacklink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBacklink) return;
    setFormError(null);

    const src = editingBacklink.sourceUrl.trim();
    const tgt = editingBacklink.targetUrl.trim();

    if (!src || (!src.startsWith('http://') && !src.startsWith('https://'))) {
      setFormError('Source URL must be a valid HTTP or HTTPS URL');
      return;
    }
    if (!tgt) {
      setFormError('Target URL cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTrackedBacklink(editingBacklink.id, {
        sourceUrl: src,
        targetUrl: tgt,
        sourceDomain: editingBacklink.sourceDomain,
        anchorText: editingBacklink.anchorText || undefined,
        linkType: editingBacklink.linkType,
        status: editingBacklink.status,
        notes: editingBacklink.notes || undefined,
      });

      setEditingBacklink(null);
      setSuccessMessage('Backlink details updated successfully.');
      loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to update backlink');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deletingBacklink) return;
    setIsSubmitting(true);
    try {
      await deleteTrackedBacklink(deletingBacklink.id);
      setDeletingBacklink(null);
      setSuccessMessage('Tracked backlink deleted successfully.');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete backlink');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Single Verify
  const handleVerifySingle = async (id: string) => {
    setVerifyingId(id);
    try {
      const updated = await verifyTrackedBacklink(id);
      setBacklinks((prev) => prev.map((b) => (b.id === id ? updated : b)));
      setSuccessMessage(
        `Verified ${updated.sourceDomain}: ${updated.status.toUpperCase()} (${updated.isVerified ? 'Found' : 'Missing/Not Found'})`
      );
      // Refresh summary in background
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  // Handle Batch Verify All
  const handleVerifyAll = async () => {
    if (backlinks.length === 0) return;
    setIsBatchVerifying(true);
    try {
      const batchResult = await verifyAllTrackedBacklinks(50);
      setSuccessMessage(
        `Batch verification complete: ${batchResult.processed} checked (${batchResult.active} active, ${batchResult.lost} lost, ${batchResult.broken} broken).`
      );
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Batch verification failed');
    } finally {
      setIsBatchVerifying(false);
    }
  };

  // Sorted backlinks
  const sortedBacklinks = useMemo(() => {
    return [...backlinks].sort((a, b) => {
      let comp = 0;
      if (sortBy === 'createdAt') {
        comp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'lastCheckedAt') {
        const tA = a.lastCheckedAt ? new Date(a.lastCheckedAt).getTime() : 0;
        const tB = b.lastCheckedAt ? new Date(b.lastCheckedAt).getTime() : 0;
        comp = tA - tB;
      } else if (sortBy === 'domain') {
        comp = a.sourceDomain.localeCompare(b.sourceDomain);
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [backlinks, sortBy, sortOrder]);

  // Compute dofollow percent
  const dofollowPercent = useMemo(() => {
    if (!summary.total || summary.total === 0) return 0;
    return Math.round((summary.dofollow / summary.total) * 100);
  }, [summary]);

  const lostOrBrokenCount = (summary.lost || 0) + (summary.broken || 0);

  // Status Badge Helper
  const renderStatusBadge = (status: TrackedBacklinkStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Pending
          </span>
        );
      case 'lost':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Lost
          </span>
        );
      case 'broken':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Broken
          </span>
        );
    }
  };

  // Link Type Badge Helper
  const renderLinkTypeBadge = (type: TrackedBacklinkLinkType) => {
    switch (type) {
      case 'dofollow':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Dofollow
          </span>
        );
      case 'nofollow':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-700 text-slate-300 border border-slate-600">
            Nofollow
          </span>
        );
      case 'ugc':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            UGC
          </span>
        );
      case 'sponsored':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Sponsored
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with LACS Switcher & Action Buttons */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 rounded-lg bg-orange-600/15 text-orange-400 border border-orange-500/20">
                <Link2 className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Tracked Backlinks & Link Monitor
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                LACS #22
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 max-w-3xl">
              Live crawler monitoring, anchor text detection, HTTP status verification, and attribute tracking
              for external inbound links acquired for LEGOMARK.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
            <button
              onClick={() => handleVerifyAll()}
              disabled={isBatchVerifying || isLoading || backlinks.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition disabled:opacity-50 cursor-pointer"
              title="Crawl and verify all tracked backlinks"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBatchVerifying ? 'animate-spin text-orange-400' : ''}`} />
              {isBatchVerifying ? 'Verifying All...' : 'Verify All'}
            </button>

            <button
              onClick={() => {
                setFormError(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm hover:shadow transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Backlink
            </button>
          </div>
        </div>

        {/* View Switcher Tabs (Opportunities vs Tracked) */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => onNavigateSection?.('backlinks')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              Backlink Opportunities (LACS #21)
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-white bg-slate-800 border border-slate-700/60 shadow-xs cursor-default"
            >
              <Link2 className="w-3.5 h-3.5 text-orange-400" />
              Tracked Backlinks (LACS #22)
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>
              Autonomous Crawler Protection: <strong className="text-slate-200">SSRF Blocked • 500KB Stream Limit</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Success & Error Banners */}
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold text-rose-300 transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Backlinks</span>
            <div className="p-1.5 rounded-md bg-slate-800 text-slate-300">
              <Link2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{summary.total}</p>
          <p className="text-[11px] text-slate-400 mt-1">Monitored inbound links</p>
        </div>

        {/* Active */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Active Links</span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{summary.active}</p>
          <p className="text-[11px] text-emerald-400/80 mt-1">Currently marked active</p>
        </div>

        {/* Lost / Broken */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Lost / Broken</span>
            <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-2">{lostOrBrokenCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.lost} lost • {summary.broken} broken
          </p>
        </div>

        {/* Dofollow % */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Dofollow Equity</span>
            <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-sky-400 mt-2">{dofollowPercent}%</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.dofollow} dofollow • {summary.nofollow} nofollow
          </p>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by source URL, domain, target path, anchor text, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-orange-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="lost">Lost</option>
                <option value="broken">Broken</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Link Type Dropdown */}
            <div className="relative">
              <select
                value={linkTypeFilter}
                onChange={(e) => setLinkTypeFilter(e.target.value)}
                className="appearance-none bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-orange-500 cursor-pointer"
              >
                <option value="all">All Link Types</option>
                <option value="dofollow">Dofollow</option>
                <option value="nofollow">Nofollow</option>
                <option value="ugc">UGC</option>
                <option value="sponsored">Sponsored</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort Options */}
            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="appearance-none bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-orange-500 cursor-pointer"
              >
                <option value="createdAt-desc">Newest Added</option>
                <option value="createdAt-asc">Oldest Added</option>
                <option value="lastCheckedAt-desc">Recently Verified</option>
                <option value="domain-asc">Domain (A-Z)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {(searchQuery || statusFilter !== 'all' || linkTypeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setLinkTypeFilter('all');
                }}
                className="px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Backlink Table / States */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-400 mb-3" />
            <p className="text-sm font-medium text-slate-300">Loading tracked backlinks...</p>
            <p className="text-xs text-slate-500 mt-1">Connecting to tracking repository</p>
          </div>
        ) : sortedBacklinks.length === 0 ? (
          <div className="py-16 px-6 text-center">
            {searchQuery || statusFilter !== 'all' || linkTypeFilter !== 'all' ? (
              <div className="max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
                  <Filter className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-white">No matching backlinks found</h3>
                <p className="text-xs text-slate-400 mt-1">
                  None of your tracked backlinks match the selected search or filter criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setLinkTypeFilter('all');
                  }}
                  className="mt-4 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto text-orange-400 mb-3">
                  <Link2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-white">No Tracked Backlinks Yet</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Start tracking external backlinks earned from digital PR, publications, partner directories, or
                  LACS #21 outreach opportunities to monitor uptime and link equity.
                </p>
                <button
                  onClick={() => {
                    setFormError(null);
                    setIsAddModalOpen(true);
                  }}
                  className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Backlink
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                  <th className="py-3.5 px-4">Source Page & Domain</th>
                  <th className="py-3.5 px-4">Target Legomark URL</th>
                  <th className="py-3.5 px-4">Anchor Text & Rel</th>
                  <th className="py-3.5 px-4">Status & HTTP</th>
                  <th className="py-3.5 px-4">Verification</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {sortedBacklinks.map((item) => {
                  const isVerifyingThis = verifyingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* 1. Source Page & Domain */}
                      <td className="py-3 px-4 max-w-xs sm:max-w-sm">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white truncate max-w-[200px]" title={item.sourceDomain}>
                                {item.sourceDomain}
                              </span>
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-orange-400 transition"
                                title="Open source page in new tab"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                            <p
                              className="text-[11px] text-slate-400 truncate mt-0.5"
                              title={item.sourceUrl}
                            >
                              {item.sourceUrl}
                            </p>
                            {item.notes && (
                              <p className="text-[10px] text-slate-400 italic mt-1 line-clamp-1" title={item.notes}>
                                Note: {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Target Legomark URL */}
                      <td className="py-3 px-4">
                        <code className="text-[11px] text-orange-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {item.targetUrl}
                        </code>
                        {item.outreachType && (
                          <div className="mt-1">
                            <span className="text-[10px] text-slate-400 font-medium">
                              via {item.outreachType.replace(/_/g, ' ')}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 3. Anchor Text & Rel */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {item.anchorText ? (
                            <span className="font-medium text-slate-200" title={item.anchorText}>
                              "{item.anchorText}"
                            </span>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">Unspecified</span>
                          )}
                          <div>{renderLinkTypeBadge(item.linkType)}</div>
                        </div>
                      </td>

                      {/* 4. Status & HTTP Code */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <div>{renderStatusBadge(item.status)}</div>
                          {item.httpStatus !== null && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                                item.httpStatus >= 200 && item.httpStatus < 300
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : item.httpStatus >= 300 && item.httpStatus < 400
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}
                            >
                              HTTP {item.httpStatus}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Verification State & Timestamp */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 text-[11px]">
                          {item.isVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Link Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              Unverified
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {item.lastCheckedAt
                              ? new Date(item.lastCheckedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Never checked'}
                          </span>
                        </div>
                      </td>

                      {/* 6. Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Verify Button */}
                          <button
                            onClick={() => handleVerifySingle(item.id)}
                            disabled={isVerifyingThis || isBatchVerifying}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
                            title="Verify backlink live via crawler"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingThis ? 'animate-spin text-orange-400' : ''}`} />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setFormError(null);
                              setEditingBacklink({ ...item });
                            }}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                            title="Edit backlink"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeletingBacklink(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Delete tracked backlink"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Add Backlink Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-orange-600/15 text-orange-400 border border-orange-500/20">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Add Tracked Backlink</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error in modal */}
            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleCreateBacklink} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Source URL <span className="text-rose-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://techcrunch.com/article/top-legal-firms-india"
                  value={addForm.sourceUrl}
                  onChange={(e) => setAddForm({ ...addForm, sourceUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The external web page linking to Legomark. Domain will be extracted automatically.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Legomark URL or Path <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="/services/private-limited-company-registration"
                  value={addForm.targetUrl}
                  onChange={(e) => setAddForm({ ...addForm, targetUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                />
                {/* Quick path suggestion pills */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400">Quick suggestions:</span>
                  {[
                    '/',
                    '/services/private-limited-company-registration',
                    '/services/trademark-registration',
                    '/services/llp-registration',
                    '/blog',
                  ].map((path) => (
                    <button
                      key={path}
                      type="button"
                      onClick={() => setAddForm({ ...addForm, targetUrl: path })}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      {path}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Anchor Text (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Legomark Company Registration"
                    value={addForm.anchorText || ''}
                    onChange={(e) => setAddForm({ ...addForm, anchorText: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Link Type
                  </label>
                  <select
                    value={addForm.linkType}
                    onChange={(e) => setAddForm({ ...addForm, linkType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-orange-500 cursor-pointer"
                  >
                    <option value="dofollow">Dofollow (Default)</option>
                    <option value="nofollow">Nofollow</option>
                    <option value="ugc">UGC</option>
                    <option value="sponsored">Sponsored</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={addForm.status}
                  onChange={(e) => setAddForm({ ...addForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-orange-500 cursor-pointer"
                >
                  <option value="active">Active (Link is live)</option>
                  <option value="pending">Pending (Awaiting live publishing)</option>
                  <option value="lost">Lost</option>
                  <option value="broken">Broken</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Outreach / Internal Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Acquired via startup guest post campaign; contact: editor@techcrunch.com"
                  value={addForm.notes || ''}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-50 transition"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Add Backlink'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Edit Backlink Modal */}
      {editingBacklink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-orange-600/15 text-orange-400 border border-orange-500/20">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Edit Tracked Backlink</h3>
              </div>
              <button
                onClick={() => setEditingBacklink(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error in modal */}
            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleUpdateBacklink} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Source URL <span className="text-rose-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={editingBacklink.sourceUrl}
                  onChange={(e) =>
                    setEditingBacklink({ ...editingBacklink, sourceUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Legomark URL or Path <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingBacklink.targetUrl}
                  onChange={(e) =>
                    setEditingBacklink({ ...editingBacklink, targetUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Anchor Text
                  </label>
                  <input
                    type="text"
                    value={editingBacklink.anchorText || ''}
                    onChange={(e) =>
                      setEditingBacklink({ ...editingBacklink, anchorText: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Link Type
                  </label>
                  <select
                    value={editingBacklink.linkType}
                    onChange={(e) =>
                      setEditingBacklink({
                        ...editingBacklink,
                        linkType: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-orange-500 cursor-pointer"
                  >
                    <option value="dofollow">Dofollow</option>
                    <option value="nofollow">Nofollow</option>
                    <option value="ugc">UGC</option>
                    <option value="sponsored">Sponsored</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={editingBacklink.status}
                  onChange={(e) =>
                    setEditingBacklink({
                      ...editingBacklink,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-orange-500 cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="lost">Lost</option>
                  <option value="broken">Broken</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={editingBacklink.notes || ''}
                  onChange={(e) =>
                    setEditingBacklink({ ...editingBacklink, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBacklink(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-50 transition"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Delete Confirmation Modal */}
      {deletingBacklink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <button
              onClick={() => setDeletingBacklink(null)}
              disabled={isSubmitting}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Delete Tracked Backlink?
                </h3>
                <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                  Are you sure you want to stop tracking this backlink? It will be permanently removed from the monitoring database.
                </p>
                <div className="mt-3 p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-400 space-y-1">
                  <div>
                    <span className="text-slate-500">Domain:</span>{' '}
                    <strong className="text-slate-300">{deletingBacklink.sourceDomain}</strong>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-500">Target:</span>{' '}
                    <code className="text-orange-400 font-mono">{deletingBacklink.targetUrl}</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingBacklink(null)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
