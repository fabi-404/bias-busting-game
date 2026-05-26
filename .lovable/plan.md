## Ziel

Drei pädagogische Erweiterungen umsetzen:
1. Stille Einzelbewertung (1–5 Sterne) pro Bewerber:in vor dem Chat in Phase 3
2. Bias-Heatmap in der Endauswertung
3. Mehr Bias-Karten (insgesamt 8) + mehr Bewerber:innen-Profile

---

## 1. Pre-Vote (5 Sterne)

**DB:** Neue Tabelle `candidate_prevotes` (session_id, player_id, round_number, candidate_id, rating 1–5, unique pro Player+Candidate+Session). Offene RLS-Policies wie der Rest des Spiels.

**UI (`Phase3Candidates`):**
- Beim Wechsel auf eine:n Bewerber:in: zuerst Sterne-Block, kein Chat sichtbar.
- Spieler:in wählt 1–5 → speichert in DB → eigener Pre-Vote als "abgegeben" markiert.
- Chat erscheint erst, wenn **alle Spieler:innen** ihren Pre-Vote abgegeben haben (realtime über `candidate_prevotes`-Channel).
- Host kann erst weiter, wenn alle abgestimmt UND Aktionskarten-Timer abgelaufen.
- Kleiner Live-Status: "3 / 4 haben bewertet".

## 2. Bias-Heatmap (Endscreen)

Auf der Final-Results-Seite zusätzliche Karte:
- Matrix: Spieler:innen × Bewerber:innen, Zelle = Pre-Vote-Rating (Farbintensität).
- Daneben pro Bewerber:in der Bias-Tag (`appeals_to_bias_id`) — sichtbar macht, ob hohe Ratings mit dem Bias der jeweiligen Spieler:in korrelieren.
- Kurzer Erklär-Text: "Wo Farbe und Bias-Farbe übereinstimmen, könnte der Bias gewirkt haben."

Implementierung als reine CSS-Grid-Heatmap (keine Chart-Lib), Farbe = `bg-[color]/opacity` basierend auf Bias-Color des Bewerbers, Opazität skaliert nach Rating.

## 3. Mehr Biases + Bewerber:innen

**Neue Biases (5 zusätzlich → insgesamt 8):**
Affinity Bias, Beauty Bias, Name Bias, Gender Bias, Age Bias. Jeweils mit `knowledge_card_text`, `self_recognition`, akademischer Quelle, Farbe.

**Neue Bewerber:innen:** Pro neuer Bias ein:e zusätzliche:r Bewerber:in in bestehender Runde 1 (für mehr Vielfalt im Bewertungspool). Bilder via `imagegen` (fast) generieren und unter `src/assets/candidates/` ablegen.

**Wissensfragen:** Je neuer Bias 3 Wahr/Falsch-Fragen seeden.

---

## Technische Schritte (Reihenfolge)

1. Migration: `candidate_prevotes` Tabelle + GRANTs + RLS.
2. Daten-Insert: 5 neue Biases + 15 neue Fragen + 5 neue Bewerber:innen (Bild-URLs).
3. Bilder generieren (5 Stockfoto-Stil-Porträts).
4. `src/lib/bias-game.ts`: Interface für `PreVoteRow`.
5. `src/routes/play.$code.tsx` Phase3:
   - State `myPrevote`, `allPrevotes`, Realtime-Subscription.
   - Gate: Chat + "Next"-Button erst nach vollständigen Pre-Votes.
6. Neue Komponente `BiasHeatmap.tsx`, in Final-Results einbinden.
7. Realtime-Publication: `candidate_prevotes` in supabase_realtime publikieren.

## Out of Scope

- Keine Änderung am Punktesystem.
- Keine zusätzliche Runde — bestehender Single-Round-Flow bleibt, nur mehr Auswahl pro Runde.
