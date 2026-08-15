import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Video,
  File,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { uploadMediaFile } from '../../services/adminMedia.service';

interface MediaUploadDropzoneProps {
  currentValue?: string | null;
  onUploaded: (url: string) => void;
  onRemove?: () => void;
  category: 'founder' | 'office' | 'logos' | 'testimonials' | 'media';
  accept?: 'image' | 'video' | 'both';
  label?: string;
  helperText?: string;
  maxSizeMB?: number;
}

export const MediaUploadDropzone: React.FC<MediaUploadDropzoneProps> = ({
  currentValue,
  onUploaded,
  onRemove,
  category,
  accept = 'image',
  label = 'Upload File',
  helperText,
  maxSizeMB = 25,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes =
    accept === 'video'
      ? 'video/mp4,video/webm,video/quicktime'
      : accept === 'both'
      ? 'image/jpeg,image/png,image/webp,image/svg+xml,image/gif,video/mp4,video/webm,video/quicktime'
      : 'image/jpeg,image/png,image/webp,image/svg+xml,image/gif';

  const isVideo = (url?: string | null) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov');
  };

  const handleFile = async (file: File) => {
    setError(null);

    // Validation: Size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`);
      return;
    }

    // Validation: Type
    if (accept === 'image' && !file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WEBP, SVG, GIF).');
      return;
    }
    if (accept === 'video' && !file.type.startsWith('video/')) {
      setError('Please upload a video file (MP4, WEBM, MOV).');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      setUploadProgress(60);
      const res = await uploadMediaFile(file, category);
      setUploadProgress(100);
      onUploaded(res.url);
    } catch (err: any) {
      setError(err.message || 'File upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-300">{label}</label>
          {helperText && <span className="text-[11px] text-slate-500">{helperText}</span>}
        </div>
      )}

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* When media already exists */}
      {currentValue ? (
        <div className="bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-center gap-4">
          {/* Preview element */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
            {isVideo(currentValue) ? (
              <video
                src={currentValue}
                className="w-full h-full object-cover"
                controls
                playsInline
              />
            ) : (
              <img
                src={currentValue}
                alt="Uploaded media preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-1 text-center sm:text-left truncate space-y-1.5 w-full">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Media Loaded</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-sm">
              {currentValue}
            </div>

            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                {isUploading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-orange-400" />
                )}
                <span>Replace File</span>
              </button>

              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={isUploading}
                  className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium rounded-lg border border-rose-900/50 transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-150 ${
            isDragging
              ? 'border-orange-500 bg-orange-500/10'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/80'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-orange-400 shadow-xs">
            {isUploading ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : accept === 'video' ? (
              <Video className="w-6 h-6" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>

          <div className="text-xs font-bold text-slate-200 mb-1">
            {isUploading
              ? 'Uploading to secure media storage...'
              : 'Click to select or drag & drop file here'}
          </div>

          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            {accept === 'video'
              ? `Supports MP4, WEBM, MOV up to ${maxSizeMB}MB`
              : accept === 'both'
              ? `Supports Images (JPG, PNG, WEBP, SVG) and Videos up to ${maxSizeMB}MB`
              : `Supports PNG, JPG, WEBP, SVG up to ${maxSizeMB}MB`}
          </p>

          {isUploading && uploadProgress !== null && (
            <div className="mt-4 max-w-xs mx-auto bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-orange-500 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
