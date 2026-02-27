# Vincent's Fingerprint Project

## Project Context

This is part of a collaborative browser fingerprinting experiment. Each developer has their own folder to build and test fingerprinting solutions.

## Tech Stack

- React + Vite
- FingerprintJS (open-source library)
- Cloudflare D1 SQLite (with localStorage fallback)
- Deployed to Cloudflare Pages

## Commands

```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run lint   # Run ESLint
```

## Deployment

- Auto-deploys on push to `main` branch
- Live URL: https://fingerprint-3y6.pages.dev/vincent/
- Base path is `/vincent/` (configured in vite.config.js)

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/           # Generic components (StabilityBadge)
│   ├── signals/          # Signal display components (SignalCard)
│   └── visitors/         # Visitor components (RecentVisitRow)
├── pages/                # Tab content / page views
│   ├── OverviewTab.jsx
│   ├── SignalsTab.jsx
│   ├── StabilityTab.jsx
│   ├── ChangesTab.jsx
│   ├── PagesTab.jsx
│   └── GlobalStatsTab.jsx
├── hooks/                # Custom React hooks
│   ├── useFingerprint.js   # Fingerprint collection (FingerprintJS + custom signals)
│   └── useVisitorHistory.js # Visit tracking (API + localStorage fallback)
├── utils/                # Utility functions
│   └── formatters.js       # Value formatting helpers
├── App.jsx               # Main app component
├── App.css               # All styles
└── main.jsx              # Entry point
```

## Signals Collected

- Screen (resolution, color depth, pixel ratio)
- Navigator (user agent, language, platform, hardware)
- Timezone
- Canvas fingerprint
- WebGL (vendor, renderer)
- Audio context
- Font detection
- Storage APIs
- Network connection info
- Battery status
- WebGL Render
- Speech Voices
- Math Engine fingerprint
- WebRTC
- Media Devices
- System info

## Notes

- This is an experimental learning project, not production software
- The `base: '/vincent/'` in vite.config.js is required for proper routing on Cloudflare Pages
- API falls back to localStorage when unavailable (dev mode)
