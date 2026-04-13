"use client";

import { useState } from "react";
import { Rnd } from "react-rnd";
import { TradingChart } from "./trading-chart";
import { Maximize2, X, BarChart2, CandlestickChart, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

interface ChartWindowProps {
  id: string;
  symbol: string;
  data: any[];
  title: string;
  onClose: (id: string) => void;
  defaultPosition?: { x: number, y: number };
  defaultSize?: { width: number, height: number };
}

export function ChartWindow({ id, symbol, data, title, onClose, defaultPosition, defaultSize }: ChartWindowProps) {
  const [chartType, setChartType] = useState<"candle" | "area">("candle");
  const [isMinimized, setIsMinimized] = useState(false);

  const handlePopOut = () => {
    const width = 800;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
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
        width: defaultSize?.width || 600,
        height: defaultSize?.height || 450,
      }}
      minWidth={300}
      minHeight={250}
      bounds="parent"
      dragHandleClassName="handle"
      className="z-10"
    >
      <div className="flex flex-col w-full h-full bg-card border border-border rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Header / Handle */}
        <div className="handle flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border cursor-move select-none">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-bold tracking-wider text-foreground uppercase">{title}</span>
            <span className="text-[10px] text-muted-foreground font-mono px-1.5 py-0.5 rounded bg-background/50">{symbol}</span>
          </div>
          
          <div className="flex items-center gap-1">
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
        <div className="flex-1 p-2 bg-background/20">
          <TradingChart data={data} type={chartType} />
        </div>
        
        {/* Footer / Status */}
        <div className="px-4 py-1.5 bg-secondary/30 border-t border-border/50 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Real-time Data Active</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono text-emerald-500 uppercase">Synced</span>
          </div>
        </div>
      </div>
    </Rnd>
  );
}
