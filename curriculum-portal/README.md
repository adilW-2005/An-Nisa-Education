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

**Flat lesson-sequence curricula** (used by `6-8`): instead of `competencies`, a curriculum can provide `lessons[]` directly. Each lesson uses the same `number`/`title`/`docUrl`/`extras[]` shape as above, plus optional `coreSkill`, `duration`, `primaryCompetencies[]`, `secondaryCompetencies[]` (rendered as badges). A curriculum can also set `gradeLabel`, `tagline`, and a top-level `extras[]` for curriculum-wide resources (e.g. a scenario bank spanning all lessons). `[curriculum]/page.jsx` renders lessons directly on the curriculum page when `lessons[]` is present, instead of linking out to competency sub-pages.

`docUrl`/`slidesUrl`/`extras[].url` don't have to be Google Docs/Slides links — a plain path like `/docs/6-8/lesson-1-plan.docx` (served from `public/docs/...`) works too. `LessonRow` only applies the Google Docs/Slides transforms (`toDocPDF`, `toSlidesPresent`, etc.) and the in-page preview iframe when the URL is a `docs.google.com`/`drive.google.com` link (or, for preview, a `.pdf`); non-Google URLs just render as a direct open/download link.

`data/curricula.json` remains the built-in fallback. For non-technical editing, use `/admin` to create or edit a Google Drive-hosted `curricula.json` manifest with the same shape. Note: `/admin` only has structured UI for the `competencies` shape — a flat `lessons[]` curriculum isn't editable there yet; edit `data/curricula.json` directly (or the Drive manifest's JSON) instead.

To make the public site read from Google Drive, set:

```bash
NEXT_PUBLIC_CURRICULA_DRIVE_FILE_ID="google-drive-file-id-for-curricula-json"
NEXT_PUBLIC_GOOGLE_API_KEY="google-api-key"
```

The Drive manifest must be shared as "Anyone with the link → Viewer" for public visitors to load it without signing in. If those variables are missing or the Drive fetch fails, the app falls back to the checked-in `data/curricula.json`.

## Admin editor

Visit `/admin` to edit curricula, competencies, lessons, and Google resources.

The editor can:
- Connect to Google from the browser.
- Create a `curricula.json` manifest in the admin's Google Drive using the current local data.
- Find or open an existing Drive manifest.
- Attach Google Docs, Slides, PDFs, and other Drive files using Google Picker.
- Save the updated JSON back to Drive.

Admin environment variables:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID="google-oauth-client-id"
NEXT_PUBLIC_GOOGLE_API_KEY="google-api-key"
NEXT_PUBLIC_GOOGLE_APP_ID="google-cloud-project-number"
```

Google Cloud setup:
- Create a Google Cloud project.
- Enable the Google Drive API and Google Picker API.
- Configure the OAuth consent screen.
- Create an OAuth Web Client ID and add authorized JavaScript origins, for example `http://localhost:3000` and the production domain.
- Create an API key and restrict it to the same websites if possible.

The app requests `https://www.googleapis.com/auth/drive.file`, which lets it create and manage files the admin explicitly creates or opens with the app. This is intentionally narrower than full Drive access.

### Will Google require approval?

For development and a small internal/admin-only setup, usually no public Google verification is needed. Keep the OAuth app in testing mode and add the admin as a test user.

For a production app used by outside Google accounts, Google may require OAuth app verification. The current scope, `drive.file`, is non-sensitive compared with full Drive scopes, so approval is much easier than requesting broad Drive access. If Google flags the app, you will need to provide the app domain, privacy policy, demo video, and an explanation of why the app needs Drive file access.

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
