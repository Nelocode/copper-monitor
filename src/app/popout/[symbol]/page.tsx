"use client";

import { use, useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Loader2, RefreshCw, WifiOff } from "lucide-react";

const TradingChart = dynamic(() => import("@/components/trading-chart").then(mod => mod.TradingChart), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
});

const RANGES = [
  { label: "1D", value: "1d" }, { label: "5D", value: "5d" },
  { label: "1M", value: "1mo" }, { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" }, { label: "1A", value: "1y" },
] as const;

const INTERVALS = [
  { label: "1m",  value: "1m",  maxDays: 7,       intraday: true  },
  { label: "2m",  value: "2m",  maxDays: 60,      intraday: true  },
  { label: "5m",  value: "5m",  maxDays: 60,      intraday: true  },
  { label: "15m", value: "15m", maxDays: 60,      intraday: true  },
  { label: "30m", value: "30m", maxDays: 60,      intraday: true  },
  { label: "1H",  value: "60m", maxDays: 730,     intraday: true  },
  { label: "Día", value: "1d",  maxDays: Infinity, intraday: false },
  { label: "Sem", value: "1wk", maxDays: Infinity, intraday: false },
] as const;

type RangeValue    = typeof RANGES[number]["value"];
type IntervalValue = typeof INTERVALS[number]["value"];

export default function PopoutChart({ params }: { params: Promise<{ symbol: string }> }) {
  const resolvedParams = use(params);
  const searchParams   = useSearchParams();

  const initType     = (searchParams.get("type") as "candle" | "area") || "candle";
  const initRange    = (searchParams.get("range") as RangeValue)    || "1mo";
  const initInterval = (searchParams.get("interval") as IntervalValue) || "1d";

  const [data,      setData]      = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [failed,    setFailed]    = useState(false);
  const [range,     setRange]     = useState<RangeValue>(initRange);
  const [interval,  setInterval]  = useState<IntervalValue>(initInterval);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const isIntraday = INTERVALS.find(i => i.value === interval)?.intraday ?? false;

  const fetchData = useCallback(async (rng: RangeValue, ivl: IntervalValue) => {
    setLoading(true);
    setFailed(false);
    try {
      const res  = await fetch(`/api/market-data?symbol=${resolvedParams.symbol}&range=${rng}&interval=${ivl}`);
      const json = await res.json();
      if (json.success && json.historical?.length > 0) {
        setData(json.historical);
        setLastUpdate(new Date());
      } else {
        setData([]);
        setFailed(true);
      }
    } catch {
      setData([]);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.symbol]);

  useEffect(() => { fetchData(range, interval); }, [range, interval, fetchData]);

  const chartHeight = typeof window !== "undefined" ? window.innerHeight - 90 : 600;

  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-border bg-secondary/50 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs font-bold tracking-wider text-foreground uppercase">{resolvedParams.symbol}</span>
        </div>
        {/* Range */}
        <div className="flex gap-0.5 bg-background/40 rounded-md p-0.5">
          {RANGES.map(r => (
            <button key={r.value} onClick={() => setRange(r.value)}
              className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded transition-all ${range === r.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {lastUpdate && <span className="text-[9px] font-mono text-muted-foreground/50">{lastUpdate.toLocaleTimeString("es-CO")}</span>}
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-mono text-emerald-500 uppercase">Live</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : failed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <WifiOff className="h-8 w-8 text-muted-foreground/30" />
            <span className="text-sm font-mono text-muted-foreground/60">Sin datos disponibles</span>
            <button onClick={() => fetchData(range, interval)}
              className="flex items-center gap-1.5 text-xs font-mono text-primary/70 hover:text-primary border border-primary/20 px-3 py-1.5 rounded transition-all">
              <RefreshCw size={12} /> Reintentar
            </button>
          </div>
        ) : (
          <TradingChart data={data} type={initType} intraday={isIntraday} height={chartHeight} />
        )}
      </div>

      {/* Footer: interval selector */}
      <div className="px-3 py-1.5 border-t border-border/40 bg-secondary/30 flex items-center gap-2 shrink-0">
        <div className="flex gap-0.5 bg-background/40 rounded-md p-0.5">
          {INTERVALS.map(ivl => {
            const rng = RANGES.find(r => r.value === range)!;
            const compatible = ivl.maxDays >= (rng as any).days ?? 30;
            return (
              <button key={ivl.value} onClick={() => setInterval(ivl.value)}
                className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded transition-all ${
                  interval === ivl.value ? "bg-primary text-primary-foreground"
                  : compatible ? "text-muted-foreground hover:text-foreground"
                  : "text-muted-foreground/25"}`}>
                {ivl.label}
              </button>
            );
          })}
        </div>
        <span className="text-[9px] font-mono text-muted-foreground/40 ml-auto">COPPER GIANT IR TERMINAL · MONITOR DEDICADO</span>
      </div>
    </div>
  );
}
