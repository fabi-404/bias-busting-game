import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { socket, joinRoom, leaveRoom } from "@/lib/socket";
import { getIdentity, setIdentity } from "@/lib/game-storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  ArrowLeft, Copy, Crown, Sparkles, Users, Brain, HelpCircle,
  UserCheck, Vote, Eye, Trophy, Check, X, ChevronRight, ChevronLeft,
  BookOpen, ExternalLink, Zap, Timer as TimerIcon, Star, BarChart3,
  Volume2, VolumeX, AlertTriangle, ShieldCheck,
} from "lucide-react";

import {
  type SessionRow, type PlayerRow, type BiasRow, type BiasQuestionRow,
  type CandidateRow, type AssignmentRow, type QuestionAnswerRow,
  type CandidateVoteRow, type BiasGuessRow, type GamePhase, type ActionCardRow,
  type CandidatePrevoteRow, type ReadyRow, type AchievementRow,
  phaseLabel, ACHIEVEMENT_META,
} from "@/lib/bias-game";
import { isMuted, setMuted, playCorrect, playWrong, playFanfare } from "@/lib/sounds";

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

export function PlayPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const identity = getIdentity(code!);

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
  const [prevotes, setPrevotes] = useState<CandidatePrevoteRow[]>([]);
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);
  const [readyRows, setReadyRows] = useState<ReadyRow[]>([]);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [muted, setMutedState] = useState(() => isMuted());

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  // Fanfare beim Erreichen der Endauswertung
  const fanfarePlayedRef = useRef(false);
  useEffect(() => {
    if (session?.phase === "final_results" && !fanfarePlayedRef.current) {
      fanfarePlayedRef.current = true;
      playFanfare();
    }
  }, [session?.phase]);

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

  const selectedCandidates = useMemo(() => {
    if (!session) return [];
    if (session.selected_candidate_ids && session.selected_candidate_ids.length > 0) {
      const map = new Map(candidates.map((c) => [c.id, c]));
      return session.selected_candidate_ids
        .map((id) => map.get(id))
        .filter((c): c is CandidateRow => !!c);
    }
    return candidates
      .filter((c) => c.round_number === session.current_round)
      .sort((a, b) => a.position - b.position);
  }, [candidates, session]);

  useEffect(() => {
    if (!identity) navigate(`/join?code=${code}`);
  }, [identity, code, navigate]);

  const loadAll = useCallback(async () => {
    try {
      const data = await api.getSession(code!);
      if (!data) {
        toast.error("Spielraum nicht gefunden.");
        navigate("/");
        return;
      }
      setSession(data.session);
      setPlayers(data.players);
      setBiases(data.biases);
      setQuestions(data.questions);
      setCandidates(data.candidates);
      setActionCards(data.actionCards);
      setAssignments(data.assignments);
      setAnswers(data.answers);
      setVotes(data.votes);
      setGuesses(data.guesses);
      setReadyRows(data.ready);
      setPrevotes(data.prevotes);
      setAchievements(data.achievements ?? []);

      // Join Socket.io room
      joinRoom(data.session.id);
    } catch (e) {
      console.error(e);
      toast.error("Verbindung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }, [code, navigate]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Socket.io Realtime-Subscriptions
  useEffect(() => {
    socket.on("session:updated", (s: SessionRow) => setSession(s));
    socket.on("players:updated", (p: PlayerRow[]) => setPlayers(p));
    socket.on("assignments:updated", (a: AssignmentRow[]) => setAssignments(a));
    socket.on("answers:updated", (a: QuestionAnswerRow[]) => setAnswers(a));
    socket.on("votes:updated", (v: CandidateVoteRow[]) => setVotes(v));
    socket.on("prevotes:updated", (p: CandidatePrevoteRow[]) => setPrevotes(p));
    socket.on("guesses:updated", (g: BiasGuessRow[]) => setGuesses(g));
    socket.on("achievements:updated", (a: AchievementRow[]) => setAchievements(a));
    socket.on("ready:updated", (r: ReadyRow[]) => setReadyRows(r));

    return () => {
      socket.off("session:updated");
      socket.off("players:updated");
      socket.off("assignments:updated");
      socket.off("answers:updated");
      socket.off("votes:updated");
      socket.off("prevotes:updated");
      socket.off("guesses:updated");
      socket.off("achievements:updated");
      socket.off("ready:updated");
      if (session?.id) leaveRoom(session.id);
    };
  }, [session?.id]);

  // ===== Host actions =====
  async function startGame() {
    if (!session || !isHost) return;
    if (biases.length === 0) { toast.error("Keine Bias-Typen vorhanden."); return; }
    try {
      const shuffledBiases = [...biases].sort(() => Math.random() - 0.5);
      const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
      const rows = shuffledPlayers.map((p, i) => ({
        player_id: p.id,
        bias_id: shuffledBiases[i % shuffledBiases.length].id,
      }));

      const newAssignments = await api.assignBiases(session.id, rows);
      setAssignments(newAssignments as AssignmentRow[]);

      const pool = candidates.filter((c) => c.round_number === 1);
      const selected = [...pool].sort(() => Math.random() - 0.5).slice(0, 3).map((c) => c.id);

      const updated = await api.updateSession(session.id, {
        phase: "phase1_knowledge",
        status: "playing",
        current_round: 1,
        current_question_index: 0,
        current_candidate_index: 0,
        phase_started_at: new Date().toISOString(),
        selected_candidate_ids: selected,
      });
      setSession(updated);
    } catch (e) {
      console.error(e);
      toast.error("Spiel konnte nicht gestartet werden.");
    }
  }

  async function setPhase(phase: GamePhase, extra: Partial<SessionRow> = {}) {
    if (!session || !isHost) return;
    try {
      const updated = await api.updateSession(session.id, {
        phase,
        phase_started_at: new Date().toISOString(),
        ...extra,
      });
      setSession(updated);
    } catch (e) {
      console.error(e);
      toast.error("Phase konnte nicht gewechselt werden.");
    }
  }

  async function nextQuestion() {
    if (!session || !isHost) return;
    const next = session.current_question_index + 1;
    if (next >= 3) {
      await setPhase("phase3_candidates", { current_candidate_index: 0 });
    } else {
      try {
        const updated = await api.updateSession(session.id, {
          current_question_index: next,
          phase_started_at: new Date().toISOString(),
        });
        setSession(updated);
      } catch (e) {
        console.error(e);
        toast.error("Nächste Frage konnte nicht geladen werden.");
      }
    }
  }

  async function nextCandidate() {
    if (!session || !isHost) return;
    const next = session.current_candidate_index + 1;
    if (next >= selectedCandidates.length) {
      await setPhase("phase4_hire_vote");
    } else {
      try {
        const updated = await api.updateSession(session.id, {
          current_candidate_index: next,
          current_action_card_id: null,
          action_card_started_at: null,
          phase_started_at: new Date().toISOString(),
        });
        setSession(updated);
      } catch (e) {
        console.error(e);
        toast.error("Nächste:r Bewerber:in konnte nicht geladen werden.");
      }
    }
  }

  async function prevCandidate() {
    if (!session || !isHost || session.current_candidate_index <= 0) return;
    try {
      const updated = await api.updateSession(session.id, {
        current_candidate_index: session.current_candidate_index - 1,
        phase_started_at: new Date().toISOString(),
      });
      setSession(updated);
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Zurücknavigieren.");
    }
  }

  async function drawActionCard() {
    if (!session || !isHost || actionCards.length === 0) return;
    const pick = actionCards[Math.floor(Math.random() * actionCards.length)];
    try {
      const updated = await api.updateSession(session.id, {
        current_action_card_id: pick.id,
        action_card_started_at: new Date().toISOString(),
      });
      setSession(updated);
    } catch (e) {
      console.error(e);
      toast.error("Aktionskarte konnte nicht gezogen werden.");
    }
  }

  async function clearActionCard() {
    if (!session || !isHost) return;
    try {
      const updated = await api.updateSession(session.id, {
        current_action_card_id: null,
        action_card_started_at: null,
      });
      setSession(updated);
    } catch (e) {
      console.error(e);
      toast.error("Aktionskarte konnte nicht entfernt werden.");
    }
  }

  async function startNextRound() {
    if (!session || !isHost) return;
    const next = session.current_round + 1;
    const roundPool = candidates.filter((c) => c.round_number === next);
    const selected = [...roundPool].sort(() => Math.random() - 0.5).slice(0, 3).map((c) => c.id);
    try {
      const updated = await api.updateSession(session.id, {
        phase: "phase3_candidates",
        current_round: next,
        current_candidate_index: 0,
        current_action_card_id: null,
        action_card_started_at: null,
        selected_candidate_ids: selected,
        phase_started_at: new Date().toISOString(),
      });
      setSession(updated);
    } catch (e) {
      console.error(e);
      toast.error("Nächste Runde konnte nicht gestartet werden.");
    }
  }

  async function finishGame() {
    if (!session || !isHost) return;
    try {
      const rows = await api.finalizeSession(session.id);
      setAchievements(rows);
    } catch (e) {
      console.error(e);
      toast.error("Auszeichnungen konnten nicht berechnet werden.");
    }
    await setPhase("final_results", { status: "ended" } as Partial<SessionRow>);
  }

  // ===== Player actions =====
  async function submitAnswer(questionId: string, answer: boolean) {
    if (!session || !myPlayerId) return;
    try {
      const result = await api.submitAnswer(session.id, myPlayerId, questionId, answer);
      if (result.points_awarded > 0) playCorrect(); else playWrong();
      if (result.points_awarded === 2) {
        toast.success("⚡ Blitzschnell! +2 Punkte (Schnell-Bonus)");
      } else if (result.points_awarded === 1) {
        toast.success("Richtig! +1 Punkt");
      }
    } catch {
      toast.error("Antwort konnte nicht gespeichert werden.");
    }
  }

  async function submitCandidateVote(candidateId: string) {
    if (!session || !myPlayerId) return;
    try {
      await api.submitVote(session.id, myPlayerId, session.current_round, candidateId);
    } catch {
      toast.error("Stimme nicht gespeichert.");
    }
  }

  async function submitPrevote(candidateId: string, rating: number) {
    if (!session || !myPlayerId) return;
    try {
      await api.submitPrevote(session.id, myPlayerId, session.current_round, candidateId, rating);
    } catch {
      toast.error("Bewertung nicht gespeichert.");
    }
  }

  async function submitBiasGuesses(picks: Record<string, string>) {
    if (!session || !myPlayerId) return;
    const rows = Object.entries(picks).map(([targetId, biasId]) => {
      const target = assignments.find((a) => a.player_id === targetId);
      return {
        guesser_player_id: myPlayerId,
        target_player_id: targetId,
        round_number: session.current_round,
        guessed_bias_id: biasId,
        is_correct: target?.bias_id === biasId,
      };
    });
    if (!rows.length) return;
    try {
      const result = await api.submitGuesses(session.id, rows);
      toast.success(`${result.correct} richtige Bias-Tipp${result.correct === 1 ? "" : "s"} (+${result.correct} Pkt.)`);
    } catch {
      toast.error("Tipps nicht gespeichert.");
    }
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/join?code=${code}` : "";
  function copyShare() { navigator.clipboard.writeText(shareUrl); toast.success("Link kopiert"); }

  if (loading || !session) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Lädt…</div>;
  }

  const phaseKey = `${session.phase}:${session.current_round}:${session.current_question_index}:${session.current_candidate_index}`;
  const readyForStep = readyRows.filter((r) => r.phase_key === phaseKey);
  const readyCount = readyForStep.length;
  const iAmReady = !!(myPlayerId && readyForStep.find((r) => r.player_id === myPlayerId));
  const showStatusBar = session.phase !== "lobby" && session.phase !== "final_results";

  const phaseDuration = session.phase_duration_seconds ?? PHASE_DURATION_SECONDS;
  const startMs = session.phase_started_at ? new Date(session.phase_started_at).getTime() : Date.now();
  const elapsed = Math.max(0, Math.floor((nowTick - startMs) / 1000));
  const timerExpired = elapsed >= phaseDuration;
  const allReady = players.length > 0 && readyCount >= players.length;
  const canAdvance = allReady || timerExpired;

  async function markReady() {
    if (!session || !myPlayerId) return;
    await api.markReady(session.id, myPlayerId, phaseKey);
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Startseite
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-mono">
              Runde {Math.max(1, session.current_round)} / {session.total_rounds}
            </Badge>
            <button
              onClick={toggleMute}
              className="grid h-9 w-9 place-items-center rounded-full bg-card border border-border hover:border-accent transition"
              title={muted ? "Ton einschalten" : "Ton ausschalten"}
            >
              {muted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-accent" />}
            </button>
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
                durationSeconds={phaseDuration}
              />
            )}

            {session.phase === "lobby" && (
              <LobbyView
                code={code!}
                isHost={isHost}
                players={players}
                onStart={startGame}
                phaseDuration={phaseDuration}
                anonymousVoting={session.anonymous_voting ?? true}
                totalRounds={session.total_rounds}
                onUpdateSettings={async (patch) => {
                  await api.updateSession(session.id, patch);
                }}
              />
            )}

            {session.phase === "phase1_knowledge" && (
              <Phase1Knowledge
                myBias={myBias}
                isHost={isHost}
                playersReady={players.length}
                assignmentsCount={assignments.length}
                canAdvance={canAdvance}
                onNext={() => setPhase("phase2_questions", { current_question_index: 0 } as Partial<SessionRow>)}
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

            {session.phase === "phase3_candidates" && (() => {
              const currentCandidate = selectedCandidates[session.current_candidate_index];
              const prevotesForCandidate = currentCandidate
                ? prevotes.filter((pv) => pv.candidate_id === currentCandidate.id && pv.round_number === session.current_round)
                : [];
              const allPrevoted = players.length > 0 && prevotesForCandidate.length >= players.length;
              return (
                <>
                  <Phase3Candidates
                    candidates={selectedCandidates}
                    round={session.current_round}
                    index={session.current_candidate_index}
                    isHost={isHost}
                    canAdvance={canAdvance && allPrevoted}
                    onNext={nextCandidate}
                    onPrev={prevCandidate}
                    actionCards={actionCards}
                    currentActionCardId={session.current_action_card_id}
                    actionCardStartedAt={session.action_card_started_at}
                    nowTick={nowTick}
                    onDrawAction={drawActionCard}
                    onClearAction={clearActionCard}
                    myPlayerId={myPlayerId}
                    players={players}
                    prevotesForCandidate={prevotesForCandidate}
                    onPrevote={submitPrevote}
                    allPrevoted={allPrevoted}
                  />
                  {myPlayerId && allPrevoted && (
                    <ChatPanel
                      sessionId={session.id}
                      myPlayerId={myPlayerId}
                      myName={identity?.name ?? ""}
                      phase={session.phase}
                      round={session.current_round}
                      title="Live-Chat zur Diskussion"
                      players={players}
                    />
                  )}
                </>
              );
            })()}

            {session.phase === "phase4_hire_vote" && (
              <Phase4HireVote
                candidates={selectedCandidates}
                round={session.current_round}
                votes={votes}
                players={players}
                myPlayerId={myPlayerId}
                isHost={isHost}
                canAdvance={canAdvance}
                onVote={submitCandidateVote}
                onNext={() => setPhase("round_results")}
                sessionId={session.id}
                myName={identity?.name ?? ""}
                anonymous={session.anonymous_voting ?? true}
              />
            )}

            {session.phase === "round_results" && (
              <RoundResults
                candidates={selectedCandidates}
                votes={votes}
                players={players}
                biases={biases}
                assignments={assignments}
                prevotes={prevotes}
                round={session.current_round}
                isHost={isHost}
                isLastRound={session.current_round >= session.total_rounds}
                canAdvance={canAdvance}
                onNextRound={startNextRound}
                onGoToBiasGuess={() => setPhase("phase5_bias_guess")}
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
                onNext={finishGame}
                isLastRound={true}
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
                candidates={candidates}
                votes={votes}
                totalRounds={session.total_rounds}
                prevotes={prevotes}
                achievements={achievements}
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
          {[...players].sort((a, b) => b.score - a.score).map((p, rank) => (
            <li key={p.id} className={cn(
              "flex items-center justify-between rounded-xl px-3 py-2",
              myPlayerId === p.id ? "bg-primary/10" : "bg-muted/40",
            )}>
              <span className="flex items-center gap-2 text-sm">
                {rank < 3 && p.score > 0 && <span className="text-sm leading-none">{["🥇", "🥈", "🥉"][rank]}</span>}
                <span>{p.avatar}</span>
                {p.is_host && <Crown className="h-3.5 w-3.5 text-accent" />}
                <span className="truncate max-w-[120px]">{p.name}</span>
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
function LobbyView({ code, isHost, players, onStart, phaseDuration, anonymousVoting, totalRounds, onUpdateSettings }: {
  code: string; isHost: boolean; players: PlayerRow[]; onStart: () => void;
  phaseDuration: number; anonymousVoting: boolean; totalRounds: number;
  onUpdateSettings: (patch: Partial<SessionRow>) => Promise<void>;
}) {
  const [rulesOpen, setRulesOpen] = useState(true);
  const minutes = Math.max(1, Math.min(5, Math.round(phaseDuration / 60)));

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl overflow-hidden">
        <button
          onClick={() => setRulesOpen((v) => !v)}
          className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-accent" />
            <div className="text-left">
              <div className="font-display text-lg">Spielregeln & Onboarding</div>
              <div className="text-xs text-muted-foreground">Was ist ein Bias? Wie läuft das Spiel?</div>
            </div>
          </div>
          {rulesOpen ? <ChevronLeft className="h-4 w-4 rotate-90" /> : <ChevronRight className="h-4 w-4 rotate-90" />}
        </button>
        {rulesOpen && (
          <div className="px-5 pb-6 space-y-4 text-sm leading-relaxed border-t border-border/40 pt-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent mb-1">Was ist ein Bias?</div>
              <p className="text-muted-foreground">
                Unbewusste Denkmuster (Unconscious Biases) beeinflussen Entscheidungen — besonders im Recruiting.
                In diesem Spiel erlebst du selbst, wie sie wirken.
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent mb-1">Ablauf in 5 Phasen</div>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li><b className="text-foreground">Wissenskarte</b> — Du erhältst geheim einen Bias zugewiesen.</li>
                <li><b className="text-foreground">Wissensfragen</b> — Wahr/Falsch zu deinem Bias (Punkte).</li>
                <li><b className="text-foreground">Bewerber:innen</b> — Drei Profile, jeweils still 1–5 Sterne bewerten, dann diskutieren.</li>
                <li><b className="text-foreground">Einstellung</b> — Gemeinsam abstimmen, wer den Job bekommt. Danach wird aufgedeckt, ob ihr in eine <b className="text-foreground">Bias-Falle</b> getappt seid!</li>
                <li><b className="text-foreground">Bias raten</b> — Nach der letzten Runde: Welcher Bias wurde wem zugeordnet? Jeder Treffer = Punkt.</li>
              </ol>
              <p className="text-muted-foreground mt-2 text-xs">
                Phase 3–4 wiederholen sich pro Runde mit neuen Bewerber:innen.
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent mb-1">Punkte sammeln</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>✅ Richtige Wissensfrage: <b className="text-foreground">+1 Punkt</b></li>
                <li>⚡ Antwort in unter 15 Sekunden: <b className="text-foreground">+2 Punkte</b></li>
                <li>🕵️ Richtiger Bias-Tipp: <b className="text-foreground">+1 Punkt</b></li>
                <li>🎭 Niemand errät deinen Bias: <b className="text-foreground">+2 Punkte</b> (Undercover-Bonus)</li>
                <li>🏅 Am Ende warten Auszeichnungen wie <b className="text-foreground">Quiz-Profi</b> und <b className="text-foreground">Bias-Detektiv:in</b>.</li>
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent mb-1">Wichtig</div>
              <p className="text-muted-foreground">
                Verrate deinen Bias nicht direkt. Spiele bewusst in seine Richtung.
              </p>
            </div>
          </div>
        )}
      </Card>

      {isHost && (
        <Card className="rounded-3xl p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent mb-3">
            <TimerIcon className="h-4 w-4" /> Workshop-Einstellungen
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Timer pro Phase</label>
                <span className="font-display text-lg">{minutes} Min</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((m) => (
                  <button
                    key={m}
                    onClick={() => onUpdateSettings({ phase_duration_seconds: m * 60 })}
                    className={cn(
                      "flex-1 rounded-xl border-2 py-2 text-sm font-medium transition",
                      m === minutes
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border hover:border-accent/50",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-border/40">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Runden</label>
                <span className="font-display text-lg">{totalRounds}</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map((r) => (
                  <button
                    key={r}
                    onClick={() => onUpdateSettings({ total_rounds: r })}
                    className={cn(
                      "flex-1 rounded-xl border-2 py-2 text-sm font-medium transition",
                      r === totalRounds
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border hover:border-accent/50",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Pro Runde: 3 neue Bewerber:innen, Abstimmung und Bias-Falle-Auswertung.
              </p>
            </div>
            <div className="flex items-start justify-between gap-4 pt-2 border-t border-border/40">
              <div className="flex-1">
                <div className="text-sm font-medium">Anonyme Abstimmung (Phase 4)</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {anonymousVoting ? "Nur die Gesamtsumme wird gezeigt." : "Wer für wen gestimmt hat ist live sichtbar."}
                </p>
              </div>
              <button
                onClick={() => onUpdateSettings({ anonymous_voting: !anonymousVoting })}
                className={cn("relative h-7 w-12 rounded-full transition", anonymousVoting ? "bg-accent" : "bg-muted")}
              >
                <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-background shadow transition-transform", anonymousVoting ? "translate-x-5" : "translate-x-0.5")} />
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card className="rounded-3xl p-10 text-center">
        <Users className="mx-auto h-12 w-12 text-accent" />
        <div className="font-display text-4xl mt-4">Lobby</div>
        <p className="text-muted-foreground mt-2">
          Teilt den Code <span className="text-accent font-display tracking-[0.3em]">{code}</span> mit eurem Team.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          {players.length}/5 {players.length === 1 ? "Spieler:in" : "Spieler:innen"} verbunden.
        </p>
        {isHost ? (
          <Button size="lg" onClick={onStart} className="mt-8 h-12">
            <Sparkles className="h-4 w-4 mr-2" /> Spiel starten
          </Button>
        ) : (
          <div className="mt-8 text-sm text-muted-foreground">Warte auf den Host…</div>
        )}
      </Card>
    </div>
  );
}

// ===== Phase 1: Knowledge =====
function Phase1Knowledge({ myBias, isHost, playersReady, assignmentsCount, canAdvance, onNext }: {
  myBias: BiasRow | null; isHost: boolean; playersReady: number; assignmentsCount: number; canAdvance: boolean; onNext: () => void;
}) {
  if (!myBias) return <Card className="rounded-3xl p-10 text-center text-muted-foreground">Bias wird zugewiesen…</Card>;
  return (
    <div className="space-y-4">
      <Card className="rounded-3xl p-8 sm:p-10 shadow-2xl"
        style={{ background: `linear-gradient(135deg, ${myBias.color}22, ${myBias.color}08)`, borderColor: myBias.color, borderWidth: 2 }}>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]" style={{ color: myBias.color }}>
          <Brain className="h-4 w-4" /> Wissenskarte · Phase 1
        </div>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl" style={{ color: myBias.color }}>{myBias.name}</h2>
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
            <a href={myBias.source_url} target="_blank" rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-foreground underline decoration-dotted hover:text-accent">
              {myBias.source_label ?? "mehr lesen"}<ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
        <div className="mt-6 text-xs text-muted-foreground italic">
          Behalte deinen Bias für dich — die anderen sollen ihn nicht direkt erfahren.
        </div>
      </Card>
      {isHost ? (
        <div className="flex flex-col items-center gap-2">
          <Button size="lg" onClick={onNext} disabled={!canAdvance} className="h-12">
            Weiter zu den Fragen <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          {!canAdvance && <p className="text-xs text-muted-foreground">Warte bis alle bereit sind oder der Timer abläuft.</p>}
        </div>
      ) : (
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
  onAnswer: (questionId: string, answer: boolean) => void; onNext: () => void;
}) {
  if (!myBias) return <Card className="rounded-3xl p-10 text-center text-muted-foreground">Kein Bias zugeordnet.</Card>;
  const myQuestions = questions.filter((q) => q.bias_id === myBias.id).sort((a, b) => a.position - b.position);
  const q = myQuestions[qIndex];
  if (!q) return <Card className="rounded-3xl p-10 text-center text-muted-foreground">Keine Fragen verfügbar.</Card>;
  const myAnswer = answers.find((a) => a.player_id === myPlayerId && a.question_id === q.id);
  const playerAnswerCounts = players.map((p) => answers.filter((a) => a.player_id === p.id).length);
  const playersDone = playerAnswerCounts.filter((c) => c > qIndex).length;
  const allDone = playersDone >= players.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Frage {qIndex + 1} von 3 · zu deiner Bias</span>
        <span className="inline-flex items-center gap-1 text-accent font-medium">
          <Zap className="h-3.5 w-3.5" /> Unter 15 Sek. = +2 Punkte
        </span>
        <span>{playersDone} / {players.length} fertig</span>
      </div>
      <Card key={q.id} className="rounded-3xl p-8" style={{ borderColor: myBias.color, borderWidth: 2 }}>
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
          <div className={cn("mt-6 rounded-2xl p-5 border-2",
            myAnswer.is_correct ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10")}>
            <div className="flex items-center gap-2 font-display text-xl">
              {myAnswer.is_correct ? <Check className="h-5 w-5 text-green-600" /> : <X className="h-5 w-5 text-red-600" />}
              Deine Antwort: {myAnswer.answer ? "Wahr" : "Falsch"} —
              {myAnswer.is_correct ? " richtig!" : " leider falsch"}
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
          {!canAdvance && <p className="text-xs text-muted-foreground">Warte bis alle bereit sind oder der Timer abläuft.</p>}
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
          {(() => {
            const resolved = resolveCandidateImage(c.image_url);
            return resolved
              ? <img src={resolved} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
              : <div className="font-display text-6xl text-accent">{initials}</div>;
          })()}
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
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}

function Phase3Candidates({ candidates, round, index, isHost, canAdvance, onNext, onPrev,
  actionCards, currentActionCardId, actionCardStartedAt, nowTick, onDrawAction, onClearAction,
  myPlayerId, players, prevotesForCandidate, onPrevote, allPrevoted }: {
  candidates: CandidateRow[]; round: number; index: number;
  isHost: boolean; canAdvance: boolean; onNext: () => void; onPrev: () => void;
  actionCards: ActionCardRow[]; currentActionCardId: string | null;
  actionCardStartedAt: string | null; nowTick: number;
  onDrawAction: () => void; onClearAction: () => void;
  myPlayerId: string | null; players: PlayerRow[];
  prevotesForCandidate: CandidatePrevoteRow[];
  onPrevote: (candidateId: string, rating: number) => void;
  allPrevoted: boolean;
}) {
  const c = candidates[index];
  const isActive = !!currentActionCardId;
  const pickKey = `${myPlayerId ?? "anon"}-${round}-${index}`;
  const activeCard = isActive && actionCards.length > 0
    ? actionCards[hashStr(pickKey) % actionCards.length]
    : null;
  const startMs = actionCardStartedAt ? new Date(actionCardStartedAt).getTime() : null;
  const elapsed = startMs ? Math.max(0, Math.floor((nowTick - startMs) / 1000)) : 0;
  const remaining = Math.max(0, ACTION_CARD_SECONDS - elapsed);

  const drawnKeyRef = useRef<string | null>(null);
  const drawnForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isHost || !c) return;
    const key = `${round}-${index}-${c.id}`;
    if (activeCard || currentActionCardId) { drawnForRef.current = key; return; }
    if (drawnKeyRef.current === key || drawnForRef.current === key) return;
    if (actionCards.length === 0) return;
    drawnKeyRef.current = key;
    onDrawAction();
  }, [isHost, c, round, index, activeCard, currentActionCardId, actionCards.length, onDrawAction]);

  if (!c) return <Card className="rounded-3xl p-10 text-center text-muted-foreground">Keine Bewerber für diese Runde.</Card>;

  const myPrevote = prevotesForCandidate.find((pv) => pv.player_id === myPlayerId) ?? null;
  const prevoteCount = prevotesForCandidate.length;
  const totalPlayers = players.length;
  const actionPending = !!activeCard && remaining > 0;
  const blockAdvance = !canAdvance || actionPending;

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground">Bewerber:in {index + 1} von {candidates.length}</div>
      <div key={c.id}><CandidateCard c={c} /></div>

      <PrevoteCard
        candidateId={c.id} myPrevote={myPrevote?.rating ?? null}
        prevoteCount={prevoteCount} totalPlayers={totalPlayers}
        allPrevoted={allPrevoted} canVote={!!myPlayerId} onPrevote={onPrevote}
      />

      {allPrevoted && (
        <Card className="rounded-2xl p-4 bg-muted/30">
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 mt-0.5 text-accent" />
            <p className="text-sm text-muted-foreground">
              Alle haben still bewertet. Jetzt: Diskutiert im Chat.
            </p>
          </div>
        </Card>
      )}

      {activeCard && (
        <Card className="rounded-3xl p-6 border-2 border-accent bg-accent/5">
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
          {activeCard.explanation && <p className="mt-3 text-sm text-muted-foreground italic">{activeCard.explanation}</p>}
          {isHost && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={onClearAction}>
                {remaining === 0 ? "Aktion beenden" : "Aktionskarte überspringen"}
              </Button>
            </div>
          )}
        </Card>
      )}

      {isHost && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex justify-center gap-3">
            {index > 0 && (
              <Button size="lg" variant="outline" onClick={onPrev} className="h-12">
                <ChevronLeft className="h-4 w-4 mr-1" /> Zurück
              </Button>
            )}
            <Button size="lg" onClick={onNext} disabled={blockAdvance} className="h-12">
              {index + 1 >= candidates.length ? "Zur Abstimmung" : "Nächste:r Bewerber:in"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          {actionPending && <p className="text-xs text-muted-foreground">Aktionskarte läuft – bitte gemeinsam durchführen ({remaining}s).</p>}
          {!actionPending && !canAdvance && <p className="text-xs text-muted-foreground">Warte bis alle bereit sind oder der Timer abläuft.</p>}
        </div>
      )}
    </div>
  );
}

// ===== Phase 4: Hire Vote =====
function Phase4HireVote({ candidates, round, votes, players, myPlayerId, isHost, canAdvance, onVote, onNext, sessionId, myName, anonymous }: {
  candidates: CandidateRow[]; round: number; votes: CandidateVoteRow[];
  players: PlayerRow[]; myPlayerId: string | null; isHost: boolean; canAdvance: boolean;
  onVote: (candidateId: string) => void; onNext: () => void;
  sessionId: string; myName: string; anonymous: boolean;
}) {
  const roundVotes = votes.filter((v) => v.round_number === round);
  const myVote = roundVotes.find((v) => v.player_id === myPlayerId);
  const allVoted = roundVotes.length >= players.length;
  const tally: Record<string, number> = {};
  for (const v of roundVotes) tally[v.candidate_id] = (tally[v.candidate_id] ?? 0) + 1;
  const winnerId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0];
  const voterMap: Record<string, PlayerRow[]> = {};
  if (!anonymous) {
    for (const v of roundVotes) {
      const player = players.find((p) => p.id === v.player_id);
      if (!player) continue;
      (voterMap[v.candidate_id] ??= []).push(player);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent">
          <Vote className="h-4 w-4" /> Phase 4 · Wer wird eingestellt?
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {anonymous ? "Abstimmung läuft anonym — nur die Gesamtsumme ist sichtbar." : "Abstimmung läuft offen — jeder sieht live, wer für wen stimmt."}
        </p>
      </Card>

      <div className="grid sm:grid-cols-3 gap-3">
        {candidates.map((c) => {
          const count = tally[c.id] ?? 0;
          const isMine = myVote?.candidate_id === c.id;
          const isWinner = allVoted && c.id === winnerId;
          const initials = c.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
          const voters = voterMap[c.id] ?? [];
          return (
            <button key={c.id} onClick={() => !allVoted && onVote(c.id)} disabled={allVoted}
              className={cn("text-left rounded-3xl border-2 p-4 transition",
                isMine ? "border-accent bg-accent/10" : "border-border bg-card hover:border-accent/50",
                isWinner && "ring-2 ring-accent")}>
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-accent/30 to-primary/20 grid place-items-center mb-3">
                <span className="font-display text-4xl text-accent">{initials}</span>
              </div>
              <div className="font-display text-lg">{c.name}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">{c.headline}</div>
              {!anonymous && voters.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {voters.map((v) => (
                    <span key={v.id} className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] text-accent">{v.avatar} {v.name}</span>
                  ))}
                </div>
              )}
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

      <div className="text-center text-sm text-muted-foreground">{roundVotes.length} / {players.length} abgestimmt</div>

      <ChatPanel sessionId={sessionId} myPlayerId={myPlayerId} myName={myName}
        phase="phase4_hire_vote" round={round} title="Diskussion · Wer wird eingestellt?" players={players} />

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
  onNext: () => void; isLastRound: boolean; sessionId: string; myName: string;
}) {
  const others = players.filter((p) => p.id !== myPlayerId);
  const myGuesses = guesses.filter((g) => g.guesser_player_id === myPlayerId && g.round_number === round);
  const alreadySubmitted = myGuesses.length === others.length && others.length > 0;
  const [picks, setPicks] = useState<Record<string, string>>({});

  useEffect(() => {
    if (myGuesses.length > 0) {
      const p: Record<string, string> = {};
      for (const g of myGuesses) p[g.target_player_id] = g.guessed_bias_id;
      setPicks(p);
    }
  }, [myGuesses.length]);

  const allPlayersSubmitted = players.every((p) => {
    const submitted = guesses.filter((g) => g.guesser_player_id === p.id && g.round_number === round).length;
    return submitted >= players.length - 1;
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
                <div className="font-display text-lg"><span className="mr-1.5">{p.avatar}</span>{p.name}</div>
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
                    <button key={b.id} disabled={alreadySubmitted} onClick={() => setPicks({ ...picks, [p.id]: b.id })}
                      className={cn("rounded-xl border-2 p-3 text-sm text-left transition",
                        isPick && !alreadySubmitted && "border-accent bg-accent/10",
                        !isPick && !alreadySubmitted && "border-border hover:border-accent/50",
                        alreadySubmitted && isCorrect && "border-green-500 bg-green-500/10",
                        alreadySubmitted && isMyGuess && !isCorrect && "border-red-500 bg-red-500/10",
                        alreadySubmitted && !isCorrect && !isMyGuess && "opacity-50 border-border")}
                      style={!alreadySubmitted && isPick ? { borderColor: b.color, background: `${b.color}15` } : undefined}>
                      <div className="font-medium" style={{ color: alreadySubmitted ? undefined : b.color }}>{b.name}</div>
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      <ChatPanel sessionId={sessionId} myPlayerId={myPlayerId} myName={myName}
        phase="phase5_bias_guess" round={round} title="Diskussion · Bias raten" players={players} />

      {!alreadySubmitted && (
        <div className="flex justify-center">
          <Button size="lg" disabled={Object.keys(picks).length < others.length} onClick={() => onSubmit(picks)} className="h-12">
            Tipps abgeben
          </Button>
        </div>
      )}

      {isHost && (
        <div className="flex flex-col items-center gap-2">
          <Button size="lg" onClick={onNext} disabled={!allPlayersSubmitted || !canAdvance}
            variant={allPlayersSubmitted && canAdvance ? "default" : "secondary"} className="h-12">
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

// ===== Runden-Auswertung mit Bias-Falle-Reveal =====
function roundWinner(candidates: CandidateRow[], votes: CandidateVoteRow[], round: number): CandidateRow | null {
  const tally: Record<string, number> = {};
  for (const v of votes.filter((x) => x.round_number === round)) {
    tally[v.candidate_id] = (tally[v.candidate_id] ?? 0) + 1;
  }
  const winnerId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0];
  return candidates.find((c) => c.id === winnerId) ?? null;
}

function RoundResults({ candidates, votes, players, biases, assignments, prevotes, round, isHost, isLastRound, canAdvance, onNextRound, onGoToBiasGuess }: {
  candidates: CandidateRow[]; votes: CandidateVoteRow[]; players: PlayerRow[];
  biases: BiasRow[]; assignments: AssignmentRow[]; prevotes: CandidatePrevoteRow[];
  round: number; isHost: boolean; isLastRound: boolean; canAdvance: boolean;
  onNextRound: () => void; onGoToBiasGuess: () => void;
}) {
  const winner = roundWinner(candidates, votes, round);
  const trapBias = winner?.appeals_to_bias_id
    ? biases.find((b) => b.id === winner.appeals_to_bias_id) ?? null
    : null;

  // Aggregierter Bewertungs-Vergleich: erst ab 2 Träger:innen, sonst wäre die Person enttarnt
  let carrierAvg: number | null = null;
  let otherAvg: number | null = null;
  if (winner && trapBias) {
    const carrierIds = new Set(assignments.filter((a) => a.bias_id === trapBias.id).map((a) => a.player_id));
    const winnerPrevotes = prevotes.filter((pv) => pv.candidate_id === winner.id);
    const carrierRatings = winnerPrevotes.filter((pv) => carrierIds.has(pv.player_id)).map((pv) => pv.rating);
    const otherRatings = winnerPrevotes.filter((pv) => !carrierIds.has(pv.player_id)).map((pv) => pv.rating);
    if (carrierRatings.length >= 2 && otherRatings.length > 0) {
      carrierAvg = carrierRatings.reduce((s, r) => s + r, 0) / carrierRatings.length;
      otherAvg = otherRatings.reduce((s, r) => s + r, 0) / otherRatings.length;
    }
  }

  const ranked = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-accent">
          <UserCheck className="h-4 w-4" /> Rundenauswertung · Runde {round}
        </div>
        {winner ? (
          <>
            <h2 className="mt-3 font-display text-3xl">Eingestellt: {winner.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{winner.headline}</p>
          </>
        ) : (
          <h2 className="mt-3 font-display text-2xl text-muted-foreground">Keine Stimmen abgegeben.</h2>
        )}
      </Card>

      {winner && (
        trapBias ? (
          <Card className="rounded-3xl p-6 border-2" style={{ borderColor: trapBias.color, background: `${trapBias.color}12` }}>
            <div className="flex items-center gap-2 font-display text-2xl" style={{ color: trapBias.color }}>
              <AlertTriangle className="h-6 w-6" /> 🚨 In die Bias-Falle getappt!
            </div>
            <p className="mt-3 text-sm leading-relaxed">
              <b>{winner.name}</b> war als Köder für den{" "}
              <b style={{ color: trapBias.color }}>{trapBias.name}</b> angelegt:{" "}
              {trapBias.short_description}
            </p>
            {carrierAvg !== null && otherAvg !== null && (
              <div className="mt-4 rounded-2xl bg-background/60 p-4 text-sm">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  Stille Bewertungen im Vergleich
                </div>
                Spieler:innen mit diesem Bias: <b>ø {carrierAvg.toFixed(1)} ★</b> · alle anderen:{" "}
                <b>ø {otherAvg.toFixed(1)} ★</b>
                {carrierAvg > otherAvg && " — der Bias hat sichtbar mitgespielt!"}
              </div>
            )}
          </Card>
        ) : (
          <Card className="rounded-3xl p-6 border-2 border-green-500 bg-green-500/10">
            <div className="flex items-center gap-2 font-display text-2xl text-green-600">
              <ShieldCheck className="h-6 w-6" /> ✅ Falle umgangen!
            </div>
            <p className="mt-3 text-sm leading-relaxed">
              <b>{winner.name}</b> war keiner Bias-Falle zugeordnet — eine neutrale, faire Wahl.
            </p>
          </Card>
        )
      )}

      <Card className="rounded-3xl p-6">
        <div className="font-display text-xl mb-3">Zwischenstand</div>
        <ul className="space-y-2">
          {ranked.map((p, rank) => (
            <li key={p.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm">
                {rank < 3 && p.score > 0 && <span>{["🥇", "🥈", "🥉"][rank]}</span>}
                <span>{p.avatar}</span>
                <span className="truncate max-w-[180px]">{p.name}</span>
              </span>
              <span className="font-display text-lg">{p.score}</span>
            </li>
          ))}
        </ul>
      </Card>

      {isHost && (
        <div className="flex flex-col items-center gap-2">
          <Button size="lg" onClick={isLastRound ? onGoToBiasGuess : onNextRound} disabled={!canAdvance} className="h-12">
            {isLastRound ? "Weiter zu Bias raten" : "Nächste Runde starten"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          {!canAdvance && <p className="text-xs text-muted-foreground">Warte bis alle bereit sind oder der Timer abläuft.</p>}
        </div>
      )}
    </div>
  );
}

// ===== Final Results =====
function FinalResults({ players, biases, assignments, sessionId, myPlayerId, myBias, candidates, votes, totalRounds, prevotes, achievements }: {
  players: PlayerRow[]; biases: BiasRow[]; assignments: AssignmentRow[];
  sessionId: string; myPlayerId: string | null; myBias: BiasRow | null;
  candidates: CandidateRow[]; votes: CandidateVoteRow[]; totalRounds: number;
  prevotes: CandidatePrevoteRow[]; achievements: AchievementRow[];
}) {
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const top = ranked[0]?.score ?? 0;
  const winners = ranked.filter((p) => p.score === top && top > 0);
  // Heatmap über alle Kandidat:innen, die in irgendeiner Runde bewertet wurden
  const seenCandidates = candidates.filter((c) => prevotes.some((pv) => pv.candidate_id === c.id));
  return (
    <div className="space-y-6 text-center">
      <Confetti />
      <Trophy className="mx-auto h-12 w-12 text-accent" />
      <h1 className="font-display text-5xl">Endauswertung</h1>
      {winners.length > 0 && (
        <div className="font-display text-3xl text-accent">Sieg: {winners.map((w) => w.name).join(" & ")} ({top} Pkt.)</div>
      )}

      <Podium ranked={ranked} />

      <Card className="rounded-3xl p-6 text-left">
        <div className="font-display text-xl mb-4">Bias-Aufdeckung</div>
        <ul className="space-y-2">
          {players.map((p) => {
            const a = assignments.find((x) => x.player_id === p.id);
            const b = a ? biases.find((y) => y.id === a.bias_id) : null;
            const myAwards = achievements.filter((aw) => aw.player_id === p.id);
            return (
              <li key={p.id} className="rounded-xl bg-muted/40 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span>{p.avatar}</span>
                    {p.is_host && <Crown className="h-3.5 w-3.5 text-accent" />}
                    <span>{p.name}</span>
                  </span>
                  {b && <span className="font-display text-sm" style={{ color: b.color }}>{b.name}</span>}
                  <span className="font-display text-lg w-12 text-right">{p.score}</span>
                </div>
                {myAwards.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {myAwards.map((aw) => {
                      const meta = ACHIEVEMENT_META[aw.achievement_key];
                      if (!meta) return null;
                      return (
                        <span key={aw.id} title={meta.description}
                          className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs text-accent">
                          <span>{meta.emoji}</span>{meta.label}
                          {aw.bonus_points > 0 && <span className="font-mono">+{aw.bonus_points}</span>}
                        </span>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <TrapSummary candidates={candidates} votes={votes} biases={biases} totalRounds={totalRounds} />

      <AchievementsCard achievements={achievements} players={players} />

      <BiasHeatmap players={players} candidates={seenCandidates} biases={biases} prevotes={prevotes} assignments={assignments} />

      {myPlayerId && myBias && (
        <ReflectionJournal sessionId={sessionId} playerId={myPlayerId} myBias={myBias} />
      )}

      <Link to="/"><Button size="lg" variant="outline" className="h-12">Zur Startseite</Button></Link>
    </div>
  );
}

// ===== Fallen-Bilanz =====
function TrapSummary({ candidates, votes, biases, totalRounds }: {
  candidates: CandidateRow[]; votes: CandidateVoteRow[]; biases: BiasRow[]; totalRounds: number;
}) {
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1)
    .map((round) => {
      const winner = roundWinner(candidates, votes, round);
      if (!winner) return null;
      const trapBias = winner.appeals_to_bias_id
        ? biases.find((b) => b.id === winner.appeals_to_bias_id) ?? null
        : null;
      return { round, winner, trapBias };
    })
    .filter((r): r is { round: number; winner: CandidateRow; trapBias: BiasRow | null } => !!r);
  if (rounds.length === 0) return null;

  const trapped = rounds.filter((r) => r.trapBias).length;

  return (
    <Card className="rounded-3xl p-6 text-left">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="h-5 w-5 text-accent" />
        <div className="font-display text-xl">Fallen-Bilanz</div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {trapped === 0
          ? "Stark! Ihr seid in keine einzige Bias-Falle getappt."
          : `Ihr seid in ${trapped} von ${rounds.length} Runden in eine Bias-Falle getappt.`}
      </p>
      <ul className="space-y-2">
        {rounds.map(({ round, winner, trapBias }) => (
          <li key={round} className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3 gap-3">
            <span className="text-xs text-muted-foreground shrink-0">Runde {round}</span>
            <span className="flex-1 text-sm truncate">{winner.name}</span>
            {trapBias ? (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0"
                style={{ background: `${trapBias.color}20`, color: trapBias.color }}>
                🚨 {trapBias.name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-600 shrink-0">
                ✅ vermieden
              </span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ===== Podium =====
const MEDAL_COLORS = ["#fbbf24", "#94a3b8", "#b45309"];

function Podium({ ranked }: { ranked: PlayerRow[] }) {
  const top3 = ranked.slice(0, 3).filter((p) => p.score > 0);
  if (top3.length < 2) return null;
  // Anordnung: Platz 2 links, Platz 1 mittig, Platz 3 rechts
  const slots = [top3[1], top3[0], top3[2]].filter((p): p is PlayerRow => !!p);
  const heightFor = (p: PlayerRow) => {
    const rank = top3.indexOf(p);
    return rank === 0 ? "h-32" : rank === 1 ? "h-24" : "h-16";
  };
  return (
    <div className="flex items-end justify-center gap-3 pt-6">
      {slots.map((p) => {
        const rank = top3.indexOf(p);
        return (
          <div key={p.id} className="flex flex-col items-center w-28 sm:w-36 podium-rise" style={{ animationDelay: `${(2 - rank) * 0.25}s` }}>
            <span className="text-3xl mb-1">{["🥇", "🥈", "🥉"][rank]}</span>
            <span className="text-3xl mb-1">{p.avatar}</span>
            <span className="text-sm font-medium truncate max-w-full">{p.name}</span>
            <span className="font-display text-xl mb-2" style={{ color: MEDAL_COLORS[rank] }}>{p.score} Pkt.</span>
            <div className={cn("w-full rounded-t-2xl grid place-items-start justify-center pt-2", heightFor(p))}
              style={{ background: `linear-gradient(180deg, ${MEDAL_COLORS[rank]}cc, ${MEDAL_COLORS[rank]}55)` }}>
              <span className="font-display text-2xl text-background">{rank + 1}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===== Auszeichnungen =====
function AchievementsCard({ achievements, players }: { achievements: AchievementRow[]; players: PlayerRow[] }) {
  if (achievements.length === 0) return null;
  const keys = Object.keys(ACHIEVEMENT_META).filter((k) => achievements.some((a) => a.achievement_key === k));
  return (
    <Card className="rounded-3xl p-6 text-left">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-accent" />
        <div className="font-display text-xl">Auszeichnungen</div>
      </div>
      <ul className="space-y-3">
        {keys.map((key) => {
          const meta = ACHIEVEMENT_META[key];
          const names = achievements
            .filter((a) => a.achievement_key === key)
            .map((a) => players.find((p) => p.id === a.player_id)?.name)
            .filter(Boolean);
          return (
            <li key={key} className="flex items-start gap-3 rounded-2xl bg-muted/40 px-4 py-3">
              <span className="text-2xl">{meta.emoji}</span>
              <div className="flex-1">
                <div className="font-medium">{meta.label}</div>
                <div className="text-xs text-muted-foreground">{meta.description}</div>
              </div>
              <div className="text-sm text-accent text-right max-w-[40%]">{names.join(", ")}</div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// ===== Konfetti =====
const CONFETTI_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ec4899", "#8b5cf6"];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        duration: 3 + Math.random() * 2.5,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 6,
      })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50" aria-hidden>
      {pieces.map((p, i) => (
        <span key={i} className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.45,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// ===== Reflection Journal =====
function ReflectionJournal({ sessionId, playerId, myBias }: {
  sessionId: string; playerId: string; myBias: BiasRow;
}) {
  const [content, setContent] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getReflection(sessionId, playerId).then((data) => {
      if (data) { setContent(data.content ?? ""); setSavedAt(data.updated_at ?? null); }
      setDataLoading(false);
    });
  }, [sessionId, playerId]);

  async function save() {
    setSaving(true);
    try {
      await api.saveReflection(sessionId, playerId, content);
      setSavedAt(new Date().toISOString());
      toast.success("Reflexion gespeichert");
    } catch {
      toast.error("Konnte Reflexion nicht speichern.");
    } finally {
      setSaving(false);
    }
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
      <p className="mt-2 text-sm text-muted-foreground">Nimm dir 5 Minuten. Diese Notizen sind nur für dich.</p>
      <ul className="mt-4 space-y-2 text-sm">
        {prompts.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span className="font-display text-base" style={{ color: myBias.color }}>{i + 1}.</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <Textarea className="mt-4 min-h-[180px]" placeholder={dataLoading ? "Lädt…" : "Schreibe hier deine Gedanken…"}
        value={content} onChange={(e) => setContent(e.target.value)} disabled={dataLoading} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {savedAt ? `Gespeichert: ${new Date(savedAt).toLocaleTimeString()}` : "Noch nicht gespeichert"}
        </span>
        <Button onClick={save} disabled={saving || dataLoading || content.trim().length === 0}>
          {saving ? "Speichert…" : "Reflexion speichern"}
        </Button>
      </div>
    </Card>
  );
}

// ===== Pre-Vote =====
function PrevoteCard({ candidateId, myPrevote, prevoteCount, totalPlayers, allPrevoted, canVote, onPrevote }: {
  candidateId: string; myPrevote: number | null; prevoteCount: number;
  totalPlayers: number; allPrevoted: boolean; canVote: boolean;
  onPrevote: (candidateId: string, rating: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const showValue = hover ?? myPrevote ?? 0;

  return (
    <Card className="rounded-3xl p-6 border-2 border-primary/30 bg-primary/5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
            <Star className="h-4 w-4" /> Stille Einzelbewertung
          </div>
          <h3 className="font-display text-xl mt-2">
            {allPrevoted ? "Alle haben bewertet" : myPrevote ? "Danke, deine Stimme ist gespeichert" : "Würdest du diese Person einstellen?"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {allPrevoted ? "Der Chat ist jetzt freigeschaltet." : "Erst still für dich bewerten — der Chat öffnet sich, sobald alle abgestimmt haben."}
          </p>
        </div>
        <Badge variant="secondary" className="font-mono">{prevoteCount} / {totalPlayers}</Badge>
      </div>
      <div className="mt-5 flex items-center gap-2 justify-center sm:justify-start">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" disabled={!canVote}
            onClick={() => onPrevote(candidateId, n)}
            onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(null)}
            className={cn("transition-transform", canVote && "hover:scale-110", !canVote && "opacity-50 cursor-not-allowed")}>
            <Star className={cn("h-9 w-9 transition-colors", n <= showValue ? "fill-accent text-accent" : "text-muted-foreground/40")} />
          </button>
        ))}
        <span className="ml-3 text-sm text-muted-foreground tabular-nums w-12">
          {myPrevote ? `${myPrevote} / 5` : hover ? `${hover} / 5` : ""}
        </span>
      </div>
      <div className="mt-3 text-[11px] text-muted-foreground flex justify-between">
        <span>1 · Auf keinen Fall</span>
        <span>3 · Unentschieden</span>
        <span>5 · Sofort einstellen</span>
      </div>
    </Card>
  );
}

// ===== Bias-Heatmap =====
function BiasHeatmap({ players, candidates, biases, prevotes, assignments }: {
  players: PlayerRow[]; candidates: CandidateRow[]; biases: BiasRow[];
  prevotes: CandidatePrevoteRow[]; assignments: AssignmentRow[];
}) {
  const allCandidates = [...candidates].sort((a, b) => (a.round_number - b.round_number) || (a.position - b.position));
  if (allCandidates.length === 0 || players.length === 0 || prevotes.length === 0) {
    return (
      <Card className="rounded-3xl p-6 text-left">
        <div className="font-display text-xl mb-2">Bias-Heatmap</div>
        <p className="text-sm text-muted-foreground">Noch keine stillen Bewertungen vorhanden.</p>
      </Card>
    );
  }

  const getRating = (playerId: string, candidateId: string) =>
    prevotes.find((pv) => pv.player_id === playerId && pv.candidate_id === candidateId)?.rating ?? null;
  const biasFor = (c: CandidateRow) =>
    c.appeals_to_bias_id ? biases.find((b) => b.id === c.appeals_to_bias_id) ?? null : null;
  const playerBias = (playerId: string) => {
    const a = assignments.find((x) => x.player_id === playerId);
    return a ? biases.find((b) => b.id === a.bias_id) ?? null : null;
  };

  return (
    <Card className="rounded-3xl p-6 text-left overflow-x-auto">
      <div className="flex items-start gap-2 mb-3">
        <BarChart3 className="h-5 w-5 mt-0.5 text-accent" />
        <div>
          <div className="font-display text-xl">Bias-Heatmap</div>
          <p className="text-xs text-muted-foreground mt-1">
            Wer hat wen wie bewertet? Wenn die Farbe einer hohen Bewertung mit dem Bias der Spieler:in übereinstimmt, könnte der Bias mitgespielt haben.
          </p>
        </div>
      </div>
      <table className="w-full text-sm border-separate border-spacing-1 min-w-[480px]">
        <thead>
          <tr>
            <th className="text-left text-xs uppercase tracking-wider text-muted-foreground font-normal p-2">Bewerber:in</th>
            {players.map((p) => {
              const pb = playerBias(p.id);
              return (
                <th key={p.id} className="text-center text-xs font-normal p-1">
                  <div className="truncate max-w-[80px] mx-auto">{p.name}</div>
                  {pb && <div className="mt-1 inline-block h-1.5 w-10 rounded-full" style={{ background: pb.color }} title={pb.name} />}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {allCandidates.map((c) => {
            const cb = biasFor(c);
            return (
              <tr key={c.id}>
                <th className="text-left text-xs font-normal p-2 align-middle">
                  <div className="flex items-center gap-2">
                    {cb && <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: cb.color }} title={`Bias-Falle: ${cb.name}`} />}
                    <span className="truncate max-w-[140px]">{c.name}</span>
                  </div>
                </th>
                {players.map((p) => {
                  const r = getRating(p.id, c.id);
                  const color = cb?.color ?? "#94a3b8";
                  return (
                    <td key={p.id} className="p-0">
                      <div className="h-10 rounded-md grid place-items-center font-mono text-xs border border-border/40"
                        style={{ background: r ? color : "transparent", opacity: r ? undefined : 0.4, color: r && r >= 3 ? "white" : undefined }}
                        title={r ? `${p.name} → ${c.name}: ${r}/5` : "keine Bewertung"}>
                        {r ? r : "·"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
