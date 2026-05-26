import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getIdentity, setIdentity } from "@/lib/game-storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

import {
  ArrowLeft, Copy, Crown, Sparkles, Users, Brain, HelpCircle,
  UserCheck, Vote, Eye, Trophy, Check, X, ChevronRight, ChevronLeft,
  BookOpen, ExternalLink, Zap, Timer as TimerIcon, Star, BarChart3,
} from "lucide-react";

import {
  type SessionRow, type PlayerRow, type BiasRow, type BiasQuestionRow,
  type CandidateRow, type AssignmentRow, type QuestionAnswerRow,
  type CandidateVoteRow, type BiasGuessRow, type GamePhase, type ActionCardRow,
  type CandidatePrevoteRow,
  TOTAL_ROUNDS, phaseLabel,
} from "@/lib/bias-game";

import { ChatPanel } from "@/components/ChatPanel";
import { PhaseStatusBar, PHASE_DURATION_SECONDS } from "@/components/PhaseStatusBar";

import cAffinity from "@/assets/candidates/c-affinity.jpg";
import cBeauty from "@/assets/candidates/c-beauty.jpg";
import cName from "@/assets/candidates/c-name.jpg";
import cGender from "@/assets/candidates/c-gender.jpg";
import cAge from "@/assets/candidates/c-age.jpg";

const CANDIDATE_IMAGE_MAP: Record<string, string> = {
  "candidate:affinity": cAffinity,
  "candidate:beauty": cBeauty,
  "candidate:name": cName,
  "candidate:gender": cGender,
  "candidate:age": cAge,
};

function resolveCandidateImage(raw: string | null): string | null {
  if (!raw) return null;
  return CANDIDATE_IMAGE_MAP[raw] ?? raw;
}

type ReadyRow = { player_id: string; phase_key: string };

export const Route = createFileRoute("/play/$code")({
  head: () => ({ meta: [{ title: "Spielraum – Recruiting BIAS" }] }),
  component: Play,
});

