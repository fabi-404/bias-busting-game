# Bias Busters 🎯

Eine webbasierte Umsetzung eines BIAS-Identifikationsspiels zur spielerischen Auseinandersetzung mit **Unconscious Bias und Diskriminierung**.  
Die Anwendung überführt einen ursprünglich im Rahmen einer Bachelorarbeit entwickelten Papierprototyp in ein digitales Multiplayer-Spiel, das online zugänglich ist und Wissen, Diskussion, Reflexion und gemeinsame Entscheidungsprozesse verbindet.

---

## Inhaltsverzeichnis

1. [Projektüberblick](#projektüberblick)
2. [Ziele des Projekts](#ziele-des-projekts)
3. [Zielgruppe](#zielgruppe)
4. [Funktionsumfang](#funktionsumfang)
5. [Spielablauf](#spielablauf)
6. [Team und Aufgabenverteilung](#team-und-aufgabenverteilung)
7. [Technologien](#technologien)
8. [Projektstruktur](#projektstruktur)
9. [Systemarchitektur](#systemarchitektur)
10. [Installation](#installation)
11. [Lokale Entwicklungsumgebung](#lokale-entwicklungsumgebung)
12. [Umgebungsvariablen](#umgebungsvariablen)
13. [Authentifizierung und Rollen](#authentifizierung-und-rollen)
14. [REST-API](#rest-api)
15. [API-Datenmodelle](#api-datenmodelle)
16. [Socket.io-Ereignisse](#socketio-ereignisse)
17. [Sequenzdiagramm: Spielraum erstellen und beitreten](#sequenzdiagramm-spielraum-erstellen-und-beitreten)
18. [Ablaufdiagramm des Spiels](#ablaufdiagramm-des-spiels)
19. [Datenbank](#datenbank)
20. [Bekannte technische Einschränkungen](#bekannte-technische-einschränkungen)
21. [Fehlerbehebung](#fehlerbehebung)

---

## Projektüberblick

**Bias Busters** basiert auf einem BIAS-Identifikationsspiel, das im Rahmen einer Bachelorarbeit zunächst als Papierprototyp entwickelt wurde. Eine weitere Inspirationsquelle ist das Kartenspiel **„Bunt Gemischt“ der HWR Berlin**, das Lehrende spielerisch für Unconscious Bias und Diskriminierung im Hochschulkontext sensibilisiert.

Die zugrunde liegende Spielidee arbeitet mit drei zentralen Kartentypen:

- **Wissenskarten**, die wichtige Begriffe wie Affinity Bias, Halo-Effekt oder Mikroaggressionen erklären,
- **Wahr-oder-Falsch-Karten**, die verbreitete Annahmen aufgreifen und hinterfragen,
- **Aktionskarten**, die Situationen, Aufgaben und Diskussionsfragen enthalten.

Diese Struktur diente als fachliche Orientierung. Die konkrete Konzeption der Webanwendung wurde im Projekt jedoch weiterentwickelt und um digitale Spielmechaniken ergänzt. Dazu gehören unter anderem Spielräume mit Raumcode, Rollen für Host und Spieler:innen, geheime Bias-Zuweisungen, Wissensfragen, Bewerber:innenbewertungen, Abstimmungen, ein Chat, Reflexionseinträge, Punktestände und eine abschließende Auswertung.

In der entwickelten Anwendung erstellt ein Host einen Spielraum. Weitere Personen treten über einen sechsstelligen Code bei und durchlaufen gemeinsam mehrere Spielphasen. Jede Person erhält geheim einen Bias, beantwortet Wissensfragen, bewertet Bewerber:innen, stimmt über eine Einstellung ab und versucht später, die Biases der anderen Personen zu erkennen. Dadurch werden mögliche Einflüsse unbewusster Vorurteile auf Entscheidungen spielerisch sichtbar gemacht.

Die Anwendung besteht aus:

- einem React-Frontend mit TypeScript,
- einem Node.js-/Express-Backend mit TypeScript,
- einer PostgreSQL-Datenbank,
- einer REST-API,
- Socket.io für Live-Aktualisierungen,
- JWT-Tokens für Host- und Spielerrollen,
- Docker für die lokale Bereitstellung der Komponenten,
- Railway für das Hosting der produktiven Webanwendung.

Es gibt **keine dauerhaften Benutzerkonten** und aktuell **keinen Mailserver**. Die Teilnahme erfolgt ausschließlich über einen Spielcode, einen Namen und ein temporäres Token.

---

## Ziele des Projekts

Das übergeordnete Ziel des Projekts ist die **Konzeption und Entwicklung einer Webanwendung**, die das ursprüngliche BIAS-Identifikationsspiel digital umsetzt, simuliert oder auf eine neue und verbesserte Weise zum Leben erweckt. Dadurch soll das Spiel ortsunabhängig und online zugänglich werden.

Die Anwendung verfolgt insbesondere folgende Ziele:

- Einen analogen Papierprototyp in eine funktionierende Webanwendung übertragen.
- Unconscious Bias und Diskriminierung verständlich und interaktiv thematisieren.
- Wissen über Bias-Arten und zentrale Begriffe vermitteln.
- Unbewusste Vorurteile bei der Bewertung von Bewerber:innen sichtbar und erlebbar machen.
- Zur Reflexion des eigenen Entscheidungsverhaltens anregen.
- Diskussionen und den Austausch innerhalb einer Gruppe fördern.
- Spielabläufe, Abstimmungen und Punktestände digital abbilden und in Echtzeit synchronisieren.
- Einen niedrigschwelligen Zugang ohne Registrierung ermöglichen.
- Die Anwendung über Railway online bereitstellen und gleichzeitig eine technische Grundlage für spätere Erweiterungen oder eine eigene Domain schaffen.

---

## Zielgruppe

Die Webanwendung soll grundsätzlich **online für alle interessierten Personen zugänglich** sein. Besonders geeignet ist sie für Menschen und Gruppen, die sich spielerisch mit Unconscious Bias, Diversität und diskriminierungsärmeren Entscheidungen auseinandersetzen möchten.

Dazu gehören insbesondere:

- Studierende und Lehrende,
- Hochschulen und Bildungseinrichtungen,
- Workshop- und Seminargruppen,
- Personalabteilungen und Recruiter:innen,
- Unternehmen und Organisationen,
- Teams, die sich mit Diversität und fairen Entscheidungsprozessen beschäftigen,
- Personen, die mehr über unbewusste Vorurteile lernen möchten.

Das Spiel ist besonders für moderierte Gruppen geeignet. Ein Host steuert den Ablauf, während die übrigen Spieler:innen über ihre eigenen Geräte teilnehmen. Gleichzeitig bietet das Projekt durch seine offene Konzeption viel gestalterischen Freiraum für kreative Spielideen und spätere Erweiterungen.

---

## Funktionsumfang

### Spielraum und Teilnahme

- Ein Host kann einen neuen Spielraum erstellen.
- Jeder Spielraum erhält einen sechsstelligen Code.
- Spieler:innen können mit Code, Name und Avatar beitreten.
- Pro Spielraum sind aktuell maximal fünf Einträge in der Spielerliste möglich.
- Die Rolle des Hosts wird über ein JWT-Token geschützt.
- Die Identität wird im Browser im `localStorage` gespeichert.

### Spielsteuerung

- Der Host startet das Spiel und wechselt zwischen den Phasen.
- Der Host kann die aktuelle Runde und den aktuellen Spielabschnitt steuern.
- Der Host kann Aktionskarten ziehen und wieder entfernen.
- Der Host kann die Endauswertung auslösen.

### Lern- und Spielmechaniken

- Geheime Zuweisung eines Bias an jede Person.
- Wissenskarten zu verschiedenen Bias-Arten.
- Wahr-/Falsch-Fragen mit Erklärung.
- Schnellbonus bei einer richtigen Antwort innerhalb von 15 Sekunden.
- Vorstellung und Bewertung von Bewerber:innen.
- Vorbewertung von Bewerber:innen auf einer Skala von 1 bis 5.
- Finale Abstimmung über eine einzustellende Person.
- Punkte für die objektiv richtige Einstellungsentscheidung.
- Gegenseitiges Erraten der geheimen Biases.
- Reflexionsjournal für persönliche Erkenntnisse.
- Chat für die Gruppendiskussion.
- Auszeichnungen und Bonuspunkte am Spielende.
- Abschließendes Podium mit den Punkteständen.

### Administration

Über die Seite `/admin` können Karten verwaltet werden:

- Karten anzeigen,
- neue Karten erstellen,
- vorhandene Karten bearbeiten,
- Karten löschen,
- Karten nach Typ unterscheiden:
  - Wissenskarten,
  - Wahr-/Falsch-Karten,
  - Aktionskarten.

---

## Spielablauf

Das Spiel läuft grundsätzlich so ab:

1. Der Host erstellt einen Spielraum.
2. Der Host teilt den sechsstelligen Raumcode mit den anderen Personen.
3. Spieler:innen treten dem Spielraum bei.
4. Der Host startet das Spiel.
5. Jede Person erhält geheim einen Bias.
6. Die Spieler:innen lesen ihre Wissenskarte.
7. Die Spieler:innen beantworten Wissensfragen.
8. Bewerber:innen werden nacheinander vorgestellt und bewertet.
9. Die Gruppe stimmt über eine Einstellung ab.
10. Die Runde wird ausgewertet und Punkte werden vergeben.
11. Bei weiteren Runden beginnt erneut die Bewerber:innen-Phase.
12. Nach der letzten Runde erraten die Spieler:innen die Biases der anderen.
13. Das Backend berechnet Auszeichnungen und Bonuspunkte.
14. Die Endauswertung zeigt Punktestände und Auszeichnungen.

---

## Team und Aufgabenverteilung

| Name | Verantwortungsbereich | Entwickelte Bestandteile |
|---|---|---|
| **Fabian Patzer** | Backend | Express-Server, REST-Endpunkte, Socket.io-Server, PostgreSQL-Anbindung, Datenbankabfragen, JWT-Authentifizierung, Spiellogik, Punkteberechnung, Sessions, Spieleraktionen, Chat- und Karten-API |
| **Affan Atik** | Frontend | React-Oberfläche, Seiten und Komponenten, Spielphasen, Benutzerführung, Formulare, Kartenverwaltung, API-Anbindung im Client, Socket.io-Client, Darstellung von Spielern, Bewerber:innen, Ergebnissen und Auszeichnungen |

Der initiale Prototyp entstand mit Lovable und wurde anschließend auf einen eigenen Stack mit React, Express und PostgreSQL übertragen.

---

## Technologien

| Bereich | Technologie | Aufgabe |
|---|---|---|
| Frontend | React 19 | Aufbau der Benutzeroberfläche |
| Frontend | TypeScript | Typsichere Entwicklung |
| Frontend | Vite | Entwicklungsserver und Frontend-Build |
| Frontend | React Router | Navigation zwischen den Seiten |
| Frontend | Radix UI / shadcn-Komponenten | Wiederverwendbare UI-Komponenten |
| Frontend | Tailwind CSS | Gestaltung und Layout |
| Frontend | Framer Motion | Animationen |
| Frontend | Socket.io Client | Echtzeit-Kommunikation |
| Backend | Node.js | JavaScript-/TypeScript-Laufzeit |
| Backend | Express | REST-API |
| Backend | Socket.io | Echtzeit-Ereignisse |
| Backend | JSON Web Token | Rollenbasierte Authentifizierung |
| Datenbank | PostgreSQL 16 | Speicherung aller Spiel- und Kartendaten |
| Datenbankzugriff | `pg` | Verbindung zwischen Backend und PostgreSQL |
| Deployment | Docker Compose | Gemeinsames Starten der Dienste in der lokalen Umgebung |
| Hosting | Railway | Hosting der produktiven Webanwendung und Verwaltung der Produktionsvariablen |
| Webserver | nginx | Auslieferung des gebauten Frontends |

---

## Projektstruktur

```text
bias-busting-game-main/
├── client/
│   ├── src/
│   │   ├── assets/              # Bilder der Bewerber:innen
│   │   ├── components/          # Wiederverwendbare React-Komponenten
│   │   ├── lib/
│   │   │   ├── api.ts           # REST-API-Client
│   │   │   ├── bias-game.ts     # Frontend-Datentypen
│   │   │   ├── game-storage.ts  # Speicherung der Identität im Browser
│   │   │   └── socket.ts        # Socket.io-Client
│   │   ├── pages/
│   │   │   ├── HomePage.tsx     # Spielraum erstellen
│   │   │   ├── JoinPage.tsx     # Spiel beitreten
│   │   │   ├── PlayPage.tsx     # Spielablauf
│   │   │   └── AdminPage.tsx    # Kartenverwaltung
│   │   └── App.tsx              # Frontend-Routen
│   ├── package.json
│   └── vite.config.ts
├── server/
│   ├── schemes/
│   │   ├── postgreSQL.schema.sql
│   │   └── migration_*.sql
│   ├── src/
│   │   ├── configs/             # PostgreSQL- und Socket.io-Konfiguration
│   │   ├── queries/             # SQL-Abfragen
│   │   ├── routes/              # HTTP-Routen
│   │   ├── services/            # Fachlogik
│   │   ├── socket/              # Socket.io-Ereignisse
│   │   ├── types/               # Backend-Datentypen
│   │   └── utils/               # Router- und JWT-Hilfsfunktionen
│   ├── main.ts                  # Einstiegspunkt des Backends
│   └── package.json
├── .env.example                 # Beispiel für Umgebungsvariablen
├── docker-compose.yml           # PostgreSQL, Backend und Frontend
├── Dockerfile.client
├── Dockerfile.server
├── nginx.conf
└── package.json                 # Gemeinsame Root-Skripte
```

---

## Systemarchitektur

```mermaid
flowchart LR
    H[Host im Browser]
    P[Spieler:innen im Browser]
    A[Admin-Oberfläche im Browser]

    subgraph RAILWAY["Railway-Hosting"]
        F[React-Frontend]
        API[Express REST-API<br/>Node.js]
        WS[Socket.io-Server<br/>Echtzeit-Updates]
        AUTH[JWT-Prüfung<br/>Host oder Player]
        DB[(PostgreSQL-Datenbank)]
    end

    H -->|HTTPS| F
    P -->|HTTPS| F
    A -->|HTTPS| F

    F -->|REST: /api/*| API
    F <-->|WebSocket: /socket.io| WS

    API --> AUTH
    AUTH --> API

    API -->|SQL über pg| DB
    WS -->|wird durch API-Aktionen ausgelöst| API
    API -->|Events an Session-Raum| WS

    WS -->|Live-Updates| H
    WS -->|Live-Updates| P
```

### Zusammenhang der Komponenten

1. Host und Spieler:innen rufen die über Railway gehostete React-Anwendung im Browser auf.
2. Das Frontend sendet normale Aktionen über die REST-API an das Express-Backend.
3. Das Backend prüft bei geschützten Routen das JWT im `Authorization`-Header.
4. Das Backend liest oder verändert Daten in der PostgreSQL-Datenbank.
5. Nach relevanten Änderungen sendet das Backend Socket.io-Ereignisse.
6. Alle Browser im gleichen Spielraum erhalten die aktualisierten Daten sofort.
7. Die Produktionsvariablen, beispielsweise `DATABASE_URL` und `JWT_SECRET`, werden in Railway hinterlegt.
8. Ein Mailserver ist nicht Bestandteil der Anwendung, da keine E-Mails versendet werden.

### Bereitstellung

Die produktive Anwendung wird über Railway bereitgestellt und ist unter folgender Adresse erreichbar:

[https://amusing-benevolence-production-a04e.up.railway.app/](https://amusing-benevolence-production-a04e.up.railway.app/)

Die Grafik zeigt die logische Verbindung der Komponenten. Die lokale Entwicklungsumgebung wird im Abschnitt [Lokale Entwicklungsumgebung](#lokale-entwicklungsumgebung) beschrieben.

---

## Installation

Da die Anwendung über Railway gehostet wird, ist keine lokale Installation notwendig.

Die Webanwendung kann direkt über folgenden Link aufgerufen werden:

[Bias Busters öffnen](https://amusing-benevolence-production-a04e.up.railway.app/)

---

## Lokale Entwicklungsumgebung

Dieser Abschnitt ist nur für Entwickler:innen relevant. Für die normale Nutzung genügt der Railway-Link aus dem Abschnitt [Installation](#installation).

### Voraussetzungen

Vor dem Start müssen folgende Programme installiert sein:

- **Node.js ab Version 20**
- **Docker Desktop** für die lokale PostgreSQL-Datenbank

### Anwendung lokal starten

1. Ein Terminal im Hauptordner des Projekts öffnen.
2. Alle Abhängigkeiten installieren:

```bash
npm run install:all
```

3. Die PostgreSQL-Datenbank starten:

```bash
docker compose up -d postgres
```

4. Frontend und Backend gemeinsam starten:

```bash
npm run dev
```

5. Die Anwendung im Browser öffnen:

```text
http://localhost:5173
```

Dabei laufen die Komponenten unter folgenden Adressen:

| Komponente | Lokale Adresse |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:3001` |
| PostgreSQL | `localhost:5432` |

Vite leitet lokale Anfragen an `/api` und `/socket.io` automatisch an das Backend auf Port `3001` weiter. Die Standardwerte des Backends passen zur PostgreSQL-Konfiguration aus `docker-compose.yml`. Daher ist für den normalen lokalen Start keine eigene `.env`-Datei erforderlich.

### Anwendung beenden

Frontend und Backend im Terminal mit `Strg + C` beenden. Anschließend kann die Datenbank gestoppt werden:

```bash
docker compose stop postgres
```

> **Hinweis:** Die Datei `.env.example` dokumentiert die verfügbaren Variablen. Das aktuelle Skript `npm run dev` lädt eine `.env`-Datei im Hauptordner nicht automatisch. Eigene Werte müssen daher als Prozessvariablen gesetzt oder über das Startskript eingebunden werden.

---

## Umgebungsvariablen

Die meisten Beispielwerte befinden sich in `.env.example`. Die zusätzlich unterstützte Variable `DATABASE_URL` ist nicht in der aktuellen `.env.example` enthalten, wird aber im Backend-Code ausgewertet und in der Railway-Umgebung gesetzt.

| Variable | Bereich | Beispiel / Standardwert | Pflicht? | Verwendet in / Herkunft | Beschreibung |
|---|---|---:|---|---|---|
| `PORT` | Backend | `3001` | Nein | `.env.example`, `server/main.ts`, `docker-compose.yml`, Railway | Port, auf dem der Express- und Socket.io-Server läuft. |
| `NODE_ENV` | Backend | `development` | Nein | `.env.example`, `docker-compose.yml`, `Dockerfile.server`, Railway | Laufzeitmodus, typischerweise `development` oder `production`. |
| `POSTGRES_HOST` | Backend / Datenbank | `localhost` | Nein | `.env.example`, `server/src/configs/postgreSQL.config.ts`, `docker-compose.yml` | Hostname der PostgreSQL-Datenbank. In Docker lautet der Hostname `postgres`. |
| `POSTGRES_PORT` | Backend / Datenbank | `5432` | Nein | `.env.example`, `server/src/configs/postgreSQL.config.ts`, `docker-compose.yml` | Port der PostgreSQL-Datenbank. |
| `POSTGRES_DB` | Backend / Datenbank | `biasgame` | Nein | `.env.example`, `server/src/configs/postgreSQL.config.ts`, `docker-compose.yml` | Name der verwendeten Datenbank. |
| `POSTGRES_USER` | Backend / Datenbank | `biasgame` | Nein | `.env.example`, `server/src/configs/postgreSQL.config.ts`, `docker-compose.yml` | PostgreSQL-Benutzername. |
| `POSTGRES_PASSWORD` | Backend / Datenbank | `biasgame` | Für Produktion ja | `.env.example`, `server/src/configs/postgreSQL.config.ts`, `docker-compose.yml`, Railway | Passwort des PostgreSQL-Benutzers. Die Beispielangabe darf nicht produktiv verwendet werden. |
| `DATABASE_URL` | Backend / Datenbank | nicht gesetzt | In Railway erforderlich, sofern keine einzelnen `POSTGRES_*`-Werte verwendet werden | `server/src/configs/postgreSQL.config.ts`, Railway Variables; nicht in `.env.example` | Vollständige PostgreSQL-Verbindungs-URL. Wenn sie gesetzt ist, wird sie gegenüber den einzelnen `POSTGRES_*`-Werten bevorzugt und SSL aktiviert. |
| `CLIENT_ORIGIN` | Backend | `http://localhost:5173` | Ja bei anderer Client-URL | `.env.example`, `server/main.ts`, `docker-compose.yml`, Railway | Erlaubte CORS-Origin des Frontends. Sie muss in Railway zur produktiven Frontend-Adresse passen. |
| `JWT_SECRET` | Backend | `change_me_in_production` | Für Produktion zwingend | `.env.example`, `server/src/utils/jwt.util.ts`, Railway Variables | Geheimer Schlüssel zum Signieren und Prüfen der JWT-Tokens. Der Beispielwert muss in Railway durch einen langen, zufälligen Wert ersetzt werden. |
| `VITE_API_URL` | Frontend | leer | Nur bei getrennter Bereitstellung | `.env.example`, `Dockerfile.client`, `client/src/lib/api.ts`, `client/src/lib/socket.ts`, Railway-Build | Basis-URL des Backends. Lokal bleibt der Wert leer, weil Vite `/api` und `/socket.io` weiterleitet. In der produktiven Bereitstellung wird die Server-URL beim Frontend-Build gesetzt. |

### Beispiel für `.env`

```dotenv
# Server
PORT=3001
NODE_ENV=development

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=biasgame
POSTGRES_USER=biasgame
POSTGRES_PASSWORD=biasgame

# Alternative vollständige Datenbank-URL, z. B. in Railway
# DATABASE_URL=postgresql://USER:PASSWORT@HOST:5432/DATENBANK

# CORS
CLIENT_ORIGIN=http://localhost:5173

# JWT
JWT_SECRET=change_me_in_production

# Client
VITE_API_URL=
```

Die tatsächlichen Produktionswerte werden in Railway unter den Environment Variables hinterlegt und aus Sicherheitsgründen nicht im Repository gespeichert.

---

## Authentifizierung und Rollen

Die Anwendung verwendet JSON Web Tokens.

### Rollen

| Rolle | Bedeutung |
|---|---|
| `host` | Darf den Spielzustand verändern, Biases zuweisen, Punkte ändern und die Endauswertung starten. |
| `player` | Darf an Spielaktionen teilnehmen, abstimmen, Fragen beantworten, chatten und Reflexionen speichern. |

### Token-Erzeugung

- Beim Erstellen einer Session wird ein `host_token` erzeugt.
- Beim Beitritt wird ein `player_token` erzeugt.
- Die Tokens sind 24 Stunden gültig.
- Das Frontend speichert das Token gemeinsam mit der Identität im `localStorage`.

### Header geschützter Endpunkte

```http
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

### Typischer JWT-Inhalt

```json
{
  "sub": "UUID",
  "role": "host",
  "sessionId": "UUID",
  "playerId": "UUID"
}
```

Bei einem Host-Token kann `playerId` fehlen.

---

# REST-API

## Allgemeine Angaben

Lokale Basis-URL:

```text
http://localhost:3001/api
```

In der lokalen Frontend-Entwicklung kann der Client wegen des Vite-Proxys direkt `/api` verwenden.

### Allgemeine Header

| Header | Verwendung |
|---|---|
| `Content-Type: application/json` | Bei Anfragen mit JSON-Body |
| `Authorization: Bearer <TOKEN>` | Bei geschützten Endpunkten |

### Allgemeine Fehlerantwort

```json
{
  "error": "Beschreibung des Fehlers"
}
```

Typische Statuscodes:

| Statuscode | Bedeutung |
|---:|---|
| `200` | Anfrage erfolgreich |
| `201` | Datensatz erfolgreich erstellt |
| `400` | Ungültige oder fehlende Eingabe |
| `401` | Token fehlt oder ist ungültig |
| `403` | Rolle besitzt nicht die erforderliche Berechtigung |
| `404` | Datensatz nicht gefunden |
| `409` | Konflikt, zum Beispiel voller Spielraum |
| `500` | Interner Serverfehler |

---

## Health-Endpunkt

| Methode | Path | Authentifizierung | Parameter / Body | Rückgabe | Beschreibung |
|---|---|---|---|---|---|
| `GET` | `/api/health` | Keine | Keine | `{ status: "ok", ts: string }` | Prüft, ob das Backend erreichbar ist. |

Beispiel:

```json
{
  "status": "ok",
  "ts": "2026-07-21T12:00:00.000Z"
}
```

---

## Session-Endpunkte

| Methode | Path | Authentifizierung | Path-Parameter | JSON-Body | Rückgabe | Beschreibung |
|---|---|---|---|---|---|---|
| `POST` | `/api/sessions` | Keine | Keine | `host_name: string` erforderlich; `total_rounds?: number` | `201`: `{ id, code, host_token }` | Erstellt einen neuen Spielraum und ein Host-Token. |
| `GET` | `/api/sessions/:code` | Keine | `code`: sechsstelliger Raumcode | Kein Body | `FullSessionState` | Lädt den vollständigen aktuellen Spielzustand anhand des Codes. |
| `PATCH` | `/api/sessions/:id` | Nur Host | `id`: Session-UUID | Eine oder mehrere erlaubte Session-Eigenschaften | Aktualisiertes `Session`-Objekt | Ändert Phase, Runde, Zeitsteuerung oder andere Session-Einstellungen. |

### `POST /api/sessions`

Request:

```json
{
  "host_name": "Fabian",
  "total_rounds": 3
}
```

Response:

```json
{
  "id": "SESSION_UUID",
  "code": "ABC123",
  "host_token": "JWT_TOKEN"
}
```

### Erlaubte Felder für `PATCH /api/sessions/:id`

| Feld | Typ | Beschreibung |
|---|---|---|
| `phase` | `GamePhase` | Aktuelle Spielphase |
| `status` | `"lobby" \| "playing" \| "ended"` | Status der Session |
| `current_round` | `number` | Aktuelle Runde |
| `current_candidate_index` | `number` | Index der aktuell angezeigten Person |
| `current_question_index` | `number` | Index der aktuellen Frage |
| `phase_started_at` | `string \| null` | ISO-Zeitpunkt des Phasenstarts |
| `selected_candidate_ids` | `string[]` | Ausgewählte Kandidat:innen-UUIDs |
| `current_action_card_id` | `string \| null` | Aktuelle Aktionskarten-UUID |
| `action_card_started_at` | `string \| null` | Startzeitpunkt der Aktionskarte |
| `phase_duration_seconds` | `number` | Geplante Dauer einer Phase |
| `anonymous_voting` | `boolean` | Legt fest, ob Stimmen anonym angezeigt werden |
| `total_rounds` | `number` | Gesamtzahl der Spielrunden |

Nicht erlaubte Felder werden ignoriert. Enthält der Body kein erlaubtes Feld, antwortet das Backend mit `400`.

---

## Spieler-Endpunkte

| Methode | Path | Authentifizierung | Path-Parameter | JSON-Body | Rückgabe | Beschreibung |
|---|---|---|---|---|---|---|
| `POST` | `/api/sessions/:id/players` | Keine | `id`: Session-UUID | `name: string`; `is_host?: boolean`; `avatar?: string` | `201`: Spielerobjekt mit `player_token` | Fügt eine Person zur Session hinzu. |
| `PATCH` | `/api/sessions/:id/players/:playerId` | Nur Host | `id`: Session-UUID; `playerId`: Spieler-UUID | `score: number` | Aktualisiertes `Player`-Objekt | Setzt den Punktestand einer Person auf einen bestimmten Wert. |

### Spielerbeitritt

Request:

```json
{
  "name": "Affan",
  "is_host": false,
  "avatar": "🦊"
}
```

Response:

```json
{
  "id": "PLAYER_UUID",
  "player_token": "JWT_TOKEN",
  "name": "Affan",
  "score": 0,
  "is_host": false,
  "avatar": "🦊"
}
```

Besonderheiten:

- `name` ist erforderlich.
- Standardavatar ist `🙂`.
- Der Avatar wird auf maximal acht Zeichen gekürzt.
- Ab fünf Einträgen in der Spielerliste antwortet das Backend mit `409`.

---

## Spiel-Endpunkte

| Methode | Path | Authentifizierung | Path-Parameter | JSON-Body | Rückgabe | Beschreibung |
|---|---|---|---|---|---|---|
| `POST` | `/api/sessions/:id/assignments` | Nur Host | `id`: Session-UUID | `rows: AssignmentInput[]` | `Assignment[]` | Löscht bisherige Zuweisungen und weist jeder Person einen Bias zu. |
| `POST` | `/api/sessions/:id/answers` | Host oder Player | `id`: Session-UUID | `player_id`, `question_id`, `answer` | `QuestionAnswer` mit `points_awarded` | Speichert oder überschreibt eine Antwort und vergibt Punkte. |
| `POST` | `/api/sessions/:id/votes` | Host oder Player | `id`: Session-UUID | `player_id`, `round_number`, `candidate_id` | `{ ok: true }` | Speichert oder ändert die finale Stimme einer Person in einer Runde. |
| `POST` | `/api/sessions/:id/rounds/:round/resolve` | Host oder Player | `id`: Session-UUID; `round`: positive Ganzzahl | Kein Body | `{ correct_candidate_id, players }` | Ermittelt die objektiv richtige Person und vergibt Einstellungsbonus-Punkte. |
| `POST` | `/api/sessions/:id/prevotes` | Host oder Player | `id`: Session-UUID | `player_id`, `round_number`, `candidate_id`, `rating` | `{ ok: true }` | Speichert eine Vorbewertung von 1 bis 5. |
| `POST` | `/api/sessions/:id/guesses` | Host oder Player | `id`: Session-UUID | `guesses: BiasGuessInput[]` | `{ ok: true, correct: number }` | Speichert Bias-Tipps und vergibt pro korrektem Tipp einen Punkt. |
| `POST` | `/api/sessions/:id/ready` | Host oder Player | `id`: Session-UUID | `player_id`, `phase_key` | `{ ok: true }` | Markiert eine Person für einen bestimmten Phasenschlüssel als bereit. |
| `POST` | `/api/sessions/:id/finalize` | Nur Host | `id`: Session-UUID | Kein Body | `Achievement[]` | Berechnet Auszeichnungen und Bonuspunkte. |
| `POST` | `/api/sessions/:id/reflection` | Host oder Player | `id`: Session-UUID | `player_id`, `content` | `Reflection` | Erstellt oder aktualisiert den Reflexionseintrag. |
| `GET` | `/api/sessions/:id/reflection/:playerId` | Host oder Player | `id`: Session-UUID; `playerId`: Spieler-UUID | Kein Body | `{ content, updated_at }` oder `null` | Lädt den Reflexionseintrag einer Person. |

### Bias-Zuweisungen

```json
{
  "rows": [
    {
      "player_id": "PLAYER_UUID_1",
      "bias_id": "BIAS_UUID_1"
    },
    {
      "player_id": "PLAYER_UUID_2",
      "bias_id": "BIAS_UUID_2"
    }
  ]
}
```

### Wissensfrage beantworten

```json
{
  "player_id": "PLAYER_UUID",
  "question_id": "QUESTION_UUID",
  "answer": true
}
```

Mögliche Punkte:

| Situation | Punkte |
|---|---:|
| Falsche Antwort | 0 |
| Richtige Antwort nach mehr als 15 Sekunden | 1 |
| Richtige Antwort innerhalb von 15 Sekunden | 2 |

Beispielantwort:

```json
{
  "id": "ANSWER_UUID",
  "session_id": "SESSION_UUID",
  "player_id": "PLAYER_UUID",
  "question_id": "QUESTION_UUID",
  "answer": true,
  "is_correct": true,
  "created_at": "2026-07-21T12:00:00.000Z",
  "points_awarded": 2
}
```

### Finale Stimme

```json
{
  "player_id": "PLAYER_UUID",
  "round_number": 1,
  "candidate_id": "CANDIDATE_UUID"
}
```

Pro Person und Runde existiert nur eine finale Stimme. Eine erneute Anfrage überschreibt die bisherige Auswahl.

### Runde auswerten

Request:

```http
POST /api/sessions/SESSION_UUID/rounds/1/resolve
Authorization: Bearer <TOKEN>
```

Response:

```json
{
  "correct_candidate_id": "CANDIDATE_UUID",
  "players": [
    {
      "id": "PLAYER_UUID",
      "name": "Affan",
      "score": 4,
      "is_host": false,
      "avatar": "🦊"
    }
  ]
}
```

Die objektiv richtige Person ist im aktuellen Datenmodell die Person der Runde, deren `appeals_to_bias_id` den Wert `null` besitzt. Richtige Stimmen erhalten einmalig zwei Punkte pro Runde.

### Vorbewertung

```json
{
  "player_id": "PLAYER_UUID",
  "round_number": 1,
  "candidate_id": "CANDIDATE_UUID",
  "rating": 4
}
```

`rating` muss laut Datenbankschema zwischen `1` und `5` liegen.

### Bias-Tipps

```json
{
  "guesses": [
    {
      "guesser_player_id": "PLAYER_UUID_1",
      "target_player_id": "PLAYER_UUID_2",
      "round_number": 3,
      "guessed_bias_id": "BIAS_UUID",
      "is_correct": true
    }
  ]
}
```

Das Backend vertraut bei diesem Endpunkt aktuell dem mitgesendeten Feld `is_correct`. Bei einem korrekten Eintrag wird ein Punkt vergeben.

### Bereitschaft markieren

```json
{
  "player_id": "PLAYER_UUID",
  "phase_key": "phase2_questions:1:0:0"
}
```

Die Kombination aus Session, Spieler:in und `phase_key` wird nur einmal gespeichert.

### Reflexion speichern

```json
{
  "player_id": "PLAYER_UUID",
  "content": "Mir ist aufgefallen, dass ..."
}
```

---

## Chat-Endpunkte

| Methode | Path | Authentifizierung | Path-Parameter | JSON-Body | Rückgabe | Beschreibung |
|---|---|---|---|---|---|---|
| `GET` | `/api/sessions/:id/chat` | Host oder Player | `id`: Session-UUID | Kein Body | `ChatMessage[]` | Lädt alle Nachrichten einer Session chronologisch. |
| `POST` | `/api/sessions/:id/chat` | Host oder Player | `id`: Session-UUID | `player_id`, `player_name`, `phase`, `round_number`, `message` | `201`: `ChatMessage` | Speichert und veröffentlicht eine neue Chatnachricht. |

Request:

```json
{
  "player_id": "PLAYER_UUID",
  "player_name": "Affan",
  "phase": "phase4_hire_vote",
  "round_number": 1,
  "message": "Ich würde Person B auswählen."
}
```

Besonderheiten:

- `message` darf nicht leer sein.
- Nachrichten werden auf maximal 500 Zeichen gekürzt.
- Nach dem Speichern wird `chat:message` an den Session-Raum gesendet.

---

## Karten-Endpunkte

| Methode | Path | Authentifizierung | Path-Parameter | JSON-Body | Rückgabe | Beschreibung |
|---|---|---|---|---|---|---|
| `GET` | `/api/cards` | Keine | Keine | Kein Body | `Card[]` | Gibt alle Karten sortiert nach Typ und Erstellungsdatum zurück. |
| `POST` | `/api/cards` | Keine | Keine | `CardBody` | `201`: `Card` | Erstellt eine neue Karte. |
| `PUT` | `/api/cards/:id` | Keine | `id`: Karten-UUID | Vollständiger `CardBody` | Aktualisierte `Card` | Ersetzt die bearbeitbaren Inhalte einer Karte. |
| `DELETE` | `/api/cards/:id` | Keine | `id`: Karten-UUID | Kein Body | `{ ok: true }` | Löscht eine Karte. |

### Karten-Body

```json
{
  "type": "truefalse",
  "title": "Beispielfrage",
  "content": "Unbewusste Vorurteile können Entscheidungen beeinflussen.",
  "example": null,
  "explanation": "Biases wirken häufig automatisch.",
  "category": "Grundlagen",
  "correct_answer": true
}
```

| Feld | Typ | Pflicht? | Beschreibung |
|---|---|---|---|
| `type` | `"knowledge" \| "truefalse" \| "action"` | Ja | Kartentyp |
| `title` | `string` | Ja | Titel der Karte |
| `content` | `string` | Ja | Hauptinhalt oder Frage |
| `example` | `string \| null` | Nein | Optionales Beispiel |
| `explanation` | `string \| null` | Nein | Optionale Erklärung |
| `category` | `string \| null` | Nein | Kategorie |
| `correct_answer` | `boolean \| null` | Bei Wahr/Falsch-Karten | Richtige Antwort |

---

# API-Datenmodelle

## `Session`

| Feld | Typ |
|---|---|
| `id` | `string` |
| `code` | `string` |
| `host_name` | `string` |
| `status` | `"lobby" \| "playing" \| "ended"` |
| `phase` | `GamePhase` |
| `current_round` | `number` |
| `current_candidate_index` | `number` |
| `current_question_index` | `number` |
| `phase_started_at` | `string \| null` |
| `total_rounds` | `number` |
| `current_action_card_id` | `string \| null` |
| `action_card_started_at` | `string \| null` |
| `selected_candidate_ids` | `string[]` |
| `phase_duration_seconds` | `number` |
| `anonymous_voting` | `boolean` |
| `created_at` | `string` |
| `updated_at` | `string` |

## `GamePhase`

```text
lobby
phase1_knowledge
phase2_questions
phase3_candidates
phase4_hire_vote
phase5_bias_guess
round_results
final_results
```

## `Player`

| Feld | Typ |
|---|---|
| `id` | `string` |
| `name` | `string` |
| `score` | `number` |
| `is_host` | `boolean` |
| `avatar` | `string` |

## Weitere API-Objekte

| Modell | Zurückgegebene Felder |
|---|---|
| `Bias` | `id`, `slug`, `name`, `short_description`, `knowledge_card_text`, `example`, `color`, `self_recognition`, `source_label`, `source_url`, `created_at` |
| `BiasQuestion` | `id`, `bias_id`, `question`, `correct_answer`, `explanation`, `position`, `created_at` |
| `Candidate` | `id`, `round_number`, `position`, `name`, `age`, `pronouns`, `image_url`, `video_url`, `headline`, `description`, `qualifications`, `appeals_to_bias_id`, `created_at` |
| `Assignment` | `id`, `session_id`, `player_id`, `bias_id`, `created_at` |
| `QuestionAnswer` | `id`, `session_id`, `player_id`, `question_id`, `answer`, `is_correct`, `created_at`; beim Absenden zusätzlich `points_awarded` |
| `CandidateVote` | `id`, `session_id`, `player_id`, `round_number`, `candidate_id`, `created_at` |
| `CandidatePrevote` | `id`, `session_id`, `player_id`, `round_number`, `candidate_id`, `rating`, `created_at`, `updated_at` |
| `BiasGuess` | `id`, `session_id`, `guesser_player_id`, `target_player_id`, `round_number`, `guessed_bias_id`, `is_correct`, `created_at` |
| `Ready` | `player_id`, `phase_key` |
| `Reflection` | `id`, `session_id`, `player_id`, `content`, `created_at`, `updated_at` |
| `ChatMessage` | `id`, `session_id`, `player_id`, `player_name`, `phase`, `round_number`, `message`, `created_at` |
| `Achievement` | `id`, `session_id`, `player_id`, `achievement_key`, `bonus_points`, `created_at` |
| `Card` | `id`, `type`, `title`, `content`, `example`, `correct_answer`, `explanation`, `category`, `created_at`, `updated_at` |

## `FullSessionState`

`GET /api/sessions/:code` liefert ein Objekt mit dem gesamten Spielzustand:

```json
{
  "session": {},
  "players": [],
  "biases": [],
  "questions": [],
  "candidates": [],
  "assignments": [],
  "answers": [],
  "votes": [],
  "guesses": [],
  "ready": [],
  "actionCards": [],
  "prevotes": [],
  "achievements": []
}
```

---

# Socket.io-Ereignisse

Socket.io verwendet standardmäßig den Path:

```text
/socket.io
```

Der Client tritt einem Raum bei, dessen Name der Session-UUID entspricht. Dadurch erhalten nur die verbundenen Browser derselben Session die jeweiligen Live-Updates.

## Vom Client an den Server

| Ereignis | Payload | Beschreibung |
|---|---|---|
| `join:room` | `sessionId: string` | Tritt dem Socket.io-Raum der Session bei. |
| `leave:room` | `sessionId: string` | Verlässt den Socket.io-Raum. |

## Vom Server an den Client

| Ereignis | Payload | Auslöser |
|---|---|---|
| `session:updated` | `Session` | Session wurde über `PATCH /sessions/:id` geändert. |
| `players:updated` | `Player[]` | Beitritt, Punkteänderung oder automatische Punktevergabe. |
| `assignments:updated` | `Assignment[]` | Biases wurden zugewiesen. |
| `answers:updated` | `QuestionAnswer[]` | Eine Wissensfrage wurde beantwortet. |
| `votes:updated` | `CandidateVote[]` | Eine finale Stimme wurde gespeichert. |
| `prevotes:updated` | `CandidatePrevote[]` | Eine Vorbewertung wurde gespeichert. |
| `guesses:updated` | `BiasGuess[]` | Bias-Tipps wurden gespeichert. |
| `ready:updated` | `Ready[]` | Eine Person hat sich für eine Phase als bereit markiert. |
| `round_resolved` | `{ round_number, correct_candidate_id }` | Eine Runde wurde ausgewertet. |
| `achievements:updated` | `Achievement[]` | Die Endauszeichnungen wurden berechnet. |
| `chat:message` | `ChatMessage` | Eine neue Chatnachricht wurde gespeichert. |

---

## Sequenzdiagramm: Spielraum erstellen und beitreten

```mermaid
sequenceDiagram
    actor Host
    participant HF as Host-Frontend
    participant API as Express-API
    participant DB as PostgreSQL
    participant PF as Spieler-Frontend
    actor Player
    participant WS as Socket.io

    Host->>HF: Name und Avatar eingeben
    HF->>API: POST /api/sessions
    API->>DB: Session mit Zufallscode anlegen
    DB-->>API: Session-ID und Code
    API-->>HF: id, code, host_token

    HF->>API: POST /api/sessions/:id/players
    API->>DB: Host als Spieler:in speichern
    DB-->>API: Host-Spielerdaten
    API-->>HF: Spielerobjekt

    HF->>HF: Host-Identität im localStorage speichern
    HF->>WS: join:room(sessionId)

    Host-->>Player: Sechsstelligen Code mitteilen
    Player->>PF: Code, Name und Avatar eingeben
    PF->>API: GET /api/sessions/:code
    API->>DB: Session und Spielzustand laden
    DB-->>API: Vollständiger Sessionzustand
    API-->>PF: FullSessionState

    PF->>API: POST /api/sessions/:id/players
    API->>DB: Spieler:in anlegen
    DB-->>API: Spielerdaten
    API-->>PF: Spielerobjekt und player_token

    API->>WS: players:updated
    WS-->>HF: Aktualisierte Spielerliste
    WS-->>PF: Aktualisierte Spielerliste

    PF->>PF: Identität im localStorage speichern
    PF->>WS: join:room(sessionId)
```

---

## Ablaufdiagramm des Spiels

```mermaid
flowchart TD
    A[Host erstellt Spielraum] --> B[Spieler:innen treten mit Code bei]
    B --> C[Host startet das Spiel]
    C --> D[Biases werden geheim zugewiesen]
    D --> E[Phase 1: Wissenskarte zum eigenen Bias]
    E --> F[Phase 2: Wahr-/Falsch-Fragen]
    F --> G[Phase 3: Bewerber:innen ansehen und vorbewerten]
    G --> H[Optional: Aktionskarte und Diskussion]
    H --> I[Phase 4: Finale Einstellungsabstimmung]
    I --> J[Rundenauswertung und Punkte]
    J --> K{Weitere Runde vorhanden?}
    K -->|Ja| G
    K -->|Nein| L[Phase 5: Biases der anderen erraten]
    L --> M[Auszeichnungen und Bonuspunkte berechnen]
    M --> N[Finale Ergebnisse und Podium]
```

---

## Datenbank

Die PostgreSQL-Datenbank wird beim ersten Start des Docker-Containers mit folgendem Schema initialisiert:

```text
server/schemes/postgreSQL.schema.sql
```

### Tabellenübersicht

| Tabelle | Zweck |
|---|---|
| `cards` | Wissens-, Wahr-/Falsch- und Aktionskarten |
| `biases` | Definitionen der verschiedenen Bias-Arten |
| `bias_questions` | Fragen zu den Bias-Arten |
| `candidates` | Bewerber:innen für die Spielrunden |
| `game_sessions` | Zustand der einzelnen Spielräume |
| `session_players` | Teilnehmer:innen und Punktestände |
| `player_bias_assignments` | Geheime Bias-Zuweisungen |
| `bias_question_answers` | Antworten auf Wissensfragen |
| `candidate_votes` | Finale Einstellungsstimmen |
| `candidate_prevotes` | Vorbewertungen von 1 bis 5 |
| `bias_guesses` | Tipps zu den Biases anderer Personen |
| `session_phase_ready` | Bereitschaftsstatus pro Phase |
| `chat_messages` | Chatnachrichten |
| `reflection_journals` | Persönliche Reflexionen |
| `player_achievements` | Auszeichnungen und Bonuspunkte |
| `round_hire_bonuses` | Einmalige Punkte für richtige Einstellungsentscheidungen |

### Beziehungen

- Eine Session besitzt mehrere Spieler:innen.
- Eine Session besitzt mehrere Antworten, Stimmen, Tipps und Chatnachrichten.
- Jede Bias-Zuweisung verbindet eine Person mit genau einem Bias.
- Jede Frage gehört zu einem Bias.
- Kandidat:innen können optional einen bestimmten Bias ansprechen.
- Viele Tabellen werden beim Löschen einer Session durch `ON DELETE CASCADE` automatisch bereinigt.

---

## Auszeichnungen

Bei der Finalisierung können folgende Auszeichnungen vergeben werden:

| Schlüssel | Anzeige | Bedingung | Bonus |
|---|---|---|---:|
| `quiz_master` | Quiz-Profi | Alle vorgesehenen Wissensfragen richtig beantwortet | `+1` |
| `bias_detective` | Bias-Detektiv:in | Alle Biases der anderen korrekt erraten | `+1` |
| `undercover` | Undercover | Niemand hat den eigenen Bias korrekt erraten | `+2` |
| `team_compass` | Teamgespür | Eigene Stimme entsprach der eindeutigen Gruppenmehrheit | `0` |
| `chat_champion` | Diskussionsfreudig | Meiste Chatbeiträge, mindestens drei | `0` |

Die Finalisierung ist idempotent: Existieren bereits Auszeichnungen für die Session, werden sie nicht erneut berechnet und Bonuspunkte nicht doppelt vergeben.

---

## Bekannte technische Einschränkungen

Die folgenden Punkte beschreiben den aktuellen Entwicklungsstand:

1. **Keine dauerhaften Benutzerkonten:**  
   Namen und Tokens werden nur für die jeweilige Session verwendet.

2. **Kein Mailserver:**  
   Die Anwendung verschickt keine Einladungs-, Registrierungs- oder Passwort-E-Mails.

3. **Admin-Endpunkte sind aktuell öffentlich:**  
   Die Endpunkte unter `/api/cards` besitzen derzeit keine Authentifizierung. Für einen produktiven Betrieb sollte eine Admin-Rolle ergänzt werden.

4. **Vollständiger Sessionzustand ist öffentlich per Code abrufbar:**  
   `GET /api/sessions/:code` benötigt aktuell kein Token und liefert unter anderem Zuweisungen, Antworten und Tipps. Für einen produktiven oder wettbewerblichen Einsatz sollten geheime Daten serverseitig nach Rolle gefiltert werden.

5. **Rundenauswertung ist nicht auf den Host beschränkt:**  
   Der Endpunkt zum Auswerten einer Runde benötigt zwar ein Token, kann aktuell aber auch mit einem Spieler-Token aufgerufen werden.

6. **Korrektheit der Bias-Tipps kommt aus dem Client:**  
   Das Feld `is_correct` wird vom Client übergeben. Sicherer wäre eine serverseitige Prüfung anhand der gespeicherten Zuweisungen.

7. **`.env` wird lokal nicht automatisch eingelesen:**  
   Die Standardwerte funktionieren lokal. Eigene Werte müssen über den Prozess, `--env-file` oder einen Environment-Loader bereitgestellt werden.

8. **Keine automatische Datenbankmigration:**  
   Beim ersten Containerstart wird das Hauptschema ausgeführt. Spätere Migrationen müssen kontrolliert und separat angewendet werden.

9. **CORS erlaubt genau eine Origin:**  
   `CLIENT_ORIGIN` wird als einzelne Zeichenkette verwendet. Mehrere Frontend-Domains werden aktuell nicht unterstützt.

---

## Fehlerbehebung

### Die gehostete Anwendung öffnet sich nicht

Zuerst prüfen, ob die vollständige Railway-Adresse aufgerufen wurde:

[https://amusing-benevolence-production-a04e.up.railway.app/](https://amusing-benevolence-production-a04e.up.railway.app/)

Wenn die Seite weiterhin nicht erreichbar ist, sollten Entwickler:innen den aktuellen Deployment-Status und die Logs des Railway-Services prüfen.

### Die lokale Anwendung öffnet sich nicht

Prüfen, ob `npm run dev` noch läuft.

Danach öffnen:

```text
http://localhost:5173
```

### Das Backend ist nicht erreichbar

Health-Endpunkt testen:

```text
http://localhost:3001/api/health
```

Oder mit `curl`:

```bash
curl http://localhost:3001/api/health
```

### Datenbankverbindung schlägt fehl

Prüfen, ob der PostgreSQL-Container läuft:

```bash
docker compose ps
```

Container starten:

```bash
docker compose up -d postgres
```

Logs anzeigen:

```bash
docker compose logs postgres
```

### Datenbanktabellen fehlen

Das Initialisierungsskript wird nur beim ersten Erstellen des Datenbank-Volumes ausgeführt.

Datenbank vollständig zurücksetzen:

```bash
docker compose down -v
docker compose up -d postgres
```

> Dabei werden alle lokalen Daten gelöscht.

### Port ist bereits belegt

Standardports:

| Dienst | Port |
|---|---:|
| Frontend-Entwicklung | `5173` |
| Backend | `3001` |
| PostgreSQL | `5432` |
| Docker-Frontend | `80` |

Beende das Programm, das den Port verwendet, oder ändere die entsprechende Konfiguration.

### `401 Unauthorized`

Prüfen:

- Wurde ein Token gespeichert?
- Beginnt der Header mit `Bearer `?
- Ist das Token jünger als 24 Stunden?
- Wurde das richtige Host- oder Spieler-Token verwendet?

### `403 Forbidden`

Die Route ist nur für den Host erlaubt. Ein normales Spieler-Token reicht nicht aus.

### Spielraum ist voll

Die aktuelle Begrenzung liegt bei fünf Einträgen in `session_players`, einschließlich eines dort gespeicherten Hosts.

---

## Nützliche Befehle

| Befehl | Bedeutung |
|---|---|
| `npm run install:all` | Installiert alle Abhängigkeiten |
| `npm run dev` | Startet Frontend und Backend parallel |
| `npm run dev:server` | Startet nur das Backend |
| `npm run dev:client` | Startet nur das Frontend |
| `docker compose up -d postgres` | Startet die lokale PostgreSQL-Datenbank |
| `docker compose stop postgres` | Stoppt die lokale PostgreSQL-Datenbank |
| `docker compose logs -f postgres` | Zeigt die Logs der lokalen PostgreSQL-Datenbank live |

---

## Frontend-Routen

| Path | Seite | Beschreibung |
|---|---|---|
| `/` | `HomePage` | Spielraum erstellen oder zu Beitritt und Administration navigieren |
| `/join` | `JoinPage` | Mit Raumcode, Name und Avatar beitreten |
| `/play/:code` | `PlayPage` | Lobby und vollständiger Spielablauf |
| `/admin` | `AdminPage` | Karten anzeigen, erstellen, bearbeiten und löschen |

---

## Lizenz

Für dieses Projekt ist aktuell keine separate Lizenzdatei im Repository hinterlegt. Ohne ausdrückliche Lizenz bleiben die Rechte grundsätzlich bei den Urheber:innen.
