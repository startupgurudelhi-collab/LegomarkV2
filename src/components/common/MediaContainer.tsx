import React from 'react';
import { User, Building, Award, Shield, FileText } from 'lucide-react';
import { MediaAsset } from '../../types/website';

interface MediaContainerProps {
  asset?: MediaAsset;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide' | 'auto';
  className?: string;
  badge?: string;
  caption?: string;
  variant?: 'founder' | 'office' | 'certificate' | 'illustration' | 'service';
  children?: React.ReactNode;
}

export const MediaContainer: React.FC<MediaContainerProps> = ({
  aspectRatio = 'portrait',
  className = '',
  badge,
  caption,
  variant = 'founder',
  children,
}) => {
  const aspectClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[4/5]',
    wide: 'aspect-[16/9]',
    auto: '',
  }[aspectRatio];

  const getVariantIcon = () => {
    switch (variant) {
      case 'founder':
        return <User className="w-12 h-12 text-slate-400" />;
      case 'office':
        return <Building className="w-12 h-12 text-slate-400" />;
      case 'certificate':
        return <Award className="w-12 h-12 text-slate-400" />;
      case 'service':
        return <Shield className="w-12 h-12 text-slate-400" />;
      default:
        return <FileText className="w-12 h-12 text-slate-400" />;
    }
  };

  return (
    <div
      id="media-container"
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-xs ${aspectClass} ${className}`}
    >
      {/* Visual Placeholder Content or Passed Media */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 text-center">
        {children ? (
          children
        ) : (
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto shadow-xs">
              {getVariantIcon()}
            </div>
            {caption && (
              <p className="text-xs text-slate-500 max-w-xs">{caption}</p>
            )}
          </div>
        )}
      </div>

      {badge && (
        <div className="absolute top-3 left-3 z-20">
          <span className="px-2.5 py-1 rounded bg-white text-slate-800 text-[10px] font-bold border border-slate-200 shadow-xs">
            {badge}
          </span>
        </div>
      )}
    </div>
  );
};