function Play() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const identity = getIdentity(code);

  const [session, setSession] = useState<SessionRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [biases, setBiases] = useState<BiasRow[]>([]);
  const [questions, setQuestions] = useState<BiasQuestionRow[]>([]);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [actionCards, setActionCards] = useState<ActionCardRow[]>([]);

  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [answers, setAnswers] = useState<QuestionAnswerRow[]>([]);
  const [votes, setVotes] = useState<CandidateVoteRow[]>([]);
  const [guesses, setGuesses] = useState<BiasGuessRow[]>([]);
  const [readyRows, setReadyRows] = useState<ReadyRow[]>([]);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const isHost = !!identity && identity.kind === "host" && session?.host_token === identity.token;
  const myPlayerId = identity?.playerId ?? null;
  const myAssignment = useMemo(
    () => assignments.find((a) => a.player_id === myPlayerId) ?? null,
    [assignments, myPlayerId],
  );
  const myBias = useMemo(
    () => (myAssignment ? biases.find((b) => b.id === myAssignment.bias_id) ?? null : null),
    [myAssignment, biases],
  );

  // Redirect if no identity
  useEffect(() => {
    if (!identity) navigate({ to: "/join", search: { code } });
  }, [identity, code, navigate]);

  // Initial load
  const loadAll = useCallback(async () => {
    const { data: sess } = await supabase.from("game_sessions").select("*").eq("code", code).maybeSingle();
    if (!sess) {
      toast.error("Spielraum nicht gefunden.");
      navigate({ to: "/" });
      return;
    }
    setSession(sess as SessionRow);

    const [b, q, c, p, a, ans, v, g, r, ac] = await Promise.all([
      supabase.from("biases").select("*").order("name"),
      supabase.from("bias_questions").select("*").order("position"),
      supabase.from("candidates").select("*").order("round_number, position"),
      supabase.from("session_players").select("id, name, score, is_host").eq("session_id", sess.id).order("joined_at"),
      supabase.from("player_bias_assignments").select("*").eq("session_id", sess.id),
      supabase.from("bias_question_answers").select("*").eq("session_id", sess.id),
      supabase.from("candidate_votes").select("*").eq("session_id", sess.id),
      supabase.from("bias_guesses").select("*").eq("session_id", sess.id),
      supabase.from("session_phase_ready").select("player_id, phase_key").eq("session_id", sess.id),
      supabase.from("cards").select("id, title, content, explanation, category").eq("type", "action"),
    ]);
    setBiases((b.data ?? []) as BiasRow[]);
    setActionCards((ac.data ?? []) as ActionCardRow[]);

    setQuestions((q.data ?? []) as BiasQuestionRow[]);
    setCandidates((c.data ?? []) as CandidateRow[]);
    setPlayers((p.data ?? []) as PlayerRow[]);
    setAssignments((a.data ?? []) as AssignmentRow[]);
    setAnswers((ans.data ?? []) as QuestionAnswerRow[]);
    setVotes((v.data ?? []) as CandidateVoteRow[]);
    setGuesses((g.data ?? []) as BiasGuessRow[]);
    setReadyRows((r.data ?? []) as ReadyRow[]);
    setLoading(false);
  }, [code, navigate]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Backfill player row if missing
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

  // Realtime
  useEffect(() => {
    if (!session) return;
    const ch = supabase
      .channel(`bias:${session.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "game_sessions", filter: `id=eq.${session.id}` },
        (p) => { if (p.eventType !== "DELETE") setSession((prev) => ({ ...(prev as SessionRow), ...(p.new as SessionRow) })); })
      .on("postgres_changes", { event: "*", schema: "public", table: "session_players", filter: `session_id=eq.${session.id}` },
        () => supabase.from("session_players").select("id, name, score, is_host").eq("session_id", session.id).order("joined_at")
          .then(({ data }) => setPlayers((data ?? []) as PlayerRow[])))
      .on("postgres_changes", { event: "*", schema: "public", table: "player_bias_assignments", filter: `session_id=eq.${session.id}` },
        () => supabase.from("player_bias_assignments").select("*").eq("session_id", session.id)
          .then(({ data }) => setAssignments((data ?? []) as AssignmentRow[])))
      .on("postgres_changes", { event: "*", schema: "public", table: "bias_question_answers", filter: `session_id=eq.${session.id}` },
        () => supabase.from("bias_question_answers").select("*").eq("session_id", session.id)
          .then(({ data }) => setAnswers((data ?? []) as QuestionAnswerRow[])))
      .on("postgres_changes", { event: "*", schema: "public", table: "candidate_votes", filter: `session_id=eq.${session.id}` },
        () => supabase.from("candidate_votes").select("*").eq("session_id", session.id)
          .then(({ data }) => setVotes((data ?? []) as CandidateVoteRow[])))
      .on("postgres_changes", { event: "*", schema: "public", table: "bias_guesses", filter: `session_id=eq.${session.id}` },
        () => supabase.from("bias_guesses").select("*").eq("session_id", session.id)
          .then(({ data }) => setGuesses((data ?? []) as BiasGuessRow[])))
      .on("postgres_changes", { event: "*", schema: "public", table: "session_phase_ready", filter: `session_id=eq.${session.id}` },
        () => supabase.from("session_phase_ready").select("player_id, phase_key").eq("session_id", session.id)
          .then(({ data }) => setReadyRows((data ?? []) as ReadyRow[])))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session?.id]);

  // ===== Host actions =====
  async function startGame() {
    if (!session || !isHost) return;
    if (biases.length === 0) { toast.error("Keine Bias-Typen vorhanden."); return; }
    // Randomly assign biases — each player gets one, cycling through bias pool
    const shuffledBiases = [...biases].sort(() => Math.random() - 0.5);
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const rows = shuffledPlayers.map((p, i) => ({
      session_id: session.id,
      player_id: p.id,
      bias_id: shuffledBiases[i % shuffledBiases.length].id,
    }));
    const { error: aErr } = await supabase.from("player_bias_assignments").insert(rows);
    if (aErr) { toast.error("Bias-Zuordnung fehlgeschlagen."); return; }
    await supabase.from("game_sessions").update({
      phase: "phase1_knowledge",
      status: "playing",
      current_round: 1,
      current_question_index: 0,
      current_candidate_index: 0,
      phase_started_at: new Date().toISOString(),
    }).eq("id", session.id);
  }

  async function setPhase(phase: GamePhase, extra: Partial<SessionRow> = {}) {
    if (!session || !isHost) return;
    await supabase.from("game_sessions").update({
      phase,
      phase_started_at: new Date().toISOString(),
      ...extra,
    }).eq("id", session.id);
  }

  async function nextQuestion() {
    if (!session || !isHost) return;
    const next = session.current_question_index + 1;
    if (next >= 3) {
      await setPhase("phase3_candidates", { current_candidate_index: 0 });
    } else {
      await supabase.from("game_sessions").update({
        current_question_index: next,
        phase_started_at: new Date().toISOString(),
      }).eq("id", session.id);
    }
  }


  async function nextCandidate() {
    if (!session || !isHost) return;
    const next = session.current_candidate_index + 1;
    if (next >= 3) {
      await setPhase("phase4_hire_vote");
    } else {
      await supabase.from("game_sessions").update({
        current_candidate_index: next,
        phase_started_at: new Date().toISOString(),
      }).eq("id", session.id);
    }
  }

  async function prevCandidate() {
    if (!session || !isHost) return;
    if (session.current_candidate_index <= 0) return;
    await supabase.from("game_sessions").update({
      current_candidate_index: session.current_candidate_index - 1,
      phase_started_at: new Date().toISOString(),
    }).eq("id", session.id);
  }

  async function drawActionCard() {
    if (!session || !isHost || actionCards.length === 0) return;
    const pick = actionCards[Math.floor(Math.random() * actionCards.length)];
    await supabase.from("game_sessions").update({
      current_action_card_id: pick.id,
      action_card_started_at: new Date().toISOString(),
    } as never).eq("id", session.id);
  }

  async function clearActionCard() {
    if (!session || !isHost) return;
    await supabase.from("game_sessions").update({
      current_action_card_id: null,
      action_card_started_at: null,
    } as never).eq("id", session.id);
  }


  async function nextRound() {
    if (!session || !isHost) return;
    if (session.current_round >= TOTAL_ROUNDS) {
      await setPhase("final_results", { status: "ended" });
    } else {
      await supabase.from("game_sessions").update({
        phase: "phase3_candidates",
        current_round: session.current_round + 1,
        current_candidate_index: 0,
        phase_started_at: new Date().toISOString(),
      }).eq("id", session.id);
    }
  }

  // ===== Player actions =====
  async function submitAnswer(questionId: string, answer: boolean) {
    if (!session || !myPlayerId) return;
    const q = questions.find((x) => x.id === questionId);
    if (!q) return;
    const is_correct = q.correct_answer === answer;
    const { error } = await supabase.from("bias_question_answers").upsert({
      session_id: session.id,
      player_id: myPlayerId,
      question_id: questionId,
      answer,
      is_correct,
    }, { onConflict: "session_id,player_id,question_id" });
    if (error) toast.error("Antwort konnte nicht gespeichert werden.");
    else if (is_correct) {
      // award +1 point for correct knowledge answer
      const me = players.find((p) => p.id === myPlayerId);
      if (me) await supabase.from("session_players").update({ score: me.score + 1 }).eq("id", myPlayerId);
    }
  }

  async function submitCandidateVote(candidateId: string) {
    if (!session || !myPlayerId) return;
    const { error } = await supabase.from("candidate_votes").upsert({
      session_id: session.id,
      player_id: myPlayerId,
      round_number: session.current_round,
      candidate_id: candidateId,
    }, { onConflict: "session_id,player_id,round_number" });
    if (error) toast.error("Stimme nicht gespeichert.");
  }

  async function submitBiasGuesses(picks: Record<string, string>) {
    if (!session || !myPlayerId) return;
    const rows = Object.entries(picks).map(([targetId, biasId]) => {
      const target = assignments.find((a) => a.player_id === targetId);
      return {
        session_id: session.id,
        guesser_player_id: myPlayerId,
        target_player_id: targetId,
        round_number: session.current_round,
        guessed_bias_id: biasId,
        is_correct: target?.bias_id === biasId,
      };
    });
    if (rows.length === 0) return;
    const { error } = await supabase.from("bias_guesses").upsert(rows, {
      onConflict: "session_id,guesser_player_id,target_player_id,round_number",
    });
    if (error) { toast.error("Tipps nicht gespeichert."); return; }
    // award points for correct guesses
    const correct = rows.filter((r) => r.is_correct).length;
    if (correct > 0) {
      const me = players.find((p) => p.id === myPlayerId);
      if (me) await supabase.from("session_players").update({ score: me.score + correct }).eq("id", myPlayerId);
    }
    toast.success(`${correct} richtige Bias-Tipp${correct === 1 ? "" : "s"} (+${correct} Pkt.)`);
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/join?code=${code}` : "";
  function copyShare() { navigator.clipboard.writeText(shareUrl); toast.success("Link kopiert"); }

  if (loading || !session) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Lädt…</div>;
  }

  // ===== Phase ready / timer =====
  const phaseKey = `${session.phase}:${session.current_round}:${session.current_question_index}:${session.current_candidate_index}`;
  const readyForStep = readyRows.filter((r) => r.phase_key === phaseKey);
  const readyCount = readyForStep.length;
  const iAmReady = !!(myPlayerId && readyForStep.find((r) => r.player_id === myPlayerId));
  const showStatusBar = session.phase !== "lobby" && session.phase !== "final_results";

  const startMs = session.phase_started_at ? new Date(session.phase_started_at).getTime() : Date.now();
  const elapsed = Math.max(0, Math.floor((nowTick - startMs) / 1000));
  const timerExpired = elapsed >= PHASE_DURATION_SECONDS;
  const allReady = players.length > 0 && readyCount >= players.length;
  const canAdvance = allReady || timerExpired;

  async function markReady() {
    if (!session || !myPlayerId) return;
    await supabase.from("session_phase_ready").upsert(
      { session_id: session.id, player_id: myPlayerId, phase_key: phaseKey },
      { onConflict: "session_id,player_id,phase_key" },
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Startseite
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-mono">
              Runde {Math.max(1, session.current_round)} / {TOTAL_ROUNDS}
            </Badge>
            <button onClick={copyShare} className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm hover:border-accent transition">
              <span className="font-display text-lg tracking-[0.3em] text-accent">{code}</span>
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          <div>
            <div className="mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {phaseLabel(session.phase)}
            </div>

            {showStatusBar && (
              <PhaseStatusBar
                phaseStartedAt={session.phase_started_at}
                iAmReady={iAmReady}
                readyCount={readyCount}
                totalPlayers={players.length}
                onReady={markReady}
                canMarkReady={!!myPlayerId}
              />
            )}

            {session.phase === "lobby" && (
              <LobbyView code={code} isHost={isHost} players={players} onStart={startGame} />
            )}

            {session.phase === "phase1_knowledge" && (
              <Phase1Knowledge
                myBias={myBias}
                isHost={isHost}
                playersReady={players.length}
                assignmentsCount={assignments.length}
                canAdvance={canAdvance}
                onNext={() => setPhase("phase2_questions", { current_question_index: 0 })}
              />
            )}

            {session.phase === "phase2_questions" && (
              <Phase2Questions
                myBias={myBias}
                myPlayerId={myPlayerId}
                questions={questions}
                answers={answers}
                qIndex={session.current_question_index}
                isHost={isHost}
                players={players}
                canAdvance={canAdvance}
                onAnswer={submitAnswer}
                onNext={nextQuestion}
              />
            )}

            {session.phase === "phase3_candidates" && (
              <>
                <Phase3Candidates
                  candidates={candidates}
                  round={session.current_round}
                  index={session.current_candidate_index}
                  isHost={isHost}
                  canAdvance={canAdvance}
                  onNext={nextCandidate}
                  onPrev={prevCandidate}
                  actionCards={actionCards}
                  currentActionCardId={session.current_action_card_id}
                  actionCardStartedAt={session.action_card_started_at}
                  nowTick={nowTick}
                  onDrawAction={drawActionCard}
                  onClearAction={clearActionCard}
                  myPlayerId={myPlayerId}
                />

                {myPlayerId && (
                  <ChatPanel
                    sessionId={session.id}
                    myPlayerId={myPlayerId}
                    myName={identity?.name ?? ""}
                    phase={session.phase}
                    round={session.current_round}
                    title="Live-Chat zur Diskussion"
                  />
                )}
              </>
            )}

            {session.phase === "phase4_hire_vote" && (
              <Phase4HireVote
                candidates={candidates}
                round={session.current_round}
                votes={votes}
                players={players}
                myPlayerId={myPlayerId}
                isHost={isHost}
                canAdvance={canAdvance}
                onVote={submitCandidateVote}
                onNext={() => setPhase("phase5_bias_guess")}
                sessionId={session.id}
                myName={identity?.name ?? ""}
              />
            )}

            {session.phase === "phase5_bias_guess" && (
              <Phase5BiasGuess
                biases={biases}
                players={players}
                assignments={assignments}
                guesses={guesses}
                myPlayerId={myPlayerId}
                round={session.current_round}
                isHost={isHost}
                canAdvance={canAdvance}
                onSubmit={submitBiasGuesses}
                onNext={nextRound}
                isLastRound={session.current_round >= TOTAL_ROUNDS}
                sessionId={session.id}
                myName={identity?.name ?? ""}
              />
            )}

            {session.phase === "final_results" && (
              <FinalResults
                players={players}
                biases={biases}
                assignments={assignments}
                sessionId={session.id}
                myPlayerId={myPlayerId}
                myBias={myBias}
              />
            )}

          </div>

          <PlayerSidebar
            players={players}
            myPlayerId={myPlayerId}
            myBias={myBias}
            phase={session.phase}
          />
        </div>
      </div>
    </main>
  );
}

// ===== Sidebar =====
function PlayerSidebar({ players, myPlayerId, myBias, phase }: {
  players: PlayerRow[]; myPlayerId: string | null; myBias: BiasRow | null; phase: GamePhase;
}) {
  const showBias = phase !== "lobby" && myBias;
  return (
    <aside className="space-y-3">
      {showBias && (
        <Card className="rounded-3xl p-5" style={{ borderColor: myBias.color, borderWidth: 2 }}>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Deine Bias</div>
          <div className="font-display text-2xl mt-1" style={{ color: myBias.color }}>{myBias.name}</div>
          <p className="text-xs text-muted-foreground mt-2">{myBias.short_description}</p>
        </Card>
      )}
      <Card className="rounded-3xl p-5">
        <div className="font-display text-lg mb-3">Spieler:innen</div>
        <ul className="space-y-2">
          {players.length === 0 && <li className="text-sm text-muted-foreground">Noch niemand da.</li>}
          {[...players].sort((a, b) => b.score - a.score).map((p) => (
            <li key={p.id} className={cn(
              "flex items-center justify-between rounded-xl px-3 py-2",
              myPlayerId === p.id ? "bg-primary/10" : "bg-muted/40",
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
    </aside>
  );
}

// ===== Lobby =====
function LobbyView({ code, isHost, players, onStart }: {
  code: string; isHost: boolean; players: PlayerRow[]; onStart: () => void;
}) {
  return (
    <Card className="rounded-3xl p-10 text-center">
      <Users className="mx-auto h-12 w-12 text-accent" />
      <div className="font-display text-4xl mt-4">Lobby</div>
      <p className="text-muted-foreground mt-2">
        Teilt den Code <span className="text-accent font-display tracking-[0.3em]">{code}</span> mit eurem Team.
      </p>
      <p className="text-sm text-muted-foreground mt-4">
        {players.length} {players.length === 1 ? "Spieler:in" : "Spieler:innen"} verbunden.
        Empfohlen: 4 Personen, mindestens 2.
      </p>
      {isHost ? (
        <Button size="lg" onClick={onStart} className="mt-8 h-12">
          <Sparkles className="h-4 w-4 mr-2" /> Spiel starten
        </Button>
      ) : (
        <div className="mt-8 text-sm text-muted-foreground">Warte auf den Host…</div>
      )}
    </Card>
  );
}

// ===== Phase 1: Knowledge =====
function Phase1Knowledge({ myBias, isHost, playersReady, assignmentsCount, canAdvance, onNext }: {
  myBias: BiasRow | null; isHost: boolean; playersReady: number; assignmentsCount: number; canAdvance: boolean; onNext: () => void;
}) {
  if (!myBias) {
    return <Card className="rounded-3xl p-10 text-center text-muted-foreground">Bias wird zugewiesen…</Card>;
  }
  return (
    <div className="space-y-4">
      <Card
        className="rounded-3xl p-8 sm:p-10 shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${myBias.color}22, ${myBias.color}08)`,
          borderColor: myBias.color, borderWidth: 2,
        }}
      >
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]" style={{ color: myBias.color }}>
          <Brain className="h-4 w-4" /> Wissenskarte · Phase 1
        </div>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl" style={{ color: myBias.color }}>
          {myBias.name}
        </h2>
        <p className="mt-3 text-base sm:text-lg font-medium opacity-90">{myBias.short_description}</p>
        <p className="mt-6 text-base leading-relaxed">{myBias.knowledge_card_text}</p>
        {myBias.example && (
          <div className="mt-6 rounded-2xl bg-background/60 backdrop-blur p-4 border border-border/40">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Beispiel</div>
            <p className="text-sm">{myBias.example}</p>
          </div>
        )}
        {myBias.self_recognition && (
          <div className="mt-4 rounded-2xl bg-background/60 backdrop-blur p-4 border-l-4" style={{ borderColor: myBias.color }}>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: myBias.color }}>
              <Eye className="h-3 w-3" /> Wie erkennst du ihn in dir selbst?
            </div>
            <p className="text-sm leading-relaxed">{myBias.self_recognition}</p>
          </div>
        )}
        {myBias.source_url && (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Wissenschaftliche Quelle:</span>
            <a
              href={myBias.source_url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-foreground underline decoration-dotted hover:text-accent"
            >
              {myBias.source_label ?? "mehr lesen"}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
        <div className="mt-6 text-xs text-muted-foreground italic">
          Behalte deinen Bias für dich — die anderen sollen ihn nicht direkt erfahren.
        </div>

      </Card>
      {isHost && (
        <div className="flex flex-col items-center gap-2">
          <Button size="lg" onClick={onNext} disabled={!canAdvance} className="h-12">
            Weiter zu den Fragen <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          {!canAdvance && (
            <p className="text-xs text-muted-foreground">Warte bis alle bereit sind oder der Timer abläuft.</p>
          )}
        </div>
      )}
      {!isHost && (
        <div className="text-center text-sm text-muted-foreground">
          {assignmentsCount} / {playersReady} Spieler:innen haben ihre Karte. Warte auf Host…
        </div>
      )}
    </div>
  );
}

// ===== Phase 2: Questions =====
function Phase2Questions({ myBias, myPlayerId, questions, answers, qIndex, isHost, players, canAdvance, onAnswer, onNext }: {
  myBias: BiasRow | null; myPlayerId: string | null;
  questions: BiasQuestionRow[]; answers: QuestionAnswerRow[]; qIndex: number;
  isHost: boolean; players: PlayerRow[]; canAdvance: boolean;
  onAnswer: (questionId: string, answer: boolean) => void;
  onNext: () => void;
}) {
  if (!myBias) {
    return <Card className="rounded-3xl p-10 text-center text-muted-foreground">Kein Bias zugeordnet.</Card>;
  }
  const myQuestions = questions.filter((q) => q.bias_id === myBias.id).sort((a, b) => a.position - b.position);
  const q = myQuestions[qIndex];
  if (!q) {
    return <Card className="rounded-3xl p-10 text-center text-muted-foreground">Keine Fragen verfügbar.</Card>;
  }
  const myAnswer = answers.find((a) => a.player_id === myPlayerId && a.question_id === q.id);

  // progress: how many players have answered up to (and including) the current question index
  const playerAnswerCounts = players.map((p) => answers.filter((a) => a.player_id === p.id).length);
  const playersDone = playerAnswerCounts.filter((c) => c > qIndex).length;
  const allDone = playersDone >= players.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Frage {qIndex + 1} von 3 · zu deiner Bias</span>
        <span>{playersDone} / {players.length} fertig</span>
      </div>
      <Card key={q.id} className="rounded-3xl p-8 animate-fade-in" style={{ borderColor: myBias.color, borderWidth: 2 }}>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]" style={{ color: myBias.color }}>
          <HelpCircle className="h-4 w-4" /> Wahr oder Falsch?
        </div>
        <h2 className="mt-4 font-display text-2xl sm:text-3xl leading-snug">{q.question}</h2>

        {!myAnswer ? (
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Button size="lg" variant="outline" className="h-16 text-lg" onClick={() => onAnswer(q.id, true)}>
              <Check className="h-5 w-5 mr-2" /> Wahr
            </Button>
            <Button size="lg" variant="outline" className="h-16 text-lg" onClick={() => onAnswer(q.id, false)}>
              <X className="h-5 w-5 mr-2" /> Falsch
            </Button>
          </div>
        ) : (
          <div className={cn(
            "mt-6 rounded-2xl p-5 border-2 animate-scale-in",
            myAnswer.is_correct ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10",
          )}>
            <div className="flex items-center gap-2 font-display text-xl">
              {myAnswer.is_correct ? <Check className="h-5 w-5 text-green-600" /> : <X className="h-5 w-5 text-red-600" />}
              Deine Antwort: {myAnswer.answer ? "Wahr" : "Falsch"} —
              {myAnswer.is_correct ? " richtig (+1 Pkt.)" : " leider falsch"}
            </div>
            <p className="mt-3 text-sm">{q.explanation}</p>
          </div>
        )}
      </Card>
      {isHost && (
        <div className="flex flex-col items-center gap-2">
          <Button size="lg" onClick={onNext} disabled={!canAdvance} className="h-12" variant={allDone && canAdvance ? "default" : "secondary"}>
            {qIndex + 1 >= 3 ? "Weiter zu den Bewerber:innen" : "Nächste Frage"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          {!canAdvance && (
            <p className="text-xs text-muted-foreground">Warte bis alle bereit sind oder der Timer abläuft.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Phase 3: Candidates =====
function CandidateCard({ c }: { c: CandidateRow }) {
  const initials = c.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <Card className="rounded-3xl overflow-hidden">
      <div className="grid sm:grid-cols-[200px_1fr]">
        <div className="aspect-square sm:aspect-auto bg-gradient-to-br from-accent/30 via-primary/20 to-accent/10 grid place-items-center">
          {c.image_url ? (
            <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
          ) : (
            <div className="font-display text-6xl text-accent">{initials}</div>
          )}
        </div>
        <div className="p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Bewerber:in</div>
          <h3 className="font-display text-3xl mt-1">{c.name}</h3>
          <div className="text-sm text-muted-foreground">
            {c.age && `${c.age} Jahre`}{c.age && c.pronouns && " · "}{c.pronouns}
          </div>
          <div className="mt-3 text-base font-medium">{c.headline}</div>
          <p className="mt-3 text-sm leading-relaxed">{c.description}</p>
          <div className="mt-4 rounded-xl bg-muted/40 p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Qualifikationen</div>
            <pre className="text-xs whitespace-pre-wrap font-sans">{c.qualifications}</pre>
          </div>
        </div>
      </div>
    </Card>
  );
}

const ACTION_CARD_SECONDS = 60;

function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function Phase3Candidates({ candidates, round, index, isHost, canAdvance, onNext, onPrev,
  actionCards, currentActionCardId, actionCardStartedAt, nowTick, onDrawAction, onClearAction, myPlayerId }: {
  candidates: CandidateRow[]; round: number; index: number;
  isHost: boolean; canAdvance: boolean; onNext: () => void; onPrev: () => void;
  actionCards: ActionCardRow[]; currentActionCardId: string | null;
  actionCardStartedAt: string | null; nowTick: number;
  onDrawAction: () => void; onClearAction: () => void;
  myPlayerId: string | null;
}) {
  const isActive = !!currentActionCardId;
  const pickKey = `${myPlayerId ?? "anon"}-${round}-${index}`;
  const activeCard = isActive && actionCards.length > 0
    ? actionCards[hashStr(pickKey) % actionCards.length]
    : null;
  const startMs = actionCardStartedAt ? new Date(actionCardStartedAt).getTime() : null;
  const elapsed = startMs ? Math.max(0, Math.floor((nowTick - startMs) / 1000)) : 0;
  const remaining = Math.max(0, ACTION_CARD_SECONDS - elapsed);

  const roundCandidates = candidates.filter((c) => c.round_number === round).sort((a, b) => a.position - b.position);
  const c = roundCandidates[index];

  // Auto-draw a mandatory action card once per candidate (host only)
  const drawnKeyRef = useRef<string | null>(null);
  const drawnForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isHost || !c) return;
    const key = `${round}-${index}-${c.id}`;
    if (activeCard || currentActionCardId) {
      drawnForRef.current = key;
      return;
    }
    if (drawnKeyRef.current === key || drawnForRef.current === key) return;
    if (actionCards.length === 0) return;
    drawnKeyRef.current = key;
    onDrawAction();
  }, [isHost, c, round, index, activeCard, currentActionCardId, actionCards.length, onDrawAction]);

  if (!c) return <Card className="rounded-3xl p-10 text-center text-muted-foreground">Keine Bewerber für diese Runde.</Card>;

  const actionPending = !!activeCard && remaining > 0;
  const blockAdvance = !canAdvance || actionPending;

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground">
        Bewerber:in {index + 1} von {roundCandidates.length}
      </div>
      <div key={c.id} className="animate-fade-in">
        <CandidateCard c={c} />
      </div>
      <Card className="rounded-2xl p-4 bg-muted/30">
        <div className="flex items-start gap-2">
          <Users className="h-4 w-4 mt-0.5 text-accent" />
          <p className="text-sm text-muted-foreground">
            Diskutiert kurz: Wie wirkt diese Person auf euch? Würdet ihr sie einstellen?
          </p>
        </div>
      </Card>

      {activeCard ? (
        <Card className="rounded-3xl p-6 border-2 border-accent bg-accent/5 animate-scale-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent">
              <Zap className="h-4 w-4" /> Aktionskarte · alle mitmachen (Pflicht)
            </div>
            <div className="flex items-center gap-1 text-sm font-mono tabular-nums" style={{ color: remaining <= 10 ? "hsl(var(--destructive))" : undefined }}>
              <TimerIcon className="h-4 w-4" />
              {String(Math.floor(remaining / 60)).padStart(1, "0")}:{String(remaining % 60).padStart(2, "0")}
            </div>
          </div>
          <h3 className="mt-3 font-display text-2xl">{activeCard.title}</h3>
          <p className="mt-2 text-base">{activeCard.content}</p>
          {activeCard.explanation && (
            <p className="mt-3 text-sm text-muted-foreground italic">{activeCard.explanation}</p>
          )}
          {isHost && remaining === 0 && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={onClearAction}>Aktion beenden</Button>
            </div>
          )}
        </Card>
      ) : null}

      {isHost && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex justify-center gap-3">
            {index > 0 && (
              <Button size="lg" variant="outline" onClick={onPrev} className="h-12">
                <ChevronLeft className="h-4 w-4 mr-1" /> Zurück
              </Button>
            )}
            <Button size="lg" onClick={onNext} disabled={blockAdvance} className="h-12">
              {index + 1 >= roundCandidates.length ? "Zur Abstimmung" : "Nächste:r Bewerber:in"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          {actionPending && (
            <p className="text-xs text-muted-foreground">Aktionskarte läuft – bitte gemeinsam durchführen ({remaining}s).</p>
          )}
          {!actionPending && !canAdvance && (
            <p className="text-xs text-muted-foreground">Warte bis alle bereit sind oder der Timer abläuft.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Phase 4: Hire Vote =====
function Phase4HireVote({ candidates, round, votes, players, myPlayerId, isHost, canAdvance, onVote, onNext, sessionId, myName }: {
  candidates: CandidateRow[]; round: number; votes: CandidateVoteRow[];
  players: PlayerRow[]; myPlayerId: string | null; isHost: boolean; canAdvance: boolean;
  onVote: (candidateId: string) => void; onNext: () => void;
  sessionId: string; myName: string;
}) {
  const roundCandidates = candidates.filter((c) => c.round_number === round).sort((a, b) => a.position - b.position);
  const roundVotes = votes.filter((v) => v.round_number === round);
  const myVote = roundVotes.find((v) => v.player_id === myPlayerId);
  const allVoted = roundVotes.length >= players.length;

  // Tally
  const tally: Record<string, number> = {};
  for (const v of roundVotes) tally[v.candidate_id] = (tally[v.candidate_id] ?? 0) + 1;
  const winnerId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent">
          <Vote className="h-4 w-4" /> Phase 4 · Wer wird eingestellt?
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Jede:r stimmt für eine:n Bewerber:in. Nach der Abstimmung wird das Ergebnis angezeigt.
        </p>
      </Card>

      <div className="grid sm:grid-cols-3 gap-3">
        {roundCandidates.map((c) => {
          const count = tally[c.id] ?? 0;
          const isMine = myVote?.candidate_id === c.id;
          const isWinner = allVoted && c.id === winnerId;
          const initials = c.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
          return (
            <button
              key={c.id}
              onClick={() => !allVoted && onVote(c.id)}
              disabled={allVoted}
              className={cn(
                "text-left rounded-3xl border-2 p-4 transition",
                isMine ? "border-accent bg-accent/10" : "border-border bg-card hover:border-accent/50",
                isWinner && "ring-2 ring-accent",
              )}
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-accent/30 to-primary/20 grid place-items-center mb-3">
                <span className="font-display text-4xl text-accent">{initials}</span>
              </div>
              <div className="font-display text-lg">{c.name}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">{c.headline}</div>
              {allVoted && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{count} Stimme{count === 1 ? "" : "n"}</span>
                  {isWinner && <Badge className="bg-accent text-accent-foreground"><UserCheck className="h-3 w-3 mr-1" />Eingestellt</Badge>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        {roundVotes.length} / {players.length} abgestimmt
      </div>

      <ChatPanel
        sessionId={sessionId}
        myPlayerId={myPlayerId}
        myName={myName}
        phase="phase4_hire_vote"
        round={round}
        title="Diskussion · Wer wird eingestellt?"
      />

      {isHost && (
        <div className="flex flex-col items-center gap-2">
          <Button size="lg" onClick={onNext} disabled={!allVoted || !canAdvance} className="h-12">
            Weiter zu Phase 5 (Bias raten) <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          {(!allVoted || !canAdvance) && (
            <p className="text-xs text-muted-foreground">
              {!allVoted ? "Warte bis alle abgestimmt haben." : "Warte bis alle bereit sind oder der Timer abläuft."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Phase 5: Bias Guess =====
function Phase5BiasGuess({ biases, players, assignments, guesses, myPlayerId, round, isHost, canAdvance, onSubmit, onNext, isLastRound, sessionId, myName }: {
  biases: BiasRow[]; players: PlayerRow[]; assignments: AssignmentRow[];
  guesses: BiasGuessRow[]; myPlayerId: string | null; round: number;
  isHost: boolean; canAdvance: boolean; onSubmit: (picks: Record<string, string>) => void;
  onNext: () => void; isLastRound: boolean;
  sessionId: string; myName: string;
}) {
  const others = players.filter((p) => p.id !== myPlayerId);
  const myGuesses = guesses.filter((g) => g.guesser_player_id === myPlayerId && g.round_number === round);
  const alreadySubmitted = myGuesses.length === others.length && others.length > 0;
  const [picks, setPicks] = useState<Record<string, string>>({});

  // Sync existing
  useEffect(() => {
    if (myGuesses.length > 0) {
      const p: Record<string, string> = {};
      for (const g of myGuesses) p[g.target_player_id] = g.guessed_bias_id;
      setPicks(p);
    }
  }, [myGuesses.length]);

  const allPlayersSubmitted = players.every((p) => {
    const submittedCount = guesses.filter((g) => g.guesser_player_id === p.id && g.round_number === round).length;
    return submittedCount >= players.length - 1;
  });

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent">
          <Eye className="h-4 w-4" /> Phase 5 · Welche Bias hat wer?
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Tippe für jede:n andere:n Mitspieler:in, welchen Bias er/sie haben könnte. Jeder richtige Tipp gibt +1 Punkt.
        </p>
      </Card>

      <div className="space-y-3">
        {others.map((p) => {
          const targetAssignment = assignments.find((a) => a.player_id === p.id);
          const correctBiasId = targetAssignment?.bias_id;
          const myGuess = myGuesses.find((g) => g.target_player_id === p.id);
          return (
            <Card key={p.id} className="rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-display text-lg">{p.name}</div>
                {alreadySubmitted && myGuess && (
                  <Badge variant={myGuess.is_correct ? "default" : "destructive"}>
                    {myGuess.is_correct ? "Richtig!" : "Falsch"}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {biases.map((b) => {
                  const isPick = picks[p.id] === b.id;
                  const isCorrect = alreadySubmitted && b.id === correctBiasId;
                  const isMyGuess = alreadySubmitted && myGuess?.guessed_bias_id === b.id;
                  return (
                    <button
                      key={b.id}
                      disabled={alreadySubmitted}
                      onClick={() => setPicks({ ...picks, [p.id]: b.id })}
                      className={cn(
                        "rounded-xl border-2 p-3 text-sm text-left transition",
                        isPick && !alreadySubmitted && "border-accent bg-accent/10",
                        !isPick && !alreadySubmitted && "border-border hover:border-accent/50",
                        alreadySubmitted && isCorrect && "border-green-500 bg-green-500/10",
                        alreadySubmitted && isMyGuess && !isCorrect && "border-red-500 bg-red-500/10",
                        alreadySubmitted && !isCorrect && !isMyGuess && "opacity-50 border-border",
                      )}
                      style={!alreadySubmitted && isPick ? { borderColor: b.color, background: `${b.color}15` } : undefined}
                    >
                      <div className="font-medium" style={{ color: alreadySubmitted ? undefined : b.color }}>
                        {b.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      <ChatPanel
        sessionId={sessionId}
        myPlayerId={myPlayerId}
        myName={myName}
        phase="phase5_bias_guess"
        round={round}
        title="Diskussion · Bias raten"
      />


      {!alreadySubmitted && (
        <div className="flex justify-center">
          <Button
            size="lg"
            disabled={Object.keys(picks).length < others.length}
            onClick={() => onSubmit(picks)}
            className="h-12"
          >
            Tipps abgeben
          </Button>
        </div>
      )}

      {isHost && (
        <div className="flex flex-col items-center gap-2">
          <Button
            size="lg"
            onClick={onNext}
            disabled={!allPlayersSubmitted || !canAdvance}
            variant={allPlayersSubmitted && canAdvance ? "default" : "secondary"}
            className="h-12"
          >
            {isLastRound ? "Endauswertung anzeigen" : "Nächste Runde"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          {(!allPlayersSubmitted || !canAdvance) && (
            <p className="text-xs text-muted-foreground">
              {!allPlayersSubmitted ? "Warte bis alle Tipps abgegeben wurden." : "Warte bis alle bereit sind oder der Timer abläuft."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Final Results =====
function FinalResults({ players, biases, assignments, sessionId, myPlayerId, myBias }: {
  players: PlayerRow[]; biases: BiasRow[]; assignments: AssignmentRow[];
  sessionId: string; myPlayerId: string | null; myBias: BiasRow | null;
}) {
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const top = ranked[0]?.score ?? 0;
  const winners = ranked.filter((p) => p.score === top && top > 0);
  return (
    <div className="space-y-6 text-center">
      <Trophy className="mx-auto h-12 w-12 text-accent" />
      <h1 className="font-display text-5xl">Endauswertung</h1>
      {winners.length > 0 && (
        <div className="font-display text-3xl text-accent">
          Sieg: {winners.map((w) => w.name).join(" & ")} ({top} Pkt.)
        </div>
      )}
      <Card className="rounded-3xl p-6 text-left">
        <div className="font-display text-xl mb-4">Bias-Aufdeckung</div>
        <ul className="space-y-2">
          {players.map((p) => {
            const a = assignments.find((x) => x.player_id === p.id);
            const b = a ? biases.find((y) => y.id === a.bias_id) : null;
            return (
              <li key={p.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                <span className="flex items-center gap-2">
                  {p.is_host && <Crown className="h-3.5 w-3.5 text-accent" />}
                  <span>{p.name}</span>
                </span>
                {b && (
                  <span className="font-display text-sm" style={{ color: b.color }}>
                    {b.name}
                  </span>
                )}
                <span className="font-display text-lg w-12 text-right">{p.score}</span>
              </li>
            );
          })}
        </ul>
      </Card>

      {myPlayerId && myBias && (
        <ReflectionJournal sessionId={sessionId} playerId={myPlayerId} myBias={myBias} />
      )}

      <Link to="/"><Button size="lg" variant="outline" className="h-12">Zur Startseite</Button></Link>
    </div>
  );
}

// ===== Reflection Journal =====
function ReflectionJournal({ sessionId, playerId, myBias }: {
  sessionId: string; playerId: string; myBias: BiasRow;
}) {
  const [content, setContent] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("reflection_journals" as never)
        .select("content, updated_at")
        .eq("session_id", sessionId)
        .eq("player_id", playerId)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setContent((data as { content: string }).content ?? "");
        setSavedAt((data as { updated_at: string }).updated_at ?? null);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [sessionId, playerId]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("reflection_journals" as never)
      .upsert(
        { session_id: sessionId, player_id: playerId, content, updated_at: new Date().toISOString() } as never,
        { onConflict: "session_id,player_id" },
      );
    setSaving(false);
    if (error) { toast.error("Konnte Reflexion nicht speichern."); return; }
    setSavedAt(new Date().toISOString());
    toast.success("Reflexion gespeichert");
  }

  const prompts = [
    `Welche deiner Entscheidungen heute könnten von deinem Bias (${myBias.name}) beeinflusst worden sein?`,
    "In welchem Moment hast du gemerkt, dass du den Bias aktiv ausgespielt hast — oder ihm widerstanden hast?",
    "Was nimmst du für echte Recruiting-Situationen mit?",
  ];

  return (
    <Card className="rounded-3xl p-6 text-left" style={{ borderColor: myBias.color, borderWidth: 2 }}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]" style={{ color: myBias.color }}>
        <BookOpen className="h-4 w-4" /> Reflexions-Journal
      </div>
      <h2 className="mt-2 font-display text-2xl">Deine persönliche Auswertung</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Nimm dir 5 Minuten. Diese Notizen sind nur für dich — sie verlassen den Spielraum nicht.
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        {prompts.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span className="font-display text-base" style={{ color: myBias.color }}>{i + 1}.</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <Textarea
        className="mt-4 min-h-[180px]"
        placeholder={loading ? "Lädt…" : "Schreibe hier deine Gedanken…"}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={loading}
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {savedAt ? `Gespeichert: ${new Date(savedAt).toLocaleTimeString()}` : "Noch nicht gespeichert"}
        </span>
        <Button onClick={save} disabled={saving || loading || content.trim().length === 0}>
          {saving ? "Speichert…" : "Reflexion speichern"}
        </Button>
      </div>
    </Card>
  );
}
