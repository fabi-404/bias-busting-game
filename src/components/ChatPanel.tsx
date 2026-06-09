import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  session_id: string;
  player_id: string;
  player_name: string;
  phase: string;
  round_number: number;
  message: string;
  created_at: string;
}

interface ChatPanelProps {
  sessionId: string;
  myPlayerId: string | null;
  myName: string;
  phase: string;
  round: number;
  title?: string;
}

export function ChatPanel({ sessionId, myPlayerId, myName, phase, round, title = "Diskussion" }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as ChatMessage[]);
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase
      .channel(`chat:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${sessionId}` },
        (p) => setMessages((prev) => [...prev, p.new as ChatMessage]),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const msg = text.trim();
    if (!msg || !myPlayerId || sending) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      player_id: myPlayerId,
      player_name: myName,
      phase,
      round_number: round,
      message: msg.slice(0, 500),
    });
    setSending(false);
    if (error) { toast.error("Nachricht konnte nicht gesendet werden."); return; }
    setText("");
  }

  return (
    <Card className="rounded-3xl p-4 flex flex-col h-[420px]">
      <div className="flex items-center gap-2 mb-3 px-1">
        <MessageCircle className="h-4 w-4 text-accent" />
        <div className="font-display text-lg">{title}</div>
        <span className="ml-auto text-xs text-muted-foreground">{messages.length} Nachricht{messages.length === 1 ? "" : "en"}</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Noch keine Nachrichten. Startet die Diskussion!
          </p>
        )}
        {messages.map((m) => {
          const mine = m.player_id === myPlayerId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                mine ? "bg-primary text-primary-foreground" : "bg-muted",
              )}>
                {!mine && (
                  <div className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5">{m.player_name}</div>
                )}
                <div className="whitespace-pre-wrap break-words">{m.message}</div>
              </div>
            </div>
          );
        })}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="mt-3 flex items-center gap-2"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={myPlayerId ? "Begründung teilen…" : "Tritt erst dem Spiel bei"}
          disabled={!myPlayerId || sending}
          maxLength={500}
        />
        <Button type="submit" size="icon" disabled={!myPlayerId || sending || !text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
