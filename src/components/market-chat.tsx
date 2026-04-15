"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, ChevronDown, ChevronUp, Bot, User, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "./ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
  id:        string;
  role:      "user" | "assistant";
  content:   string;
  timestamp: Date;
  error?:    boolean;
}

interface MarketSnapshot {
  cgnt?: { price: number; changePercent: number; volume: number; currency: string } | null;
  ocg?:  { price: number; changePercent: number; volume: number; currency: string } | null;
}

interface MarketChatProps {
  marketData?: MarketSnapshot;
}

// ─── Quick prompts ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  "¿Qué indica el volumen de hoy en CGNT?",
  "¿Es buen momento para comunicar hitos públicos?",
  "Analiza la relación entre CGNT y OCG hoy",
  "¿Qué patrón técnico muestra el mercado ahora?",
  "¿Cómo comunicar una corrección a los inversores?",
  "Compara el momentum actual de ambas empresas",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(d: Date) {
  return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export function MarketChat({ marketData }: MarketChatProps) {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  // ─── Send message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id:        `u-${Date.now()}`,
      role:      "user",
      content:   trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: trimmed },
          ],
          marketData,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        const errorText =
          data.error === "no_api_key"
            ? "⚙️ Configura GROQ_API_KEY u OPENAI_API_KEY en EasyPanel para activar el asistente."
            : `Error: ${data.message ?? "No se pudo conectar al asistente."}`;

        setMessages(prev => [
          ...prev,
          { id: `e-${Date.now()}`, role: "assistant", content: errorText, timestamp: new Date(), error: true },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { id: `a-${Date.now()}`, role: "assistant", content: data.reply, timestamp: new Date() },
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id:        `e-${Date.now()}`,
          role:      "assistant",
          content:   "Error de conexión. Verifica la red del servidor.",
          timestamp: new Date(),
          error:     true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, marketData]);

  // ─── Market context bar ───────────────────────────────────────────────────
  const { cgnt, ocg } = marketData ?? {};
  const hasData = cgnt || ocg;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        open ? "h-[480px]" : "h-12"
      }`}
    >
      <div className="h-full flex flex-col bg-[#09090b]/95 backdrop-blur-xl border-t border-border shadow-2xl">

        {/* ── Toggle bar ──────────────────────────────────────────────────── */}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-3 px-4 h-12 hover:bg-white/3 transition-colors select-none w-full text-left shrink-0 border-b border-border/50"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-bold tracking-widest text-foreground uppercase">Asistente IR</span>
            <span className="text-[9px] font-mono text-muted-foreground/60 hidden sm:block">· Copper Giant Terminal</span>
          </div>

          {hasData && !open && (
            <div className="flex items-center gap-3 ml-4">
              {cgnt && (
                <span className={`text-[10px] font-mono ${cgnt.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  CGNT {cgnt.changePercent >= 0 ? "+" : ""}{cgnt.changePercent.toFixed(2)}%
                </span>
              )}
              {ocg && (
                <span className={`text-[10px] font-mono ${ocg.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  OCG {ocg.changePercent >= 0 ? "+" : ""}{ocg.changePercent.toFixed(2)}%
                </span>
              )}
            </div>
          )}

          {!open && (
            <span className="ml-auto text-[10px] font-mono text-muted-foreground/40 hidden sm:block">
              Consultar mercado, timing IR, análisis técnico…
            </span>
          )}

          <div className="ml-auto shrink-0">
            {open
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
              : <ChevronUp   className="h-4 w-4 text-muted-foreground" />
            }
          </div>
        </button>

        {/* ── Chat panel (only rendered when open) ────────────────────────── */}
        {open && (
          <div className="flex flex-col flex-1 min-h-0">

            {/* Market context badge */}
            {hasData && (
              <div className="flex items-center gap-4 px-4 py-1.5 bg-white/3 border-b border-border/30 shrink-0">
                <span className="text-[9px] text-muted-foreground/50 uppercase font-mono tracking-widest">Contexto activo:</span>
                {cgnt && (
                  <span className="text-[10px] font-mono text-foreground/70">
                    CGNT.V ${cgnt.price.toFixed(3)} {cgnt.currency}
                    <span className={`ml-1 ${cgnt.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      ({cgnt.changePercent >= 0 ? "+" : ""}{cgnt.changePercent.toFixed(2)}%)
                    </span>
                  </span>
                )}
                {ocg && (
                  <span className="text-[10px] font-mono text-foreground/70">
                    OCG ${ocg.price.toFixed(3)} {ocg.currency}
                    <span className={`ml-1 ${ocg.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      ({ocg.changePercent >= 0 ? "+" : ""}{ocg.changePercent.toFixed(2)}%)
                    </span>
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-mono text-emerald-500">contextualizado</span>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-4">
                  <Bot className="h-8 w-8 text-muted-foreground/20" />
                  <div>
                    <p className="text-sm text-muted-foreground/60 font-medium mb-1">Asistente estratégico de IR</p>
                    <p className="text-[11px] text-muted-foreground/40">Conoce el contexto de CGNT y OCG en tiempo real</p>
                  </div>
                  {/* Quick prompts */}
                  <div className="flex flex-wrap gap-1.5 justify-center max-w-lg mt-1">
                    {QUICK_PROMPTS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(p)}
                        className="text-[10px] font-mono text-primary/60 hover:text-primary border border-primary/15 hover:border-primary/30 px-2.5 py-1 rounded-full transition-all hover:bg-primary/5"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                    msg.role === "assistant" ? "bg-primary/10 border border-primary/20" : "bg-secondary"
                  }`}>
                    {msg.role === "assistant"
                      ? <Sparkles className="h-3 w-3 text-primary" />
                      : <User      className="h-3 w-3 text-muted-foreground" />
                    }
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[80%] group ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                    <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      msg.error
                        ? "bg-red-500/10 border border-red-500/20 text-red-400"
                        : msg.role === "user"
                        ? "bg-primary/15 border border-primary/20 text-foreground"
                        : "bg-secondary/60 border border-border/40 text-foreground"
                    }`}>
                      {msg.error && <AlertCircle className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />}
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground/30 px-1">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                  </div>
                  <div className="bg-secondary/60 border border-border/40 rounded-xl">
                    <TypingDots />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts (after first message) */}
            {messages.length > 0 && !loading && (
              <div className="flex gap-1.5 px-4 py-1.5 overflow-x-auto shrink-0 border-t border-border/20">
                {QUICK_PROMPTS.slice(0, 4).map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p)}
                    className="shrink-0 text-[10px] font-mono text-muted-foreground/50 hover:text-primary border border-border/30 hover:border-primary/30 px-2 py-0.5 rounded-full transition-all whitespace-nowrap"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-2 border-t border-border/40 shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="Consultar sobre CGNT, OCG, mercado, IR, timing…"
                className="flex-1 bg-secondary/40 border border-border/40 rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 focus:bg-secondary/60 transition-all font-mono"
                disabled={loading}
              />
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="h-8 w-8 shrink-0 bg-primary hover:bg-primary/80 disabled:opacity-30"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
