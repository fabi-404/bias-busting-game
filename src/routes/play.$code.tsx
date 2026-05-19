import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getIdentity, setIdentity } from "@/lib/game-storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FlipCard, cardMeta, type CardRecord } from "@/components/GameCard";
import { toast } from "sonner";
import { Check, X, Copy, ArrowLeft, Crown, Sparkles, Trophy, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/play/$code")({
  head: () => ({ meta: [{ title: "Spielraum – Recruiting BIAS" }] }),
  component: Play,
});

interface SessionRow {
  id: string;
  code: string;
  status: "lobby" | "playing" | "ended";
  current_card_id: string | null;
  revealed: boolean;
  round_number: number;
  total_rounds: number;
  host_name: string;
  host_token: string;
}

interface PlayerRow {
  id: string;
  name: string;
  score: number;
  is_host: boolean;
}

interface VoteRow {
  id: string;
  player_id: string;
  vote: boolean;
  round_number: number;
  card_id: string;
}

function Play() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const identity = getIdentity(code);

  const [session, setSession] = useState<SessionRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [currentCard, setCurrentCard] = useState<CardRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);

  const isHost = !!identity && identity.kind === "host" && session?.host_token === identity.token;

  // Redirect to join if no identity yet
  useEffect(() => {
    if (!identity) {
      navigate({ to: "/join", search: { code } });
    }
  }, [identity, code, navigate]);

  // Initial load
  const loadSession = useCallback(async () => {
    const { data, error } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    if (error || !data) {
      toast.error("Spielraum nicht gefunden.");
      navigate({ to: "/" });
      return;
    }
    setSession(data as SessionRow);
    const [{ data: ps }, { data: vs }] = await Promise.all([
      supabase.from("session_players").select("id, name, score, is_host").eq("session_id", data.id).order("joined_at"),
      supabase.from("session_votes").select("id, player_id, vote, round_number, card_id").eq("session_id", data.id).eq("round_number", data.round_number),
    ]);
    setPlayers((ps ?? []) as PlayerRow[]);
    setVotes((vs ?? []) as VoteRow[]);
    setLoading(false);
  }, [code, navigate]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Realtime subscriptions
  useEffect(() => {
    if (!session) return;
    const ch = supabase
      .channel(`session:${session.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "game_sessions", filter: `id=eq.${session.id}` },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          setSession((prev) => ({ ...(prev as SessionRow), ...(payload.new as SessionRow) }));
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "session_players", filter: `session_id=eq.${session.id}` },
        () => {
          supabase.from("session_players").select("id, name, score, is_host").eq("session_id", session.id).order("joined_at")
            .then(({ data }) => setPlayers((data ?? []) as PlayerRow[]));
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "session_votes", filter: `session_id=eq.${session.id}` },
        () => {
          supabase.from("session_votes").select("id, player_id, vote, round_number, card_id").eq("session_id", session.id).eq("round_number", session.round_number)
            .then(({ data }) => setVotes((data ?? []) as VoteRow[]));
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session?.id, session?.round_number]);

  // Load card when current_card_id changes
  useEffect(() => {
    if (!session?.current_card_id) { setCurrentCard(null); return; }
    setCurrentCard(null);
    supabase.from("cards").select("*").eq("id", session.current_card_id).maybeSingle()
      .then(({ data }) => setCurrentCard(data as CardRecord | null));
  }, [session?.current_card_id]);

  // Reset stale votes immediately when the active card changes (before realtime refetch arrives)
  useEffect(() => {
    setVotes([]);
  }, [session?.round_number, session?.current_card_id]);

  const activeVotes = useMemo(() => {
    if (!session?.current_card_id) return [];
    return votes.filter(
      (v) => v.round_number === session.round_number && v.card_id === session.current_card_id,
    );
  }, [votes, session?.round_number, session?.current_card_id]);
  const cardReady = !!currentCard && currentCard.id === session?.current_card_id;

  const myVote = useMemo(() => {
    if (!identity?.playerId || !session) return null;
    return activeVotes.find(
      (v) => v.player_id === identity.playerId,
    ) ?? null;
  }, [activeVotes, identity?.playerId, session]);

  async function drawCard() {
    if (!session) return;
    if (session.round_number >= session.total_rounds) {
      await supabase.from("game_sessions").update({ status: "ended" }).eq("id", session.id);
      return;
    }
    setDrawing(true);
    try {
      const { data: history } = await supabase
        .from("session_card_history").select("card_id").eq("session_id", session.id);
      const seen = new Set((history ?? []).map((r) => r.card_id as string));
      const { data: allCards } = await supabase.from("cards").select("*");
      const pool = (allCards ?? []).filter((c) => !seen.has(c.id));
      const next = (pool.length > 0 ? pool : (allCards ?? []))[Math.floor(Math.random() * Math.max(1, pool.length || (allCards?.length ?? 0)))];
      if (!next) { toast.error("Keine Karten im Stapel."); return; }

      const newRound = session.round_number + 1;
      await supabase.from("session_card_history")
        .insert({ session_id: session.id, card_id: next.id, round_number: newRound });
      await supabase.from("game_sessions")
        .update({ current_card_id: next.id, revealed: false, round_number: newRound, status: "playing" })
        .eq("id", session.id);
    } catch (e) {
      console.error(e);
      toast.error("Karte konnte nicht gezogen werden.");
    } finally {
      setDrawing(false);
    }
  }

  const revealingRef = useRef(false);

  async function reveal() {
    if (!session || !currentCard) return;
    if (session.revealed || revealingRef.current) return;
    revealingRef.current = true;
    try {
      // Award points for correct T/F votes
      if (currentCard.type === "truefalse" && currentCard.correct_answer !== null) {
        const correct = activeVotes.filter((v) => v.vote === currentCard.correct_answer);
        for (const v of correct) {
          const player = players.find((p) => p.id === v.player_id);
          if (player) {
            await supabase.from("session_players")
              .update({ score: player.score + 1 }).eq("id", v.player_id);
          }
        }
      }
      const isLastRound = session.round_number >= session.total_rounds;
      await supabase.from("game_sessions")
        .update({ revealed: true, ...(isLastRound ? { status: "ended" as const } : {}) })
        .eq("id", session.id);
    } finally {
      // small delay to avoid immediate re-trigger before realtime arrives
      setTimeout(() => { revealingRef.current = false; }, 1500);
    }
  }

  async function castVote(vote: boolean) {
    if (!session || !identity?.playerId || !session.current_card_id) return;
    if (session.revealed) return;
    const { error } = await supabase.from("session_votes")
      .upsert({
        session_id: session.id,
        card_id: session.current_card_id,
        player_id: identity.playerId,
        round_number: session.round_number,
        vote,
      }, { onConflict: "session_id,player_id,round_number" });
    if (error) toast.error("Stimme konnte nicht gespeichert werden.");
  }

  // Backfill: if user came back without playerId, create one
  useEffect(() => {
    async function ensurePlayer() {
      if (!session || !identity || identity.playerId) return;
      const { data } = await supabase.from("session_players")
        .insert({ session_id: session.id, name: identity.name, is_host: identity.kind === "host" })
        .select("id").single();
      if (data) setIdentity(code, { ...identity, playerId: data.id });
    }
    ensurePlayer();
  }, [session, identity, code]);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/join?code=${code}` : "";

  function copyShare() {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Einladungslink kopiert");
  }

  // Auto-reveal once all players have responded (host triggers; others see via realtime)
  const expectedVoters = players.length;
  useEffect(() => {
    if (!isHost || !session || !currentCard || session.revealed) return;
    if (!cardReady) return;
    if (session.status === "ended") return;
    if (currentCard.type === "knowledge") return; // knowledge cards: host reveals manually
    const uniqueVoters = new Set(activeVotes.map((v) => v.player_id)).size;
    if (expectedVoters > 0 && uniqueVoters >= expectedVoters) {
      void reveal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, session?.revealed, session?.status, currentCard?.id, cardReady, activeVotes.length, expectedVoters]);

  // Countdown before auto-drawing the next card after reveal
  const COUNTDOWN_SECONDS = 5;
  const [countdown, setCountdown] = useState<number | null>(null);
  const autoDrawnRef = useRef<string | null>(null);

  useEffect(() => {
    // Reset countdown whenever the card or round changes
    setCountdown(null);
  }, [session?.round_number, session?.current_card_id]);

  useEffect(() => {
    if (!session || !session.revealed) return;
    if (session.status === "ended") return;
    if (session.round_number >= session.total_rounds) return;
    if (countdown !== null) return;
    setCountdown(COUNTDOWN_SECONDS);
  }, [session?.revealed, session?.status, session?.round_number, session?.total_rounds, session?.current_card_id]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      const cardKey = session?.current_card_id ?? "";
      if (isHost && session && !drawing && autoDrawnRef.current !== cardKey) {
        autoDrawnRef.current = cardKey;
        void drawCard();
      }
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, isHost]);

  if (loading || !session) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Lädt…</div>;
  }

  const yesVotes = activeVotes.filter((v) => v.vote === true).length;
  const noVotes = activeVotes.filter((v) => v.vote === false).length;
  const totalVoters = players.length;
  const discussedCount = new Set(activeVotes.filter((v) => v.vote === true).map((v) => v.player_id)).size;
  const allDiscussed = totalVoters > 0 && discussedCount >= totalVoters;

  // ===== Winner / end screen =====
  if (session.status === "ended") {
    const ranked = [...players].sort((a, b) => b.score - a.score);
    const topScore = ranked[0]?.score ?? 0;
    const winners = ranked.filter((p) => p.score === topScore && topScore > 0);
    return (
      <main className="min-h-screen px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-accent">
            <PartyPopper className="h-3.5 w-3.5" />
            Spiel beendet
          </div>
          <h1 className="mt-6 font-display text-5xl sm:text-7xl">Gesamtsieger:in</h1>
          <p className="mt-3 text-muted-foreground">
            {session.total_rounds} Runden gespielt – danke fürs Mitdiskutieren!
          </p>

          <Card className="mt-8 p-8 rounded-3xl">
            {winners.length === 0 ? (
              <div className="text-muted-foreground">Diesmal ohne Punkte – aber jede Menge Reflexion.</div>
            ) : (
              <>
                <Trophy className="mx-auto h-12 w-12 text-accent" />
                <div className="mt-4 font-display text-4xl sm:text-5xl">
                  {winners.map((w) => w.name).join(" & ")}
                </div>
                <div className="mt-2 text-muted-foreground">
                  mit {topScore} {topScore === 1 ? "Punkt" : "Punkten"}
                </div>
              </>
            )}

            <ol className="mt-8 space-y-2 text-left">
              {ranked.map((p, i) => (
                <li
                  key={p.id}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3",
                    i === 0 && p.score > 0 ? "bg-accent/15 border border-accent/40" : "bg-muted/40",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className="font-display text-lg w-6 text-muted-foreground">{i + 1}.</span>
                    {p.is_host && <Crown className="h-3.5 w-3.5 text-accent" />}
                    <span>{p.name}</span>
                  </span>
                  <span className="font-display text-xl">{p.score}</span>
                </li>
              ))}
            </ol>
          </Card>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/">
              <Button size="lg" variant="outline" className="h-12">Zur Startseite</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Startseite
          </Link>
          <button
            onClick={copyShare}
            className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm hover:border-accent transition"
          >
            <span className="font-display text-lg tracking-[0.3em] text-accent">{code}</span>
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          {/* CARD AREA */}
          <div>
            {cardReady ? (
              <>
                <FlipCard card={currentCard} flipped={session.revealed} />

                {/* T/F voting */}
                {currentCard.type === "truefalse" && !session.revealed && (
                  <div className="mt-6 mx-auto max-w-2xl" key={`tf-${session.current_card_id}`}>
                    <div className="text-center text-sm text-muted-foreground mb-3">
                      Stimme jetzt ab – Auflösung kommt nach allen Stimmen.
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        size="lg"
                        onClick={() => castVote(true)}
                        variant={myVote?.vote === true ? "default" : "outline"}
                        className={cn("h-16 text-lg", myVote?.vote === true && "bg-truefalse text-truefalse-foreground hover:bg-truefalse/90")}
                      >
                        <Check className="h-5 w-5 mr-2" /> Wahr
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => castVote(false)}
                        variant={myVote?.vote === false ? "default" : "outline"}
                        className={cn("h-16 text-lg", myVote?.vote === false && "bg-primary text-primary-foreground")}
                      >
                        <X className="h-5 w-5 mr-2" /> Falsch
                      </Button>
                    </div>
                    <div className="mt-3 text-center text-xs text-muted-foreground">
                      {activeVotes.length} / {totalVoters} abgestimmt
                    </div>
                  </div>
                )}

                {/* T/F results when revealed */}
                {currentCard.type === "truefalse" && session.revealed && (
                  <div className="mt-6 mx-auto max-w-2xl grid grid-cols-2 gap-3 text-center">
                    <div className={cn(
                      "rounded-2xl p-4 border-2",
                      currentCard.correct_answer === true ? "border-truefalse bg-truefalse/10" : "border-border"
                    )}>
                      <div className="text-3xl font-display">{yesVotes}</div>
                      <div className="text-xs text-muted-foreground mt-1">Wahr</div>
                    </div>
                    <div className={cn(
                      "rounded-2xl p-4 border-2",
                      currentCard.correct_answer === false ? "border-primary bg-primary/10" : "border-border"
                    )}>
                      <div className="text-3xl font-display">{noVotes}</div>
                      <div className="text-xs text-muted-foreground mt-1">Falsch</div>
                    </div>
                  </div>
                )}

                {/* Action card: discussion acknowledgement */}
                {currentCard.type === "action" && !session.revealed && (
                  <div className="mt-6 mx-auto max-w-2xl" key={`act-${session.current_card_id}`}>
                    <div className="text-center text-sm text-muted-foreground mb-3">
                      Diskutiert die Frage gemeinsam. Markiert „Diskutiert", sobald ihr fertig seid.
                    </div>
                    <Button
                      size="lg"
                      onClick={() => castVote(true)}
                      disabled={myVote?.vote === true}
                      variant={myVote?.vote === true ? "default" : "outline"}
                      className={cn(
                        "h-16 text-lg w-full",
                        myVote?.vote === true && "bg-action text-action-foreground hover:bg-action/90"
                      )}
                    >
                      <Check className="h-5 w-5 mr-2" />
                      {myVote?.vote === true ? "Diskutiert ✓" : "Diskutiert"}
                    </Button>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{discussedCount} von {totalVoters} bereit</span>
                        {allDiscussed && <span className="text-action font-medium">Alle bereit!</span>}
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-action transition-all"
                          style={{ width: `${totalVoters ? (discussedCount / totalVoters) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {players.map((p) => {
                          const done = activeVotes.some((v) => v.player_id === p.id && v.vote === true);
                          return (
                            <span
                              key={p.id}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border",
                                done ? "bg-action/15 border-action/40 text-foreground" : "bg-muted/40 border-border text-muted-foreground"
                              )}
                            >
                              {done && <Check className="h-3 w-3 text-action" />}
                              {p.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action card revealed */}
                {currentCard.type === "action" && session.revealed && (
                  <div className="mt-6 mx-auto max-w-2xl rounded-2xl border-2 border-action bg-action/10 p-4 text-center">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Gruppe abgestimmt</div>
                    <div className="font-display text-2xl">{discussedCount} / {totalVoters} haben diskutiert</div>
                  </div>
                )}

                {/* Countdown to next card (visible to everyone) */}
                {session.revealed && countdown !== null && countdown > 0 && session.round_number < session.total_rounds && (
                  <div className="mt-6 mx-auto max-w-2xl text-center">
                    <div className="inline-flex items-center gap-3 rounded-full bg-accent/15 border border-accent/30 px-5 py-2.5">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Nächste Karte in</span>
                      <span className="font-display text-3xl text-accent tabular-nums w-8 text-center">{countdown}</span>
                    </div>
                  </div>
                )}

                {/* Host controls */}
                {isHost && (
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {!session.revealed && (
                      <Button
                        size="lg"
                        onClick={reveal}
                        variant={currentCard.type === "action" && allDiscussed ? "default" : "secondary"}
                        className="h-12"
                      >
                        {currentCard.type === "action" ? "Diskussion abschließen" : "Auflösen"}
                      </Button>
                    )}
                    <Button size="lg" onClick={drawCard} disabled={drawing} className="h-12">
                      <Sparkles className="h-4 w-4 mr-2" />
                      {session.round_number >= session.total_rounds
                        ? "Spiel beenden"
                        : countdown !== null && countdown > 0
                          ? `Jetzt ziehen (${countdown})`
                          : "Nächste Karte"}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="rounded-3xl p-10 text-center">
                <div className="font-display text-3xl mb-2">Lobby</div>
                <p className="text-muted-foreground mb-6">
                  Teilt den Code <span className="text-accent font-display tracking-[0.3em]">{code}</span> mit eurem Team.
                </p>
                {isHost ? (
                  <Button size="lg" onClick={drawCard} disabled={drawing} className="h-12">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Erste Karte ziehen
                  </Button>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Warte auf den Host…
                  </div>
                )}
                {/* Card type legend */}
                <div className="mt-10 grid sm:grid-cols-3 gap-3 text-left">
                  {(["knowledge", "truefalse", "action"] as const).map((t) => {
                    const m = cardMeta[t];
                    const Icon = m.icon;
                    return (
                      <div key={t} className={cn("rounded-2xl p-4", m.tone)}>
                        <Icon className="h-5 w-5" />
                        <div className="font-display text-lg mt-2">{m.label}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* PLAYER LIST */}
          <aside className="space-y-3">
            <Card className="rounded-3xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-display text-lg">Spieler:innen</div>
                <span className="text-xs text-muted-foreground">Runde {session.round_number} / {session.total_rounds}</span>
              </div>
              <ul className="space-y-2">
                {players.length === 0 && (
                  <li className="text-sm text-muted-foreground">Noch niemand da.</li>
                )}
                {[...players].sort((a, b) => b.score - a.score).map((p) => (
                  <li key={p.id} className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2",
                    identity?.playerId === p.id ? "bg-primary/10" : "bg-muted/40"
                  )}>
                    <span className="flex items-center gap-2 text-sm">
                      {p.is_host && <Crown className="h-3.5 w-3.5 text-accent" />}
                      <span className="truncate max-w-[140px]">{p.name}</span>
                    </span>
                    <span className="font-display text-lg">{p.score}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {currentCard?.type === "truefalse" && !session.revealed && (
              <Card className="rounded-3xl p-5">
                <div className="font-display text-sm mb-2 text-muted-foreground uppercase tracking-wider">Live</div>
                <div className="text-sm">
                  {activeVotes.length} von {totalVoters} haben abgestimmt
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${totalVoters ? (activeVotes.length / totalVoters) * 100 : 0}%` }}
                  />
                </div>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
