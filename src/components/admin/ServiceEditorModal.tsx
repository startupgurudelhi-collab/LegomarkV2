import React, { useState, useEffect, useMemo } from 'react';
import {
  AdminService,
  AdminCategory,
  ServiceHighlightItem,
  ServiceProcessStepItem,
  ServiceFaqItem,
} from '../../types/adminService';
import { adminServiceApi } from '../../services/adminService.service';
import { ServiceCompletenessBadge, calculateServiceCompleteness } from './ServiceCompleteness';
import {
  X,
  Save,
  Loader2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Building2,
  ShieldCheck,
  FileText,
  Landmark,
  Scale,
  Briefcase,
  Award,
  Globe,
  DollarSign,
  TrendingUp,
  Clock,
  HelpCircle,
  Search,
  Sparkles,
  Layers,
  CheckCircle2,
  Tag,
  Key,
  Flame,
  Check,
  AlertCircle,
} from 'lucide-react';

interface ServiceEditorModalProps {
  isOpen: boolean;
  serviceId: string | null; // null if creating new
  allServices: AdminService[];
  categories: AdminCategory[];
  onClose: () => void;
  onSaved: (savedService: AdminService) => void;
}

type EditorTab =
  | 'general'
  | 'pricing'
  | 'content'
  | 'requirements'
  | 'process'
  | 'faq'
  | 'related'
  | 'seo';

const ICON_OPTIONS = [
  { name: 'Building2', label: 'Company / Corporate' },
  { name: 'ShieldCheck', label: 'Trademark / Compliance' },
  { name: 'FileText', label: 'Documentation / Filings' },
  { name: 'Landmark', label: 'Statutory / Legal' },
  { name: 'Scale', label: 'Law & Governance' },
  { name: 'Briefcase', label: 'Business Operations' },
  { name: 'Award', label: 'IP & Certification' },
  { name: 'Globe', label: 'FDI & Global Entry' },
  { name: 'DollarSign', label: 'Tax & Valuation' },
  { name: 'TrendingUp', label: 'Growth & Restructuring' },
  { name: 'Layers', label: 'Multi-jurisdiction' },
  { name: 'Clock', label: 'Fast-Track / Retainer' },
  { name: 'CheckCircle2', label: 'Verification' },
  { name: 'Sparkles', label: 'Specialized' },
  { name: 'Key', label: 'Licenses & Approvals' },
  { name: 'Flame', label: 'High Demand' },
];

