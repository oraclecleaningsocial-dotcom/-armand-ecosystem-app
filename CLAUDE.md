# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout (important, non-obvious)

The actual application source is **not** committed as plain files in the git tree — it lives inside two zip archives at the repo root:

- `armand-ecosystem-app-github-root.zip` — the real source only: `package.json`, `package-lock.json`, `index.html`, `src/main.jsx`, `src/styles.css`. This mirrors what should be the repo root.
- `armand-ecosystem-app.zip` — the same source plus a full `node_modules/` (a local install snapshot). Larger and mostly useful for inspecting exact installed dependency versions; not needed to make code changes.

Both were added via "Add files via upload" (no history of the unzipped source in git). To work on the code:

```bash
unzip -o armand-ecosystem-app-github-root.zip -d /tmp/armand-src   # extract just the source
cd /tmp/armand-src && npm install
```

After editing, re-zip `package.json`, `package-lock.json`, `index.html`, and `src/` back into `armand-ecosystem-app-github-root.zip` (and update `armand-ecosystem-app.zip` similarly if it needs to stay in sync) and commit the updated archive(s) — there is no unzipped copy tracked in git to edit directly. If asked to modernize the repo, flag to the user that de-zipping the source into normal tracked files would make future diffs/reviews far easier, but don't do it unprompted.

## What this app is

A mobile-first, **Italian-language** personal ecosystem app prototype for a single user ("Armand"): meals/recipes, shopping list, personal finance, workouts/exercises, health (blood pressure, temperature, medications, supplements), notes, weather, notifications, and smart suggestions. All UI copy, category names, and in-app data are in Italian — keep new strings in Italian for consistency.

It's a client-only React prototype: no backend, no router library, no state library. All persistence is `localStorage`.

## Commands

Run from inside the extracted source directory (the one containing `package.json`):

```bash
npm install        # install deps (react, react-dom, vite, @vitejs/plugin-react, lucide-react)
npm run dev         # vite dev server, --host 0.0.0.0
npm run build       # vite production build
npm run preview     # preview the production build, --host 0.0.0.0
```

There is no `vite.config.js` (Vite defaults apply), no lint script, no test script, and no CI workflow configured in this repo. Don't invent lint/test commands — verify changes by running `npm run dev` and exercising the UI, or `npm run build` to catch syntax/type errors.

Dependency versions actually installed (from `package-lock.json` inside the archives): React 19.2.6, Vite 8.0.13, `@vitejs/plugin-react` 6.0.1, `lucide-react` 1.16.0. `package.json` pins all of these to `"latest"`.

## Architecture (`src/main.jsx`)

The entire app — data model, business logic, and UI — lives in a single ~190-line (but very dense/long-lined) file, `src/main.jsx`. There are no separate component files, no context providers, no reducers/store library. Understanding the file requires seeing how these pieces fit together:

1. **Global mutable state, outside React.** `appState` is a plain module-level object (seeded from `starterState` via `structuredClone`). It is *not* React state. Business-logic functions (`addRecipe`, `addExpense`, `addWorkout`, `addBloodPressure`, etc.) mutate `appState` directly and return `{success, errors?}` result objects.

2. **React only re-renders on demand.** The single `App()` component holds a dummy `useState` counter (`force`) purely to trigger re-renders. Every action wired into the `actions` object in `App()` calls the underlying mutator function and then `refresh()` (which bumps the counter). This is the pattern to follow when adding a new mutation: write a plain function that mutates `appState`, then expose it through `actions` wrapped with `refresh()`.

3. **`syncEcosystem(eventType, payload)` is the central side-effect pipeline.** Nearly every mutator calls this at the end. It re-derives all cross-cutting computed state in a fixed order: regenerates the shopping list from today's assigned recipes (for meal-related events), recalculates shopping totals, updates the food expense line item, updates finance summary, checks budget limits, recalculates fitness progress and health summary, regenerates smart suggestions/notifications, regenerates dashboard widgets, and finally persists everything via `saveState()` (`localStorage`, key `armand_ecosystem_app_state`). When adding a new kind of mutation that affects derived data, add its recalculation here rather than scattering it across UI handlers.

4. **`bootstrap()`** seeds first-run demo data (assigns default meals, ensures a finance month/budget exists) and is called once at module load (`bootstrap()` at the bottom of the file) and again after `loadState()` restores from `localStorage`.

5. **Screens, not routes.** `SECTIONS` (top of file) is the single source of truth for the list of screens (id, Italian label, lucide icon) and drives the sidebar nav, bottom nav, and the `Screen` dispatcher (`Screen({screen,...})` maps `screen` id → component via a lookup object, e.g. `dashboard: Dashboard`). Navigation is just `appState.currentScreen = s; setScreenState(s)` — no URL/history involvement.

6. **Dashboard widgets are generated data, not hardcoded JSX.** `generateDashboardWidgets()` builds an array of widget descriptors (title, mainValue, description, `dataSource`, action label, target screen, icon) from all the domain summaries; `updateWidgets()` stores the result on `appState.widgets`, and `Dashboard` just maps over `state.widgets` rendering `<Widget>`. The "Fonte input: ..." (data source) line shown throughout the UI is a deliberate convention — every card/widget states where its data comes from; preserve this when adding new cards.

7. **Suggestions/notifications are computed, not stored as authored content.** `generateSuggestions()` and `generateSmartNotifications()` inspect current state (missing prices, unpurchased items, negative savings, missed budget, today's workout, missing health readings, rainy weather) and produce `{type, message, action}` entries; `syncEcosystem` merges and de-duplicates them by `type` into `appState.suggestions`.

8. **Apple Health integration is fully mocked.** `connectAppleHealth()`/`syncHealthData()` simulate a HealthKit connection and canned metrics; comments in the file note this is a stand-in for real HealthKit/`react-native-health` integration in a future React Native build. Don't implement real HealthKit calls without being asked — this is a web prototype.

9. **IDs and keys.** Entity IDs are generated with `createId(prefix)` → `` `${prefix}_${Date.now()}_${Math.floor(Math.random()*10000)}` ``. Shopping items are de-duplicated/merged by a composite key from `createShoppingKey(name, unit, category)` (lowercased/trimmed) so the same ingredient from multiple recipes or manual entry merges into one line with combined quantity and tracked `sources`/`recipeIds`.

## Conventions to preserve when editing

- Keep all user-facing strings in Italian, matching the existing tone (informal, addresses the user as "Armand").
- Follow the existing terse/dense inline style already used in `main.jsx` (no separate CSS-in-JS, plain class names styled in `src/styles.css`) rather than introducing a new styling approach.
- New domain mutators should return `{success, errors?}` (or `{success, ...data}`) like existing ones, and call `syncEcosystem('SOME_EVENT', payload)` at the end so derived state and persistence stay consistent.
- New cards/widgets should include a short "Fonte input: ..." line describing their data source, consistent with the rest of the UI.
