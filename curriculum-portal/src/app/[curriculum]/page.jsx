import { notFound } from "next/navigation";
import Card from "../../../components/Card";
import CardGrid from "../../../components/CardGrid";
import Breadcrumbs from "../../../components/Breadcrumbs";
import EmptyState from "../../../components/EmptyState";
import LinkButton from "../../../components/LinkButton";
import LessonRow from "../../../components/LessonRow";
import { getCurriculumById } from "../../../lib/data";

export async function generateMetadata({ params }) {
  const { curriculum: curriculumId } = await params;
  const curriculum = await getCurriculumById(curriculumId);
  if (!curriculum) {
    return { title: "Curriculum — Not found" };
  }
  return {
    title: `${curriculum.title} — Competencies`,
    description: `Explore competencies within ${curriculum.title}.`,
  };
}

export default async function CurriculumPage({ params }) {
  const { curriculum: curriculumId } = await params;
  const curriculum = await getCurriculumById(curriculumId);
  if (!curriculum) return notFound();

  const items = [
    { label: "Home", href: "/" },
    { label: curriculum.title },
  ];

  // Curricula can be organized either as Competency → Lessons (K-2, 3-5)
  // or as a flat, developmental Lesson sequence (6-8), where each lesson
  // already carries its own CASEL competency tags. See README "Data model".
  const isLessonSequence = Array.isArray(curriculum.lessons) && curriculum.lessons.length > 0;
  const competencies = curriculum.competencies || [];
  const lessons = curriculum.lessons || [];
  const hasMasterPlan = !!curriculum.masterPlan;
  const hasScenarioCards = !!curriculum.scenarioCards;
  const extras = Array.isArray(curriculum.extras) ? curriculum.extras : [];
  const gradeLabel = curriculum.gradeLabel || curriculum.title.replace(/\s*Curriculum\s*$/i, "").trim();
  const introText = isLessonSequence
    ? `A developmental, lesson-by-lesson sequence for grades ${gradeLabel}. Each lesson integrates multiple CASEL competencies, shown as tags below.`
    : `Explore the core competencies that build essential life skills for students in grades ${gradeLabel}.`;

  return (
    <div className="space-y-8">
      <Breadcrumbs items={items} />

      <section className="section-panel">
        <div className="max-w-4xl">
          <p className="eyebrow">Curriculum track</p>
          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-ink md:text-5xl">{curriculum.title}</h1>
          {curriculum.tagline ? (
            <p className="mt-2 max-w-3xl text-lg font-bold text-annisa-blue-700">{curriculum.tagline}</p>
          ) : null}
          <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-700">
            {introText}
          </p>

          {(hasMasterPlan || hasScenarioCards || extras.length > 0) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {hasMasterPlan && (
                <LinkButton href={curriculum.masterPlan} ariaLabel={`Master Plan for ${curriculum.title}`}>
                  Master plan
                </LinkButton>
              )}
              {hasScenarioCards && (
                <LinkButton href={curriculum.scenarioCards} ariaLabel={`Scenario Cards for ${curriculum.title}`} variant="secondary">
                  Scenario cards
                </LinkButton>
              )}
              {extras.map((ex, idx) => (
                <LinkButton key={idx} variant="chip" href={ex.url} ariaLabel={`${ex.label} for ${curriculum.title}`}>
                  {ex.label}
                </LinkButton>
              ))}
            </div>
          )}
        </div>
      </section>

      {isLessonSequence ? (
        <section>
          <div className="mb-5">
            <p className="eyebrow">Lesson sequence</p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink">Lessons ({lessons.length})</h2>
          </div>
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <LessonRow key={lesson.number} lesson={lesson} />
            ))}
          </div>
        </section>
      ) : (
        <section>
          <div className="mb-5">
            <p className="eyebrow">Classroom skills</p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink">Competencies</h2>
          </div>
          {competencies.length === 0 ? (
            <EmptyState message="No competencies available yet." />
          ) : (
            <CardGrid>
              {competencies.map((comp) => (
                <Card key={comp.id} title={comp.title} description={comp.summary} href={`/${curriculum.id}/${comp.id}`} />
              ))}
            </CardGrid>
          )}
        </section>
      )}
    </div>
  );
} 