import { AVATAR_CHOICES } from "@/lib/bias-game";
import { cn } from "@/lib/utils";

export function AvatarPicker({ value, onChange }: {
  value: string;
  onChange: (avatar: string) => void;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Dein Avatar
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {AVATAR_CHOICES.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={cn(
              "aspect-square rounded-xl text-xl grid place-items-center border-2 transition",
              value === emoji
                ? "border-accent bg-accent/15 scale-110"
                : "border-transparent bg-muted/40 hover:border-accent/40",
            )}
            aria-label={`Avatar ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
