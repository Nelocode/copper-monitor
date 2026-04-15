"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

interface MarketQuote {
  price: number;
  currency: string;
  changePercent: number;
  volume: number;
  name: string;
}

interface StrategicSuggestionsProps {
  data?: {
    cgnt: MarketQuote;
    ocg: MarketQuote;
  } | null;
}

type SuggestionTone = "bullish" | "bearish" | "neutral" | "opportunity";

interface Suggestion {
  tone: SuggestionTone;
  title: string;
  body: string;
  cta: string;
}

function generateSuggestion(cgnt: MarketQuote, ocg: MarketQuote): Suggestion {
  const cgntUp = cgnt.changePercent > 0;
  const ocgUp = ocg.changePercent > 0;
  const cgntStrong = cgnt.changePercent > 2;
  const ocgStrong = ocg.changePercent > 2;
  const cgntWeak = cgnt.changePercent < -2;
  const totalVolume = (cgnt.volume || 0) + (ocg.volume || 0);
  const highVolume = totalVolume > 800_000;

  // Ambos fuertes al alza + volumen alto → momento ideal IR
  if (cgntStrong && ocgStrong && highVolume) {
    return {
      tone: "bullish",
      title: "Ventana óptima para comunicación con inversores",
      body: `CGNT.V (+${cgnt.changePercent.toFixed(2)}%) y OCG.V (+${ocg.changePercent.toFixed(2)}%) avanzan simultáneamente con volumen combinado de ${totalVolume.toLocaleString("es-CO")} acciones. Este contexto de momentum dual es ideal para publicar actualizaciones de proyecto La Estrella / Mocoa — máxima receptividad de inversores activos.`,
      cta: "Preparar Comunicado",
    };
  }

  // CGNT sube fuerte → aprovechar momentum
  if (cgntStrong && cgntUp) {
    return {
      tone: "bullish",
      title: "Momentum positivo en CGNT.V — activar IR proactivo",
      body: `Con CGNT.V avanzando +${cgnt.changePercent.toFixed(2)}% a ${cgnt.price.toFixed(3)} ${cgnt.currency}, el mercado está receptivo. Se recomienda contactar a analistas de cobertura y actualizar presentación corporativa. El volumen de ${cgnt.volume.toLocaleString("es-CO")} acciones indica presencia institucional activa.`,
      cta: "Ver Presentación Corporativa",
    };
  }

  // Ambos positivos, sin ser fuertes → consolidación sana
  if (cgntUp && ocgUp) {
    return {
      tone: "bullish",
      title: "Sector metales TSX-V en consolidación positiva",
      body: `Tanto CGNT.V (+${cgnt.changePercent.toFixed(2)}%) como OCG.V (+${ocg.changePercent.toFixed(2)}%) avanzan en la sesión. Contexto sector favorable — buen momento para reforzar presencia en foros de inversores minoristas (Reddit/Stockhouse) antes del cierre de mercado.`,
      cta: "Ver Estrategia de Contenido",
    };
  }

  // Caída fuerte de CGNT → posible oportunidad de comunicación de contención
  if (cgntWeak) {
    return {
      tone: "bearish",
      title: "Presión vendedora — activar comunicación de soporte",
      body: `CGNT.V cede ${cgnt.changePercent.toFixed(2)}% en la sesión actual. En contextos de corrección, la comunicación proactiva de hitos técnicos del proyecto Mocoa puede anclar el sentimiento inversor. Considerar publicar avances de perforación o resultados de laboratorio pendientes para contrarrestar la presión.`,
      cta: "Revisar Hitos Pendientes",
    };
  }

  // CGNT baja, OCG sube → divergencia sectorial
  if (!cgntUp && ocgUp) {
    return {
      tone: "opportunity",
      title: "Divergencia sectorial — oportunidad para diferenciar CGNT.V",
      body: `OCG.V avanza +${ocg.changePercent.toFixed(2)}% mientras CGNT.V cede ${cgnt.changePercent.toFixed(2)}%. La fortaleza sectorial del TSX-V en plata/cobre no se está trasladando a CGNT.V. Publicar diferenciadores del proyecto La Estrella (grado de cobre, hectareaje, proxies de valor) puede capturar flujo institucional.`,
      cta: "Revisar Deck Inversores",
    };
  }

  // Volumen alto pero precio plano → acumulación silenciosa
  if (highVolume && Math.abs(cgnt.changePercent) < 1) {
    return {
      tone: "opportunity",
      title: "Acumulación silenciosa detectada en CGNT.V",
      body: `Volumen combinado de ${totalVolume.toLocaleString("es-CO")} acciones con una variación de precio mínima (${cgnt.changePercent.toFixed(2)}%) sugiere fase de acumulación. Patrón consistente con entrada institucional cautelosa. Monitorear el breaker de ${(cgnt.price * 1.05).toFixed(3)} ${cgnt.currency} como nivel de confirmación.`,
      cta: "Ver Análisis Técnico",
    };
  }

  // Default neutral
  return {
    tone: "neutral",
    title: "Mercado en modo de espera — mantener visibilidad",
    body: `CGNT.V cotiza a ${cgnt.price.toFixed(3)} ${cgnt.currency} (${cgnt.changePercent >= 0 ? "+" : ""}${cgnt.changePercent.toFixed(2)}%) con actividad moderada. En sesiones de baja volatilidad, se recomienda mantener la cadencia de contenido en redes sociales y portales financieros para preservar el interés inversor de mediano plazo.`,
    cta: "Revisar Calendario IR",
  };
}

