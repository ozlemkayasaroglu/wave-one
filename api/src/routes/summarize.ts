import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';
import { getCachedSummary, setCachedSummary } from '../lib/cache';

const router = Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function fetchArticleText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);
  } catch {
    return '';
  }
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { url, title, description, articleId } = req.body;
    if (!articleId || (!url && !title)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Cache check
    const cached = await getCachedSummary(articleId);
    if (cached) return res.json({ ...cached, cached: true });

    // 2. Fetch article text
    const articleText = url ? await fetchArticleText(url) : '';
    const content = articleText.length > 200 ? articleText : (description ?? title ?? '');

    // 3. Groq summarization
    const prompt = `Sen bir Türkçe teknoloji ve profesyonel haber editörüsün. Makaleyi analiz et ve SADECE geçerli JSON döndür, başka hiçbir şey yazma.

{
  "translatedTitle": "başlığın doğal Türkçe çevirisi",
  "summary": "2-3 cümlelik akıcı Türkçe özet",
  "keyPoints": ["önemli nokta 1", "önemli nokta 2", "önemli nokta 3"],
  "category": "Hukuk veya Sağlık veya Eğitim veya Yazılım"
}

Başlık: ${title}
İçerik: ${content.slice(0, 2500)}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 500,
    });

    const text = completion.choices[0]?.message?.content || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');

    const parsed = JSON.parse(match[0]);
    const data = {
      translatedTitle: parsed.translatedTitle ?? title,
      summary: parsed.summary ?? '',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      category: parsed.category ?? '',
    };

    // 4. Cache async
    setCachedSummary(articleId, data).catch(() => {});

    return res.json({ ...data, cached: false });
  } catch (err) {
    console.error('Summarize error:', err);
    return res.status(500).json({ error: 'Summarization failed' });
  }
});

export default router;
