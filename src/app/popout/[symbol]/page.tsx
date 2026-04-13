"use client";

import { use, useEffect, useState } from "react";
import { TradingChart } from "@/components/trading-chart";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PopoutChart({ params }: { params: Promise<{ symbol: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") as "candle" | "area") || "candle";

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/market-data?symbol=${resolvedParams.symbol}&range=6mo`);
        const json = await res.json();
        if (json.success) {
          setData(json.historical);
        }
      } catch (err) {
        console.error("Popout fetch failed", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [resolvedParams.symbol]);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex flex-col">
      <div className="px-4 py-2 border-b border-border bg-secondary/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs font-bold tracking-wider text-foreground uppercase">Monitor Independiente</span>
          <span className="text-[10px] text-muted-foreground font-mono px-1.5 py-0.5 rounded bg-background/50">{resolvedParams.symbol}</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[9px] font-mono text-emerald-500 uppercase">Live Stream</span>
        </div>
      </div>
      
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <TradingChart data={data} type={type} height={window.innerHeight - 40} />
        )}
      </div>
    </div>
  );
}
