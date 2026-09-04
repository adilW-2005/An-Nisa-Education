import Card from "../../components/Card";
import CardGrid from "../../components/CardGrid";
import { getCurricula } from "../../lib/data";
import LinkButton from "../../components/LinkButton";

export const metadata = {
  title: "Cultivating Character - A K–8 SEL Curriculum",
  description: "Calm minds, kind hearts, wise choices. Choose a curriculum to explore competencies and lessons.",
};

export default async function Home() {
  const curricula = await getCurricula();
  const competencyCount = curricula.reduce(
    (total, curriculum) => total + (curriculum.competencies || []).length,
    0
  );
  const lessonCount = curricula.reduce(
    (total, curriculum) =>
      total +
      (curriculum.lessons || []).length +
      (curriculum.competencies || []).reduce(
        (sum, competency) => sum + (competency.lessons || []).length,
        0
      ),
    0
  );

  return (
    <div className="space-y-10">
      <section className="section-panel overflow-hidden">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="eyebrow">K-8 Social-Emotional Learning</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-[-0.04em] text-ink md:text-6xl">
              Cultivating Character
            </h1>
            <p className="mt-4 text-xl leading-8 text-stone-700">
              Calm minds, kind hearts, wise choices. Find the lesson, handout,
              or classroom resource you need without digging through folders.
            </p>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-ink">{curricula.length}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Tracks</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">{competencyCount}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Skills</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">{lessonCount}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Lessons</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 max-w-2xl">
          <form action="/search" method="GET" aria-label="Search lessons">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                name="q"
                placeholder="Search by lesson, skill, or topic"
                className="field-input flex-1"
              />
              <button type="submit" className="btn-primary">
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="surface-card p-6">
          <p className="eyebrow">Printable resources</p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-ink">Ready-to-print skill and value guides</h2>
          <div className="mt-5 flex flex-wrap gap-3">
          <LinkButton href="/docs/Skills.pdf" ariaLabel="Open Skills PDF for printing">
            Skills PDF
          </LinkButton>
          <LinkButton href="/docs/Values.pdf" ariaLabel="Open Values PDF for printing" variant="secondary">
            Values PDF
          </LinkButton>
          </div>
        </div>
        <div className="surface-card p-6">
          <p className="eyebrow">Teacher training</p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-ink">Start with the training deck</h2>
          <div className="mt-5">
          <LinkButton 
            href="https://docs.google.com/presentation/d/1t9uJo8m4l1PG06DxPCyx0SrgBK8cjZI-eZX-Ys1gMRQ/edit?usp=sharing" 
            ariaLabel="Open Teacher Training presentation"
          >
            Training slides
          </LinkButton>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="eyebrow">Choose a track</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink">Curriculum paths</h2>
        </div>
        <CardGrid>
          {curricula.map((c) => (
            <Card key={c.id} title={c.title} description={undefined} href={`/${c.id}`} />
          ))}
        </CardGrid>
      </section>
    </div>
  );
}
