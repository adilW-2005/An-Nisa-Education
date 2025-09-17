import data from "../data/curricula.json";

export function getCurricula() {
  return data.curricula || [];
}

export function getCurriculumById(curriculumId) {
  const curricula = getCurricula();
  return curricula.find((c) => c.id === curriculumId) || null;
}

export function getCompetency(curriculumId, competencyId) {
  const curriculum = getCurriculumById(curriculumId);
  if (!curriculum) return null;
  const competency = (curriculum.competencies || []).find(
    (comp) => comp.id === competencyId
  );
  return competency || null;
} 