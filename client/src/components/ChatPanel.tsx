import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { socket } from "@/lib/socket";
import type { ChatMessage } from "@/lib/bias-game";

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
    const data = await api.getChat(sessionId);
    setMessages(data);
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = (msg: ChatMessage) => setMessages((prev) => [...prev, msg]);
    socket.on("chat:message", handler);
    return () => { socket.off("chat:message", handler); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const msg = text.trim();
    if (!msg || !myPlayerId || sending) return;
    setSending(true);
    try {
      await api.sendChat(sessionId, myPlayerId, myName, phase, round, msg);
      setText("");
    } catch {
      toast.error("Nachricht konnte nicht gesendet werden.");
    } finally {
      setSending(false);
    }
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
