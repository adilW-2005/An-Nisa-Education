function normalizeUrl(url) {
  return (url || "").trim();
}

function replacePath(url, patterns, replacement) {
  const u = normalizeUrl(url);
  if (!u) return "";
  let out = u;
  patterns.forEach((pattern) => {
    const regex = new RegExp(pattern);
    out = out.replace(regex, replacement);
  });
  return out;
}

// Docs
export function toDocView(url) {
  return replacePath(url, ["/(edit|view|preview)$"], "/view");
}

export function toDocPDF(url) {
  // Convert to export?format=pdf
  const u = normalizeUrl(url);
  if (!u) return "";
  if (u.includes("/export?format=pdf")) return u;
  return u
    .replace(/\/edit(.*)?$/, "")
    .replace(/\/view(.*)?$/, "")
    .replace(/\/preview(.*)?$/, "")
    .concat("/export?format=pdf");
}

// Slides
export function toSlidesPresent(url) {
  return replacePath(url, ["/(edit|view|preview|present)$"], "/present");
}

export function toSlidesEmbed(url) {
  // For embedding slides
  const u = normalizeUrl(url);
  if (!u) return "";
  const base = u
    .replace(/\/edit(.*)?$/, "")
    .replace(/\/view(.*)?$/, "")
    .replace(/\/preview(.*)?$/, "")
    .replace(/\/present(.*)?$/, "");
  return `${base}/embed`;
}

export function toSlidesPPTX(url) {
  const u = normalizeUrl(url);
  if (!u) return "";
  const base = u
    .replace(/\/edit(.*)?$/, "")
    .replace(/\/view(.*)?$/, "")
    .replace(/\/preview(.*)?$/, "")
    .replace(/\/present(.*)?$/, "");
  return `${base}/export/pptx`;
}

export function toSlidesPDF(url) {
  const u = normalizeUrl(url);
  if (!u) return "";
  const base = u
    .replace(/\/edit(.*)?$/, "")
    .replace(/\/view(.*)?$/, "")
    .replace(/\/preview(.*)?$/, "")
    .replace(/\/present(.*)?$/, "");
  return `${base}/export/pdf`;
} 