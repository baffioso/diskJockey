# DiskJockey

A simple client-side two-deck DJ mixer built with React + Vite using the Web Audio API.

## Features
- Two independent decks (A and B)
- Load local MP3 files
- Transport controls: Play/Pause, Cue
- Pitch slider ±8% (vertical)
- Pitch bend +/- while held
- Equal-power crossfader

Note: Bandcamp streaming may require CORS permissions and appropriate licensing; this app currently supports local files. A future enhancement could support user-provided URLs that permit cross-origin playback.

## Development

- Install dependencies
```sh
npm install
```
- Start dev server
```sh
npm run dev
```
- Build
```sh
npm run build
```

Open http://localhost:5173 in your browser.
