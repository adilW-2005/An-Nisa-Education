import Card from "../../components/Card";
import CardGrid from "../../components/CardGrid";
import { getCurricula } from "../../lib/data";

export const metadata = {
  title: "Curriculum Portal",
  description: "Choose a curriculum to explore competencies and lessons.",
};

export default function Home() {
  const curricula = getCurricula();

  return (
    <div className="space-y-12">
      <section className="bg-gradient-to-br from-annisa-blue to-annisa-blue-600 text-white rounded-2xl p-6 md:p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-3">Curriculum Portal</h1>
          <p className="text-annisa-blue-100 mb-4">
            Explore competencies and lessons from AnNisa Education curricula.
          </p>
          <form action="/search" method="GET" aria-label="Search lessons">
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="search"
                name="q"
                placeholder="Search lessons..."
                className="flex-1 rounded-full border-0 bg-white/90 backdrop-blur px-4 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button type="submit" className="rounded-full bg-white text-annisa-blue px-4 py-2 text-sm font-medium hover:bg-annisa-blue-50 focus:outline-none focus:ring-2 focus:ring-white/50 transition">
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Choose Your Curriculum</h2>
        <CardGrid>
          {curricula.map((c) => (
            <Card key={c.id} title={c.title} description={undefined} href={`/${c.id}`} />
          ))}
        </CardGrid>
      </section>
    </div>
  );
}
