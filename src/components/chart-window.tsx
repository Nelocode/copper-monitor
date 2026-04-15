"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Rnd } from "react-rnd";
import { TradingChart } from "./trading-chart";
import { X, BarChart2, CandlestickChart, ExternalLink, Loader2, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

// ─── Range definitions (how far back) ───────────────────────────────────────
const RANGES = [
  { label: "1D",  value: "1d",  days: 2   },
  { label: "5D",  value: "5d",  days: 5   },
  { label: "1M",  value: "1mo", days: 30  },
  { label: "3M",  value: "3mo", days: 90  },
  { label: "6M",  value: "6mo", days: 180 },
  { label: "1A",  value: "1y",  days: 365 },
] as const;

// ─── Interval definitions (candle granularity) ───────────────────────────────
const INTERVALS = [
  { label: "1m",   value: "1m",  maxDays: 7,        display: "1 Minuto",   intraday: true,  refresh: 30   },
  { label: "2m",   value: "2m",  maxDays: 60,       display: "2 Minutos",  intraday: true,  refresh: 60   },
  { label: "5m",   value: "5m",  maxDays: 60,       display: "5 Minutos",  intraday: true,  refresh: 60   },
  { label: "15m",  value: "15m", maxDays: 60,       display: "15 Minutos", intraday: true,  refresh: 120  },
  { label: "30m",  value: "30m", maxDays: 60,       display: "30 Minutos", intraday: true,  refresh: 300  },
  { label: "1H",   value: "60m", maxDays: 730,      display: "1 Hora",     intraday: true,  refresh: 600  },
  { label: "Día",  value: "1d",  maxDays: Infinity,  display: "Diario",     intraday: false, refresh: 0    },
  { label: "Sem",  value: "1wk", maxDays: Infinity,  display: "Semanal",    intraday: false, refresh: 0    },
] as const;

type RangeValue    = typeof RANGES[number]["value"];
type IntervalValue = typeof INTERVALS[number]["value"];

// ─── Smart compatibility helpers ─────────────────────────────────────────────
function getBestInterval(rangeValue: RangeValue, currentInterval: IntervalValue): IntervalValue {
  const range    = RANGES.find(r => r.value === rangeValue)!;
  const interval = INTERVALS.find(i => i.value === currentInterval)!;
  if (interval.maxDays >= range.days) return currentInterval;
  // Pick the finest compatible interval
  const best = [...INTERVALS].reverse().find(i => i.maxDays >= range.days);
  return best?.value ?? "1d";
}

function getBestRange(intervalValue: IntervalValue, currentRange: RangeValue): RangeValue {
  const interval = INTERVALS.find(i => i.value === intervalValue)!;
  const range    = RANGES.find(r => r.value === currentRange)!;
  if (interval.maxDays >= range.days) return currentRange;
  // Pick the largest compatible range
  const best = [...RANGES].reverse().find(r => r.days <= interval.maxDays);
  return best?.value ?? "1d";
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface ChartWindowProps {
  id:              string;
  symbol:          string;
  title:           string;
  onClose:         (id: string) => void;
  defaultPosition?: { x: number; y: number };
  defaultSize?:    { width: number; height: number };
}

// ─── Component ───────────────────────────────────────────────────────────────
export function ChartWindow({ id, symbol, title, onClose, defaultPosition, defaultSize }: ChartWindowProps) {
  const [chartType, setChartType] = useState<"candle" | "area">("candle");
  const [range,     setRange]     = useState<RangeValue>("1mo");
  const [interval,  setInterval]  = useState<IntervalValue>("1d");
  const [data,      setData]      = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [failed,    setFailed]    = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [countdown,  setCountdown]  = useState(0);
  const refreshRef = useRef<NodeJS.Timeout | null>(null);

  const currentInterval = INTERVALS.find(i => i.value === interval)!;
  const isIntraday = currentInterval.intraday;

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (sym: string, rng: RangeValue, ivl: IntervalValue) => {
    setLoading(true);
    setFailed(false);
    try {
      const res  = await fetch(`/api/market-data?symbol=${sym}&range=${rng}&interval=${ivl}`);
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
  }, []);

  // ─── Auto-refresh for intraday intervals ─────────────────────────────────
  useEffect(() => {
    if (refreshRef.current) clearInterval(refreshRef.current);
    if (currentInterval.refresh > 0) {
      setCountdown(currentInterval.refresh);
      refreshRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            fetchData(symbol, range, interval);
            return currentInterval.refresh;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [symbol, range, interval, currentInterval.refresh, fetchData]);

  // ─── Fetch on mount and config change ────────────────────────────────────
  useEffect(() => {
    fetchData(symbol, range, interval);
  }, [symbol, range, interval, fetchData]);

  // ─── Range change (with smart interval correction) ────────────────────────
  const handleRangeChange = (newRange: RangeValue) => {
    const fixedInterval = getBestInterval(newRange, interval);
    setRange(newRange);
    if (fixedInterval !== interval) setInterval(fixedInterval);
  };

  // ─── Interval change (with smart range correction) ───────────────────────
  const handleIntervalChange = (newInterval: IntervalValue) => {
    const fixedRange = getBestRange(newInterval, range);
    setInterval(newInterval);
    if (fixedRange !== range) setRange(fixedRange);
  };

  const handlePopOut = () => {
    const w = 900, h = 650;
    const left = window.screenX + (window.outerWidth  - w) / 2;
    const top  = window.screenY + (window.outerHeight - h) / 2;
    window.open(
      `/popout/${symbol}?type=${chartType}&range=${range}&interval=${interval}`,
      `Chart_${symbol}_${Date.now()}`,
      `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const isCompatible = (ivl: typeof INTERVALS[number], rng: RangeValue) => {
    const r = RANGES.find(x => x.value === rng)!;
    return ivl.maxDays >= r.days;
  };

  return (
    <Rnd
      default={{
        x: defaultPosition?.x || 0,
        y: defaultPosition?.y || 0,
        width:  defaultSize?.width  || 620,
        height: defaultSize?.height || 480,
      }}
      minWidth={380}
      minHeight={300}
      bounds="parent"
      dragHandleClassName="handle"
      className="z-10"
    >
      <div className="flex flex-col w-full h-full bg-card border border-border rounded-xl shadow-2xl overflow-hidden">

        {/* ── Row 1: Header ─────────────────────────────────────────────── */}
        <div className="handle flex items-center justify-between px-3 py-1.5 bg-secondary/50 border-b border-border cursor-move select-none gap-2 shrink-0">
          {/* Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="text-[11px] font-bold tracking-wider text-foreground uppercase truncate">{title}</span>
            <span className="text-[9px] text-muted-foreground font-mono px-1.5 py-0.5 rounded bg-background/50 shrink-0">{symbol}</span>
          </div>

          {/* Range buttons */}
          <div className="flex items-center gap-0.5 bg-background/40 rounded-md p-0.5 shrink-0">
            {RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => handleRangeChange(r.value)}
                className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded transition-all ${
                  range === r.value
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary"
              onClick={() => setChartType(chartType === "candle" ? "area" : "candle")} title="Tipo de gráfico">
              {chartType === "candle" ? <BarChart2 size={13} /> : <CandlestickChart size={13} />}
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary"
              onClick={handlePopOut} title="Ventana independiente">
              <ExternalLink size={13} />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => onClose(id)}>
              <X size={13} />
            </Button>
          </div>
        </div>

        {/* ── Row 2: Chart ──────────────────────────────────────────────── */}
        <div className="flex-1 bg-background/20 relative overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Cargando datos...</span>
            </div>
          ) : failed ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
              <WifiOff className="h-7 w-7 text-muted-foreground/30" />
              <span className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-widest">Sin datos disponibles</span>
              <span className="text-[9px] text-muted-foreground/40 font-mono max-w-[200px] leading-relaxed">
                {symbol} · Yahoo Finance no pudo entregar datos para este rango/intervalo
              </span>
              <button
                onClick={() => fetchData(symbol, range, interval)}
                className="mt-2 flex items-center gap-1.5 text-[10px] font-mono font-bold text-primary/70 hover:text-primary border border-primary/20 hover:border-primary/40 px-3 py-1 rounded transition-all"
              >
                <RefreshCw size={10} /> Reintentar
              </button>
            </div>
          ) : (
            <TradingChart data={data} type={chartType} intraday={isIntraday} />
          )}
        </div>

        {/* ── Row 3: Interval selector + status ────────────────────────── */}
        <div className="flex items-center justify-between px-2 py-1.5 bg-secondary/30 border-t border-border/50 shrink-0 gap-2">
          {/* Interval buttons */}
          <div className="flex items-center gap-0.5 bg-background/40 rounded-md p-0.5">
            {INTERVALS.map(ivl => {
              const compatible = isCompatible(ivl, range);
              const active     = interval === ivl.value;
              return (
                <button
                  key={ivl.value}
                  onClick={() => handleIntervalChange(ivl.value)}
                  title={compatible ? ivl.display : `Requiere rango ≤ ${ivl.maxDays}d`}
                  className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow"
                      : compatible
                      ? "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      : "text-muted-foreground/25 cursor-pointer hover:text-muted-foreground/50"
                  }`}
                >
                  {ivl.label}
                </button>
              );
            })}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 shrink-0">
            {currentInterval.refresh > 0 && !loading && !failed && (
              <span className="text-[9px] font-mono text-amber-400/60">
                ↻ {countdown}s
              </span>
            )}
            {lastUpdate && (
              <span className="text-[9px] font-mono text-muted-foreground/50 hidden sm:block">
                {lastUpdate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
            <div className={`w-1.5 h-1.5 rounded-full ${failed ? "bg-red-500" : loading ? "bg-amber-400 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
            <span className={`text-[9px] font-mono uppercase ${failed ? "text-red-400" : "text-emerald-500"}`}>
              {failed ? "Error" : loading ? "..." : "Live"}
            </span>
          </div>
        </div>

      </div>
    </Rnd>
  );
}
