import { NextResponse } from 'next/server';

export const revalidate = 300; // 5 minutes

async function fetchStockTwits(symbol: string) {
  const res = await fetch(
    `https://api.stocktwits.com/api/2/streams/symbol/${symbol}.json?limit=15`,
    {
      headers: { 'User-Agent': 'copper-monitor/1.0 IR Terminal' },
      next: { revalidate: 300 },
    }
  );
  if (!res.ok) throw new Error(`StockTwits error: ${res.status}`);
  const data = await res.json();

  return (data.messages || []).map((msg: any) => ({
    id: String(msg.id),
    body: msg.body,
    author: msg.user?.username || 'unknown',
    createdAt: msg.created_at,
    sentiment: (msg.entities?.sentiment?.basic as 'Bullish' | 'Bearish') || null,
    source: 'stocktwits' as const,
    url: `https://stocktwits.com/${msg.user?.username}/message/${msg.id}`,
  }));
}

async function fetchReddit(query: string) {
  const q = encodeURIComponent(query);
  const res = await fetch(
    `https://www.reddit.com/search.json?q=${q}&sort=new&limit=10&type=link`,
    {
      headers: {
        'User-Agent': 'copper-monitor/1.0 (IR Terminal for CGNT.V)',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 },
    }
  );
  if (!res.ok) throw new Error(`Reddit error: ${res.status}`);
  const data = await res.json();

  return (data.data?.children || []).map((child: any) => ({
    id: child.data.id,
    body: child.data.title,
    author: child.data.author,
    subreddit: child.data.subreddit,
    score: child.data.score || 0,
    numComments: child.data.num_comments || 0,
    createdAt: new Date(child.data.created_utc * 1000).toISOString(),
    source: 'reddit' as const,
    url: `https://reddit.com${child.data.permalink}`,
  }));
}

export async function GET() {
  const [stocktwitsResult, redditResult] = await Promise.allSettled([
    fetchStockTwits('CGNT'),
    fetchReddit('CGNT OR "copper giant" OR "Copper Giant Resources"'),
  ]);

  return NextResponse.json({
    success: true,
    stocktwits: stocktwitsResult.status === 'fulfilled' ? stocktwitsResult.value : [],
    reddit: redditResult.status === 'fulfilled' ? redditResult.value : [],
    errors: {
      stocktwits: stocktwitsResult.status === 'rejected' ? stocktwitsResult.reason?.message : null,
      reddit: redditResult.status === 'rejected' ? redditResult.reason?.message : null,
    },
    fetchedAt: new Date().toISOString(),
  });
}
