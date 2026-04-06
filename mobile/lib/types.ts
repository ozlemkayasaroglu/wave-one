export type Category = 'law' | 'health' | 'education' | 'politics' | 'economy';
export type SocialPlatform = 'linkedin' | 'instagram' | 'twitter';
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
  cached?: boolean;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  law:       'Hukuk',
  health:    'Sağlık',
  education: 'Eğitim',
  politics:  'Siyaset',
  economy:   'Ekonomi',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  law:       '#c9a050',
  health:    '#6b9e7a',
  education: '#7090c0',
  politics:  '#c06070',
  economy:   '#50a0c9',
};

export const CATEGORIES: Category[] = ['law', 'health', 'education', 'politics', 'economy'];
