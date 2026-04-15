import { NextResponse } from "next/server";

// ─── Types ───────────────────────────────────────────────────────────────────
interface MarketData {
  price: number;
  currency: string;
  changePercent: number;
  volume: number;
  name?: string;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages:     ChatMessage[];
  marketData?: {
    cgnt?: MarketData | null;
    ocg?:  MarketData | null;
  };
}

// ─── System prompt with live market context ───────────────────────────────────
function buildSystemPrompt(cgnt?: MarketData | null, ocg?: MarketData | null): string {
  const now = new Date().toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "full",
    timeStyle: "short",
  });

  const fmt = (d?: MarketData | null, ticker = "") =>
    d
      ? `${ticker}: $${d.price.toFixed(3)} ${d.currency} | ${d.changePercent >= 0 ? "+" : ""}${d.changePercent.toFixed(2)}% | Vol: ${d.volume.toLocaleString("es-CO")} acc.`
      : `${ticker}: Sin datos de mercado`;

  return `Eres el Asistente Estratégico de IR del Terminal Privado de Copper Giant Resources Corp y Outcrop Silver & Gold Corp.

ROL Y ALCANCE:
Tu función es proveer análisis estratégico de Investor Relations (IR), interpretación de datos de mercado en tiempo real, análisis técnico básico y recomendaciones de timing para comunicaciones corporativas — siempre desde la perspectiva interna y confidencial del equipo directivo de ambas compañías.

DATOS DE MERCADO EN TIEMPO REAL (${now} COT):
• ${fmt(cgnt, "CGNT.V (TSX-V)")}
• ${fmt(ocg, "OCG (TSX)")}

CONTEXTO CORPORATIVO INTERNO:
— Copper Giant Resources Corp (CGNT.V):
  • Exploración de cobre en Colombia — Proyecto La Estrella y concesión Mocoa
  • Cotiza en TSX Venture Exchange
  • Enfoque en expansión de recursos y perforaciones de confirmación

— Outcrop Silver & Gold Corp (OCG):
  • Productor junior de plata y oro — Proyecto Santa Ana, Colombia
  • Graduada al TSX principal (main board)
  • En etapa de avance hacia producción comercial

DIRECTRICES:
✓ Responde SIEMPRE en español con tono ejecutivo y estratégico
✓ Usa los datos de mercado en tiempo real para contextualizar respuestas
✓ Cuando sea relevante, sugiere timing óptimo para comunicados, posteos en redes o contacto con analistas
✓ Analiza correlaciones entre CGNT y OCG como señales de fortaleza/debilidad sectorial
✓ Si detectas patrones técnicos o de volumen relevantes para la estrategia IR, destácalos
✓ Sé conciso — respuestas de 3-5 oraciones salvo que se pida más detalle
✗ No des asesoría financiera regulada ni recomendaciones de compra/venta explícitas
✗ No inventes datos que no tengas en el contexto

Este es un sistema seguro y confidencial de uso interno exclusivo del equipo de liderazgo.`;
}

// ─── Call Groq (primary) ──────────────────────────────────────────────────────
async function callGroq(messages: ChatMessage[], apiKey: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       "llama-3.3-70b-versatile",
      messages,
      max_tokens:  1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── Call OpenAI (fallback) ───────────────────────────────────────────────────
async function callOpenAI(messages: ChatMessage[], apiKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       "gpt-4o-mini",
      messages,
      max_tokens:  1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const { messages = [], marketData } = body;

    if (!messages.length) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    // Build full message list with system prompt
    const systemPrompt = buildSystemPrompt(marketData?.cgnt, marketData?.ocg);
    const fullMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const groqKey   = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let reply = "";

    if (groqKey) {
      reply = await callGroq(fullMessages, groqKey);
    } else if (openaiKey) {
      reply = await callOpenAI(fullMessages, openaiKey);
    } else {
      return NextResponse.json(
        {
          error:   "no_api_key",
          message: "Se requiere GROQ_API_KEY u OPENAI_API_KEY en las variables de entorno.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("AI chat error:", err);
    return NextResponse.json(
      { error: "ai_error", message: err?.message ?? "Error del asistente" },
      { status: 500 }
    );
  }
}
