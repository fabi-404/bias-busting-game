import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setIdentity } from "@/lib/game-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/join")({
  validateSearch: (s: Record<string, unknown>) => ({
    code: typeof s.code === "string" ? s.code : "",
  }),
  head: () => ({
    meta: [{ title: "Beitreten – Recruiting BIAS" }],
  }),
  component: Join,
});

function Join() {
  const { code: initial } = Route.useSearch();
  const navigate = useNavigate();
  const [code, setCode] = useState(initial.toUpperCase());
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function join() {
    const c = code.trim().toUpperCase();
    if (c.length !== 6) return toast.error("Code muss 6 Zeichen haben.");
    if (!name.trim()) return toast.error("Bitte gib deinen Namen ein.");

    setLoading(true);
    try {
      const { data: session, error: sErr } = await supabase
        .from("game_sessions")
        .select("id, code, status")
        .eq("code", c)
        .maybeSingle();
      if (sErr) throw sErr;
      if (!session) return toast.error("Spielraum nicht gefunden.");

      const { data: player, error: pErr } = await supabase
        .from("session_players")
        .insert({ session_id: session.id, name: name.trim() })
        .select("id, player_token")
        .single();
      if (pErr) throw pErr;

      setIdentity(c, {
        kind: "player",
        token: player.player_token,
        playerId: player.id,
        name: name.trim(),
      });
      navigate({ to: "/play/$code", params: { code: c } });
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
