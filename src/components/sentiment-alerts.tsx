"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, TrendingUp, TrendingDown, AlertTriangle, BarChart2, Activity, Zap, WifiOff } from "lucide-react";
import { useMemo } from "react";

interface MarketQuote {
  price: number;
  currency: string;
  changePercent: number;
  volume: number;
  name: string;
}

interface SentimentAlertsProps {
  data?: {
    cgnt: MarketQuote | null;
    ocg: MarketQuote | null;
  } | null;
}

type AlertType = "positive" | "warning" | "neutral" | "critical";

interface Alert {
  id: number;
  type: AlertType;
  message: string;
  time: string;
  icon: React.ElementType;
  metric?: string;
}

function analyzeMarket(cgnt: MarketQuote | null, ocg: MarketQuote | null): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();
  const timeStr = now.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

  // --- CGNT.V análisis de precio ---
  if (cgnt) {
    if (cgnt.changePercent >= 3) {
      alerts.push({ id: 1, type: "positive", icon: TrendingUp, metric: `+${cgnt.changePercent.toFixed(2)}%`, message: `CGNT.V registra un avance fuerte de +${cgnt.changePercent.toFixed(2)}% en la sesión. Momentum positivo visible — ventana favorable para comunicados de prensa e interacción con inversores institucionales.`, time: `Actualizado ${timeStr}` });
    } else if (cgnt.changePercent > 0.5) {
      alerts.push({ id: 1, type: "positive", icon: TrendingUp, metric: `+${cgnt.changePercent.toFixed(2)}%`, message: `CGNT.V avanza +${cgnt.changePercent.toFixed(2)}% a ${cgnt.price.toFixed(3)} ${cgnt.currency}. Actividad compradora moderada en la sesión actual.`, time: `Actualizado ${timeStr}` });
    } else if (cgnt.changePercent < -3) {
      alerts.push({ id: 1, type: "critical", icon: TrendingDown, metric: `${cgnt.changePercent.toFixed(2)}%`, message: `Presión vendedora significativa en CGNT.V (${cgnt.changePercent.toFixed(2)}%). Se recomienda monitorear posibles catalizadores macro o noticias del sector cobre.`, time: `Actualizado ${timeStr}` });
    } else if (cgnt.changePercent < -1) {
      alerts.push({ id: 1, type: "warning", icon: AlertTriangle, metric: `${cgnt.changePercent.toFixed(2)}%`, message: `CGNT.V muestra corrección de ${cgnt.changePercent.toFixed(2)}% en la sesión. Precio actual: ${cgnt.price.toFixed(3)} ${cgnt.currency}. Posible reconsolidación antes de próximo movimiento.`, time: `Actualizado ${timeStr}` });
    } else {
      alerts.push({ id: 1, type: "neutral", icon: Activity, metric: `${cgnt.changePercent >= 0 ? "+" : ""}${cgnt.changePercent.toFixed(2)}%`, message: `CGNT.V consolida sin tendencia definida (${cgnt.changePercent.toFixed(2)}%) a ${cgnt.price.toFixed(3)} ${cgnt.currency}. Mercado en fase de absorción — volumen bajo presión.`, time: `Actualizado ${timeStr}` });
    }
  }

  // --- OCG.V análisis ---
  if (ocg) {
    if (ocg.changePercent >= 2) {
      alerts.push({ id: 2, type: "positive", icon: Zap, metric: `+${ocg.changePercent.toFixed(2)}%`, message: `OCG.V (Outcrop Silver) lidera con +${ocg.changePercent.toFixed(2)}% en TSX-V. Correlación positiva con CGNT.V refuerza el apetito inversor en metales base del portafolio.`, time: `Actualizado ${timeStr}` });
    } else if (ocg.changePercent < -2) {
      alerts.push({ id: 2, type: "warning", icon: AlertTriangle, metric: `${ocg.changePercent.toFixed(2)}%`, message: `OCG.V bajo presión (${ocg.changePercent.toFixed(2)}%) a ${ocg.price.toFixed(3)} ${ocg.currency}. El sector plata/cobre en TSX-V muestra debilidad sectorial — vigilar correlación con CGNT.V.`, time: `Actualizado ${timeStr}` });
    } else {
      alerts.push({ id: 2, type: "neutral", icon: MessageSquare, metric: `${ocg.changePercent >= 0 ? "+" : ""}${ocg.changePercent.toFixed(2)}%`, message: `OCG.V estable a ${ocg.price.toFixed(3)} ${ocg.currency} (${ocg.changePercent.toFixed(2)}%). Volumen de referencia para el sector metales en TSX-V dentro de rangos normales.`, time: `Actualizado ${timeStr}` });
    }
  } else {
    alerts.push({ id: 2, type: "neutral", icon: WifiOff, metric: "N/D", message: `OCG.V no disponible en este momento. El análisis comparativo de sector se reanudará cuando el feed de datos esté activo.`, time: `Actualizado ${timeStr}` });
  }

  // --- Análisis de volumen combinado (solo si ambos disponibles) ---
  if (cgnt && ocg) {
    const totalVolume = (cgnt.volume || 0) + (ocg.volume || 0);
    const bothPositive = cgnt.changePercent > 0 && ocg.changePercent > 0;
    const bothNegative = cgnt.changePercent < 0 && ocg.changePercent < 0;

    if (totalVolume > 800_000) {
      alerts.push({ id: 3, type: "positive", icon: BarChart2, metric: `${totalVolume.toLocaleString("es-CO")} acc.`, message: `Volumen combinado elevado: ${totalVolume.toLocaleString("es-CO")} acciones negociadas hoy entre CGNT.V y OCG.V. Alta liquidez — condición óptima para publicaciones estratégicas de IR.`, time: `Actualizado ${timeStr}` });
    } else if (bothPositive) {
      alerts.push({ id: 3, type: "positive", icon: TrendingUp, metric: "Correlación ↑", message: `Ambos activos en terreno positivo simultáneamente. Correlación alcista entre CGNT.V (+${cgnt.changePercent.toFixed(2)}%) y OCG.V (+${ocg.changePercent.toFixed(2)}%) — señal de fortaleza sectorial en metales TSX-V.`, time: `Actualizado ${timeStr}` });
    } else if (bothNegative) {
      alerts.push({ id: 3, type: "warning", icon: AlertTriangle, metric: "Presión sectorial", message: `Presión vendedora simultánea en CGNT.V y OCG.V. Posible impacto macro o rotación sectorial. Volumen combinado: ${totalVolume.toLocaleString("es-CO")} acc. hoy.`, time: `Actualizado ${timeStr}` });
    } else {
      alerts.push({ id: 3, type: "neutral", icon: BarChart2, metric: `${totalVolume.toLocaleString("es-CO")} acc.`, message: `Volumen combinado de sesión: ${totalVolume.toLocaleString("es-CO")} acciones. Divergencia entre CGNT.V y OCG.V sugiere movimientos específicos por activo, no presión sectorial generalizada.`, time: `Actualizado ${timeStr}` });
    }
  } else if (cgnt) {
    // Solo CGNT disponible
    alerts.push({ id: 3, type: "neutral", icon: BarChart2, metric: `${(cgnt.volume || 0).toLocaleString("es-CO")} acc.`, message: `Volumen CGNT.V en sesión: ${(cgnt.volume || 0).toLocaleString("es-CO")} acciones. Feed de OCG.V no disponible — análisis sectorial parcial.`, time: `Actualizado ${timeStr}` });
  }

  return alerts;
}

