# Bias Busters 🎯

Ein Multiplayer-Partyspiel, das Unconscious Bias erlebbar macht: Ein Host erstellt eine Session, Mitspieler treten per Code bei und durchlaufen gemeinsam mehrere Runden mit Bewerber-Auswahl, (anonymem) Voting, Action-Karten und Bias-Reveal — inklusive Punkten, Auszeichnungen und Podium.

> ⚠️ Provisorische README — wird im Laufe des Projekts ergänzt.

## Tech-Stack

- **Client:** React + TypeScript + Vite (UI mit Radix/shadcn)
- **Server:** Node.js + Express + Socket.io (Echtzeit-Kommunikation)
- **Datenbank:** PostgreSQL
- **Auth:** JWT (Host-/Player-Rollen)
- **Deployment:** Docker Compose, nginx (Client), Railway

## Projektstruktur

```
├── client/     # React-Frontend (Vite)
├── server/     # Express-API + Socket.io + Spiellogik
│   └── schemes/  # SQL-Schema & Migrationen
├── db/         # init.sql für den Postgres-Container
└── docker-compose.yml
```

## Lokale Entwicklung

Voraussetzungen: Node.js ≥ 20, eine laufende PostgreSQL-Instanz (oder der Compose-Container).

```bash
# Abhängigkeiten installieren (Root, Server, Client)
npm run install:all

# Env-Datei anlegen und anpassen
cp .env.example .env

# Client (Port 5173) + Server (Port 3001) parallel starten
npm run dev
```

Der Vite-Dev-Server proxied API-Anfragen an den Backend-Server; `VITE_API_URL` bleibt lokal leer.

## Docker

```bash
npm run docker:up    # baut & startet Postgres, Server und Client (Port 80)
npm run docker:down  # stoppt alles
```

## Wichtige Umgebungsvariablen

| Variable | Beschreibung |
|---|---|
| `POSTGRES_*` | Verbindungsdaten der Datenbank |
| `CLIENT_ORIGIN` | Erlaubte CORS-Origin des Clients |
| `JWT_SECRET` | Secret zum Signieren der Tokens — **in Produktion zwingend setzen** |
| `VITE_API_URL` | Server-URL für den Client-Build (nur Production, z. B. Railway) |

Alle Variablen mit Beispielwerten: siehe [.env.example](.env.example)

## Team

Fabian Patzer & Affan Atik — der initiale Prototyp entstand mit Lovable und wurde anschließend vollständig auf den eigenen Stack (React/Express/PostgreSQL) migriert.
