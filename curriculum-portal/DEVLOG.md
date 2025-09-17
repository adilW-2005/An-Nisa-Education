# DEVLOG

## Stage 0 — Project init
- Scaffolded Next.js App Router project (JS) with ESLint, npm, no `src/` dir override but template created `src/`.
- Tailwind v4 present via PostCSS plugin; added legacy `tailwind.config.js` for theme extension and content globs.
- Added Tailwind directives in `src/app/globals.css`.

Run:
- npm install
- npm run dev

## Stage 1 — Data model and helpers
- Added `data/curricula.json` with sample K–2 and 3–5 curricula.
- Implemented `lib/data.js` with `getCurricula`, `getCurriculumById`, `getCompetency`.
- Implemented `lib/googleLinks.js` with helpers: `toDocView`, `toDocPDF`, `toSlidesPresent`, `toSlidesEmbed`, `toSlidesPPTX`, `toSlidesPDF`.
- Added placeholder brand logo at `public/brand/logo.svg`. 

## Stage 2 — Layout, brand, and theme
- Implemented global shell in `src/app/layout.js` with header (logo), main container, and footer.
- Added placeholder brand logo at `public/brand/logo.svg`.
- Theme: blue/white, `bg-slate-50` background, rounded cards, soft shadows.

## Stage 3 — Reusable components
- Added `components/`:
  - `Card.jsx`, `CardGrid.jsx`, `Breadcrumbs.jsx`, `LinkButton.jsx`, `LessonRow.jsx`, `EmptyState.jsx`.
- Buttons open external links in new tabs with `rel="noopener noreferrer"`.
- LessonRow includes optional preview toggles with lazy iframes.

## Stage 4 — Pages & routing
- Home `src/app/page.js`: loads curricula and renders two cards with intro + search CTA placeholder.
- `src/app/[curriculum]/page.jsx`: lists 5 competency cards or EmptyState.
- `src/app/[curriculum]/[competency]/page.jsx`: shows header and 5 lessons with actions & previews.
- `src/app/not-found.js`: friendly 404 with link back home.

## Stage 5 — SEO & polish
- Dynamic page titles/descriptions via `generateMetadata`.
- Focus styles with Tailwind ring on interactive elements.
- Color contrast verified for anisa blue on white. 

## Stage 6 — Optional Search
- Installed `fuse.js` and added `/search` route for client-side search across lessons.
- Header search form submits to `/search?q=...`. 

## Stage 7 — Content loading & handoff
- Documented data updates and Google link normalization in `README.md`.
- Integration point isolated to `lib/data.js` so a CMS/Sheets swap can be made later without UI changes.
- Verified external links open in new tabs and previews embed via iframes. 