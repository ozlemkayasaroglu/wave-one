import Parser from 'rss-parser';
import crypto from 'crypto';
import type { NewsItem, Category, Period } from './types';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; WaveOne/1.0)',
    Accept: 'application/rss+xml, application/xml, text/xml',
  },
});

interface FeedSource {
  url: string;
  source: string;
  category: Category;
}

const FEEDS: FeedSource[] = [
  // Law
  { url: 'https://www.law.com/rss/', source: 'Law.com', category: 'law' },
  { url: 'https://abovethelaw.com/feed/', source: 'Above the Law', category: 'law' },
  { url: 'https://www.legaltechnews.com/rss/site/legaltechnews', source: 'Legal Tech News', category: 'law' },
  { url: 'https://thelawyer.com/feed/', source: 'The Lawyer', category: 'law' },
  { url: 'https://www.artificiallawyer.com/feed/', source: 'Artificial Lawyer', category: 'law' },
  // Health
  { url: 'https://www.statnews.com/feed/', source: 'STAT News', category: 'health' },
  { url: 'https://www.fiercepharma.com/rss/xml', source: 'Fierce Pharma', category: 'health' },
  { url: 'https://medcitynews.com/feed/', source: 'MedCity News', category: 'health' },
  { url: 'https://www.healthcareitnews.com/rss.xml', source: 'Healthcare IT News', category: 'health' },
  { url: 'https://www.beckershospitalreview.com/rss/all-news-feed.xml', source: "Becker's Hospital Review", category: 'health' },
  // Education
  { url: 'https://edsurge.com/news.rss', source: 'EdSurge', category: 'education' },
  { url: 'https://www.edtechmagazine.com/higher/rss.xml', source: 'EdTech Magazine', category: 'education' },
  { url: 'https://campustechnology.com/rss-feeds/news.aspx', source: 'Campus Technology', category: 'education' },
  { url: 'https://www.timeshighereducation.com/hub/hendrix-college/rss.xml', source: 'Times Higher Ed', category: 'education' },
  { url: 'https://www.edsurge.com/news.rss', source: 'EdSurge', category: 'education' },
  // Software
  { url: 'https://techcrunch.com/feed/', source: 'TechCrunch', category: 'software' },
  { url: 'https://www.infoq.com/feed/', source: 'InfoQ', category: 'software' },
  { url: 'https://www.theregister.com/software/news.atom', source: 'The Register', category: 'software' },
  { url: 'https://feeds.feedburner.com/ThePragmaticEngineer', source: 'Pragmatic Engineer', category: 'software' },
  { url: 'https://dev.to/feed', source: 'Dev.to', category: 'software' },
];

function extractImage(item: Parser.Item): string | undefined {
  const enclosure = (item as any).enclosure?.url;
  if (enclosure && /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(enclosure)) return enclosure;
  const content = (item['content:encoded'] || item.content || '') as string;
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1];
}

function generateId(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
}

function periodCutoff(period: Period): Date {
  const now = new Date();
  if (period === 'daily') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (period === 'weekly') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
}

async function fetchFeed(feed: FeedSource): Promise<NewsItem[]> {
  try {
    const parsed = await parser.parseURL(feed.url);
    return (parsed.items || []).slice(0, 20).map((item) => ({
      id: generateId(item.link || item.title || Math.random().toString()),
      title: item.title || 'Untitled',
      description: (item.contentSnippet || item.summary || '').slice(0, 300),
      url: item.link || '',
      source: feed.source,
      category: feed.category,
      publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
      imageUrl: extractImage(item),
    }));
  } catch {
    return [];
  }
}

export async function fetchNews(category: Category, period: Period): Promise<NewsItem[]> {
  const feeds = FEEDS.filter((f) => f.category === category);
  const results = await Promise.allSettled(feeds.map(fetchFeed));
  const cutoff = periodCutoff(period);

  const items = results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .filter((item) => new Date(item.publishedAt) >= cutoff)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 60);

  // Deduplicate by id
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
