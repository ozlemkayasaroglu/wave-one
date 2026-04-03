import type { NewsItem, Category, Period } from './types';

interface FeedSource {
  url: string;
  source: string;
  category: Category;
}

const FEEDS: FeedSource[] = [
  // Law
  { url: 'https://abovethelaw.com/feed/', source: 'Above the Law', category: 'law' },
  { url: 'https://www.artificiallawyer.com/feed/', source: 'Artificial Lawyer', category: 'law' },
  { url: 'https://thelawyer.com/feed/', source: 'The Lawyer', category: 'law' },
  { url: 'https://lawsitesblog.com/feed', source: 'LawSites', category: 'law' },
  // Health
  { url: 'https://www.statnews.com/feed/', source: 'STAT News', category: 'health' },
  { url: 'https://medcitynews.com/feed/', source: 'MedCity News', category: 'health' },
  { url: 'https://www.fiercepharma.com/rss/xml', source: 'Fierce Pharma', category: 'health' },
  { url: 'https://www.healthcareitnews.com/rss.xml', source: 'Healthcare IT News', category: 'health' },
  // Education
  { url: 'https://edsurge.com/news.rss', source: 'EdSurge', category: 'education' },
  { url: 'https://www.edtechmagazine.com/higher/rss.xml', source: 'EdTech Magazine', category: 'education' },
  { url: 'https://campustechnology.com/rss-feeds/news.aspx', source: 'Campus Technology', category: 'education' },
  { url: 'https://www.insidehighered.com/rss.xml', source: 'Inside Higher Ed', category: 'education' },
  // Software
  { url: 'https://techcrunch.com/feed/', source: 'TechCrunch', category: 'software' },
  { url: 'https://www.infoq.com/feed/', source: 'InfoQ', category: 'software' },
  { url: 'https://dev.to/feed', source: 'Dev.to', category: 'software' },
  { url: 'https://www.theregister.com/software/news.atom', source: 'The Register', category: 'software' },
];

// Simple hash function — no Node.js crypto needed
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0').slice(0, 12);
}

function tag(xml: string, tagName: string): string {
  const re = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
}

function attr(xml: string, tagName: string, attrName: string): string {
  const re = new RegExp(`<${tagName}[^>]*\\s${attrName}=["']([^"']+)["']`, 'i');
  const m = xml.match(re);
  return m ? m[1] : '';
}

function extractImage(itemXml: string): string | undefined {
  // enclosure url
  const enc = attr(itemXml, 'enclosure', 'url');
  if (enc && /\.(jpe?g|png|webp|gif)/i.test(enc)) return enc;
  // media:content
  const med = attr(itemXml, 'media:content', 'url');
  if (med) return med;
  // img in content
  const img = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (img) return img[1];
  return undefined;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseItems(xml: string, feed: FeedSource): NewsItem[] {
  // Support both RSS <item> and Atom <entry>
  const itemRe = /<item[\s>]([\s\S]*?)<\/item>|<entry[\s>]([\s\S]*?)<\/entry>/gi;
  const items: NewsItem[] = [];
  let match;

  while ((match = itemRe.exec(xml)) !== null && items.length < 20) {
    const block = match[1] || match[2];

    const title = stripHtml(tag(block, 'title') || 'Untitled');
    const link = tag(block, 'link') || attr(block, 'link', 'href') || '';
    const pubDate = tag(block, 'pubDate') || tag(block, 'published') || tag(block, 'updated') || new Date().toISOString();
    const description = stripHtml(
      tag(block, 'description') || tag(block, 'summary') || tag(block, 'content') || ''
    ).slice(0, 300);

    if (!title || !link) continue;

    items.push({
      id: simpleHash(link || title),
      title,
      description,
      url: link,
      source: feed.source,
      category: feed.category,
      publishedAt: new Date(pubDate).toISOString(),
      imageUrl: extractImage(block),
    });
  }

  return items;
}

async function fetchFeed(feed: FeedSource): Promise<NewsItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WaveOne/1.0)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseItems(xml, feed);
  } catch {
    return [];
  }
}

function periodCutoff(period: Period): Date {
  const now = new Date();
  if (period === 'daily') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (period === 'weekly') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
}

export async function fetchNews(category: Category, period: Period): Promise<NewsItem[]> {
  const feeds = FEEDS.filter((f) => f.category === category);
  const results = await Promise.allSettled(feeds.map(fetchFeed));
  const cutoff = periodCutoff(period);

  const seen = new Set<string>();
  return results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return new Date(item.publishedAt) >= cutoff;
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 60);
}
