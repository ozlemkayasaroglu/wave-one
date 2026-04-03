export type Category = 'law' | 'health' | 'education' | 'software';
export type Period = 'daily' | 'weekly' | 'monthly';

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  category: Category;
  publishedAt: string;
  imageUrl?: string;
}

export interface SummaryData {
  translatedTitle: string;
  summary: string;
  keyPoints: string[];
  category: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  law: 'Hukuk',
  health: 'Sağlık',
  education: 'Eğitim',
  software: 'Yazılım',
};

export const CATEGORIES: Category[] = ['law', 'health', 'education', 'software'];
