"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { KPICards } from "@/components/kpi-cards";
import { StockChart } from "@/components/stock-chart";
import { SentimentAlerts } from "@/components/sentiment-alerts";
import { StrategicSuggestions } from "@/components/strategic-suggestions";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/market-data");
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
              <h1 className="text-sm font-bold tracking-tight text-foreground uppercase">Monitoreo Bursátil</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Relaciones con Inversores</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
            {loading ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Sincronizando Mercado</span>
            ) : (
              <span className="text-emerald-500 font-mono">● LIVE</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Analizando cotizaciones y sentimiento...</p>
          </div>
        ) : data ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Secciones */}
            <KPICards data={data} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <StockChart data={data.historical} />
              <SentimentAlerts />
            </div>

            <StrategicSuggestions />
          </div>
        ) : (
          <div className="text-center text-destructive py-20">
            No se pudieron recuperar los datos de mercado. Intente nuevamente.
          </div>
        )}

      </main>
    </div>
  );
}
