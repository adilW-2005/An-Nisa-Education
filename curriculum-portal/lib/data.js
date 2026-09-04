import data from "../data/curricula.json";

const DRIVE_FILE_ID = process.env.NEXT_PUBLIC_CURRICULA_DRIVE_FILE_ID;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

async function getRemoteData() {
  if (!DRIVE_FILE_ID) return null;

  const url = new URL(`https://www.googleapis.com/drive/v3/files/${DRIVE_FILE_ID}`);
  url.searchParams.set("alt", "media");
  if (GOOGLE_API_KEY) {
    url.searchParams.set("key", GOOGLE_API_KEY);
  }

  try {
    const response = await fetch(url, {
      // Admin saves should be visible on the public site immediately.
      cache: "no-store",
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function getCurriculumData() {
  return (await getRemoteData()) || data;
}

export async function getCurricula() {
  const curriculumData = await getCurriculumData();
  return curriculumData.curricula || [];
}

export async function getCurriculumById(curriculumId) {
  const curricula = await getCurricula();
  return curricula.find((c) => c.id === curriculumId) || null;
}

export async function getCompetency(curriculumId, competencyId) {
  const curriculum = await getCurriculumById(curriculumId);
  if (!curriculum) return null;
  const competency = (curriculum.competencies || []).find(
    (comp) => comp.id === competencyId
  );
  return competency || null;
} 