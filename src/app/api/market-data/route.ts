import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'CGNT.V';
  const interval = (searchParams.get('interval') as any) || '1d';
  const range = searchParams.get('range') || '6mo';

  try {
    // Fetch Current Quote and Chart data in parallel
    const [quote, chartData] = await Promise.all([
      yahooFinance.quote(symbol),
      yahooFinance.chart(symbol, { 
        period1: range === '6mo' ? new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        interval 
      })
    ]);

    // Format historical data for Lightweight Charts (OHLC)
    const historical = chartData.quotes.map((q: any) => ({
      time: Math.floor(new Date(q.date).getTime() / 1000), // Unix timestamp
      open: q.open || q.close,
      high: q.high || q.close,
      low: q.low || q.close,
      close: q.close,
      volume: q.volume || 0,
    })).filter(q => q.open !== null);

    return NextResponse.json({
      success: true,
      symbol,
      quote: {
        price: quote?.regularMarketPrice || 0,
        currency: quote?.currency || 'USD',
        changePercent: quote?.regularMarketChangePercent || 0,
        volume: quote?.regularMarketVolume || 0,
        name: quote?.shortName || symbol,
        bid: quote?.bid ?? null,
        ask: quote?.ask ?? null,
        bidSize: quote?.bidSize ?? null,   // in hundreds (board lots)
        askSize: quote?.askSize ?? null,
        dayHigh: quote?.regularMarketDayHigh ?? null,
        dayLow: quote?.regularMarketDayLow ?? null,
        open: quote?.regularMarketOpen ?? null,
        previousClose: quote?.regularMarketPreviousClose ?? null,
      },
      historical,
    });
  } catch (error) {
    console.error(`Market data error for ${symbol}:`, error);
    return NextResponse.json({ success: false, error: 'Failed to fetch market data' }, { status: 500 });
  }
}
