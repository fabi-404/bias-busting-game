import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const PHASE_DURATION_SECONDS = 120;

export function PhaseStatusBar({
  phaseStartedAt,
  iAmReady,
  readyCount,
  totalPlayers,
  onReady,
  canMarkReady,
  durationSeconds = PHASE_DURATION_SECONDS,
}: {
  phaseStartedAt: string | null;
  iAmReady: boolean;
  readyCount: number;
  totalPlayers: number;
  onReady: () => void;
  canMarkReady: boolean;
  durationSeconds?: number;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const startMs = phaseStartedAt ? new Date(phaseStartedAt).getTime() : now;
  const elapsed = Math.max(0, Math.floor((now - startMs) / 1000));
  const remaining = Math.max(0, durationSeconds - elapsed);
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const pct = Math.min(100, (elapsed / durationSeconds) * 100);
  const urgent = remaining <= 15 && remaining > 0;
  const expired = remaining === 0;

  return (
    <Card className="rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-[120px]">
          <Clock className={cn(
            "h-5 w-5",
            expired ? "text-muted-foreground" : urgent ? "text-red-500 animate-pulse" : "text-accent",
          )} />
          <div className={cn(
            "font-display text-2xl tabular-nums",
            expired ? "text-muted-foreground" : urgent ? "text-red-500" : "",
          )}>
            {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
          </div>
        </div>

        <div className="flex-1 min-w-[120px]">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-1000 ease-linear",
                expired ? "bg-muted-foreground/40" : urgent ? "bg-red-500" : "bg-accent",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {readyCount} / {totalPlayers} bereit
          </div>
        </div>

        {canMarkReady && (
          <Button
            size="sm"
            variant={iAmReady ? "secondary" : "default"}
            onClick={onReady}
            disabled={iAmReady}
            className="h-10"
          >
            <Check className="h-4 w-4 mr-1" />
            {iAmReady ? "Bereit" : "Bereit"}
          </Button>
        )}
      </div>
    </Card>
  );
}
