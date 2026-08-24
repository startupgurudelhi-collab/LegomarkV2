import React, { useState, useEffect, useMemo } from 'react';
import { AdminService, AdminCategory } from '../../types/adminService';
import { adminServiceApi } from '../../services/adminService.service';
import { ServiceCompletenessBadge } from './ServiceCompleteness';
import { ServiceEditorModal } from './ServiceEditorModal';
import { CategoryManagerModal } from './CategoryManagerModal';
import { ServicePreviewModal } from './ServicePreviewModal';
import { ServicePackagesModal } from './ServicePackagesModal';
import {
  Building2,
  Plus,
  Layers,
  Search,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
  Edit2,
  Eye,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Clock,
  Sparkles,
  IndianRupee,
  HelpCircle,
  FileText,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ChevronRight,
  Filter,
  Package,
} from 'lucide-react';

export const AdminServicesPage: React.FC = () => {
  const [services, setServices] = useState<AdminService[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortBy, setSortBy] = useState<'order' | 'title' | 'price'>('order');

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [previewService, setPreviewService] = useState<AdminService | null>(null);
  const [packagesService, setPackagesService] = useState<AdminService | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [svcRes, catRes] = await Promise.all([
        adminServiceApi.getAllServices(),
        adminServiceApi.getAllCategories(),
      ]);
      setServices(svcRes.services || []);
      setCategories(catRes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load services catalogue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered & Sorted Services
  const filteredServices = useMemo(() => {
    return services
      .filter((s) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = s.title.toLowerCase().includes(q);
          const matchesSlug = s.slug.toLowerCase().includes(q);
          const matchesDesc = s.shortDesc?.toLowerCase().includes(q);
          const matchesLabel = s.shortLabel?.toLowerCase().includes(q);
          if (!matchesTitle && !matchesSlug && !matchesDesc && !matchesLabel) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && s.categoryId !== selectedCategory) {
          return false;
        }

        // Status filter
        if (statusFilter === 'active' && !s.isActive) return false;
        if (statusFilter === 'inactive' && s.isActive) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'price') {
          return (Number(b.priceAmount) || 0) - (Number(a.priceAmount) || 0);
        }
        return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
      });
  }, [services, searchQuery, selectedCategory, statusFilter, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.isActive).length;
    const inactive = total - active;
    const totalCategories = categories.length;
    return { total, active, inactive, totalCategories };
  }, [services, categories]);

  // Handlers
  const handleCreateNew = () => {
    setEditingServiceId(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (service: AdminService) => {
    setEditingServiceId(service.id);
    setIsEditorOpen(true);
  };

  const handleToggleStatus = async (service: AdminService) => {
    try {
      const updated = await adminServiceApi.updateStatus(service.id, !service.isActive);
      setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, isActive: updated.isActive } : s)));
    } catch (err: any) {
      alert(err.message || 'Failed to update service status');
    }
  };

  const handleDuplicate = async (service: AdminService) => {
    try {
      setLoading(true);
      const fullDetails = await adminServiceApi.getServiceById(service.id);
      const newSlug = `${service.slug}-copy-${Math.floor(Math.random() * 1000)}`;
      const newId = `${service.id}-copy-${Math.floor(Math.random() * 1000)}`;

      const duplicated = await adminServiceApi.createService({
        ...fullDetails,
        id: newId,
        slug: newSlug,
        title: `${service.title} (Copy)`,
        displayOrder: services.length,
        isActive: false, // Start as draft/inactive
      });

      await loadData();
      // Open editor for the newly duplicated service
      setEditingServiceId(duplicated.id);
      setIsEditorOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate service');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredServices.length) return;

    const list = [...filteredServices];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    const reorderPayload = list.map((item, idx) => ({
      id: item.id,
      categoryId: item.categoryId,
      displayOrder: idx,
    }));

    // Optimistic update
    setServices((prev) => {
      const map = new Map(reorderPayload.map((r) => [r.id, r.displayOrder]));
      return prev
        .map((s) => (map.has(s.id) ? { ...s, displayOrder: map.get(s.id)! } : s))
        .sort((a, b) => a.displayOrder - b.displayOrder);
    });

    try {
      await adminServiceApi.reorderServices(reorderPayload);
    } catch (err: any) {
      alert(err.message || 'Failed to save reorder');
      await loadData();
    }
  };

  const handleDelete = async (service: AdminService) => {
    if (!window.confirm(`Are you sure you want to delete '${service.title}'? This will remove all associated process steps, FAQs, and highlights.`)) {
      return;
    }

    try {
      await adminServiceApi.deleteService(service.id);
      setServices((prev) => prev.filter((s) => s.id !== service.id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete service');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-orange-400" />
            Service Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage LEGOMARK INDIA's complete professional service catalogue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-bold transition flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-orange-400" />
            Practice Area Categories ({categories.length})
          </button>

          <button
            type="button"
            onClick={handleCreateNew}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
        </div>
      </div>

      {/* Top Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Services</div>
          <div className="text-2xl font-black text-slate-100 mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">In active database catalogue</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Active Services</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{stats.active}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Published & accessible to clients</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Draft / Inactive</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{stats.inactive}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Hidden from public navigation</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">Categories</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{stats.totalCategories}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Practice areas organized</div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
            selectedCategory === 'all'
              ? 'bg-orange-500 text-slate-950 border-orange-500 shadow-md shadow-orange-500/20'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          All Categories ({services.length})
        </button>

        {categories.map((cat) => {
          const count = services.filter((s) => s.categoryId === cat.id).length;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-orange-500 text-slate-950 border-orange-500 shadow-md shadow-orange-500/20'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>{cat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by service name, slug, description..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="order">Display Order</option>
            <option value="title">Title (A–Z)</option>
            <option value="price">Starting Price</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-orange-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'cards' ? 'bg-orange-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content View */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-xs font-bold transition"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
          <span className="text-xs">Loading complete service catalogue...</span>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-200">No Services Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all'
              ? 'No services match your active search and filter criteria.'
              : 'The service catalogue is currently empty.'}
          </p>
          <button
            type="button"
            onClick={handleCreateNew}
            className="mt-4 px-4 py-2 bg-orange-500 text-slate-950 rounded-xl text-xs font-bold"
          >
            Create First Service
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-12 text-center">Order</th>
                  <th className="py-3.5 px-4">Service & Practice Domain</th>
                  <th className="py-3.5 px-4">Commercial Terms</th>
                  <th className="py-3.5 px-4 text-center">Content Inclusions</th>
                  <th className="py-3.5 px-4">Completeness</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredServices.map((service, index) => (
                  <tr
                    key={service.id}
                    className={`transition hover:bg-slate-800/30 ${
                      !service.isActive ? 'opacity-60 bg-slate-950/20' : ''
                    }`}
                  >
                    {/* Reorder Buttons */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveOrder(index, 'up')}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-20 transition"
                          title="Move up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">
                          {service.displayOrder ?? index}
                        </span>
                        <button
                          type="button"
                          disabled={index === filteredServices.length - 1}
                          onClick={() => handleMoveOrder(index, 'down')}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-20 transition"
                          title="Move down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Service & Category */}
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 text-xs truncate max-w-xs">{service.title}</span>
                            {service.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                {service.badge}
                              </span>
                            )}
                            {service.popular && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="font-medium text-orange-400/90">{service.category?.name || 'General'}</span>
                            <span>•</span>
                            <span className="font-mono text-slate-500">/{service.slug}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Commercial Terms */}
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-bold text-orange-400 text-xs">{service.startingPrice}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{service.timeline}</span>
                        </div>
                      </div>
                    </td>

                    {/* Content Inclusions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                        <span title="Features & Highlights" className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                          <ShieldCheck className="w-3 h-3 text-orange-400" />
                          {(service.counts?.featureCount || service.features?.length || 0) + (service.counts?.highlightCount || service.highlights?.length || 0)}
                        </span>
                        <span title="Process Roadmap Steps" className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3 text-blue-400" />
                          {service.counts?.processStepCount || service.processSteps?.length || 0}
                        </span>
                        <span title="FAQs" className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                          <HelpCircle className="w-3 h-3 text-emerald-400" />
                          {service.counts?.faqCount || service.faqs?.length || 0}
                        </span>
                      </div>
                    </td>

                    {/* Completeness Score */}
                    <td className="py-3 px-4">
                      <ServiceCompletenessBadge service={service} compact />
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(service)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition border ${
                          service.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {service.isActive ? 'Active' : 'Draft'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewService(service)}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition"
                          title="Preview Public Page"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEdit(service)}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-orange-400 transition"
                          title="Edit Service"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setPackagesService(service)}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-orange-600/20 text-slate-300 hover:text-orange-400 transition"
                          title="Packages for this Service"
                        >
                          <Package className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(service)}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition"
                          title="Duplicate Service"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(service)}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition"
                          title="Delete Service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service, index) => (
            <div
              key={service.id}
              className={`p-5 rounded-2xl bg-slate-900/50 border transition flex flex-col justify-between ${
                service.isActive
                  ? 'border-slate-800 hover:border-slate-700'
                  : 'border-slate-800/60 opacity-60 bg-slate-950/20'
              }`}
            >
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    {service.category?.name || 'General'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(service)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                      service.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {service.isActive ? 'Active' : 'Draft'}
                  </button>
                </div>

                {/* Title & Description */}
                <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-1.5">
                  <span className="truncate">{service.title}</span>
                  {service.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 shrink-0">
                      {service.badge}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {service.shortDesc}
                </p>

                {/* Pricing & Timeline */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[10px] text-slate-500">Starting price</div>
                    <div className="text-sm font-black text-orange-400">{service.startingPrice}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">Timeline</div>
                    <div className="text-xs font-semibold text-slate-300">{service.timeline}</div>
                  </div>
                </div>

                {/* Completeness */}
                <div className="mb-4">
                  <ServiceCompletenessBadge service={service} compact />
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">/{service.slug}</span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewService(service)}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition"
                    title="Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(service)}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-orange-400 transition"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPackagesService(service)}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-orange-600/20 text-slate-300 hover:text-orange-400 transition"
                    title="Packages"
                  >
                    <Package className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(service)}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(service)}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <ServiceEditorModal
          isOpen={isEditorOpen}
          serviceId={editingServiceId}
          allServices={services}
          categories={categories}
          onClose={() => setIsEditorOpen(false)}
          onSaved={(saved) => {
            loadData();
          }}
        />
      )}

      {/* Categories Modal */}
      {isCategoryModalOpen && (
        <CategoryManagerModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onCategoriesChanged={() => {
            loadData();
          }}
        />
      )}

      {/* Preview Modal */}
      {previewService && (
        <ServicePreviewModal
          isOpen={!!previewService}
          service={previewService}
          onClose={() => setPreviewService(null)}
          onEdit={(s) => {
            handleEdit(s);
          }}
        />
      )}

      {/* Service Packages Modal */}
      {packagesService && (
        <ServicePackagesModal
          isOpen={!!packagesService}
          service={packagesService}
          onClose={() => setPackagesService(null)}
        />
      )}
    </div>
  );
};
