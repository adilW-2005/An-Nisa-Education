# Curriculum Portal

A production-ready Next.js (App Router) + Tailwind CSS site for an education curriculum portal modeled after Overcoming Obstacles’ card → deeper card → assets flow. Theme uses AnNisa blue.

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Data model

Data lives in `data/curricula.json` as a 3-level tree:
- Curriculum → `id`, `title`, `competencies`
- Competency → `id`, `title`, `summary`, `lessons`
- Lesson → `number`, `title`, `docUrl`, `slidesUrl`, `extras[]` (each extra has `label`, `url`)

Update this file to add curricula, competencies, and lessons. The UI updates automatically.

## Google links helpers

Use functions from `lib/googleLinks.js` to normalize Google links:
- Docs: `toDocView(url)`, `toDocPDF(url)`
- Slides: `toSlidesPresent(url)`, `toSlidesEmbed(url)`, `toSlidesPPTX(url)`, `toSlidesPDF(url)`

Downloads:
- Doc PDF: `toDocPDF(originalDocUrl)`
- Slides PDF: `toSlidesPDF(originalSlidesUrl)`
- Slides PPTX: `toSlidesPPTX(originalSlidesUrl)`

### Google sharing checklist
- Set sharing to: "Anyone with the link → Viewer"
- Optional: Slides “Publish to the web” to guarantee embedding

## Routing
- `/` → curriculum cards
- `/{curriculum}` → competency cards
- `/{curriculum}/{competency}` → lessons list with action buttons and optional previews

## Theme
- AnNisa blue `#1C4E80`. Blue + white palette, rounded cards, soft shadows.

## Accessibility & SEO
- Keyboard navigable links and buttons with visible focus rings
- External links open in new tabs with `rel="noopener noreferrer"`
- Dynamic titles and descriptions

## Development notes
- JSX only (no TypeScript)
- Small components, Prettier-friendly
- Data-driven: no hardcoded links inside pages

See `DEVLOG.md` for stage-by-stage changes.

## Search
- A simple search is available at `/search` using Fuse.js to match lesson titles and competency summaries.
- Use the header search box or navigate directly to `/search?q=calming`.
