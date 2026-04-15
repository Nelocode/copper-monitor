"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ExternalLink, MessageSquare, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockTwitsPost {
  id: string;
  body: string;
  author: string;
  createdAt: string;
  sentiment: "Bullish" | "Bearish" | null;
  source: "stocktwits";
  url: string;
}

interface RedditPost {
  id: string;
  body: string;
  author: string;
  subreddit: string;
  score: number;
  numComments: number;
  createdAt: string;
  source: "reddit";
  url: string;
}

interface SocialFeedProps {
  data: {
    stocktwits: StockTwitsPost[];
    reddit: RedditPost[];
    errors: { stocktwits: string | null; reddit: string | null };
    fetchedAt: string;
  } | null;
  loading?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

// ─── Sentiment badge ──────────────────────────────────────────────────────────

function SentimentBadge({ sentiment }: { sentiment: "Bullish" | "Bearish" | null }) {
  if (sentiment === "Bullish")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-400/10 border-emerald-400/30">
        <TrendingUp className="w-2.5 h-2.5" /> Bullish
      </span>
    );
  if (sentiment === "Bearish")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border text-red-400 bg-red-400/10 border-red-400/30">
        <TrendingDown className="w-2.5 h-2.5" /> Bearish
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border text-zinc-500 bg-zinc-500/10 border-zinc-500/20">
      <Minus className="w-2.5 h-2.5" /> Neutral
    </span>
  );
}

// ─── StockTwits Tab ───────────────────────────────────────────────────────────

function StockTwitsTab({ posts, error }: { posts: StockTwitsPost[]; error: string | null }) {
  const bullish = posts.filter((p) => p.sentiment === "Bullish").length;
  const bearish = posts.filter((p) => p.sentiment === "Bearish").length;
  const total = posts.length;

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
        <MessageSquare className="w-6 h-6 opacity-30" />
        <span className="text-xs">No se pudo conectar con StockTwits</span>
      </div>
    );

  if (total === 0)
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
        <MessageSquare className="w-6 h-6 opacity-30" />
        <span className="text-xs">Sin menciones recientes en StockTwits</span>
      </div>
    );

  const bullPct = total > 0 ? Math.round((bullish / total) * 100) : 0;
  const bearPct = total > 0 ? Math.round((bearish / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Sentiment bar */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-secondary">
          <div
            className="h-full bg-emerald-500 float-left rounded-l-full"
            style={{ width: `${bullPct}%` }}
          />
          <div
            className="h-full bg-red-500 float-right rounded-r-full"
            style={{ width: `${bearPct}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-emerald-400 shrink-0">{bullish}↑</span>
        <span className="text-[10px] font-mono text-red-400 shrink-0">{bearish}↓</span>
        <span className="text-[10px] font-mono text-muted-foreground shrink-0">{total} total</span>
      </div>

      {/* Posts */}
      <div className="flex flex-col gap-1.5 max-h-[320px] overflow-y-auto no-scrollbar pr-1">
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-1 p-2.5 rounded-lg border border-border/40 bg-background/40 hover:border-border hover:bg-background/70 transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-primary font-mono">@{post.author}</span>
                <SentimentBadge sentiment={post.sentiment} />
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-[10px] font-mono">{timeAgo(post.createdAt)}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <p className="text-xs text-foreground/80 leading-snug">{truncate(post.body, 160)}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Reddit Tab ───────────────────────────────────────────────────────────────

function RedditTab({ posts, error }: { posts: RedditPost[]; error: string | null }) {
  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
        <MessageSquare className="w-6 h-6 opacity-30" />
        <span className="text-xs">No se pudo conectar con Reddit</span>
      </div>
    );

  if (posts.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
        <MessageSquare className="w-6 h-6 opacity-30" />
        <span className="text-xs">Sin menciones recientes en Reddit</span>
      </div>
    );

  return (
    <div className="flex flex-col gap-1.5 max-h-[360px] overflow-y-auto no-scrollbar pr-1">
      {posts.map((post) => (
        <a
          key={post.id}
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col gap-1 p-2.5 rounded-lg border border-border/40 bg-background/40 hover:border-border hover:bg-background/70 transition-all"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-orange-400 font-mono">
              r/{post.subreddit}
            </span>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-[10px] font-mono">{timeAgo(post.createdAt)}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <p className="text-xs text-foreground/80 leading-snug">{truncate(post.body, 160)}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-muted-foreground font-mono">
              ▲ {post.score.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              💬 {post.numComments}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">u/{post.author}</span>
          </div>
        </a>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "stocktwits" | "reddit";

export function SocialFeed({ data, loading }: SocialFeedProps) {
  const [activeTab, setActiveTab] = useState<Tab>("stocktwits");

  const tabs: { id: Tab; label: string; count: number }[] = useMemo(
    () => [
      { id: "stocktwits", label: "StockTwits", count: data?.stocktwits?.length ?? 0 },
      { id: "reddit",     label: "Reddit",     count: data?.reddit?.length ?? 0 },
    ],
    [data]
  );

  const fetchedAt = data?.fetchedAt
    ? new Date(data.fetchedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <Card className="bg-card/50 backdrop-blur-md border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Sentimiento Social</CardTitle>
          <div className="flex items-center gap-2">
            {fetchedAt && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                <RefreshCw className="w-2.5 h-2.5" /> {fetchedAt}
              </span>
            )}
            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              LIVE
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all border ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground border-border/50 hover:border-border hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    activeTab === tab.id ? "bg-white/20" : "bg-secondary"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {loading || !data ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : activeTab === "stocktwits" ? (
          <StockTwitsTab posts={data.stocktwits} error={data.errors.stocktwits} />
        ) : (
          <RedditTab posts={data.reddit} error={data.errors.reddit} />
        )}
      </CardContent>
    </Card>
  );
}
