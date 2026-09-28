/**
 * Types for LACS Module #15: AI Comment Reply Suggestions
 */

export interface CommentReplySuggestionItem {
  tone: 'authoritative' | 'consultative' | 'concise';
  label: string;
  badge: string;
  summary: string;
  text: string;
}

export interface CommentReplySuggestionsResult {
  commentId: string;
  authorName: string;
  blogTitle: string;
  blogSlug: string;
  suggestions: {
    authoritative: CommentReplySuggestionItem;
    consultative: CommentReplySuggestionItem;
    concise: CommentReplySuggestionItem;
  };
  generatedAt: string;
}
