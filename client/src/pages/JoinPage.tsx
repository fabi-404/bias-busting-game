import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { setIdentity } from "@/lib/game-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export function JoinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState((searchParams.get("code") ?? "").toUpperCase());
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function join() {
    const c = code.trim().toUpperCase();
    if (c.length !== 6) return toast.error("Code muss 6 Zeichen haben.");
    if (!name.trim()) return toast.error("Bitte gib deinen Namen ein.");

    setLoading(true);
    try {
      const sessionData = await api.getSession(c);
      if (!sessionData) return toast.error("Spielraum nicht gefunden.");

      const player = await api.joinSession(sessionData.session.id, name.trim(), false);

      setIdentity(c, {
        kind: "player",
        token: player.player_token,
        playerId: player.id,
        name: name.trim(),
      });

      navigate(`/play/${c}`);
    } catch (e) {
      console.error(e);
      toast.error("Beitritt fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Link>
        <Card className="mt-6 p-6 sm:p-8 rounded-3xl">
          <h1 className="font-display text-3xl">Spiel beitreten</h1>
          <p className="text-sm text-muted-foreground mt-1">Code vom Host eingeben.</p>
          <div className="mt-6 space-y-3">
            <Input
              placeholder="ABCDEF"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              className="h-14 text-center font-display text-2xl tracking-[0.5em]"
              maxLength={6}
            />
            <Input
              placeholder="Dein Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="h-12"
              onKeyDown={(e) => e.key === "Enter" && join()}
            />
            <Button onClick={join} disabled={loading} size="lg" className="w-full h-12">
              {loading ? "…" : "Beitreten"}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
