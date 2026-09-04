import Link from "next/link";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { getCurricula } from "../../../lib/data";
import Fuse from "fuse.js";

export const metadata = {
  title: "Search — Curriculum Portal",
  description: "Search lessons across curricula.",
};

async function buildIndex() {
  const curricula = await getCurricula();
  const records = [];
  for (const curriculum of curricula) {
    for (const comp of curriculum.competencies || []) {
      for (const lesson of comp.lessons || []) {
        records.push({
          curriculumId: curriculum.id,
          curriculumTitle: curriculum.title,
          competencyId: comp.id,
          competencyTitle: comp.title,
          summary: comp.summary,
          lessonNumber: lesson.number,
          lessonTitle: lesson.title,
        });
      }
    }
    for (const lesson of curriculum.lessons || []) {
      records.push({
        curriculumId: curriculum.id,
        curriculumTitle: curriculum.title,
        competencyId: null,
        competencyTitle: [
          ...(lesson.primaryCompetencies || []),
          ...(lesson.secondaryCompetencies || []),
        ].join(", "),
        summary: lesson.coreSkill,
        lessonNumber: lesson.number,
        lessonTitle: lesson.title,
      });
    }
  }
  return records;
}

export default async function SearchPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const q = (resolvedSearchParams?.q || "").toString();
  const items = [
    { label: "Home", href: "/" },
    { label: "Search" },
  ];

  const dataset = await buildIndex();
  let results = [];
  if (q) {
    const fuse = new Fuse(dataset, {
      includeScore: true,
      ignoreLocation: true,
      threshold: 0.4,
      keys: ["lessonTitle", "competencyTitle", "curriculumTitle", "summary"],
    });
    results = fuse.search(q).slice(0, 25).map((r) => r.item);
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs items={items} />
      
      <section className="section-panel">
        <div className="max-w-4xl">
          <p className="eyebrow">Search</p>
          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-ink md:text-5xl">Find lessons quickly</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-700">
            Find lessons across all curricula by title, competency, or keywords.
          </p>
          <form action="/search" method="GET" role="search" className="mt-6 max-w-2xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search by lesson, skill, or topic"
                className="field-input flex-1"
              />
              <button type="submit" className="btn-primary px-6">
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      <section>
        {!q ? (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-annisa-blue-50">
              <svg className="w-8 h-8 text-annisa-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-stone-600">Enter a search term to find lessons across all curricula.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
              <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.881-6.08-2.33" />
              </svg>
            </div>
            <p className="text-stone-600">No results found for "<strong>{q}</strong>".</p>
            <p className="mt-2 text-sm text-stone-500">Try different keywords or check your spelling.</p>
          </div>
        ) : (
          <div>
            <h2 className="mb-6 text-2xl font-bold tracking-[-0.02em] text-ink">
              Search Results ({results.length})
            </h2>
            <div className="space-y-4">
              {results.map((r, idx) => (
                <div key={idx} className="surface-card p-5 transition-shadow hover:shadow-[0_20px_45px_rgba(15,118,110,0.10)]">
                  <Link
                    href={
                      r.competencyId
                        ? `/${r.curriculumId}/${r.competencyId}#lesson-${r.lessonNumber}`
                        : `/${r.curriculumId}#lesson-${r.lessonNumber}`
                    }
                    className="focus-ring block rounded-2xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-annisa-blue/20 bg-annisa-blue-50 text-sm font-bold text-annisa-blue-700">
                        {r.lessonNumber}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 text-sm font-bold text-annisa-blue-700">
                          {r.curriculumTitle}
                          {r.competencyTitle ? ` → ${r.competencyTitle}` : ""}
                        </div>
                        <h3 className="text-lg font-bold text-ink transition-colors hover:text-annisa-blue-700">
                          {r.lessonTitle}
                        </h3>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
} 