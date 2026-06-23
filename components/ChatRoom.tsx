"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Send, Sparkles, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type {
  Message,
  VennRecommendation,
  VennRecommendationItem,
  VennResponse,
} from "@/types/database";

interface RealtimeMessageRow {
  id: string;
  trip_id: string;
  user_id: string | null;
  content: string;
  message_type: Message["message_type"];
  created_at: string;
  users: { name: string } | null;
  venn_recommendations: Pick<VennRecommendation, "id" | "recommendations_json"> | null;
}

const VENN_MENTION = /@venn/i;
const VENN_SUGGESTIONS = ["Find us a holiday", "Ask about a destination", "Filter results"];

export function ChatRoom({
  tripId,
  tripName,
  currentUserId,
  initialMessages,
}: {
  tripId: string;
  tripName: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [askingVenn, setAskingVenn] = useState(false);
  const [vennPanelOpen, setVennPanelOpen] = useState(false);
  const [vennInput, setVennInput] = useState("");
  // IDs of text messages that were sent via the Venn panel (for distinct rendering)
  const [vennQueryIds, setVennQueryIds] = useState(new Set<string>());
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const vennTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (vennPanelOpen) {
      const id = setTimeout(() => vennTextareaRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [vennPanelOpen]);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function setup() {
      // Postgres Changes are RLS-checked using the realtime socket's auth
      // token, which is only attached to the join payload if it's set
      // *before* subscribe() is called. Without this, the socket connects
      // as `anon`, `is_trip_member()` returns false, and no events ever
      // arrive (the chat then only updates on full page reloads).
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }

      if (cancelled) return;

      channel = supabase
        .channel(`trip-${tripId}-messages`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `trip_id=eq.${tripId}`,
          },
          async (payload) => {
            const newRow = payload.new as { id: string };

            const { data } = await supabase
              .from("messages")
              .select(
                "id, trip_id, user_id, content, message_type, recommendation_id, created_at, users(name), venn_recommendations(id, recommendations_json)"
              )
              .eq("id", newRow.id)
              .single();

            if (!data) return;

            const row = data as unknown as RealtimeMessageRow;

            const message: Message = {
              id: row.id,
              trip_id: row.trip_id,
              user_id: row.user_id,
              content: row.content,
              message_type: row.message_type,
              created_at: row.created_at,
              user: row.users
                ? { id: row.user_id ?? "", email: "", name: row.users.name, created_at: "" }
                : undefined,
              recommendation: row.venn_recommendations
                ? {
                    id: row.venn_recommendations.id,
                    trip_id: row.trip_id,
                    triggered_by: "",
                    recommendations_json: row.venn_recommendations.recommendations_json,
                    created_at: row.created_at,
                  }
                : undefined,
            };

            setMessages((prev) => {
              if (prev.some((m) => m.id === message.id)) return prev;
              return [...prev, message];
            });

            if (message.message_type === "venn_card") {
              setAskingVenn(false);
            }
          }
        )
        .subscribe();
    }

    void setup();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [tripId]);

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed) return;

    setSending(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({
        trip_id: tripId,
        user_id: currentUserId,
        content: trimmed,
        message_type: "text",
      })
      .select("id, created_at")
      .single();

    setSending(false);

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to send message.");
      return;
    }

    // Show the message immediately rather than waiting on the realtime
    // round-trip; the later postgres_changes event for this id is deduped.
    setMessages((prev) => {
      if (prev.some((m) => m.id === data.id)) return prev;
      return [
        ...prev,
        {
          id: data.id,
          trip_id: tripId,
          user_id: currentUserId,
          content: trimmed,
          message_type: "text",
          created_at: data.created_at,
        },
      ];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");

    if (VENN_MENTION.test(trimmed)) {
      void triggerVenn(trimmed);
      return;
    }

    await sendMessage(trimmed);
  }

  async function triggerVenn(message: string) {
    setAskingVenn(true);
    setError(null);

    const res = await fetch("/api/venn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId, message }),
    });

    if (!res.ok) {
      setAskingVenn(false);
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Venn couldn't process that. Please try again.");
    }
  }

  async function handleVennSubmit() {
    const trimmed = vennInput.trim();
    if (!trimmed || askingVenn) return;

    setVennPanelOpen(false);
    setVennInput("");

    // Post the query as a visible text message so the group sees what was asked
    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .insert({
        trip_id: tripId,
        user_id: currentUserId,
        content: trimmed,
        message_type: "text",
      })
      .select("id, created_at")
      .single();

    if (data) {
      setVennQueryIds((prev) => new Set([...prev, data.id]));
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [
          ...prev,
          {
            id: data.id,
            trip_id: tripId,
            user_id: currentUserId,
            content: trimmed,
            message_type: "text",
            created_at: data.created_at,
          },
        ];
      });
    }

    void triggerVenn(trimmed);
  }

  function fillChip(text: string) {
    setVennInput(text);
    requestAnimationFrame(() => vennTextareaRef.current?.focus());
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <h1 className="font-bold text-lg text-ink">{tripName}</h1>
          <p className="text-sm text-ink-3">
            Everyone&apos;s in — chat below, or tap the Venn button to get ideas, answers, or
            cost breakdowns.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="py-12 text-center text-sm text-ink-3">
              No messages yet. Say hi, or tap the Venn button to get started.
            </div>
          )}
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isOwn={message.user_id === currentUserId}
              isVennQuery={vennQueryIds.has(message.id)}
            />
          ))}
          {askingVenn && (
            <div className="flex items-center gap-2 text-sm text-ink-3">
              <Sparkles className="h-4 w-4 text-brand animate-pulse" />
              Venn is thinking...
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Full-screen backdrop — closes the Venn panel on outside click */}
      {vennPanelOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setVennPanelOpen(false)}
        />
      )}

      {/* Input bar — sits above the backdrop so clicking it doesn't dismiss the panel */}
      <div className="border-t border-line bg-white relative z-20">
        <div className="mx-auto max-w-3xl px-6 py-4 relative">

          {/* Venn panel — slides up from just above the input row */}
          <div
            className={cn(
              "absolute bottom-[calc(100%+12px)] right-0 z-20 w-80 rounded-2xl border border-black/[0.06] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.14)] transition-all duration-200 ease-out origin-bottom-right",
              vennPanelOpen
                ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                : "opacity-0 translate-y-3 scale-[0.97] pointer-events-none"
            )}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 pb-3 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2563eb]">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-semibold text-ink">Ask Venn</span>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setVennPanelOpen(false)}
                className="rounded-md p-0.5 text-ink-3 transition-colors hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Panel body */}
            <div className="px-4 pb-2 pt-3">
              <textarea
                ref={vennTextareaRef}
                value={vennInput}
                onChange={(e) => setVennInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleVennSubmit();
                  }
                }}
                placeholder="What do you want to know?"
                rows={3}
                className="w-full resize-none rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand-light"
              />
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {VENN_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => fillChip(s)}
                    className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink-2 transition-colors hover:border-brand/30 hover:bg-brand-light hover:text-brand"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Panel footer */}
            <div className="px-4 pb-4 pt-2">
              <Button
                type="button"
                className="w-full"
                onClick={() => void handleVennSubmit()}
                disabled={!vennInput.trim() || askingVenn}
              >
                <Sparkles className="h-4 w-4" />
                {askingVenn ? "Thinking..." : "Ask Venn"}
              </Button>
            </div>
          </div>

          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message your group..."
              className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand-light"
            />
            {/* Venn button — inline in the input row */}
            <button
              type="button"
              aria-label={vennPanelOpen ? "Close Venn" : "Ask Venn"}
              onClick={() => setVennPanelOpen((o) => !o)}
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] text-white transition-all duration-150 hover:bg-blue-600 active:scale-95",
                askingVenn && "opacity-60"
              )}
            >
              {vennPanelOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </button>
            <Button type="submit" disabled={sending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({
  message,
  isOwn,
  isVennQuery = false,
}: {
  message: Message;
  isOwn: boolean;
  isVennQuery?: boolean;
}) {
  if (message.message_type === "venn_card" && message.recommendation) {
    const response = message.recommendation.recommendations_json;

    switch (response.type) {
      case "recommendations":
        return <RecommendationsCard response={response} />;
      case "information":
        return <InformationCard response={response} />;
      case "clarification":
        return <ClarificationCard response={response} />;
      case "calculation":
        return <CalculationCard response={response} />;
    }
  }

  if (message.message_type === "system") {
    return (
      <div className="text-center text-xs text-ink-3 py-1">{message.content}</div>
    );
  }

  return (
    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
      <span className="px-1 mb-1 inline-flex items-center gap-1 text-xs text-ink-3">
        {isOwn ? "You" : message.user?.name ?? "Someone"}
        {isVennQuery && <Sparkles className="h-3 w-3 text-brand" />}
      </span>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
          isOwn ? "bg-brand text-white" : "bg-white border border-line text-ink"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function VennCardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand/20 bg-brand-light/50 p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand">
        <Sparkles className="h-4 w-4" />
        Venn
      </div>
      {children}
    </div>
  );
}

function RecommendationsCard({
  response,
}: {
  response: Extract<VennResponse, { type: "recommendations" }>;
}) {
  return (
    <VennCardShell>
      <p className="mb-3 text-sm text-ink-2">
        {response.message ?? "Here are some ideas for your group."}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {response.trips.map((item, i) => (
          <RecommendationCard key={i} item={item} />
        ))}
      </div>
    </VennCardShell>
  );
}

function InformationCard({
  response,
}: {
  response: Extract<VennResponse, { type: "information" }>;
}) {
  return (
    <VennCardShell>
      <h3 className="mb-2 font-bold text-ink">{response.headline}</h3>
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-2">
        {response.bullets.map((bullet, i) => (
          <li key={i}>{bullet}</li>
        ))}
      </ul>
    </VennCardShell>
  );
}

function ClarificationCard({
  response,
}: {
  response: Extract<VennResponse, { type: "clarification" }>;
}) {
  return (
    <VennCardShell>
      <p className="text-sm text-ink-2">{response.message}</p>
    </VennCardShell>
  );
}

function CalculationCard({
  response,
}: {
  response: Extract<VennResponse, { type: "calculation" }>;
}) {
  return (
    <VennCardShell>
      {response.headline && <h3 className="mb-2 font-bold text-ink">{response.headline}</h3>}
      <div className="space-y-1.5 text-sm">
        {response.breakdown.map((row, i) => (
          <div key={i} className="flex items-center justify-between text-ink-2">
            <span>{row.label}</span>
            <span className="font-medium text-ink">{row.amount}</span>
          </div>
        ))}
      </div>
      {response.total && (
        <div className="mt-3 flex items-center justify-between border-t border-line pt-2 text-sm font-bold text-ink">
          <span>Total</span>
          <span>{response.total}</span>
        </div>
      )}
    </VennCardShell>
  );
}

function RecommendationCard({ item }: { item: VennRecommendationItem }) {
  return (
    <div className="flex flex-col rounded-xl border border-line bg-white p-4">
      <h3 className="font-bold text-ink">
        {item.destination}
        {item.country ? `, ${item.country}` : ""}
      </h3>
      <p className="mt-1 text-sm text-ink-3">
        {item.dates}
        {item.nights ? ` · ${item.nights} night${item.nights === 1 ? "" : "s"}` : ""}
      </p>
      <div className="mt-3 space-y-1 text-sm text-ink-2">
        <p>
          <span className="font-semibold">Stay:</span> {item.accommodation_type}
        </p>
        <p>
          <span className="font-semibold">Price:</span> {item.price_per_person} per person
        </p>
        {item.why_it_fits && (
          <p>
            <span className="font-semibold">Why it fits:</span> {item.why_it_fits}
          </p>
        )}
      </div>
      <a
        href={item.booking_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-line bg-white px-3.5 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-surface"
      >
        View on Booking.com
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
