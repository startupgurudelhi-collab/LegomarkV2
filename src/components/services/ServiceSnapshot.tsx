import React from 'react';
import {
  ShieldCheck,
  FileCheck2,
  CheckCircle2,
  Sparkles,
  Zap,
  Lock,
  Scale,
  Building2,
  Award,
  Users,
  Briefcase,
  Layers,
  FileText,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { ServiceItem } from '../../types/website';

interface ServiceSnapshotProps {
  service: ServiceItem;
  className?: string;
}

// Icon resolver helper for dynamic highlight cards
function renderHighlightIcon(iconName?: string, className = 'w-4 h-4 text-emerald-600') {
  switch (iconName) {
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'FileCheck2':
      return <FileCheck2 className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Lock':
      return <Lock className={className} />;
    case 'Scale':
      return <Scale className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'Award':
      return <Award className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'FileText':
      return <FileText className={className} />;
    case 'Clock':
      return <Clock className={className} />;
    default:
      return <ShieldCheck className={className} />;
  }
}

export const ServiceSnapshot: React.FC<ServiceSnapshotProps> = ({ service, className = '' }) => {
  // Service-specific highlights from database CMS or standard canonical fallbacks
  const customHighlights = service.landingPage?.highlights;
  const hasCustomHighlights = customHighlights && customHighlights.length > 0;

  // Maximum 4 highlights
  const highlights = hasCustomHighlights
    ? customHighlights.slice(0, 4)
    : [
        {
          title: 'CA / CS & Legal Scrutiny',
          description: 'Processed by practicing corporate professionals',
          iconName: 'ShieldCheck',
        },
        {
          title: 'Official Portal Filing',
          description: 'Direct MCA / GST / IP India gateway submission',
          iconName: 'FileCheck2',
        },
      ];

  // Service-specific canonical features list
  const inclusions = service.features && service.features.length > 0
    ? service.features
    : [
        'Dedicated Legal Expert Assignment',
        'Government Application Filing & Follow-up',
        'Charter & Document Drafting Assistance',
        'Official Registration Certificate Issuance',
      ];

  return (
    <div
      id="service-snapshot-section"
      className={`p-4 sm:p-5 rounded-xl bg-slate-50/90 border border-slate-200 shadow-xs space-y-4 ${className}`}
    >
      {/* Section Header */}
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0B132B] border-b border-slate-200/70 pb-2.5">
        <Sparkles className="w-3.5 h-3.5 text-orange-600" />
        <span>Service Snapshot & Core Inclusions</span>
      </div>

      {/* 1. Highlight Cards (Max 4, compact layout) */}
      <div
        className={`grid gap-2.5 ${
          highlights.length === 1
            ? 'grid-cols-1'
            : highlights.length === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : highlights.length === 3
            ? 'grid-cols-1 sm:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {highlights.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-lg bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors"
          >
            <div className="mt-0.5 shrink-0 p-1 rounded-md bg-emerald-50 text-emerald-700">
              {renderHighlightIcon(item.iconName, 'w-3.5 h-3.5')}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 leading-tight truncate">
                {item.title}
              </div>
              {item.description && (
                <div className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                  {item.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 2. What's Included (Service Inclusions Checklist) */}
      <div className="space-y-2 pt-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
          What is Covered Under This Service
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
          {inclusions.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. Optional Service Fee Note / Disclaimer */}
      {service.governmentFeeNote && (
        <p className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-200/70">
          * {service.governmentFeeNote}
        </p>
      )}
    </div>
  );
};
