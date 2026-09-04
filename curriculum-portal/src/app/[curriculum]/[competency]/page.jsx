import { notFound } from "next/navigation";
import Breadcrumbs from "../../../../components/Breadcrumbs";
import LessonRow from "../../../../components/LessonRow";
import LinkButton from "../../../../components/LinkButton";
import { getCurriculumById, getCompetency } from "../../../../lib/data";

export async function generateMetadata({ params }) {
  const { curriculum: curriculumId, competency: competencyId } = await params;
  const curriculum = await getCurriculumById(curriculumId);
  const competency = await getCompetency(curriculumId, competencyId);
  if (!curriculum || !competency) return { title: "Not found" };
  return {
    title: `${competency.title} — ${curriculum.title}`,
    description: competency.summary,
  };
}

export default async function CompetencyPage({ params }) {
  const { curriculum: curriculumId, competency: competencyId } = await params;
  const curriculum = await getCurriculumById(curriculumId);
  const competency = await getCompetency(curriculumId, competencyId);
  if (!curriculum || !competency) return notFound();

  const items = [
    { label: "Home", href: "/" },
    { label: curriculum.title, href: `/${curriculum.id}` },
    { label: competency.title },
  ];

  const lessons = competency.lessons || [];
  const hasParentLetter = !!competency.parentLetter;
  const hasMaterialsList = !!competency.materialsList;

  return (
    <div className="space-y-8">
      <Breadcrumbs items={items} />
      
      <section className="section-panel">
        <div className="max-w-4xl">
          <div className="mb-4 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-annisa-blue/20 bg-annisa-blue-50 text-lg font-bold text-annisa-blue-700">
              {competency.id.charAt(competency.id.length - 1)}
            </div>
            <div>
              <p className="eyebrow">{curriculum.title}</p>
              <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] text-ink md:text-5xl">{competency.title}</h1>
            </div>
          </div>
          {competency.summary ? (
            <p className="max-w-3xl text-lg leading-8 text-stone-700">{competency.summary}</p>
          ) : null}
          
          {(hasParentLetter || hasMaterialsList) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {hasParentLetter && (
                <LinkButton href={competency.parentLetter} ariaLabel={`Parent Letter for ${competency.title}`}>
                  Parent letter
                </LinkButton>
              )}
              {hasMaterialsList && (
                <LinkButton href={competency.materialsList} ariaLabel={`Materials List for ${competency.title}`} variant="secondary">
                  Materials list
                </LinkButton>
              )}
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="eyebrow">Teach this competency</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink">Lessons ({lessons.length})</h2>
        </div>
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <LessonRow key={lesson.number} lesson={lesson} />
          ))}
        </div>
      </section>
    </div>
  );
} 