export interface BlogSeriesArticle {
  sequenceNumber: number;
  suggestedTitle: string;
  primaryKeyword: string;
  searchIntent: string;
  contentAngle: string;
  keyTakeaways?: string[];
}

export interface BlogSeriesResult {
  topic: string;
  targetService?: string;
  articleCount: number;
  seriesOverview?: string;
  articles: BlogSeriesArticle[];
}

export interface GenerateBlogSeriesInput {
  topic: string;
  targetService?: string;
  articleCount?: number;
}
