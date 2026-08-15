import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Archive,
  ChevronRight,
  Trash2,
  Eye,
  Save,
  Check,
  X,
  ExternalLink,
  Copy,
  Calendar,
  MessageSquare,
  FileText,
  Shield,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { LeadItem, LeadStats, LeadStatus, LeadFilters } from '../../types/lead';
import {
  fetchAdminLeads,
  updateAdminLeadStatus,
  updateAdminLeadNotes,
  deleteAdminLead,
} from '../../services/lead.service';
import { SERVICES } from '../../data/websiteData';

const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; bg: string; text: string; border: string; icon: any; desc: string }
> = {
  NEW: {
    label: 'New',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: AlertCircle,
    desc: 'Needs prompt follow-up',
  },
  CONTACTED: {
    label: 'Contacted',
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    icon: PhoneCall,
    desc: 'Initial conversation initiated',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    icon: Clock,
    desc: 'Advisory or proposal active',
  },
  CONVERTED: {
    label: 'Converted',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    icon: CheckCircle2,
    desc: 'Client successfully retained',
  },
  CLOSED: {
    label: 'Closed',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    icon: Archive,
    desc: 'Archived or completed',
  },
};

export const AdminLeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    total: 0,
    new: 0,
    contacted: 0,
    inProgress: 0,
    converted: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'fullName' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Detail Modal / Drawer State
  const [activeLead, setActiveLead] = useState<LeadItem | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState(false);

  // Delete Confirmation State
  const [leadToDelete, setLeadToDelete] = useState<LeadItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy Feedback State
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadLeads = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const res = await fetchAdminLeads({
          search: searchQuery.trim() || undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          service: selectedService !== 'all' ? selectedService : undefined,
          dateRange: selectedDateRange,
          sortBy,
          sortOrder,
        });

        setLeads(res.leads);
        setStats(res.stats);

        // If the active lead is currently open in modal, update its state
        if (activeLead) {
          const updatedActive = res.leads.find((l) => l.id === activeLead.id);
          if (updatedActive) {
            setActiveLead(updatedActive);
            setEditingNotes(updatedActive.adminNotes || '');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load leads');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, selectedStatus, selectedService, selectedDateRange, sortBy, sortOrder, activeLead]
  );

  useEffect(() => {
    loadLeads();
  }, [selectedStatus, selectedService, selectedDateRange, sortBy, sortOrder]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadLeads();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenLeadDetails = (lead: LeadItem) => {
    setActiveLead(lead);
    setEditingNotes(lead.adminNotes || '');
    setNotesSaveSuccess(false);
  };

  const handleCloseLeadDetails = () => {
    setActiveLead(null);
    setEditingNotes('');
    setNotesSaveSuccess(false);
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const updated = await updateAdminLeadStatus(leadId, newStatus);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      if (activeLead && activeLead.id === leadId) {
        setActiveLead(updated);
      }
      // Refresh stats
      const res = await fetchAdminLeads({});
      setStats(res.stats);
      showToast(`Status updated to ${STATUS_CONFIG[newStatus].label}`);
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Failed to update status'}`);
    }
  };

  const handleSaveNotes = async () => {
    if (!activeLead) return;
    setIsSavingNotes(true);
    setNotesSaveSuccess(false);
    try {
      const updated = await updateAdminLeadNotes(activeLead.id, editingNotes);
      setActiveLead(updated);
      setLeads((prev) => prev.map((l) => (l.id === activeLead.id ? updated : l)));
      setNotesSaveSuccess(true);
      showToast('Admin notes saved successfully');
      setTimeout(() => setNotesSaveSuccess(false), 2500);
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Failed to save notes'}`);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAdminLead(leadToDelete.id);
      setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
      if (activeLead && activeLead.id === leadToDelete.id) {
        handleCloseLeadDetails();
      }
      setLeadToDelete(null);
      // Refresh stats
      const res = await fetchAdminLeads({});
      setStats(res.stats);
      showToast('Enquiry record deleted successfully');
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Failed to delete lead'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  // Distinct service names for filter dropdown
  const serviceOptions = useMemo(() => {
    const set = new Set<string>();
    SERVICES.forEach((s) => set.add(s.title));
    leads.forEach((l) => {
      if (l.serviceInterested) set.add(l.serviceInterested);
    });
    return Array.from(set).sort();
  }, [leads]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedStatus !== 'all' ||
    selectedService !== 'all' ||
    selectedDateRange !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedService('all');
    setSelectedDateRange('all');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-medium animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Users className="w-3 h-3" />
              Lead Center
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-400">Website Consultation Pipeline</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Leads & Enquiries Management
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Track and process inbound consultation requests, corporate advisory enquiries, and prospective client leads in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadLeads(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-400' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Real Top Statistics Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Leads */}
        <button
          onClick={() => setSelectedStatus('all')}
          className={`text-left p-4 rounded-xl border transition-all ${
            selectedStatus === 'all'
              ? 'bg-slate-800/90 border-slate-600 ring-1 ring-slate-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Leads</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">All enquiries</div>
        </button>

        {/* New Enquiries */}
        <button
          onClick={() => setSelectedStatus('NEW')}
          className={`text-left p-4 rounded-xl border transition-all ${
            selectedStatus === 'NEW'
              ? 'bg-amber-950/40 border-amber-500/50 ring-1 ring-amber-500'
              : 'bg-slate-900 border-slate-800 hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-medium">New</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.new}</div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">Needs action</div>
        </button>

        {/* Contacted */}
        <button
          onClick={() => setSelectedStatus('CONTACTED')}
          className={`text-left p-4 rounded-xl border transition-all ${
            selectedStatus === 'CONTACTED'
              ? 'bg-sky-950/40 border-sky-500/50 ring-1 ring-sky-500'
              : 'bg-slate-900 border-slate-800 hover:border-sky-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-sky-400 mb-2">
            <span className="text-xs font-medium">Contacted</span>
            <PhoneCall className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400">{stats.contacted}</div>
          <div className="text-[11px] text-sky-400/80 mt-0.5">Initial call done</div>
        </button>

        {/* In Progress */}
        <button
          onClick={() => setSelectedStatus('IN_PROGRESS')}
          className={`text-left p-4 rounded-xl border transition-all ${
            selectedStatus === 'IN_PROGRESS'
              ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500'
              : 'bg-slate-900 border-slate-800 hover:border-indigo-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <span className="text-xs font-medium">In Progress</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400">{stats.inProgress}</div>
          <div className="text-[11px] text-indigo-400/80 mt-0.5">Active discussion</div>
        </button>

        {/* Converted */}
        <button
          onClick={() => setSelectedStatus('CONVERTED')}
          className={`text-left p-4 rounded-xl border transition-all ${
            selectedStatus === 'CONVERTED'
              ? 'bg-emerald-950/40 border-emerald-500/50 ring-1 ring-emerald-500'
              : 'bg-slate-900 border-slate-800 hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-medium">Converted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.converted}</div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5">Retained clients</div>
        </button>

        {/* Closed */}
        <button
          onClick={() => setSelectedStatus('CLOSED')}
          className={`text-left p-4 rounded-xl border transition-all ${
            selectedStatus === 'CLOSED'
              ? 'bg-slate-800/90 border-slate-600 ring-1 ring-slate-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Closed</span>
            <Archive className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-300">{stats.closed}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Archived / Done</div>
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, phone, email, service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-orange-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">All Statuses ({stats.total})</option>
              <option value="NEW">New ({stats.new})</option>
              <option value="CONTACTED">Contacted ({stats.contacted})</option>
              <option value="IN_PROGRESS">In Progress ({stats.inProgress})</option>
              <option value="CONVERTED">Converted ({stats.converted})</option>
              <option value="CLOSED">Closed ({stats.closed})</option>
            </select>
          </div>

          {/* Service Dropdown */}
          <div className="lg:col-span-3">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-orange-500 truncate"
            >
              <option value="all">All Services</option>
              {serviceOptions.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="lg:col-span-1">
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('_');
                setSortBy(sb as any);
                setSortOrder(so as any);
              }}
              className="w-full px-2 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-orange-500"
            >
              <option value="createdAt_desc">Newest</option>
              <option value="createdAt_asc">Oldest</option>
              <option value="fullName_asc">Name A-Z</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2 flex-wrap">
              <span>Filtering active:</span>
              {selectedStatus !== 'all' && (
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[11px] border border-slate-700">
                  Status: {STATUS_CONFIG[selectedStatus as LeadStatus]?.label || selectedStatus}
                </span>
              )}
              {selectedService !== 'all' && (
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[11px] border border-slate-700 truncate max-w-xs">
                  Service: {selectedService}
                </span>
              )}
              {selectedDateRange !== 'all' && (
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[11px] border border-slate-700">
                  Date: {selectedDateRange}
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[11px] border border-slate-700">
                  Search: "{searchQuery}"
                </span>
              )}
            </div>

            <button
              onClick={handleClearFilters}
              className="text-orange-400 hover:text-orange-300 font-semibold cursor-pointer shrink-0"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* 4. Error Banner */}
      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadLeads(true)}
            className="px-3 py-1 rounded bg-rose-900/60 hover:bg-rose-900 text-white font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* 5. Leads Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-300">
            Enquiries List <span className="text-slate-500 font-normal">({leads.length} displayed)</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Click any row to open full enquiry details and admin notes
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
            <div className="text-xs font-medium">Loading enquiries from database...</div>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-500">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No enquiries yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">
              Consultation requests submitted through the LEGOMARK INDIA website will appear here.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
              >
                Clear Active Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Client Name</th>
                  <th className="py-3 px-4 font-semibold">Contact Info</th>
                  <th className="py-3 px-4 font-semibold">Service Requested</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Source</th>
                  <th className="py-3 px-4 font-semibold">Received</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leads.map((lead) => {
                  const statusInfo = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
                  const StatusIcon = statusInfo.icon;
                  const initials = lead.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => handleOpenLeadDetails(lead)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Name & Location */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-orange-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                              {lead.fullName}
                            </div>
                            {lead.city && (
                              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Building className="w-3 h-3 text-slate-500" />
                                <span>{lead.city}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-medium text-slate-200">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <a
                              href={`tel:${lead.phone}`}
                              className="hover:text-orange-400 hover:underline"
                            >
                              {lead.phone}
                            </a>
                            <button
                              onClick={() => handleCopy(lead.phone, `phone_${lead.id}`)}
                              className="p-1 text-slate-500 hover:text-slate-300 rounded"
                              title="Copy Phone"
                            >
                              {copiedField === `phone_${lead.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          {lead.email && (
                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <a
                                href={`mailto:${lead.email}`}
                                className="hover:text-orange-400 hover:underline truncate max-w-[180px]"
                              >
                                {lead.email}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Service Requested */}
                      <td className="py-3.5 px-4">
                        <div className="max-w-[220px]">
                          <span className="inline-block font-medium text-slate-200 text-xs truncate max-w-full">
                            {lead.serviceInterested}
                          </span>
                          {lead.message && (
                            <p className="text-[11px] text-slate-400 truncate max-w-full mt-0.5">
                              "{lead.message}"
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status Badge + Quick Selector */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                            className={`appearance-none text-[11px] font-bold px-2.5 py-1 pr-6 rounded-full border cursor-pointer focus:outline-hidden transition-all ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                          >
                            <option value="NEW" className="bg-slate-900 text-amber-400">
                              ● New
                            </option>
                            <option value="CONTACTED" className="bg-slate-900 text-sky-400">
                              ● Contacted
                            </option>
                            <option value="IN_PROGRESS" className="bg-slate-900 text-indigo-400">
                              ● In Progress
                            </option>
                            <option value="CONVERTED" className="bg-slate-900 text-emerald-400">
                              ● Converted
                            </option>
                            <option value="CLOSED" className="bg-slate-900 text-slate-400">
                              ● Closed
                            </option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
                            <span className="text-[9px]">▼</span>
                          </div>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                          {lead.source || 'Website Modal'}
                        </span>
                      </td>

                      {/* Received Time */}
                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="font-medium text-slate-200">{formatRelativeTime(lead.createdAt)}</div>
                        <div className="text-[10px] text-slate-500">{formatDate(lead.createdAt)}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenLeadDetails(lead)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setLeadToDelete(lead)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete Lead"
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

      {/* 6. Lead Detail Modal / Drawer */}
      {activeLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
          onClick={handleCloseLeadDetails}
        >
          <div
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      STATUS_CONFIG[activeLead.status]?.bg || 'bg-slate-800'
                    } ${STATUS_CONFIG[activeLead.status]?.text || 'text-slate-200'} ${
                      STATUS_CONFIG[activeLead.status]?.border || 'border-slate-700'
                    }`}
                  >
                    {STATUS_CONFIG[activeLead.status]?.label || activeLead.status}
                  </span>
                  <span className="text-xs text-slate-500">&bull;</span>
                  <span className="text-xs text-slate-400">ID: {activeLead.id.slice(0, 8)}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">{activeLead.fullName}</h2>
                <p className="text-xs text-slate-400">
                  Received on {formatDate(activeLead.createdAt)} ({formatRelativeTime(activeLead.createdAt)})
                </p>
              </div>

              <button
                onClick={handleCloseLeadDetails}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-300 flex-1">
              {/* Section 1: Contact Information */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-orange-400" />
                  <span>Contact Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">
                      Phone Number
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{activeLead.phone}</span>
                      <button
                        onClick={() => handleCopy(activeLead.phone, 'modal_phone')}
                        className="p-1 text-slate-400 hover:text-white rounded"
                        title="Copy Phone"
                      >
                        {copiedField === 'modal_phone' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={`tel:${activeLead.phone}`}
                        className="px-2 py-0.5 rounded bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-[10px] font-bold border border-orange-500/30"
                      >
                        Call Now
                      </a>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">
                      Email Address
                    </label>
                    {activeLead.email ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{activeLead.email}</span>
                        <button
                          onClick={() => handleCopy(activeLead.email!, 'modal_email')}
                          className="p-1 text-slate-400 hover:text-white rounded"
                          title="Copy Email"
                        >
                          {copiedField === 'modal_email' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={`mailto:${activeLead.email}`}
                          className="px-2 py-0.5 rounded bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 text-[10px] font-bold border border-sky-500/30"
                        >
                          Email
                        </a>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Not provided</span>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">
                      Location / Jurisdiction
                    </label>
                    <span className="text-xs font-semibold text-white">
                      {activeLead.city || 'Not specified (India)'}
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">
                      Submission Channel
                    </label>
                    <span className="text-xs font-semibold text-white">
                      {activeLead.source || 'Website Consultation Modal'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Enquiry Details */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                  <span>Enquiry Requirement</span>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                    Service of Interest
                  </label>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm font-bold text-orange-400">
                    {activeLead.serviceInterested}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                    Client Message / Requirement Details
                  </label>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 whitespace-pre-wrap leading-relaxed min-h-[60px]">
                    {activeLead.message ? activeLead.message : <span className="text-slate-500 italic">No additional note provided with request.</span>}
                  </div>
                </div>
              </div>

              {/* Section 3: Status & Workflow */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-orange-400" />
                    <span>Workflow Status</span>
                  </span>
                  <span className="text-[10px] font-normal text-slate-400">
                    {STATUS_CONFIG[activeLead.status]?.desc}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {(['NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'CLOSED'] as LeadStatus[]).map(
                    (st) => {
                      const cfg = STATUS_CONFIG[st];
                      const isSelected = activeLead.status === st;
                      return (
                        <button
                          key={st}
                          onClick={() => handleStatusChange(activeLead.id, st)}
                          className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                            isSelected
                              ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-orange-500 font-bold shadow-xs`
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          <div className="text-[11px] font-bold">{cfg.label}</div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Section 4: Internal Administrative Notes */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-orange-400" />
                    <span>Internal Staff / Advisory Notes</span>
                  </div>
                  {notesSaveSuccess && (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Saved
                    </span>
                  )}
                </div>

                <textarea
                  rows={3}
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Record callback outcomes, quotes discussed, fee quotes, or compliance checklist requirements..."
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-orange-500 leading-relaxed"
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[10px] text-slate-400">
                    {activeLead.updatedBy && <span>Last updated by: {activeLead.updatedBy}</span>}
                  </div>
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes || editingNotes === (activeLead.adminNotes || '')}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    {isSavingNotes ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    <span>Save Notes</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setLeadToDelete(activeLead);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-950 text-rose-400 border border-rose-800/50 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Enquiry</span>
              </button>

              <button
                onClick={handleCloseLeadDetails}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Dialog */}
      {leadToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
          onClick={() => setLeadToDelete(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-950/50 border border-rose-800/60 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">Confirm Lead Deletion</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Are you sure you want to permanently delete the enquiry from{' '}
                <strong className="text-white">{leadToDelete.fullName}</strong> ({leadToDelete.phone})?
                This action cannot be undone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setLeadToDelete(null)}
                disabled={isDeleting}
                className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLead}
                disabled={isDeleting}
                className="py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
