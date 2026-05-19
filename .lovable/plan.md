
# BIAS — Komplettes Spielkonzept

Ein Multiplayer-Spiel für 4 Spieler. Jeder Spieler erhält zufällig einen von 4 Bias-Typen, der über alle 3 Runden behalten wird. Pro Runde werden 3 Bewerber für eine Stelle bewertet — beeinflusst durch den eigenen Bias.

## Spielablauf

```text
Runde 1:  Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
Runde 2:                     Phase 3 → Phase 4 → Phase 5
Runde 3:                     Phase 3 → Phase 4 → Phase 5
                                                    ↓
                                              Endauswertung
```

- **Phase 1** *(nur Runde 1)*: Wissenskarte — jeder Spieler sieht privat die Erklärung seines zugewiesenen Bias.
- **Phase 2** *(nur Runde 1)*: Wahr/Falsch-Karten zum eigenen Bias mit Timer (30 s pro Frage, 3 Fragen).
- **Phase 3**: 3 Bewerber werden nacheinander vorgestellt (Bild + Beschreibung). Zwischen jedem Bewerber kurze Diskussionsphase.
- **Phase 4**: Abstimmung — welcher Bewerber wird eingestellt? Ergebnis wird angezeigt.
- **Phase 5**: Bias-Diskussion + Abstimmung — Spieler tippen, welchen Bias andere Spieler haben.

## Datenmodell (neue/erweiterte Tabellen)

**Neu:**
- `biases`: name, description, knowledge_card_text, color
- `bias_questions`: bias_id, question, correct_answer, explanation (für Phase 2)
- `candidates`: round_number, name, image_url, description, qualifications (3 pro Runde × 3 Runden = 9)
- `player_bias_assignments`: session_id, player_id, bias_id
- `candidate_votes`: session_id, player_id, round_number, candidate_id (Phase 4)
- `bias_guesses`: session_id, guesser_player_id, target_player_id, round_number, guessed_bias_id (Phase 5)
- `bias_question_answers`: session_id, player_id, question_id, answer, correct

**Erweitert — `game_sessions`:**
- `phase` (enum: lobby, phase1_knowledge, phase2_questions, phase3_candidates, phase4_vote, phase5_bias_vote, results)
- `current_candidate_index` (0–2 für Phase 3)
- `phase_started_at` (für Timer)

## Platzhalter-Inhalte (vom Agent generiert)

- **4 Bias-Typen**: Halo-Effekt, Confirmation Bias, Ähnlichkeits-Bias (Similar-to-me), Attributionsfehler
- **Pro Bias**: 1 Wissenskarte + 3 Wahr/Falsch-Fragen
- **9 Bewerber** (3 pro Runde) mit Stockfoto-Stil-Bildern (über imagegen generiert), Namen, Lebenslauf-Beschreibung

## Screens

- `/` — Landing + Spiel erstellen/beitreten (bleibt)
- `/host/$code` — Host-Dashboard mit Phasen-Steuerung
- `/play/$code` — Spieleransicht, reagiert auf aktuelle Phase via Supabase Realtime
- `/admin` — Bias/Fragen/Bewerber verwalten (vorhandenen Adminbereich erweitern)

## Realtime

Alle Spieler abonnieren `game_sessions` + relevante Child-Tabellen über Supabase Realtime; UI rendert je nach `phase` die passende Komponente.

## Technische Details

- Phasen-Übergänge nur durch den Host (Button „Nächste Phase"), oder automatisch nach Timer (Phase 2).
- Bias-Zuordnung passiert serverseitig beim Start (Phase 1 betreten) per `createServerFn` mit Service-Role-Client, damit andere Spieler den Bias nicht über die Browser-Devtools sehen.
- Spieler sehen nur ihren eigenen Bias-Inhalt (RLS-artige Filterung in der Server Function über `player_token`).
- Punktesystem: Korrekte Bias-Vermutung in Phase 5 = +1 Punkt. Optional: gemeinsame Einstellung des „richtigen" Bewerbers (z.B. der ohne Bias-Match) = Bonuspunkte.

## Migration & Code-Schritte

1. **DB-Migration**: Neue Tabellen + Phase-Enum erweitern + Seed der 4 Biases, 12 Fragen, 9 Bewerber.
2. **Bewerber-Bilder**: 9 Porträts via `imagegen` (fast) generieren und nach `src/assets/candidates/` legen, URLs in DB.
3. **Server Functions**: `assignBiases`, `advancePhase`, `submitQuestionAnswer`, `submitCandidateVote`, `submitBiasGuess`, `getMyBias`.
4. **Komponenten**: `PhaseKnowledgeCard`, `PhaseQuestions`, `PhaseCandidates`, `PhaseHiringVote`, `PhaseBiasGuess`, `PhaseResults`, `HostControls`, `Timer`.
5. **Realtime-Hook**: `useGameSession(code)` — abonniert Session + leitet Phase + Spielerliste.
6. **Host-/Player-Routen** anpassen, Admin um neue Entities erweitern.

## Was ist NICHT enthalten

- Echte Videos (Platzhalter: Bild + Text, wie gewünscht)
- Chat-Funktion in Phase 4 (Diskussion findet offline/verbal statt; kann später ergänzt werden)
- Authentifizierung mit Accounts (Spieler über `player_token` in URL/LocalStorage)

Soll ich so loslegen?
