export type SourceType = "seed" | "upload" | "url";
export type AiMode = "stub" | "live";

export type LibraryItem = {
  id: string;
  title: string;
  family: string;
  explanation: string;
  keywords: string[];
  imagePrompt: string;
  siteBrief: string;
  imageUrl: string;
  sourceUrl: string;
  note: string;
  createdAt: string;
  sourceType: SourceType;
  aspect: string;
  sorter: string;
};

export type Analysis = {
  title: string;
  family: string;
  explanation: string;
  keywords: string[];
  imagePrompt: string;
  siteBrief: string;
  aspect: string;
  sorter: string;
  aiMode: AiMode;
};

export type AnalyzeInput = {
  title?: string;
  description?: string;
  filename?: string;
  note?: string;
  sourceUrl?: string;
  width?: number;
  height?: number;
};
