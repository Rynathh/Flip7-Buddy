# Flip7 Buddy

Ein interaktiver Begleiter (Buddy) für das Kartenspiel **Flip7**. Diese Web-Anwendung hilft dabei, die gezogenen Karten zu verwalten, Punkte zu berechnen und die Wahrscheinlichkeiten für einen Fehlschlag (Bust) im Auge zu behalten.

## Features

- **Spieler-Management**: Beliebig viele Spieler hinzufügen, inklusive KI-Gegnern (Bots).
- **Automatisierte Berechnungen**: Punkte, Flip7-Bonus und Wahrscheinlichkeiten werden automatisch berechnet.
- **Sonderkarten-Handling**: Unterstützung für Freeze, Flip 3 und Second Chance Schilde.
- **Status-Persistenz**: Das Spiel wird automatisch im Browser gespeichert (`localStorage`).
- **Export/Import**: Spielstände können als JSON-Datei gespeichert und wieder geladen werden.
- **Modernes Design**: Dunkles, ansprechendes UI mit Glasmorphismus-Effekten.

## Projektstruktur

Das Projekt ist modular aufgebaut:
- `index.html`: Die Hauptseite.
- `style.css`: Das gesamte Design.
- `js/`: Das Verzeichnis für die JavaScript-Module.
  - `main.js`: Einstiegspunkt und Event-Handling.
  - `engine.js`: Spiellogik und Bot-KI.
  - `ui.js`: DOM-Manipulation und Rendering.
  - `state.js`: Status-Verwaltung und Persistenz.
  - `constants.js`: Spielkonstanten und Deck-Werte.

## Installation & Start

Da die Anwendung moderne **ES-Module** verwendet, muss sie über einen Webserver gestartet werden. Ein direkter Start über das Dateisystem (`file://`) wird von Browsern aus Sicherheitsgründen blockiert.

### Option 1: Mit Node.js (Empfohlen)

Falls du Node.js installiert hast, kannst du einen einfachen Webserver im Projektverzeichnis starten:

```bash
# Falls noch nicht installiert:
npx http-server ./ -p 8080
```

Danach kannst du die Anwendung unter `http://localhost:8080` aufrufen.

### Option 2: Live Server (VS Code)

Falls du VS Code nutzt, kannst du die Erweiterung **"Live Server"** installieren und unten rechts auf "Go Live" klicken.

## Spielanleitung

Eine detaillierte Spielanleitung findest du in der Datei [Anleitung.md](./Anleitung.md) oder direkt im Tracker unter dem jeweiligen Bereich.

## Entwicklung

Dieses Projekt wurde als moderne Vanilla JS Anwendung entwickelt. Es benötigt keine Frameworks oder Build-Tools, nutzt aber aktuelle Browser-Features wie ES-Module.
