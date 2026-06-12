import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { socket } from "@/lib/socket";
import { playPop } from "@/lib/sounds";
import type { ChatMessage, PlayerRow } from "@/lib/bias-game";

const QUICK_REACTIONS = ["👍", "😂", "😮", "🤔", "❤️"];

// Nachrichten, die nur aus wenigen Emojis bestehen, werden groß ohne Bubble gerendert
function isEmojiOnly(msg: string): boolean {
  const trimmed = msg.trim();
  if (!trimmed || trimmed.length > 12) return false;
  try {
    return /^[\p{Extended_Pictographic}\p{Emoji_Component}‍️\s]+$/u.test(trimmed);
  } catch {
    return false;
  }
}

interface ChatPanelProps {
  sessionId: string;
  myPlayerId: string | null;
  myName: string;
  phase: string;
  round: number;
  title?: string;
  players?: PlayerRow[];
}

export function ChatPanel({ sessionId, myPlayerId, myName, phase, round, title = "Diskussion", players }: ChatPanelProps) {
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
    const handler = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.player_id !== myPlayerId) playPop();
    };
    socket.on("chat:message", handler);
    return () => { socket.off("chat:message", handler); };
  }, [myPlayerId]);

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

  async function sendReaction(emoji: string) {
    if (!myPlayerId || sending) return;
    try {
      await api.sendChat(sessionId, myPlayerId, myName, phase, round, emoji);
    } catch {
      toast.error("Reaktion konnte nicht gesendet werden.");
    }
  }

  const avatarFor = (playerId: string) => players?.find((p) => p.id === playerId)?.avatar ?? null;

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
          const avatar = avatarFor(m.player_id);
          if (isEmojiOnly(m.message)) {
            return (
              <div key={m.id} className={cn("flex items-end gap-1.5", mine ? "justify-end" : "justify-start")}>
                {!mine && (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    {avatar ? `${avatar} ` : ""}{m.player_name}
                  </span>
                )}
                <span className="text-3xl leading-none animate-in zoom-in duration-200">{m.message.trim()}</span>
              </div>
            );
          }
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                mine ? "bg-primary text-primary-foreground" : "bg-muted",
              )}>
                {!mine && (
                  <div className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5">
                    {avatar ? `${avatar} ` : ""}{m.player_name}
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">{m.message}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-1">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => sendReaction(emoji)}
            disabled={!myPlayerId}
            className="h-8 w-8 rounded-full grid place-items-center text-base bg-muted/40 hover:bg-accent/20 hover:scale-110 transition disabled:opacity-40"
            aria-label={`Reaktion ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="mt-2 flex items-center gap-2"
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
