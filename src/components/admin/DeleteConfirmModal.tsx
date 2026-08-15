import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { AdminPackage } from '../../types/admin';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  packageItem: AdminPackage | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  packageItem,
  isDeleting,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !packageItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Warning Content */}
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Delete &ldquo;{packageItem.name}&rdquo;?
            </h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              This permanently removes the package and its package-specific feature list from the database. Shared comparison matrix rows will be preserved.
            </p>
            <div className="mt-3 p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-400">
              <div><span className="text-slate-500">Package ID:</span> <code className="text-orange-400 font-mono">{packageItem.id}</code></div>
              <div><span className="text-slate-500">Features count:</span> {packageItem.features?.length || 0} features</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg text-white bg-rose-600 hover:bg-rose-500 focus:outline-hidden focus:ring-2 focus:ring-rose-500 disabled:opacity-50 transition-colors"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Package</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