const badgeConfig: Record<AlertType, { variant: "default" | "destructive" | "secondary" | "outline"; label: string; color: string }> = {
  positive: { variant: "default", label: "Positivo", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  warning:  { variant: "destructive", label: "Alerta", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  critical: { variant: "destructive", label: "Crítico", color: "text-red-500 bg-red-500/10 border-red-500/20" },
  neutral:  { variant: "secondary", label: "Neutral", color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20" },
};

const leftBarColor: Record<AlertType, string> = {
  positive: "bg-emerald-500",
  warning:  "bg-amber-400",
  critical: "bg-red-500",
  neutral:  "bg-zinc-600",
};

export function SentimentAlerts({ data }: SentimentAlertsProps) {
  const alerts = useMemo(() => {
    if (!data?.cgnt && !data?.ocg) return null;
    return analyzeMarket(data!.cgnt, data!.ocg);
  }, [data]);

  if (!alerts) {
    return (
      <Card className="col-span-1 bg-card/50 backdrop-blur-md border-border">
        <CardHeader>
          <CardTitle className="text-xl">Inteligencia de Mercado (IA)</CardTitle>
          <CardDescription>Esperando datos de mercado...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-secondary/30 animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 bg-card/50 backdrop-blur-md border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Inteligencia de Mercado</CardTitle>
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            LIVE
          </span>
        </div>
        <CardDescription>Análisis algorítmico en tiempo real — CGNT.V · OCG.V</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          const cfg = badgeConfig[alert.type];
          return (
            <div
              key={alert.id}
              className="flex flex-col space-y-2 p-3 rounded-lg border border-border/50 bg-background/50 relative overflow-hidden group transition-colors hover:border-border"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${leftBarColor[alert.type]} transition-opacity group-hover:opacity-100 opacity-60`} />
              <div className="flex items-center justify-between pl-1">
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${cfg.color}`}>
                  {cfg.label}
                  {alert.metric && <span className="ml-1.5 opacity-80">{alert.metric}</span>}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">{alert.time}</span>
              </div>
              <p className="text-sm text-foreground/90 leading-snug flex gap-2 pl-1">
                <Icon className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                {alert.message}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
