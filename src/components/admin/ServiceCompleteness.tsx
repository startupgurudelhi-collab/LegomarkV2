import React from 'react';
import { AdminService, ServiceCompletenessScore } from '../../types/adminService';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export function calculateServiceCompleteness(service: Partial<AdminService>): ServiceCompletenessScore {
  const missingItems: string[] = [];
  const passedItems: string[] = [];
  let score = 0;

  // 1. Basic Essentials (35 pts)
  if (service.title && service.title.trim().length > 0) {
    score += 10;
    passedItems.push('Title specified');
  } else {
    missingItems.push('Service Title');
  }

  if (service.slug && service.slug.trim().length > 0) {
    score += 5;
    passedItems.push('URL Slug');
  } else {
    missingItems.push('URL Slug');
  }

  if (service.categoryId && service.categoryId.trim().length > 0) {
    score += 5;
    passedItems.push('Category assigned');
  } else {
    missingItems.push('Category');
  }

  if (service.shortDesc && service.shortDesc.trim().length >= 10) {
    score += 15;
    passedItems.push('Short Description');
  } else {
    missingItems.push('Short Description (10+ chars)');
  }

  // 2. Commercial Terms (15 pts)
  if (service.startingPrice && service.startingPrice.trim().length > 0) {
    score += 10;
    passedItems.push('Starting Price');
  } else {
    missingItems.push('Starting Price');
  }

  if (service.timeline && service.timeline.trim().length > 0) {
    score += 5;
    passedItems.push('Estimated Timeline');
  } else {
    missingItems.push('Delivery Timeline');
  }

  // 3. Narrative & Overview (15 pts)
  if (service.headline && service.headline.trim().length > 0) {
    score += 5;
    passedItems.push('Landing Page Headline');
  } else {
    missingItems.push('Landing Page Headline');
  }

  if (service.overview && service.overview.trim().length > 0) {
    score += 10;
    passedItems.push('Detailed Overview Narrative');
  } else {
    missingItems.push('Overview Narrative');
  }

  // 4. Inclusions & Process (25 pts)
  const featCount = (service.features?.length || 0) + (service.counts?.featureCount || 0) + (service.highlights?.length || 0) + (service.counts?.highlightCount || 0);
  if (featCount >= 2) {
    score += 10;
    passedItems.push('Inclusions / Highlights (2+)');
  } else {
    missingItems.push('At least 2 Key Features/Highlights');
  }

  const procCount = (service.processSteps?.length || 0) + (service.counts?.processStepCount || 0);
  if (procCount >= 2) {
    score += 5;
    passedItems.push('Process Roadmap Steps (2+)');
  } else {
    missingItems.push('Process Steps (at least 2)');
  }

  const docCount = (service.documents?.length || 0) + (service.counts?.documentCount || 0);
  if (docCount >= 1) {
    score += 5;
    passedItems.push('Client Document Checklist');
  } else {
    missingItems.push('Required Documents Checklist');
  }

  const faqCount = (service.faqs?.length || 0) + (service.counts?.faqCount || 0);
  if (faqCount >= 2) {
    score += 5;
    passedItems.push('FAQs (2+)');
  } else {
    missingItems.push('At least 2 FAQs');
  }

  // 5. SEO & Discoverability (10 pts)
  const hasSeoTitle = service.seoTitle && service.seoTitle.trim().length > 0;
  const hasMetaDesc = service.metaDescription && service.metaDescription.trim().length > 0;
  if (hasSeoTitle && hasMetaDesc) {
    score += 10;
    passedItems.push('SEO Title & Meta Description');
  } else if (hasSeoTitle || hasMetaDesc) {
    score += 5;
    missingItems.push(hasSeoTitle ? 'SEO Meta Description' : 'SEO Title');
  } else {
    missingItems.push('SEO Title & Meta Description');
  }

  // Normalize score between 0 and 100
  const percentage = Math.min(100, Math.max(0, score));

  let status: 'complete' | 'good' | 'incomplete' | 'draft' = 'draft';
  if (percentage >= 90) status = 'complete';
  else if (percentage >= 70) status = 'good';
  else if (percentage >= 40) status = 'incomplete';

  return {
    percentage,
    missingItems,
    passedItems,
    status,
  };
}

interface ServiceCompletenessBadgeProps {
  service: Partial<AdminService>;
  compact?: boolean;
  showMissingTooltip?: boolean;
}

export const ServiceCompletenessBadge: React.FC<ServiceCompletenessBadgeProps> = ({
  service,
  compact = false,
  showMissingTooltip = true,
}) => {
  const result = calculateServiceCompleteness(service);

  const getStatusColor = (pct: number) => {
    if (pct >= 90) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', bar: 'bg-emerald-500' };
    if (pct >= 70) return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', bar: 'bg-blue-500' };
    if (pct >= 50) return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', bar: 'bg-amber-500' };
    return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', bar: 'bg-rose-500' };
  };

  const colors = getStatusColor(result.percentage);

  if (compact) {
    return (
      <div className="flex items-center gap-2 group relative">
        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-300 ${colors.bar}`}
            style={{ width: `${result.percentage}%` }}
          />
        </div>
        <span className={`text-xs font-semibold ${colors.text}`}>{result.percentage}%</span>

        {showMissingTooltip && result.missingItems.length > 0 && (
          <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full left-0 mb-2 z-30 w-56 p-2.5 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-left transition-opacity duration-150">
            <div className="text-[11px] font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Missing Content ({result.missingItems.length}):
            </div>
            <ul className="text-[10px] text-slate-400 space-y-0.5 list-disc list-inside">
              {result.missingItems.slice(0, 4).map((item, idx) => (
                <li key={idx} className="truncate">{item}</li>
              ))}
              {result.missingItems.length > 4 && (
                <li className="text-slate-500 font-medium">+{result.missingItems.length - 4} more items</li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-xl border ${colors.bg} ${colors.border}`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          {result.percentage >= 90 ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-xs font-semibold text-slate-200">Catalogue Completeness</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
          {result.percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700 mb-2">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colors.bar}`}
          style={{ width: `${result.percentage}%` }}
        />
      </div>

      {result.missingItems.length > 0 ? (
        <div className="text-[11px] text-slate-400 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-300">To reach 100%:</strong> Add{' '}
            {result.missingItems.slice(0, 3).join(', ')}
            {result.missingItems.length > 3 ? ` +${result.missingItems.length - 3} more` : ''}
          </span>
        </div>
      ) : (
        <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Complete catalogue profile ready for public presentation</span>
        </div>
      )}
    </div>
  );
};
