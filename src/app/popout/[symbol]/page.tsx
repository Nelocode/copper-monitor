"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";

// Convert our symbol format to TradingView format
function toTVSymbol(symbol: string): string {
  if (symbol.endsWith(".V"))  return `TSXV:${symbol.slice(0, -2)}`;
  if (symbol.endsWith(".TO")) return `TSX:${symbol.slice(0, -3)}`;
  return symbol;
}

export default function PopoutChart({ params }: { params: Promise<{ symbol: string }> }) {
  const resolvedParams = use(params);
  const searchParams   = useSearchParams();
  const chartStyle     = searchParams.get("style") === "area" ? "2" : "1"; // 1=candle, 2=area

  const symbol   = decodeURIComponent(resolvedParams.symbol);
  const tvSymbol = toTVSymbol(symbol);
  const frameId  = `tv_popout_${symbol.replace(/[^a-z0-9]/gi, "_")}`;

  const tvUrl =
    `https://s.tradingview.com/widgetembed/` +
    `?frameElementId=${frameId}` +
    `&symbol=${encodeURIComponent(tvSymbol)}` +
    `&interval=D` +
    `&theme=dark` +
    `&style=${chartStyle}` +
    `&timezone=America%2FNew_York` +
    `&locale=es` +
    `&toolbar_bg=%23000000` +
    `&hide_top_toolbar=0` +
    `&hide_legend=0` +
    `&hide_volume=0` +
    `&calendar=0` +
    `&saveimage=0`;

  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex flex-col">
      {/* Minimal header */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#0a0a0a] border-b border-[#1a1a1a] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs font-bold tracking-widest text-white uppercase font-mono">{symbol}</span>
          <span className="text-[9px] font-mono text-emerald-500/60 ml-1">LIVE · TSX-V</span>
        </div>
        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
          Copper Giant IR Terminal
        </span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-mono text-emerald-500 uppercase">Streaming</span>
        </div>
      </div>

      {/* TradingView full chart */}
      <div className="flex-1 overflow-hidden">
        <iframe
          id={frameId}
          src={tvUrl}
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          allowFullScreen
          scrolling="no"
          title={`${symbol} - Live Chart`}
        />
      </div>
    </div>
  );
}
