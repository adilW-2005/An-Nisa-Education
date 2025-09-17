import { notFound } from "next/navigation";
import Breadcrumbs from "../../../../components/Breadcrumbs";
import LessonRow from "../../../../components/LessonRow";
import LinkButton from "../../../../components/LinkButton";
import { getCurriculumById, getCompetency } from "../../../../lib/data";

export async function generateMetadata({ params }) {
  const { curriculum: curriculumId, competency: competencyId } = await params;
  const curriculum = getCurriculumById(curriculumId);
  const competency = getCompetency(curriculumId, competencyId);
  if (!curriculum || !competency) return { title: "Not found" };
  return {
    title: `${competency.title} — ${curriculum.title}`,
    description: competency.summary,
  };
}

export default async function CompetencyPage({ params }) {
  const { curriculum: curriculumId, competency: competencyId } = await params;
  const curriculum = getCurriculumById(curriculumId);
  const competency = getCompetency(curriculumId, competencyId);
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
      
      <section className="bg-gradient-to-br from-annisa-blue/10 to-annisa-blue/5 rounded-2xl p-8 md:p-12">
        <div className="max-w-4xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-annisa-blue text-white flex items-center justify-center font-semibold">
              {competency.id.charAt(competency.id.length - 1)}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{competency.title}</h1>
            </div>
          </div>
          {competency.summary ? (
            <p className="text-lg text-slate-600 mb-6">{competency.summary}</p>
          ) : null}
          
          {(hasParentLetter || hasMaterialsList) && (
            <div className="flex flex-wrap gap-3">
              {hasParentLetter && (
                <LinkButton href={competency.parentLetter} ariaLabel={`Parent Letter for ${competency.title}`}>
                  📧 Parent Letter
                </LinkButton>
              )}
              {hasMaterialsList && (
                <LinkButton href={competency.materialsList} ariaLabel={`Materials List for ${competency.title}`}>
                  📝 Materials List
                </LinkButton>
              )}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Lessons ({lessons.length})</h2>
        <div className="space-y-6">
          {lessons.map((lesson) => (
            <LessonRow key={lesson.number} lesson={lesson} />
          ))}
        </div>
      </section>
    </div>
  );
} 