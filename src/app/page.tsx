"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { KPICards } from "@/components/kpi-cards";
import { SentimentAlerts } from "@/components/sentiment-alerts";
import { StrategicSuggestions } from "@/components/strategic-suggestions";
import dynamic from "next/dynamic";
import { Loader2, Plus, Monitor, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChartWindow = dynamic(() => import("@/components/chart-window").then(mod => mod.ChartWindow), {
  ssr: false,
  loading: () => (
    <div className="w-[300px] h-[250px] bg-card border border-border animate-pulse rounded-xl flex items-center justify-center">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  ),
});

interface WindowState {
  id: string;
  symbol: string;
  title: string;
  data: any[];
  loading: boolean;
}

export default function Dashboard() {
  const [masterData, setMasterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [windows, setWindows] = useState<WindowState[]>([]);

  // Fetch initial master data for KPIs and Sentiment
  useEffect(() => {
    async function loadMasterData() {
      try {
        const [res1, res2] = await Promise.all([
          fetch("/api/market-data?symbol=CGNT.V"),
          fetch("/api/market-data?symbol=LBCMF")
        ]);
        const json1 = await res1.json();
        const json2 = await res2.json();
        
        if (json1.success && json2.success) {
          setMasterData({
            cgnt: json1.quote,
            lbcmf: json2.quote,
          });
        }
      } catch (err) {
        console.error("Failed to load master data", err);
      } finally {
        setLoading(false);
      }
    }
    loadMasterData();
  }, []);

  const addChartWindow = useCallback(async (symbol: string, title: string) => {
    const id = `${symbol}-${Date.now()}`;
    const newWindow: WindowState = { id, symbol, title, data: [], loading: true };
    setWindows(prev => [...prev, newWindow]);

    try {
      const res = await fetch(`/api/market-data?symbol=${symbol}&range=6mo`);
      const json = await res.json();
      if (json.success) {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, data: json.historical, loading: false } : w));
      }
    } catch (err) {
      console.error(`Failed to load window data for ${symbol}`, err);
    }
  }, []);

  const closeWindow = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  };

  // Pre-load default windows
  useEffect(() => {
    if (!loading && windows.length === 0) {
      addChartWindow("CGNT.V", "Copper Giant (TSXV)");
      setTimeout(() => addChartWindow("LBCMF", "Copper Giant (OTCQB)"), 500);
    }
  }, [loading, addChartWindow]);

  return (
    <div className="min-h-screen bg-[#000000] text-foreground font-sans selection:bg-primary/30 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo.webp" 
              alt="Copper Giant Logo" 
              width={160} 
              height={40} 
              className="object-contain"
              priority
            />
            <div className="hidden sm:block ml-4 pl-4 border-l border-border">
              <h1 className="text-sm font-bold tracking-tight text-foreground uppercase">Workstation Multimodal</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Terminal de Relaciones con Inversores</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/50 border border-border/50">
            <Activity className="h-3 w-3 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sistema Operativo v2.0 Live</span>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
              onClick={() => addChartWindow("HG=F", "Cobre Spot (HG=F)")}
            >
              <Plus className="mr-2 h-4 w-4" /> Nuevo Gráfico
            </Button>
            <div className="h-8 w-[1px] bg-border mx-2" />
            {loading ? (
              <span className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin"/> Syncing</span>
            ) : (
              <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded shadow-[0_0_10px_rgba(16,185,129,0.2)] border border-emerald-500/20">● CONECTADO</span>
            )}
          </div>
        </div>
      </header>

      {/* Workspace Area */}
      <main className="flex-1 relative overflow-hidden p-4">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse font-mono text-xs uppercase tracking-widest">Iniciando Espacio de Trabajo...</p>
          </div>
        ) : (
          <div className="h-full flex flex-col gap-6 overflow-y-auto no-scrollbar">
            
            {/* KPI Cards section (Static at top) */}
            {masterData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                <KPICards data={masterData} />
                <div className="lg:col-span-2">
                    <StrategicSuggestions />
                </div>
              </div>
            )}

            {/* Draggable Area - This takes the remaining space */}
            <div className="relative flex-1 min-h-[800px] border border-dashed border-border/30 rounded-2xl bg-gradient-to-b from-transparent to-secondary/5">
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <Monitor className="w-96 h-96" />
              </div>
              
              {windows.map((win, idx) => (
                <ChartWindow
                  key={win.id}
                  id={win.id}
                  symbol={win.symbol}
                  title={win.title}
                  data={win.data}
                  onClose={closeWindow}
                  defaultPosition={{ x: 20 + (idx * 40), y: 20 + (idx * 40) }}
                />
              ))}

              <div className="absolute bottom-10 right-10 flex flex-col gap-4 max-w-sm">
                <SentimentAlerts />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="px-6 py-2 border-t border-border/20 bg-black/40 text-[9px] text-muted-foreground flex justify-between items-center">
        <div className="flex gap-4">
           <span>COPPER GIANT RESOURCES CORP</span>
           <span className="text-secondary-foreground/20">|</span>
           <span>SECURE IR TERMINAL</span>
        </div>
        <div className="font-mono opacity-50">
          PROPRIETARY MULTIMODAL INTERFACE V.2.1
        </div>
      </footer>
    </div>
  );
}
