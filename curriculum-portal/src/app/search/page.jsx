import Link from "next/link";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { getCurricula } from "../../../lib/data";
import Fuse from "fuse.js";

export const metadata = {
  title: "Search — Curriculum Portal",
  description: "Search lessons across curricula.",
};

function buildIndex() {
  const curricula = getCurricula();
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
  }
  return records;
}

export default function SearchPage({ searchParams }) {
  const q = (searchParams?.q || "").toString();
  const items = [
    { label: "Home", href: "/" },
    { label: "Search" },
  ];

  const dataset = buildIndex();
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
      
      <section className="bg-gradient-to-br from-annisa-blue/10 to-annisa-blue/5 rounded-2xl p-8 md:p-12">
        <div className="max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Search Lessons</h1>
          <p className="text-lg text-slate-600 mb-6">
            Find lessons across all curricula by title, competency, or keywords.
          </p>
          <form action="/search" method="GET" role="search" className="max-w-2xl">
            <div className="flex items-center gap-3">
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search lessons..."
                className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-annisa-blue focus:border-annisa-blue"
              />
              <button type="submit" className="rounded-full bg-annisa-blue text-white px-6 py-3 text-sm font-medium hover:bg-annisa-blue-600 focus:outline-none focus:ring-2 focus:ring-annisa-blue transition">
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      <section>
        {!q ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-annisa-blue/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-annisa-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-slate-600">Enter a search term to find lessons across all curricula.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.881-6.08-2.33" />
              </svg>
            </div>
            <p className="text-slate-600">No results found for "<strong>{q}</strong>".</p>
            <p className="text-sm text-slate-500 mt-2">Try different keywords or check your spelling.</p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">
              Search Results ({results.length})
            </h2>
            <div className="space-y-4">
              {results.map((r, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <Link
                    href={`/${r.curriculumId}/${r.competencyId}#lesson-${r.lessonNumber}`}
                    className="block focus:outline-none focus:ring-2 focus:ring-annisa-blue rounded"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-annisa-blue text-white text-sm font-semibold flex items-center justify-center flex-shrink-0">
                        {r.lessonNumber}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-annisa-blue font-medium mb-1">
                          {r.curriculumTitle} → {r.competencyTitle}
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 hover:text-annisa-blue-700 transition-colors">
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