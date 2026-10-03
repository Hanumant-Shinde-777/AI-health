# AI Health Assistant — Frontend

React 18 + TypeScript + Vite + Tailwind CSS. Mobile-first UI for patients and doctors, in English, Hindi and Marathi, with light, dark and system themes.

Full setup for the whole project (database, backend, environment variables) is in the [main README](../../README.md).

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

The backend must be running on `http://localhost:5000` (see `../backend`). If the API is elsewhere, set it in `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check (`tsc --noEmit`) and build to `dist/` |
| `npm run preview` | Serve the production build locally |

## Project structure

```
src/
├── pages/            Route screens (most live in pages/shared/_screens.tsx)
├── routes/           Router (lazy-loaded pages) and route guards
├── components/       feedback/ (alerts, skeletons, toasts), forms/, layout/, ui/
├── services/         API calls (axios client in apiClient.ts)
├── store/            Redux Toolkit slices + Zustand stores
├── context/          Theme provider
├── i18n/             i18next setup and locales/ (en, hi, mr)
├── assets/styles/    Tailwind entry and theme tokens (index.css)
└── utils/            Helpers
```

## Notes

- **Theme colors** are CSS variables in `src/assets/styles/index.css` (`:root[data-theme='dark' | 'light']`), mapped to Tailwind color names in `tailwind.config.js`. Use the theme names (`bg-card`, `text-muted`, `border-border`, …) rather than raw hex values so both themes work.
- **Translations:** add new strings to all three files in `src/i18n/locales/`. Missing Hindi/Marathi keys fall back to English.
- **Offline fallback:** several services fall back to mock data in `localStorage` when the API is unreachable, so some screens still render without the backend.
