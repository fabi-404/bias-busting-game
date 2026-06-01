import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { setIdentity } from "@/lib/game-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Users, Settings } from "lucide-react";

export function HomePage() {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState("");
  const [loading, setLoading] = useState(false);

  async function createSession() {
    if (!hostName.trim()) {
      toast.error("Bitte gib deinen Namen ein.");
      return;
    }
    setLoading(true);
    try {
      const { id, code, host_token } = await api.createSession(hostName.trim(), 1);

      const player = await api.joinSession(id, hostName.trim(), true);

      setIdentity(code, {
        kind: "host",
        token: host_token,
        playerId: player.id,
        name: hostName.trim(),
      });

      navigate(`/play/${code}`);
    } catch (e) {
      console.error(e);
      toast.error("Spielraum konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Workshop-Edition
          </div>
          <h1 className="mt-6 font-display text-5xl sm:text-7xl text-foreground">
            Recruiting <span className="text-accent">BIAS</span>
            <span className="block text-3xl sm:text-4xl mt-2 text-muted-foreground font-normal">
              Das Spiel über unbewusste Vorurteile
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            5 Phasen · 3 Runden · ideal für 4 Spieler:innen. Jede:r erhält geheim einen Bias und entscheidet beeinflusst über drei Bewerber:innen.
          </p>
        </header>

        <Card className="p-6 sm:p-8 rounded-3xl border-border/60 shadow-xl shadow-black/5">
          <h2 className="font-display text-2xl mb-4">Spielraum erstellen</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Du bist Host. Du steuerst die Phasen — die anderen treten mit dem Code bei.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Dein Name"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              maxLength={40}
              className="h-12 text-base"
              onKeyDown={(e) => e.key === "Enter" && createSession()}
            />
            <Button
              onClick={createSession}
              disabled={loading}
              size="lg"
              className="h-12 px-6"
            >
              {loading ? "…" : "Raum öffnen"}
            </Button>
          </div>
        </Card>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <Link
            to="/join"
            className="group rounded-3xl border border-border/60 bg-card p-6 transition hover:border-accent hover:shadow-lg"
          >
            <Users className="h-6 w-6 text-accent" />
            <div className="mt-3 font-display text-xl">Spiel beitreten</div>
            <p className="text-sm text-muted-foreground mt-1">
              Mit Code und Namen an einem laufenden Spiel teilnehmen.
            </p>
          </Link>
          <Link
            to="/admin"
            className="group rounded-3xl border border-border/60 bg-card p-6 transition hover:border-primary hover:shadow-lg"
          >
            <Settings className="h-6 w-6 text-primary" />
            <div className="mt-3 font-display text-xl">Karten verwalten</div>
            <p className="text-sm text-muted-foreground mt-1">
              Neue Karten anlegen oder bestehende anpassen.
            </p>
          </Link>
        </div>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          Inspiriert vom analogen Workshop-Kartenspiel zu unbewussten Vorurteilen im Recruiting.
        </footer>
      </div>
    </main>
  );
}