const toneConfig: Record<SuggestionTone, { border: string; icon: string; badge: string; badgeText: string }> = {
  bullish:     { border: "border-emerald-500/30 bg-emerald-500/5", icon: "text-emerald-500", badge: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30", badgeText: "Señal Alcista" },
  bearish:     { border: "border-red-500/30 bg-red-500/5",         icon: "text-red-400",     badge: "text-red-400 bg-red-400/10 border-red-400/30",           badgeText: "Alerta Bajista" },
  opportunity: { border: "border-amber-400/30 bg-amber-400/5",     icon: "text-amber-400",   badge: "text-amber-400 bg-amber-400/10 border-amber-400/30",     badgeText: "Oportunidad" },
  neutral:     { border: "border-zinc-500/30 bg-zinc-500/5",       icon: "text-zinc-400",    badge: "text-zinc-400 bg-zinc-400/10 border-zinc-400/30",         badgeText: "Mercado Neutral" },
};

const ToneIcon: Record<SuggestionTone, React.ElementType> = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  opportunity: Lightbulb,
  neutral: Minus,
};

export function StrategicSuggestions({ data }: StrategicSuggestionsProps) {
  const suggestion = useMemo(() => {
    if (!data?.cgnt || !data?.ocg) return null;
    return generateSuggestion(data.cgnt, data.ocg);
  }, [data]);

  if (!suggestion) {
    return (
      <div className="mt-6 h-24 rounded-xl border border-border/30 bg-card/30 animate-pulse" />
    );
  }

  const cfg = toneConfig[suggestion.tone];
  const Icon = ToneIcon[suggestion.tone];

  return (
    <Alert className={`mt-6 lg:col-span-3 border ${cfg.border}`}>
      <Icon className={`h-5 w-5 ${cfg.icon}`} />
      <AlertTitle className="flex items-center gap-3 flex-wrap">
        <span className="text-lg font-semibold text-foreground">{suggestion.title}</span>
        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ml-auto ${cfg.badge}`}>
          {suggestion.badgeText}
        </span>
      </AlertTitle>
      <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <p className="text-muted-foreground leading-relaxed text-sm">
          {suggestion.body}
        </p>
        <Button
          variant="outline"
          size="sm"
          className={`shrink-0 border ${cfg.badge} hover:bg-white/5 transition-all`}
        >
          {suggestion.cta} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
