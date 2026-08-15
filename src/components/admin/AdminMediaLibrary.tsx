import React, { useState, useEffect, useRef } from 'react';
import {
  FolderOpen,
  Image as ImageIcon,
  Video,
  FileText,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle2,
  Upload,
  Calendar,
  Layers,
} from 'lucide-react';
import { fetchMediaAssets, deleteMediaAsset, uploadMediaFile, MediaAsset } from '../../services/adminMedia.service';
import { MediaUploadDropzone } from './MediaUploadDropzone';

export const AdminMediaLibrary: React.FC = () => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<MediaAsset | null>(null);
  const [replacingAsset, setReplacingAsset] = useState<MediaAsset | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const loadAssets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMediaAssets();
      setAssets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve media library.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleDelete = async (asset: MediaAsset) => {
    if (!window.confirm(`Delete "${asset.name}" permanently from storage?`)) return;
    try {
      await deleteMediaAsset(asset.url);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      setToastMessage('Media asset deleted.');
      setTimeout(() => setToastMessage(null), 3000);
      if (selectedPreview?.id === asset.id) setSelectedPreview(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete asset');
    }
  };

  const handleTriggerReplace = (asset: MediaAsset) => {
    setReplacingAsset(asset);
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.value = '';
      replaceFileInputRef.current.click();
    }
  };

  const handleFileReplaced = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !replacingAsset) return;
    const file = e.target.files[0];
    try {
      // 1. Delete old asset
      await deleteMediaAsset(replacingAsset.url);
      // 2. Upload new asset under same category
      await uploadMediaFile(file, replacingAsset.category as any);
      setToastMessage(`Asset "${replacingAsset.name}" replaced successfully.`);
      setTimeout(() => setToastMessage(null), 3000);
      loadAssets();
      if (selectedPreview?.id === replacingAsset.id) setSelectedPreview(null);
    } catch (err: any) {
      setError(err.message || 'Failed to replace asset');
    } finally {
      setReplacingAsset(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || asset.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Hidden file input for Replace action */}
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,video/mp4,video/webm,video/quicktime"
        onChange={handleFileReplaced}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-orange-500" />
            Native Media & Asset Manager
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Central repository for previewing, replacing, and managing uploaded portraits, office photos, logos, and video assets.
          </p>
        </div>

        <button
          onClick={loadAssets}
          disabled={isLoading}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Storage
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {toastMessage && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Upload Zone */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
          Upload New Asset
        </h3>
        <MediaUploadDropzone
          label=""
          helperText=""
          category="media"
          accept="both"
          onUploaded={() => {
            loadAssets();
            setToastMessage('New asset uploaded successfully.');
            setTimeout(() => setToastMessage(null), 3000);
          }}
        />
      </div>

      {/* Controls & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assets by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-400 font-medium">Category:</span>
          {['all', 'founder', 'office', 'logos', 'testimonials', 'media'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" />
          <p className="text-xs font-medium">Reading disk storage...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/40">
          <FolderOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-300">No media assets found</p>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery
              ? 'No assets match your search query.'
              : 'Upload images or videos above to populate the repository.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredAssets.map((asset) => {
            const isVid = asset.mimeType.startsWith('video/');
            return (
              <div
                key={asset.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                {/* Visual Thumbnail / Preview Click */}
                <div
                  onClick={() => setSelectedPreview(asset)}
                  className="relative w-full h-32 bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer"
                >
                  {isVid ? (
                    <div className="flex flex-col items-center justify-center text-orange-400 p-2">
                      <Video className="w-8 h-8 mb-1" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Video</span>
                    </div>
                  ) : (
                    <img
                      src={asset.url}
                      alt={asset.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  )}

                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      className="p-1.5 bg-slate-800 text-white rounded-md shadow-xs hover:bg-slate-700"
                      title="Inspect preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details (File name, Type, Size, Category, Upload date) & Actions (Replace, Delete) */}
                <div className="p-3 space-y-2 text-left">
                  <div>
                    <p className="text-xs font-semibold text-white truncate" title={asset.name}>
                      {asset.name}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                      <span className="capitalize px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {asset.category}
                      </span>
                      <span>{formatBytes(asset.size)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleTriggerReplace(asset)}
                      className="text-[11px] font-medium text-slate-300 hover:text-orange-400 flex items-center gap-1 cursor-pointer"
                      title="Replace this asset"
                    >
                      <Upload className="w-3.5 h-3.5 text-orange-400" />
                      <span>Replace</span>
                    </button>

                    <button
                      onClick={() => handleDelete(asset)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                      title="Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {selectedPreview && (
        <div
          onClick={() => setSelectedPreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="truncate pr-4">
                <h3 className="text-sm font-bold text-white truncate">{selectedPreview.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Category: <span className="capitalize text-slate-200">{selectedPreview.category}</span> • Type:{' '}
                  <span className="text-slate-200">{selectedPreview.mimeType}</span> • Size:{' '}
                  <span className="text-slate-200">{formatBytes(selectedPreview.size)}</span> • Uploaded:{' '}
                  <span className="text-slate-200">
                    {new Date(selectedPreview.createdAt).toLocaleDateString()}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedPreview(null)}
                className="text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="w-full max-h-[60vh] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 p-2">
              {selectedPreview.mimeType.startsWith('video/') ? (
                <video
                  src={selectedPreview.url}
                  controls
                  autoPlay
                  className="max-h-[55vh] max-w-full rounded-lg"
                />
              ) : (
                <img
                  src={selectedPreview.url}
                  alt={selectedPreview.name}
                  referrerPolicy="no-referrer"
                  className="max-h-[55vh] max-w-full object-contain rounded-lg"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-400">
                File: <span className="text-white font-medium">{selectedPreview.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleTriggerReplace(selectedPreview);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-orange-400" />
                  <span>Replace Asset</span>
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedPreview);
                  }}
                  className="px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 text-xs font-bold rounded-lg border border-rose-800/80 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
