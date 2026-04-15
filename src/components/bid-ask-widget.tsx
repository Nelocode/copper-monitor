"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Quote {
  price: number;
  currency: string;
  bid?: number | null;
  ask?: number | null;
  bidSize?: number | null;
  askSize?: number | null;
  dayHigh?: number | null;
  dayLow?: number | null;
  open?: number | null;
  previousClose?: number | null;
}

interface BidAskWidgetProps {
  symbol: string;
  quote: Quote;
}

function BidAskBar({ size, max, color }: { size: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((size / max) * 100, 100) : 0;
  return (
    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function BidAskWidget({ symbol, quote }: BidAskWidgetProps) {
  const { bid, ask, bidSize, askSize, currency, dayHigh, dayLow } = quote;

  const hasBidAsk = bid != null && ask != null;
  const spread = hasBidAsk ? (ask! - bid!).toFixed(3) : null;
  const spreadPct = hasBidAsk && bid! > 0 ? (((ask! - bid!) / bid!) * 100).toFixed(2) : null;

  const maxSize = Math.max(bidSize || 0, askSize || 0);

  // Determine market pressure
  const getPressure = () => {
    if (!bidSize || !askSize) return null;
    const ratio = bidSize / (bidSize + askSize);
    if (ratio > 0.65) return { label: "Strong Bid", color: "text-emerald-400" };
    if (ratio < 0.35) return { label: "Strong Ask", color: "text-red-400" };
    return { label: "Balanced", color: "text-zinc-400" };
  };
  const pressure = getPressure();

  return (
    <Card className="bg-card/50 backdrop-blur-md border-border h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            {symbol}
          </CardTitle>
          {pressure && (
            <span className={`text-[10px] font-bold font-mono ${pressure.color}`}>
              {pressure.label}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {hasBidAsk ? (
          <>
            {/* Bid row */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold font-mono text-emerald-400 w-6">BID</span>
              <span className="text-sm font-bold font-mono text-emerald-400 w-14">
                {bid!.toFixed(3)}
              </span>
              <BidAskBar size={bidSize || 0} max={maxSize} color="bg-emerald-500" />
              <span className="text-[10px] font-mono text-muted-foreground w-16 text-right">
                {bidSize != null ? `${(bidSize * 100).toLocaleString()}` : "—"}
              </span>
            </div>

            {/* Spread */}
            <div className="flex items-center gap-2 py-1 border-y border-border/30">
              <span className="text-[10px] text-muted-foreground font-mono flex-1">
                Spread
              </span>
              <span className="text-[10px] font-mono font-bold text-foreground">
                {spread} {currency}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                ({spreadPct}%)
              </span>
            </div>

            {/* Ask row */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold font-mono text-red-400 w-6">ASK</span>
              <span className="text-sm font-bold font-mono text-red-400 w-14">
                {ask!.toFixed(3)}
              </span>
              <BidAskBar size={askSize || 0} max={maxSize} color="bg-red-500" />
              <span className="text-[10px] font-mono text-muted-foreground w-16 text-right">
                {askSize != null ? `${(askSize * 100).toLocaleString()}` : "—"}
              </span>
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground font-mono text-center py-4">
            Mercado cerrado o sin datos
          </div>
        )}

        {/* Day range */}
        {(dayLow != null && dayHigh != null) && (
          <div className="pt-1 border-t border-border/20 grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Min</span>
              <span className="text-xs font-mono font-semibold">{dayLow.toFixed(3)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Max</span>
              <span className="text-xs font-mono font-semibold">{dayHigh.toFixed(3)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
