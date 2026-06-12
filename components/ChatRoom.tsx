"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Send, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Message, VennRecommendation, VennRecommendationItem } from "@/types/database";

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

const VENN_TRIGGERS = [
  "venn, give us ideas",
  "venn, find us somewhere",
  "venn, what works for us",
];

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
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    if (VENN_TRIGGERS.includes(trimmed.toLowerCase())) {
      void askVenn();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const value = input;
    setInput("");
    await sendMessage(value);
  }

  async function askVenn() {
    setAskingVenn(true);
    setError(null);

    const res = await fetch("/api/venn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId }),
    });

    if (!res.ok) {
      setAskingVenn(false);
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Venn couldn't find any ideas. Please try again.");
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <h1 className="font-bold text-lg text-ink">{tripName}</h1>
          <p className="text-sm text-ink-3">
            Everyone&apos;s in. Chat below, or ask Venn to find your group some trip ideas.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="py-12 text-center text-sm text-ink-3">
              No messages yet. Say hi, or ask Venn for ideas to get started.
            </div>
          )}
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isOwn={message.user_id === currentUserId}
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

      <div className="border-t border-line bg-white">
        <div className="mx-auto max-w-3xl px-6 py-4">
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <div className="mb-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={askVenn}
              disabled={askingVenn}
            >
              <Sparkles className="h-4 w-4" />
              {askingVenn ? "Thinking..." : "Ask Venn for ideas"}
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message your group..."
              className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand-light"
            />
            <Button type="submit" disabled={sending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message, isOwn }: { message: Message; isOwn: boolean }) {
  if (message.message_type === "venn_card" && message.recommendation) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand">
          <Sparkles className="h-4 w-4" />
          Venn found some ideas for your group
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {message.recommendation.recommendations_json.map((item, i) => (
            <RecommendationCard key={i} item={item} />
          ))}
        </div>
      </div>
    );
  }

  if (message.message_type === "system") {
    return (
      <div className="text-center text-xs text-ink-3 py-1">{message.content}</div>
    );
  }

  return (
    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
      <span className="px-1 mb-1 text-xs text-ink-3">
        {isOwn ? "You" : message.user?.name ?? "Someone"}
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

function RecommendationCard({ item }: { item: VennRecommendationItem }) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-white p-5">
      <h3 className="font-bold text-ink">
        {item.destination}
        {item.country ? `, ${item.country}` : ""}
      </h3>
      <p className="mt-1 text-sm text-ink-3">{item.dates}</p>
      {item.description && <p className="mt-2 text-sm text-ink-2">{item.description}</p>}
      <div className="mt-3 space-y-1 text-sm text-ink-2">
        <p>
          <span className="font-semibold">Stay:</span> {item.accommodation}
        </p>
        <p>
          <span className="font-semibold">Price:</span> {item.price_per_person} per person
        </p>
        {item.vibe_match && (
          <p>
            <span className="font-semibold">Why it fits:</span> {item.vibe_match}
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
