"use client";

import { Rnd } from "react-rnd";
import { X, ExternalLink, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";

// ─── Symbol conversion: CGNT.V → TSXV:CGNT ──────────────────────────────────
function toTVSymbol(symbol: string): string {
  if (symbol.endsWith(".V"))  return `TSXV:${symbol.slice(0, -2)}`;
  if (symbol.endsWith(".TO")) return `TSX:${symbol.slice(0, -3)}`;
  return symbol;
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
  const tvSymbol = toTVSymbol(symbol);
  // Unique ID for the TradingView frame (alphanumeric only)
  const frameId  = `tv_${id.replace(/[^a-z0-9]/gi, "_")}`;

  // TradingView widget embed URL
  const tvUrl =
    `https://s.tradingview.com/widgetembed/` +
    `?frameElementId=${frameId}` +
    `&symbol=${encodeURIComponent(tvSymbol)}` +
    `&interval=D` +                       // default daily — user changes inside widget
    `&theme=dark` +
    `&style=1` +                          // candlestick
    `&timezone=America%2FNew_York` +      // Eastern — TSX/TSX-V market hours
    `&locale=es` +
    `&toolbar_bg=%23000000` +
    `&hide_top_toolbar=0` +               // show TradingView range/interval Bar
    `&hide_legend=0` +
    `&hide_volume=0` +
    `&calendar=0` +
    `&saveimage=0` +
    `&show_popup_button=0`;

  // Open symbol directly in full TradingView
  const handlePopOut = () => {
    window.open(
      `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`,
      `TV_${symbol}_${Date.now()}`,
      "width=1200,height=750,resizable=yes,menubar=no,toolbar=no"
    );
  };

  return (
    <Rnd
      default={{
        x:      defaultPosition?.x  || 0,
        y:      defaultPosition?.y  || 0,
        width:  defaultSize?.width  || 640,
        height: defaultSize?.height || 490,
      }}
      minWidth={360}
      minHeight={280}
      bounds="parent"
      dragHandleClassName="handle"
      className="z-10"
    >
      <div className="flex flex-col w-full h-full bg-[#000] border border-border rounded-xl shadow-2xl overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="handle flex items-center justify-between px-3 py-1.5 bg-[#0a0a0a] border-b border-[#1a1a1a] cursor-move select-none gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="text-[11px] font-bold tracking-wider text-white uppercase truncate">{title}</span>
            <span className="text-[9px] text-zinc-500 font-mono px-1.5 py-0.5 rounded bg-white/5 shrink-0">{symbol}</span>
            <span className="text-[9px] font-mono text-emerald-500/50 shrink-0 hidden sm:block">TradingView · LIVE</span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 text-zinc-500 hover:text-primary"
              onClick={handlePopOut}
              title="Abrir en TradingView completo"
            >
              <ExternalLink size={13} />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 text-zinc-500 hover:text-destructive"
              onClick={() => onClose(id)}
            >
              <X size={13} />
            </Button>
          </div>
        </div>

        {/* ── TradingView iframe ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden bg-black">
          <iframe
            id={frameId}
            src={tvUrl}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            allowFullScreen
            scrolling="no"
            title={`${symbol} Chart`}
          />
        </div>

      </div>
    </Rnd>
  );
}
