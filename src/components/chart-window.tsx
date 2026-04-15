"use client";

import { useState, useEffect, useCallback } from "react";
import { Rnd } from "react-rnd";
import { TradingChart } from "./trading-chart";
import { X, BarChart2, CandlestickChart, ExternalLink, Loader2, WifiOff } from "lucide-react";
import { Button } from "./ui/button";

interface ChartWindowProps {
  id: string;
  symbol: string;
  title: string;
  onClose: (id: string) => void;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
}

const RANGES = [
  { label: "1M",  value: "1mo" },
  { label: "3M",  value: "3mo" },
  { label: "6M",  value: "6mo" },
  { label: "1A",  value: "1y"  },
] as const;

type RangeValue = typeof RANGES[number]["value"];

export function ChartWindow({ id, symbol, title, onClose, defaultPosition, defaultSize }: ChartWindowProps) {
  const [chartType, setChartType] = useState<"candle" | "area">("candle");
  const [range, setRange]         = useState<RangeValue>("6mo");
  const [data, setData]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [failed, setFailed]       = useState(false);

  const fetchData = useCallback(async (sym: string, rng: RangeValue) => {
    setLoading(true);
    setFailed(false);
    try {
      const res  = await fetch(`/api/market-data?symbol=${sym}&range=${rng}&interval=1d`);
      const json = await res.json();
      if (json.success && json.historical?.length > 0) {
        setData(json.historical);
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

  // Fetch on mount and when range changes
  useEffect(() => {
    fetchData(symbol, range);
  }, [symbol, range, fetchData]);

  const handlePopOut = () => {
    const width  = 800;
    const height = 600;
    const left   = window.screenX + (window.outerWidth  - width)  / 2;
    const top    = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      `/popout/${symbol}?type=${chartType}`,
      `Chart_${symbol}_${Date.now()}`,
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );
  };

  return (
    <Rnd
      default={{
        x: defaultPosition?.x || 0,
        y: defaultPosition?.y || 0,
        width:  defaultSize?.width  || 600,
        height: defaultSize?.height || 450,
      }}
      minWidth={340}
      minHeight={280}
      bounds="parent"
      dragHandleClassName="handle"
      className="z-10"
    >
      <div className="flex flex-col w-full h-full bg-card border border-border rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">

        {/* Header / Handle */}
        <div className="handle flex items-center justify-between px-3 py-2 bg-secondary/50 border-b border-border cursor-move select-none gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="text-xs font-bold tracking-wider text-foreground uppercase truncate">{title}</span>
            <span className="text-[10px] text-muted-foreground font-mono px-1.5 py-0.5 rounded bg-background/50 shrink-0">{symbol}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Range selector */}
            <div className="flex items-center gap-0.5 bg-background/40 rounded-md p-0.5 mr-1">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
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

            {/* Chart type toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={() => setChartType(chartType === "candle" ? "area" : "candle")}
              title="Cambiar tipo de gráfico"
            >
              {chartType === "candle" ? <BarChart2 size={14} /> : <CandlestickChart size={14} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={handlePopOut}
              title="Abrir en ventana independiente"
            >
              <ExternalLink size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onClose(id)}
            >
              <X size={14} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-2 bg-background/20 relative overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Cargando datos...</span>
            </div>
          ) : failed ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4">
              <WifiOff className="h-6 w-6 text-muted-foreground/40" />
              <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">Sin datos disponibles</span>
              <span className="text-[9px] text-muted-foreground/40 font-mono">{symbol} · Yahoo Finance no disponible</span>
              <button
                onClick={() => fetchData(symbol, range)}
                className="mt-1 text-[9px] font-mono text-primary/60 hover:text-primary underline underline-offset-2 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <TradingChart data={data} type={chartType} />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-1.5 bg-secondary/30 border-t border-border/50 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
            {RANGES.find(r => r.value === range)?.label} · Intervalo Diario
          </span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono text-emerald-500 uppercase">Synced</span>
          </div>
        </div>

      </div>
    </Rnd>
  );
}
