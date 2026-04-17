import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export const dynamic = 'force-dynamic';

// ─── Twelve Data quote fetcher ───────────────────────────────────────────────
async function fetchFromTwelveData(symbol: string, apiKey: string) {
  // Convert symbol: CGNT.V → symbol=CGNT&exchange=TSXV
  const dotIdx   = symbol.lastIndexOf(".");
  const ticker   = dotIdx > -1 ? symbol.slice(0, dotIdx)   : symbol;
  const suffix   = dotIdx > -1 ? symbol.slice(dotIdx + 1)  : "";
  const exchange = suffix === "V"  ? "TSXV"
                 : suffix === "TO" ? "TSX"
                 : undefined;

  const params = new URLSearchParams({ symbol: ticker, apikey: apiKey });
  if (exchange) params.set("exchange", exchange);

  const res  = await fetch(`https://api.twelvedata.com/quote?${params}`, { cache: 'no-store' });
  const data = await res.json();

  if (data.code || !data.close) {
    throw new Error(data.message || `Twelve Data: no data for ${symbol}`);
  }

  return {
    price:         parseFloat(data.close)            || 0,
    currency:      data.currency                     || "CAD",
    changePercent: parseFloat(data.percent_change)   || 0,
    volume:        parseInt(data.volume, 10)         || 0,
    name:          data.name                         || symbol,
    bid:           null as number | null,   // not on free tier
    ask:           null as number | null,
    bidSize:       null as number | null,
    askSize:       null as number | null,
    dayHigh:       parseFloat(data.high)              || 0,
    dayLow:        parseFloat(data.low)               || 0,
    open:          parseFloat(data.open)              || 0,
    previousClose: parseFloat(data.previous_close)    || 0,
  };
}

// ─── Yahoo Finance quote fetcher (fallback) ──────────────────────────────────
async function fetchFromYahoo(symbol: string) {
  const quote = await yahooFinance.quote(symbol);
  return {
    price:         quote?.regularMarketPrice          || 0,
    currency:      quote?.currency                    || "CAD",
    changePercent: quote?.regularMarketChangePercent  || 0,
    volume:        quote?.regularMarketVolume         || 0,
    name:          quote?.shortName                   || symbol,
    bid:           quote?.bid                         ?? null,
    ask:           quote?.ask                         ?? null,
    bidSize:       quote?.bidSize                     ?? null,
    askSize:       quote?.askSize                     ?? null,
    dayHigh:       quote?.regularMarketDayHigh        ?? null,
    dayLow:        quote?.regularMarketDayLow         ?? null,
    open:          quote?.regularMarketOpen           ?? null,
    previousClose: quote?.regularMarketPreviousClose  ?? null,
  };
}

// ─── Route handler ───────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol           = searchParams.get("symbol") || "CGNT.V";

  const twelveDataKey = process.env.TWELVE_DATA_API_KEY;

  // Try Twelve Data first (if key is configured), then fall back to Yahoo
  let quote;
  let source = "unknown";

  if (twelveDataKey) {
    try {
      quote  = await fetchFromTwelveData(symbol, twelveDataKey);
      source = "twelve-data";
    } catch (err) {
      console.warn(`Twelve Data failed for ${symbol}, falling back to Yahoo:`, err);
    }
  }

  if (!quote) {
    try {
      quote  = await fetchFromYahoo(symbol);
      source = "yahoo-finance";
    } catch (err) {
      console.error(`Both sources failed for ${symbol}:`, err);
      return NextResponse.json(
        { success: false, error: "All data sources failed", symbol },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    symbol,
    source,
    quote,
    // historical is empty — charts are handled by TradingView widget
    historical: [],
  });
}
