import { cn } from "@/lib/utils";
import { Brain, HelpCircle, MessagesSquare } from "lucide-react";

export type CardType = "knowledge" | "truefalse" | "action";

export const cardMeta: Record<CardType, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  knowledge: { label: "Wissenskarte", icon: Brain, tone: "bg-knowledge text-knowledge-foreground" },
  truefalse: { label: "Wahr oder Falsch?", icon: HelpCircle, tone: "bg-truefalse text-truefalse-foreground" },
  action: { label: "Aktionskarte", icon: MessagesSquare, tone: "bg-action text-action-foreground" },
};

export interface CardRecord {
  id: string;
  type: CardType;
  title: string;
  content: string;
  example: string | null;
  correct_answer: boolean | null;
  explanation: string | null;
  category: string | null;
}

interface CardFaceProps {
  card: CardRecord;
  side: "front" | "back";
  className?: string;
}

export function CardFace({ card, side, className }: CardFaceProps) {
  const meta = cardMeta[card.type];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "h-full w-full rounded-3xl p-7 sm:p-10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] ring-1 ring-black/5 flex flex-col",
        meta.tone,
        className,
      )}
      style={{
        backgroundImage:
          "radial-gradient(at 0% 0%, rgba(255,255,255,0.18) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(0,0,0,0.12) 0px, transparent 50%)",
      }}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] opacity-90">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span>{meta.label}</span>
        </div>
        {card.category && <span className="opacity-70">{card.category}</span>}
      </div>

      {side === "front" ? (
        <div className="flex flex-1 flex-col justify-center gap-5 py-6">
          <h2 className="font-display text-3xl sm:text-5xl leading-[1.05]">{card.title}</h2>
          <p className="text-base sm:text-lg leading-relaxed opacity-95">{card.content}</p>
          {card.type === "knowledge" && card.example && (
            <div className="mt-2 rounded-2xl bg-black/15 p-4 text-sm sm:text-base">
              <div className="mb-1 text-[10px] uppercase tracking-[0.2em] opacity-80">Beispiel</div>
              {card.example}
            </div>
          )}
          {card.type === "action" && card.example && (
            <div className="mt-2 rounded-2xl bg-black/20 p-4 text-sm sm:text-base">
              <div className="mb-1 text-[10px] uppercase tracking-[0.2em] opacity-80">Gruppenfrage</div>
              <div className="font-medium">{card.example}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center gap-5 py-6">
          <div className="text-[10px] uppercase tracking-[0.2em] opacity-80">Auflösung</div>
          {card.type === "truefalse" && (
            <div className="font-display text-4xl sm:text-6xl">
              {card.correct_answer ? "Wahr" : "Falsch"}
            </div>
          )}
          {card.type === "knowledge" && (
            <div className="font-display text-3xl sm:text-4xl">Diskutiert weiter</div>
          )}
          {card.type === "action" && (
            <div className="font-display text-3xl sm:text-4xl">Im Gespräch bleiben</div>
          )}
          <p className="text-base sm:text-lg leading-relaxed opacity-95">
            {card.explanation || card.content}
          </p>
        </div>
      )}

      <div className="mt-auto pt-4 text-[10px] uppercase tracking-[0.25em] opacity-70">
        Recruiting Bias · Das Spiel
      </div>
    </div>
  );
}

interface FlipCardProps {
  card: CardRecord;
  flipped: boolean;
}

export function FlipCard({ card, flipped }: FlipCardProps) {
  return (
    <div
      key={card.id}
      className="flip-card animate-draw-in mx-auto w-full max-w-2xl aspect-[3/4] sm:aspect-[4/5]"
    >
      <div className={cn("flip-inner", flipped && "is-flipped")}>
        <div className="flip-face">
          <CardFace card={card} side="front" />
        </div>
        <div className="flip-face flip-back">
          <CardFace card={card} side="back" />
        </div>
      </div>
    </div>
  );
}
