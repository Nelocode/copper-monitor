"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { KPICards } from "@/components/kpi-cards";
import { SentimentAlerts } from "@/components/sentiment-alerts";
import { StrategicSuggestions } from "@/components/strategic-suggestions";
import { SocialFeed } from "@/components/social-feed";
import { BidAskWidget } from "@/components/bid-ask-widget";
import { MarketChat } from "@/components/market-chat";
import dynamic from "next/dynamic";
import { Loader2, Monitor, Activity } from "lucide-react";

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
}

const SOCIAL_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function Dashboard() {
  const [masterData, setMasterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [socialData, setSocialData] = useState<any>(null);
  const [socialLoading, setSocialLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch market data for KPIs
  useEffect(() => {
    async function loadMasterData() {
      try {
        const [res1, res2] = await Promise.allSettled([
          fetch("/api/market-data?symbol=CGNT.V").then(r => r.json()),
          fetch("/api/market-data?symbol=OCG.TO").then(r => r.json()),
        ]);

        const json1 = res1.status === 'fulfilled' ? res1.value : null;
        const json2 = res2.status === 'fulfilled' ? res2.value : null;

        const cgnt = json1?.success ? json1.quote : null;
        const ocg  = json2?.success ? json2.quote : null;

        // Surface whatever data we have — don't block intelligence on both succeeding
        if (cgnt || ocg) {
          setMasterData({ cgnt, ocg });
        }
      } catch (err) {
        console.error("Failed to load master data", err);
      } finally {
        setLoading(false);
      }
    }
    loadMasterData();
  }, []);

  // Fetch + poll social sentiment data
  useEffect(() => {
    async function fetchSocial() {
      try {
        const res = await fetch("/api/social-sentiment");
        const json = await res.json();
        if (json.success) setSocialData(json);
      } catch (err) {
        console.error("Failed to load social data", err);
      } finally {
        setSocialLoading(false);
      }
    }
    fetchSocial();
    const interval = setInterval(fetchSocial, SOCIAL_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const addChartWindow = useCallback((symbol: string, title: string) => {
    const id = `${symbol}-${Date.now()}`;
    setWindows(prev => [...prev, { id, symbol, title }]);
  }, []);

  const closeWindow = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  };

  // Pre-load default windows
  useEffect(() => {
    if (!loading && windows.length === 0) {
      addChartWindow("CGNT.V", "Copper Giant (TSXV)");
      setTimeout(() => addChartWindow("OCG.TO", "Outcrop Silver (TSX)"), 500);
    }
  }, [loading, windows.length, addChartWindow]);

  if (!isClient) return null;

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
          <div className="h-full flex flex-col gap-4 overflow-y-auto no-scrollbar">
            
            {/* Row 1: KPI Cards + BidAsk widgets */}
            {masterData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="lg:col-span-3">
                  <KPICards data={masterData} />
                </div>
                {masterData.cgnt && <BidAskWidget symbol="CGNT.V" quote={masterData.cgnt} />}
                {masterData.ocg  && <BidAskWidget symbol="OCG.TO" quote={masterData.ocg}  />}
              </div>
            )}

            {/* Row 2: Strategic Suggestion (full width) */}
            {masterData && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-1000 delay-100">
                <StrategicSuggestions data={masterData} />
              </div>
            )}

            {/* Row 3: Social Feed + Sentiment Alerts (side by side) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-1000 delay-150">
              <div className="lg:col-span-2">
                <SocialFeed data={socialData} loading={socialLoading} />
              </div>
              <div>
                <SentimentAlerts data={masterData} />
              </div>
            </div>

            {/* Row 4: Draggable Chart Workspace */}
            <div className="relative flex-1 min-h-[700px] border border-dashed border-border/30 rounded-2xl bg-gradient-to-b from-transparent to-secondary/5">
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <Monitor className="w-96 h-96" />
              </div>
              
              {windows.map((win, idx) => (
                <ChartWindow
                  key={win.id}
                  id={win.id}
                  symbol={win.symbol}
                  title={win.title}
                  onClose={closeWindow}
                  defaultPosition={{ x: 20 + (idx * 40), y: 20 + (idx * 40) }}
                />
              ))}
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
      {/* AI Market Chat - fixed bottom panel */}
      <MarketChat marketData={masterData ?? undefined} />

    </div>
  );
}
