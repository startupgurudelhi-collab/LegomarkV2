import React, { useMemo } from 'react';
import { markdownToHtml } from '../admin/editorUtils';

interface RichContentRendererProps {
  content: string;
  className?: string;
}

export const RichContentRenderer: React.FC<RichContentRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const htmlContent = useMemo(() => {
    return markdownToHtml(content);
  }, [content]);

  return (
    <div
      className={`rich-content-renderer ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
