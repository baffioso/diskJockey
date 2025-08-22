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

## Deploying to GitHub Pages

This repo is configured with a GitHub Actions workflow that builds and deploys the `dist` folder to GitHub Pages whenever you push to `main`.

- Repo Settings → Pages → Source: GitHub Actions
- App base path is set to `/diskJockey/` in `vite.config.ts` for correct asset URLs.

Manual run: go to the Actions tab → “Deploy to GitHub Pages” → Run workflow.