export const ServiceEditorModal: React.FC<ServiceEditorModalProps> = ({
  isOpen,
  serviceId,
  allServices,
  categories,
  onClose,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<AdminService>>({
    id: '',
    slug: '',
    categoryId: categories[0]?.id || 'company-registration',
    title: '',
    shortLabel: '',
    shortDesc: '',
    fullDesc: '',
    startingPrice: '₹4,999',
    priceAmount: 4999,
    currency: 'INR',
    pricingType: 'fixed',
    priceDisplayOverride: '',
    governmentFeeNote: '',
    timeline: '7–10 Business Days',
    popular: false,
    badge: '',
    iconName: 'Building2',
    displayOrder: 0,
    isActive: true,
    headline: '',
    overview: '',
    aliases: [],
    seoTitle: '',
    metaDescription: '',
    features: [],
    highlights: [],
    benefits: [],
    deliverables: [],
    documents: [],
    processSteps: [],
    faqs: [],
    relatedServiceIds: [],
  });

  // Load service data if editing
  useEffect(() => {
    if (!isOpen) return;

    if (serviceId) {
      setLoading(true);
      setError(null);
      adminServiceApi
        .getServiceById(serviceId)
        .then((data) => {
          setFormData({
            ...data,
            features: data.features || [],
            highlights: data.highlights || [],
            benefits: data.benefits || [],
            deliverables: data.deliverables || [],
            documents: data.documents || [],
            processSteps: data.processSteps || [],
            faqs: data.faqs || [],
            relatedServiceIds: data.relatedServiceIds || [],
          });
          setIsDirty(false);
        })
        .catch((err: any) => {
          setError(err.message || 'Failed to load service');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // New service default initialization
      setFormData({
        id: '',
        slug: '',
        categoryId: categories[0]?.id || 'company-registration',
        title: '',
        shortLabel: '',
        shortDesc: '',
        fullDesc: '',
        startingPrice: '₹4,999',
        priceAmount: 4999,
        currency: 'INR',
        pricingType: 'fixed',
        priceDisplayOverride: '',
        governmentFeeNote: '',
        timeline: '7–10 Business Days',
        popular: false,
        badge: '',
        iconName: 'Building2',
        displayOrder: allServices.length,
        isActive: true,
        headline: '',
        overview: '',
        aliases: [],
        seoTitle: '',
        metaDescription: '',
        features: ['Dedicated Legal Specialist', 'Fast turnaround time', 'End-to-end documentation support'],
        highlights: [
          { title: 'Full MCA Compliance', description: 'End-to-end statutory compliance with zero rejection guarantee.', iconName: 'ShieldCheck', displayOrder: 0 },
          { title: 'Digital Processing', description: '100% online workflow without physical visit required.', iconName: 'Building2', displayOrder: 1 },
        ],
        benefits: ['Complete statutory protection', 'Accelerated government approvals', 'Lifetime legal advisory support'],
        deliverables: ['Digital Certificate / Registration Copy', 'Statutory Identification / Registration Numbers', 'Complete Master Document Dossier'],
        documents: ['PAN Card of all applicants', 'Aadhaar / Passport / Voter ID', 'Address Proof (Bank statement or utility bill)'],
        processSteps: [
          { stepNumber: '01', title: 'Consultation & Document Collection', description: 'Initial legal assessment and digital verification of KYC records.', displayOrder: 0 },
          { stepNumber: '02', title: 'Preparation & Filing', description: 'Drafting statutory forms and submitting with respective regulatory portals.', displayOrder: 1 },
          { stepNumber: '03', title: 'Approval & Issuance', description: 'Government scrutiny approval and certificate issuance.', displayOrder: 2 },
        ],
        faqs: [
          { question: 'What is the standard turnaround time?', answer: 'The typical processing timeline is 7–10 business days subject to regulatory approvals.', displayOrder: 0, isActive: true },
          { question: 'Are government fees included in the starting price?', answer: 'The starting price covers professional consultation and drafting. Official government statutory duties are specified separately.', displayOrder: 1, isActive: true },
        ],
        relatedServiceIds: [],
      });
      setIsDirty(false);
    }
  }, [isOpen, serviceId, categories, allServices.length]);

  const updateField = <K extends keyof AdminService>(field: K, value: AdminService[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleTitleChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: !serviceId && (!prev.slug || prev.slug === '') ? slug : prev.slug,
      id: !serviceId && (!prev.id || prev.id === '') ? slug : prev.id,
      seoTitle: !prev.seoTitle || prev.seoTitle === '' ? `${val} | LEGOMARK INDIA` : prev.seoTitle,
    }));
    setIsDirty(true);
  };

  const handleCloseSafe = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      setError('Service Title is required');
      setActiveTab('general');
      return;
    }

    if (!formData.categoryId) {
      setError('Category is required');
      setActiveTab('general');
      return;
    }

    if (!formData.shortDesc?.trim()) {
      setError('Short Description is required');
      setActiveTab('general');
      return;
    }

    if (!formData.startingPrice?.trim()) {
      setError('Starting Price is required');
      setActiveTab('pricing');
      return;
    }

    if (!formData.timeline?.trim()) {
      setError('Timeline is required');
      setActiveTab('pricing');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      let saved: AdminService;

      if (!serviceId) {
        // Creating new service
        const serviceIdToUse = (formData.id?.trim() || formData.slug?.trim() || formData.title!.trim().toLowerCase().replace(/\s+/g, '-')).replace(/[^a-z0-9-]/g, '');
        const slugToUse = (formData.slug?.trim() || serviceIdToUse).toLowerCase().replace(/[^a-z0-9-]/g, '');

        saved = await adminServiceApi.createService({
          ...formData,
          id: serviceIdToUse,
          slug: slugToUse,
        });
      } else {
        // Updating existing service
        saved = await adminServiceApi.updateService(serviceId, formData);
      }

      setIsDirty(false);
      onSaved(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  // Completeness score
  const completeness = useMemo(() => calculateServiceCompleteness(formData), [formData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0B132B] border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 truncate max-w-md">
                  {serviceId ? `Edit: ${formData.title || 'Service'}` : 'Create New Professional Service'}
                </h3>
                {isDirty && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Unsaved changes
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Configure comprehensive commercial terms, requirements, and catalogue content</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ServiceCompletenessBadge service={formData} compact />
            <button
              type="button"
              onClick={handleCloseSafe}
              className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-2 bg-slate-900/50 border-b border-slate-800 flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: 'general', label: '1. General' },
            { id: 'pricing', label: '2. Pricing & Terms' },
            { id: 'content', label: '3. Landing Content' },
            { id: 'requirements', label: '4. Documents' },
            { id: 'process', label: '5. Process Steps' },
            { id: 'faq', label: '6. FAQs' },
            { id: 'related', label: '7. Related' },
            { id: 'seo', label: '8. SEO' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as EditorTab)}
              className={`px-3.5 py-2.5 text-xs font-bold rounded-t-lg transition border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-orange-400 border-orange-500 bg-slate-800/60'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
              <span className="text-xs">Loading complete service schema...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: GENERAL */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Service Title <span className="text-orange-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title || ''}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="e.g. Private Limited Company Registration"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Practice Area Category <span className="text-orange-400">*</span>
                      </label>
                      <select
                        value={formData.categoryId || ''}
                        onChange={(e) => updateField('categoryId', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({cat.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        URL Slug <span className="text-orange-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.slug || ''}
                        onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="e.g. private-limited-company-registration"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Short Menu Label <span className="text-slate-400 font-normal">(for headers & mobile drawer)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.shortLabel || ''}
                        onChange={(e) => updateField('shortLabel', e.target.value)}
                        placeholder="e.g. Pvt Ltd Registration"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Short Description <span className="text-orange-400">*</span>{' '}
                      <span className="text-slate-400 font-normal">(Used on catalogue cards & summary views)</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      maxLength={1000}
                      value={formData.shortDesc || ''}
                      onChange={(e) => updateField('shortDesc', e.target.value)}
                      placeholder="e.g. Complete incorporation package with DIN, DSC, PAN, TAN, MOA, and AOA drafting for Indian startups."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Icon Selector Grid */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Visual Lucide Icon
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl">
                      {ICON_OPTIONS.map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => updateField('iconName', item.name)}
                          className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                            formData.iconName === item.name
                              ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <Building2 className="w-4 h-4 shrink-0 text-orange-400" />
                          <div className="truncate text-xs font-medium">{item.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status & Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Marketing Badge / Chip
                      </label>
                      <input
                        type="text"
                        value={formData.badge || ''}
                        onChange={(e) => updateField('badge', e.target.value)}
                        placeholder="e.g. Most Popular, Fast-Track"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Catalogue Display Order
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.displayOrder ?? 0}
                        onChange={(e) => updateField('displayOrder', parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="flex flex-col justify-center gap-2 pt-4">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive ?? true}
                          onChange={(e) => updateField('isActive', e.target.checked)}
                          className="w-4 h-4 rounded text-orange-500 bg-slate-950 border-slate-700 focus:ring-orange-500"
                        />
                        <span>Active in Public Catalogue</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-medium text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.popular ?? false}
                          onChange={(e) => updateField('popular', e.target.checked)}
                          className="w-4 h-4 rounded text-orange-500 bg-slate-950 border-slate-700 focus:ring-orange-500"
                        />
                        <span>Featured / Popular Service</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PRICING & TERMS */}
              {activeTab === 'pricing' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Starting Price Display <span className="text-orange-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.startingPrice || ''}
                        onChange={(e) => updateField('startingPrice', e.target.value)}
                        placeholder="e.g. ₹6,999"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-bold text-orange-400 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Pricing Model
                      </label>
                      <select
                        value={formData.pricingType || 'fixed'}
                        onChange={(e) => updateField('pricingType', e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500 capitalize"
                      >
                        <option value="fixed">Fixed Rate</option>
                        <option value="recurring">Recurring / Retainer</option>
                        <option value="custom">Custom Quotation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Estimated Turnaround Timeline <span className="text-orange-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.timeline || ''}
                        onChange={(e) => updateField('timeline', e.target.value)}
                        placeholder="e.g. 7–10 Business Days"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Price Display Override <span className="text-slate-400 font-normal">(Optional custom label)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.priceDisplayOverride || ''}
                        onChange={(e) => updateField('priceDisplayOverride', e.target.value)}
                        placeholder="e.g. ₹6,999 + MCA Stamp Duty"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Government / Statutory Fee Note
                      </label>
                      <input
                        type="text"
                        value={formData.governmentFeeNote || ''}
                        onChange={(e) => updateField('governmentFeeNote', e.target.value)}
                        placeholder="e.g. Excludes state stamp duty and official MCA filing challans"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LANDING PAGE CONTENT */}
              {activeTab === 'content' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Landing Page Headline
                    </label>
                    <input
                      type="text"
                      value={formData.headline || ''}
                      onChange={(e) => updateField('headline', e.target.value)}
                      placeholder="e.g. Seamless MCA-Compliant Company Incorporation in India"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Detailed Strategic Overview (Narrative)
                    </label>
                    <textarea
                      rows={4}
                      value={formData.overview || ''}
                      onChange={(e) => updateField('overview', e.target.value)}
                      placeholder="Detailed narrative describing the significance, legal structure, and advantages of this service..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500 leading-relaxed"
                    />
                  </div>

                  {/* Highlights Builder */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        Key Value Highlights ({formData.highlights?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const list = formData.highlights || [];
                          updateField('highlights', [
                            ...list,
                            { title: 'New Highlight', description: 'Highlight description here', iconName: 'ShieldCheck', displayOrder: list.length },
                          ]);
                        }}
                        className="px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Highlight
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(formData.highlights || []).map((hl, idx) => (
                        <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-start gap-3">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={hl.title}
                              onChange={(e) => {
                                const list = [...(formData.highlights || [])];
                                list[idx] = { ...list[idx], title: e.target.value };
                                updateField('highlights', list);
                              }}
                              placeholder="Highlight Title"
                              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:border-orange-500"
                            />
                            <input
                              type="text"
                              value={hl.description}
                              onChange={(e) => {
                                const list = [...(formData.highlights || [])];
                                list[idx] = { ...list[idx], description: e.target.value };
                                updateField('highlights', list);
                              }}
                              placeholder="Highlight Description"
                              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:border-orange-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const list = (formData.highlights || []).filter((_, i) => i !== idx);
                              updateField('highlights', list);
                            }}
                            className="p-1.5 rounded hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Features Bullets */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        Summary Features / Quick Bullets ({formData.features?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const list = formData.features || [];
                          updateField('features', [...list, 'New inclusion item']);
                        }}
                        className="px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Bullet
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {(formData.features || []).map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={feat}
                            onChange={(e) => {
                              const list = [...(formData.features || [])];
                              list[idx] = e.target.value;
                              updateField('features', list);
                            }}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:border-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const list = (formData.features || []).filter((_, i) => i !== idx);
                              updateField('features', list);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        Tangible Deliverables ({formData.deliverables?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const list = formData.deliverables || [];
                          updateField('deliverables', [...list, 'Official Registration Dossier']);
                        }}
                        className="px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Deliverable
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {(formData.deliverables || []).map((deliv, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={deliv}
                            onChange={(e) => {
                              const list = [...(formData.deliverables || [])];
                              list[idx] = e.target.value;
                              updateField('deliverables', list);
                            }}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:border-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const list = (formData.deliverables || []).filter((_, i) => i !== idx);
                              updateField('deliverables', list);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CLIENT REQUIREMENTS */}
              {activeTab === 'requirements' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-200">
                          Required Client Documents Checklist ({formData.documents?.length || 0})
                        </span>
                        <p className="text-[11px] text-slate-400">List all identification, premises proofs, and authorizations required from the client.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const list = formData.documents || [];
                          updateField('documents', [...list, 'PAN Card / ID Proof']);
                        }}
                        className="px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-xs font-semibold flex items-center gap-1 transition shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Document Item
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(formData.documents || []).map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 w-5">{idx + 1}.</span>
                          <input
                            type="text"
                            value={doc}
                            onChange={(e) => {
                              const list = [...(formData.documents || [])];
                              list[idx] = e.target.value;
                              updateField('documents', list);
                            }}
                            placeholder="e.g. Electricity Bill or Rent Agreement with NOC"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:border-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const list = (formData.documents || []).filter((_, i) => i !== idx);
                              updateField('documents', list);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PROCESS */}
              {activeTab === 'process' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-200">
                          Step-by-Step Execution Roadmap ({formData.processSteps?.length || 0})
                        </span>
                        <p className="text-[11px] text-slate-400">Define the sequential stages from client onboarding to regulatory delivery.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const list = formData.processSteps || [];
                          updateField('processSteps', [
                            ...list,
                            {
                              stepNumber: `0${list.length + 1}`,
                              title: `Stage ${list.length + 1}`,
                              description: 'Stage description',
                              displayOrder: list.length,
                            },
                          ]);
                        }}
                        className="px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-xs font-semibold flex items-center gap-1 transition shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Process Step
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(formData.processSteps || []).map((step, idx) => (
                        <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={step.stepNumber || `0${idx + 1}`}
                                onChange={(e) => {
                                  const list = [...(formData.processSteps || [])];
                                  list[idx] = { ...list[idx], stepNumber: e.target.value };
                                  updateField('processSteps', list);
                                }}
                                className="w-12 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-center font-bold text-orange-400"
                              />
                              <input
                                type="text"
                                value={step.title}
                                onChange={(e) => {
                                  const list = [...(formData.processSteps || [])];
                                  list[idx] = { ...list[idx], title: e.target.value };
                                  updateField('processSteps', list);
                                }}
                                placeholder="Step Title"
                                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs font-semibold text-slate-100 focus:border-orange-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const list = (formData.processSteps || []).filter((_, i) => i !== idx);
                                updateField('processSteps', list);
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={step.description}
                            onChange={(e) => {
                              const list = [...(formData.processSteps || [])];
                              list[idx] = { ...list[idx], description: e.target.value };
                              updateField('processSteps', list);
                            }}
                            placeholder="Detailed description of activities in this step"
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-300 focus:border-orange-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: FAQ */}
              {activeTab === 'faq' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-200">
                          Frequently Asked Questions ({formData.faqs?.length || 0})
                        </span>
                        <p className="text-[11px] text-slate-400">Address common client questions regarding eligibility, timelines, and statutory fees.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const list = formData.faqs || [];
                          updateField('faqs', [
                            ...list,
                            { question: 'New Question?', answer: 'Detailed answer text.', displayOrder: list.length, isActive: true },
                          ]);
                        }}
                        className="px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-xs font-semibold flex items-center gap-1 transition shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add FAQ
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(formData.faqs || []).map((faq, idx) => (
                        <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={faq.question}
                              onChange={(e) => {
                                const list = [...(formData.faqs || [])];
                                list[idx] = { ...list[idx], question: e.target.value };
                                updateField('faqs', list);
                              }}
                              placeholder="Question text"
                              className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs font-semibold text-slate-100 focus:border-orange-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const list = (formData.faqs || []).filter((_, i) => i !== idx);
                                updateField('faqs', list);
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={faq.answer}
                            onChange={(e) => {
                              const list = [...(formData.faqs || [])];
                              list[idx] = { ...list[idx], answer: e.target.value };
                              updateField('faqs', list);
                            }}
                            placeholder="Answer text"
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-300 focus:border-orange-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: RELATED SERVICES */}
              {activeTab === 'related' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-slate-200">
                      Cross-Sell / Related Catalogue Recommendations
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Select associated services from LEGOMARK INDIA catalogue to display as recommended additions.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-2 bg-slate-900 border border-slate-800 rounded-lg">
                      {allServices
                        .filter((s) => s.id !== formData.id && s.id !== serviceId)
                        .map((other) => {
                          const isSelected = (formData.relatedServiceIds || []).includes(other.id);
                          return (
                            <button
                              key={other.id}
                              type="button"
                              onClick={() => {
                                const current = formData.relatedServiceIds || [];
                                if (isSelected) {
                                  updateField('relatedServiceIds', current.filter((id) => id !== other.id));
                                } else {
                                  updateField('relatedServiceIds', [...current, other.id]);
                                }
                              }}
                              className={`p-2.5 rounded-lg border text-left flex items-center justify-between gap-2 transition ${
                                isSelected
                                  ? 'bg-orange-500/20 border-orange-500/60 text-slate-100'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-bold truncate">{other.title}</div>
                                <div className="text-[10px] text-slate-500 truncate">{other.category?.name} • {other.startingPrice}</div>
                              </div>
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center text-xs shrink-0 ${
                                  isSelected ? 'bg-orange-500 text-slate-950 font-bold' : 'border border-slate-700'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: SEO */}
              {activeTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        SEO Meta Title
                      </label>
                      <span className="text-[10px] text-slate-500">
                        {(formData.seoTitle || '').length} / 60 recommended
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={255}
                      value={formData.seoTitle || ''}
                      onChange={(e) => updateField('seoTitle', e.target.value)}
                      placeholder="e.g. Private Limited Company Registration Online | LEGOMARK INDIA"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Meta Description
                      </label>
                      <span className="text-[10px] text-slate-500">
                        {(formData.metaDescription || '').length} / 160 recommended
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={formData.metaDescription || ''}
                      onChange={(e) => updateField('metaDescription', e.target.value)}
                      placeholder="e.g. Register your Private Limited Company in India with end-to-end legal support, DIN, DSC, PAN, and certificate issuance."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Live Google Search Preview */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Search Engine Result Snippet Preview
                    </span>
                    <div className="text-blue-400 text-sm font-semibold hover:underline cursor-pointer truncate">
                      {formData.seoTitle || `${formData.title || 'Service Title'} | LEGOMARK INDIA`}
                    </div>
                    <div className="text-emerald-500 text-[11px]">
                      https://legomark.in/services/{formData.slug || 'service-slug'}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                      {formData.metaDescription || formData.shortDesc || 'Comprehensive professional legal services provided by LEGOMARK INDIA.'}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer Save / Cancel Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleCloseSafe}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || loading}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {serviceId ? 'Save Changes' : 'Publish Service to Catalogue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
