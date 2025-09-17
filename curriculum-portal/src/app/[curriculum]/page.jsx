import { notFound } from "next/navigation";
import Card from "../../../components/Card";
import CardGrid from "../../../components/CardGrid";
import Breadcrumbs from "../../../components/Breadcrumbs";
import EmptyState from "../../../components/EmptyState";
import LinkButton from "../../../components/LinkButton";
import { getCurriculumById } from "../../../lib/data";

export async function generateMetadata({ params }) {
  const { curriculum: curriculumId } = await params;
  const curriculum = getCurriculumById(curriculumId);
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
  const curriculum = getCurriculumById(curriculumId);
  if (!curriculum) return notFound();

  const items = [
    { label: "Home", href: "/" },
    { label: curriculum.title },
  ];

  const competencies = curriculum.competencies || [];
  const hasMasterPlan = !!curriculum.masterPlan;
  const hasScenarioCards = !!curriculum.scenarioCards;

  return (
    <div className="space-y-8">
      <Breadcrumbs items={items} />
      
      <section className="bg-gradient-to-br from-annisa-blue/10 to-annisa-blue/5 rounded-2xl p-8 md:p-12">
        <div className="max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{curriculum.title}</h1>
          <p className="text-lg text-slate-600 mb-6">
            Explore the core competencies that build essential life skills for students in grades {curriculum.id === 'k-2' ? 'K–2' : '3–5'}.
          </p>
          
          {(hasMasterPlan || hasScenarioCards) && (
            <div className="flex flex-wrap gap-3">
              {hasMasterPlan && (
                <LinkButton href={curriculum.masterPlan} ariaLabel={`Master Plan for ${curriculum.title}`}>
                  📋 Master Plan
                </LinkButton>
              )}
              {hasScenarioCards && (
                <LinkButton href={curriculum.scenarioCards} ariaLabel={`Scenario Cards for ${curriculum.title}`}>
                  🎯 Scenario Cards
                </LinkButton>
              )}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Competencies</h2>
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
    </div>
  );
} 