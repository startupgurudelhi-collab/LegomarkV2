import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Upload,
  X,
  RefreshCw,
  Plus,
  Type,
  Trash2,
  Maximize2,
  Minimize2,
  Info,
} from 'lucide-react';
import { uploadMediaFile } from '../../services/adminMedia.service';
import { markdownToHtml, htmlToMarkdown } from './editorUtils';

interface RichTextEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write comprehensive article content with headings, paragraphs, lists, quotes, and inline illustrations...',
  minHeight = '450px',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    formatBlock: 'p',
  });

  // Hyperlink Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Image Modal State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageAlt, setImageAlt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Selected Image inside editor for action (delete/caption)
  const [selectedEditorImg, setSelectedEditorImg] = useState<HTMLImageElement | null>(null);

  // Synchronize incoming value into contentEditable editor if external change occurs
  useEffect(() => {
    if (!editorRef.current) return;

    const currentMarkdown = htmlToMarkdown(editorRef.current.innerHTML);
    // Only update innerHTML if markdown representation differs to prevent cursor jumping
    if (value !== currentMarkdown) {
      editorRef.current.innerHTML = markdownToHtml(value);
    }
  }, [value]);

  // Initial load
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = markdownToHtml(value);
    }
  }, []);

  // Save current DOM selection
  const saveSelection = () => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Restore saved DOM selection
  const restoreSelection = () => {
    if (typeof window === 'undefined' || !savedSelectionRef.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  // Trigger content change upstream
  const handleContentChange = useCallback(() => {
    if (!editorRef.current) return;
    const md = htmlToMarkdown(editorRef.current.innerHTML);
    onChange(md);
    updateToolbarState();
  }, [onChange]);

  // Update active state of toolbar buttons based on selection
  const updateToolbarState = () => {
    if (typeof document === 'undefined') return;
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        formatBlock: document.queryCommandValue('formatBlock') || 'p',
      });
    } catch {
      // ignore
    }
  };

  // Execute standard formatting commands
  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    saveSelection();
    handleContentChange();
  };

  // Format block command (h1, h2, h3, p, blockquote)
  const formatBlock = (tag: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();

    if (tag === 'blockquote') {
      document.execCommand('formatBlock', false, '<blockquote>');
    } else if (tag.startsWith('h')) {
      document.execCommand('formatBlock', false, `<${tag}>`);
    } else {
      document.execCommand('formatBlock', false, '<p>');
    }

    saveSelection();
    handleContentChange();
  };

  // Open Link Dialog
  const handleOpenLinkModal = () => {
    saveSelection();
    const sel = window.getSelection();
    if (sel) {
      setLinkText(sel.toString());
    }
    setLinkUrl('');
    setIsLinkModalOpen(true);
  };

  const handleApplyLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    restoreSelection();
    editorRef.current?.focus();

    const formattedUrl = linkUrl.trim().startsWith('http')
      ? linkUrl.trim()
      : `https://${linkUrl.trim()}`;

    if (linkText.trim() && window.getSelection()?.toString() !== linkText.trim()) {
      document.execCommand(
        'insertHTML',
        false,
        `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer">${linkText.trim()}</a>`
      );
    } else {
      document.execCommand('createLink', false, formattedUrl);
    }

    setIsLinkModalOpen(false);
    setLinkText('');
    setLinkUrl('');
    handleContentChange();
  };

  // Image Selection and Native Upload
  const handleOpenImageModal = () => {
    saveSelection();
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageAlt('');
    setUploadError(null);
    setIsImageModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      if (!imageAlt) {
        setImageAlt(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  };

  const handleUploadAndInsertImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select an image file to upload.');
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      // 1. Upload to persistent server storage under /uploads/media/
      const result = await uploadMediaFile(selectedFile, 'media');

      if (!result || !result.url) {
        throw new Error('Failed to upload image to server');
      }

      const persistentUrl = result.url;
      const caption = imageAlt.trim() || 'Article illustration';

      // 2. Insert figure/img block into the contentEditable canvas
      restoreSelection();
      editorRef.current?.focus();

      const imageHtml = `
        <figure class="article-image-block" contenteditable="false">
          <img src="${persistentUrl}" alt="${caption}" />
          <figcaption contenteditable="true">${caption}</figcaption>
        </figure>
        <p><br></p>
      `;

      document.execCommand('insertHTML', false, imageHtml);

      // 3. Clean up modal
      setIsImageModalOpen(false);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setImageAlt('');

      handleContentChange();
    } catch (err: any) {
      console.error('Image upload failed in rich editor:', err);
      setUploadError(err.message || 'Error uploading image to server');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle clicking on image inside editor
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      setSelectedEditorImg(target as HTMLImageElement);
    } else {
      setSelectedEditorImg(null);
    }
    updateToolbarState();
  };

  // Delete selected image
  const handleDeleteSelectedImage = () => {
    if (!selectedEditorImg) return;
    const parentFigure = selectedEditorImg.closest('figure');
    if (parentFigure) {
      parentFigure.remove();
    } else {
      selectedEditorImg.remove();
    }
    setSelectedEditorImg(null);
    handleContentChange();
  };

  return (
    <div
      className={`rounded-2xl border border-slate-700/80 bg-slate-950 overflow-hidden shadow-xl flex flex-col transition-all ${
        isFullScreen ? 'fixed inset-4 z-50 bg-slate-950 border-slate-700' : 'relative'
      }`}
    >
      {/* 1. TOP STICKY TOOLBAR */}
      <div className="bg-slate-900 border-b border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none z-10 sticky top-0">
        {/* Main Formatting Action Buttons */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Paragraph */}
          <button
            type="button"
            onClick={() => formatBlock('p')}
            className={`p-1.5 px-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              activeFormats.formatBlock === 'p'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Normal Paragraph (P)"
          >
            <Type className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Paragraph</span>
          </button>

          <div className="w-[1px] h-5 bg-slate-800 mx-0.5" />

          {/* Heading 1 */}
          <button
            type="button"
            onClick={() => formatBlock('h1')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeFormats.formatBlock === 'h1'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4 text-orange-400" />
          </button>

          {/* Heading 2 */}
          <button
            type="button"
            onClick={() => formatBlock('h2')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeFormats.formatBlock === 'h2'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4 text-orange-400" />
          </button>

          {/* Heading 3 */}
          <button
            type="button"
            onClick={() => formatBlock('h3')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeFormats.formatBlock === 'h3'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4 text-orange-400" />
          </button>

          <div className="w-[1px] h-5 bg-slate-800 mx-0.5" />

          {/* Bold */}
          <button
            type="button"
            onClick={() => execCmd('bold')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeFormats.bold
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => execCmd('italic')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeFormats.italic
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          {/* Underline */}
          <button
            type="button"
            onClick={() => execCmd('underline')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeFormats.underline
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          {/* Strikethrough */}
          <button
            type="button"
            onClick={() => execCmd('strikeThrough')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeFormats.strikeThrough
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-800 mx-0.5" />

          {/* Bullet List */}
          <button
            type="button"
            onClick={() => execCmd('insertUnorderedList')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeFormats.insertUnorderedList
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Bulleted List"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            onClick={() => execCmd('insertOrderedList')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeFormats.insertOrderedList
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          {/* Blockquote */}
          <button
            type="button"
            onClick={() => formatBlock('blockquote')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeFormats.formatBlock === 'blockquote'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-800 mx-0.5" />

          {/* Text Alignment */}
          <button
            type="button"
            onClick={() => execCmd('justifyLeft')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeFormats.justifyLeft
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('justifyCenter')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeFormats.justifyCenter
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('justifyRight')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeFormats.justifyRight
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-800 mx-0.5" />

          {/* Insert Link */}
          <button
            type="button"
            onClick={handleOpenLinkModal}
            className="p-1.5 px-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4 text-blue-400" />
            <span className="hidden md:inline">Link</span>
          </button>

          {/* Insert Image (Native Upload) */}
          <button
            type="button"
            onClick={handleOpenImageModal}
            className="p-1.5 px-3 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Insert Image (Uploads to /uploads/media/)"
          >
            <ImageIcon className="w-4 h-4 text-orange-400" />
            <span>Insert Image</span>
          </button>

          {/* Image Selected Action Pill */}
          {selectedEditorImg && (
            <button
              type="button"
              onClick={handleDeleteSelectedImage}
              className="p-1.5 px-2.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-semibold flex items-center gap-1 ml-1 cursor-pointer animate-fadeIn"
              title="Remove selected image"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Image</span>
            </button>
          )}
        </div>

        {/* Right Action Icons: Fullscreen toggle */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Editor'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. TRUE EDITABLE DOCUMENT CANVAS */}
      <div className="flex-1 bg-white p-6 sm:p-10 overflow-y-auto cursor-text select-text relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentChange}
          onClick={handleEditorClick}
          onKeyUp={() => {
            saveSelection();
            updateToolbarState();
          }}
          onMouseUp={() => {
            saveSelection();
            updateToolbarState();
          }}
          style={{ minHeight: isFullScreen ? 'calc(100vh - 120px)' : minHeight }}
          data-placeholder={placeholder}
          className="editable-document-canvas w-full max-w-4xl mx-auto focus:outline-hidden text-slate-900 font-sans"
        />
      </div>

      {/* 3. FOOTER STATUS BAR */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>True Document Editor (Rich-Text ContentEditable Canvas)</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Click anywhere to write text above or below embedded media</span>
          <span>{value.length} chars</span>
        </div>
      </div>

      {/* 4. MODAL: INSERT HYPERLINK */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-400" />
                <span>Insert Hyperlink</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Display Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ministry of Corporate Affairs Portal"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://www.mca.gov.in"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 shadow-xs cursor-pointer"
                >
                  Apply Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: NATIVE MEDIA UPLOAD & INLINE INSERTION */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Insert Inline Image at Cursor</h4>
                  <p className="text-[11px] text-slate-400">
                    Uploaded directly to persistent server storage under <code>/uploads/media/</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs mb-4">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadAndInsertImage} className="space-y-4">
              {/* Dropzone / Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Image File (PNG, JPG, WEBP, SVG) *
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="relative rounded-xl border border-slate-700 bg-slate-950 overflow-hidden group">
                    <img
                      src={previewUrl}
                      alt="Selected preview"
                      className="w-full h-44 object-contain p-2"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                      title="Choose different image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/60"
                  >
                    <Upload className="w-8 h-8 text-orange-400 mx-auto mb-2 opacity-80" />
                    <p className="text-xs font-bold text-white">Click to choose image from device</p>
                    <p className="text-[11px] text-slate-500 mt-1">PNG, JPG, WEBP up to 50MB</p>
                  </div>
                )}
              </div>

              {/* Alt Text / Caption */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Image Caption / Alt Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. SPICe+ MCA Portal filing workflow steps"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                <strong className="text-slate-300 block mb-0.5">True Document Flow:</strong>
                The image is inserted directly into the editable document flow at your cursor. You can immediately continue typing text before or after the image.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isUploadingImage}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isUploadingImage ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading & Inserting...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload & Insert Image</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
