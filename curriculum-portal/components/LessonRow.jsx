"use client";

import { useState } from "react";
import LinkButton from "./LinkButton";
import {
  toDocView,
  toDocPDF,
  toSlidesPresent,
  toSlidesEmbed,
  toSlidesPPTX,
  toSlidesPDF,
} from "../lib/googleLinks";

// Native Google Docs/Slides support the docs.google.com edit/view/present
// URL transforms in lib/googleLinks.js. A plain uploaded file sitting on
// Drive (pptx/docx/pdf that was never converted to Google's own format)
// is a different URL shape (drive.google.com/file/d/<id>/view) and those
// transforms would silently produce broken links if applied to it.
function isGoogleDocUrl(url) {
  return /docs\.google\.com\/document\//.test(url || "");
}

function isGoogleSlidesUrl(url) {
  return /docs\.google\.com\/presentation\//.test(url || "");
}

function isDriveFileUrl(url) {
  return /drive\.google\.com\/file\//.test(url || "");
}

function isPdfUrl(url) {
  return /\.pdf($|\?)/i.test(url || "");
}

function toDriveFilePreview(url) {
  return (url || "").replace(/\/(view|edit)(\?.*)?$/, "/preview");
}

export default function LessonRow({ lesson }) {
  const [showPreview, setShowPreview] = useState(false);
  const hasDoc = !!lesson.docUrl;
  const hasSlides = !!lesson.slidesUrl;
  const docIsGoogle = hasDoc && isGoogleDocUrl(lesson.docUrl);
  const docIsDriveFile = hasDoc && isDriveFileUrl(lesson.docUrl);
  const slidesIsGoogle = hasSlides && isGoogleSlidesUrl(lesson.slidesUrl);
  const slidesIsDriveFile = hasSlides && isDriveFileUrl(lesson.slidesUrl);
  const canPreviewDoc = hasDoc && (docIsGoogle || docIsDriveFile || isPdfUrl(lesson.docUrl));
  const canPreviewSlides = hasSlides && (slidesIsGoogle || slidesIsDriveFile);
  const badges = [
    ...(lesson.primaryCompetencies || []),
    ...(lesson.secondaryCompetencies || []),
  ];

  return (
    <div id={`lesson-${lesson.number}`} className="surface-card scroll-mt-28 p-5 transition-shadow hover:shadow-[0_20px_45px_rgba(15,118,110,0.10)] md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-annisa-blue/20 bg-annisa-blue-50 text-sm font-bold text-annisa-blue-700">
              {lesson.number}
            </div>
            <div>
              <p className="eyebrow">Lesson {lesson.number}</p>
              <h4 className="mt-1 text-lg font-bold leading-snug text-ink">
                {lesson.title}
              </h4>
              {(lesson.coreSkill || lesson.duration) && (
                <p className="mt-1 text-sm text-stone-600">
                  {lesson.coreSkill}
                  {lesson.coreSkill && lesson.duration ? " · " : ""}
                  {lesson.duration}
                </p>
              )}
              {badges.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {badges.map((b, idx) => (
                    <span
                      key={idx}
                      className="rounded-full border border-annisa-blue/20 bg-annisa-blue-50 px-2.5 py-0.5 text-xs font-bold text-annisa-blue-700"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasDoc && (
            <LinkButton href={docIsGoogle ? toDocView(lesson.docUrl) : lesson.docUrl} ariaLabel={`Open Lesson Guide for ${lesson.title}`}>
              Lesson guide
            </LinkButton>
          )}
          {hasSlides && (
            <LinkButton href={slidesIsGoogle ? toSlidesPresent(lesson.slidesUrl) : lesson.slidesUrl} ariaLabel={`Open Slides for ${lesson.title}`}>
              Slides
            </LinkButton>
          )}
          {docIsGoogle && (
            <LinkButton variant="chip" href={toDocPDF(lesson.docUrl)} ariaLabel={`Download PDF for ${lesson.title}`}>
              Guide PDF
            </LinkButton>
          )}
          {slidesIsGoogle && (
            <>
              <LinkButton variant="chip" href={toSlidesPDF(lesson.slidesUrl)} ariaLabel={`Download Slides PDF for ${lesson.title}`}>
                Slides PDF
              </LinkButton>
              <LinkButton variant="chip" href={toSlidesPPTX(lesson.slidesUrl)} ariaLabel={`Download PPTX for ${lesson.title}`}>
                PPTX
              </LinkButton>
            </>
          )}
          {Array.isArray(lesson.extras) && lesson.extras.map((ex, idx) => (
            <LinkButton key={idx} variant="chip" href={ex.url} ariaLabel={`${ex.label} for ${lesson.title}`}>
              {ex.label}
            </LinkButton>
          ))}
          {(canPreviewDoc || canPreviewSlides) && (
            <button
              type="button"
              onClick={() => setShowPreview((s) => !s)}
              className="quiet-link ml-auto text-sm font-bold"
              aria-expanded={showPreview}
            >
              {showPreview ? "Hide preview" : "Preview"}
            </button>
          )}
        </div>
      </div>

      {showPreview && (
        <div className="mt-6 space-y-4">
          {canPreviewDoc && (
            <details className="rounded-2xl border border-stone-200 bg-stone-50 p-4" open>
              <summary className="cursor-pointer text-sm font-bold text-ink hover:text-annisa-blue">Lesson guide preview</summary>
              <div className="mt-3 overflow-hidden rounded-lg">
                <iframe
                  title={`Doc preview for ${lesson.title}`}
                  src={
                    docIsGoogle
                      ? toDocView(lesson.docUrl)
                      : docIsDriveFile
                      ? toDriveFilePreview(lesson.docUrl)
                      : lesson.docUrl
                  }
                  className="h-[480px] w-full rounded-lg border border-stone-200 bg-white"
                  loading="lazy"
                />
              </div>
            </details>
          )}
          {canPreviewSlides && (
            <details className="rounded-2xl border border-stone-200 bg-stone-50 p-4" open>
              <summary className="cursor-pointer text-sm font-bold text-ink hover:text-annisa-blue">Slides preview</summary>
              <div className="mt-3 overflow-hidden rounded-lg">
                <iframe
                  title={`Slides preview for ${lesson.title}`}
                  src={slidesIsGoogle ? toSlidesEmbed(lesson.slidesUrl) : toDriveFilePreview(lesson.slidesUrl)}
                  className="h-[480px] w-full rounded-lg border border-stone-200 bg-white"
                  loading="lazy"
                  allowFullScreen
                />
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
} 