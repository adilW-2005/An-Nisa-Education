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

export default function LessonRow({ lesson }) {
  const [showPreview, setShowPreview] = useState(false);
  const hasDoc = !!lesson.docUrl;
  const hasSlides = !!lesson.slidesUrl;

  return (
    <div id={`lesson-${lesson.number}`} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-annisa-blue text-white text-sm font-semibold flex items-center justify-center">
              {lesson.number}
            </div>
            <h4 className="text-lg font-semibold text-slate-900">
              {lesson.title}
            </h4>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasDoc && (
            <LinkButton href={toDocView(lesson.docUrl)} ariaLabel={`Open Lesson Guide for ${lesson.title}`}>
              Open Lesson Guide (Doc)
            </LinkButton>
          )}
          {hasSlides && (
            <LinkButton href={toSlidesPresent(lesson.slidesUrl)} ariaLabel={`Open Slides for ${lesson.title}`}>
              Open Slides
            </LinkButton>
          )}
          {hasDoc && (
            <LinkButton variant="chip" href={toDocPDF(lesson.docUrl)} ariaLabel={`Download PDF for ${lesson.title}`}>
              Download PDF (Doc)
            </LinkButton>
          )}
          {hasSlides && (
            <>
              <LinkButton variant="chip" href={toSlidesPDF(lesson.slidesUrl)} ariaLabel={`Download Slides PDF for ${lesson.title}`}>
                Download PDF (Slides)
              </LinkButton>
              <LinkButton variant="chip" href={toSlidesPPTX(lesson.slidesUrl)} ariaLabel={`Download PPTX for ${lesson.title}`}>
                Download PPTX (Slides)
              </LinkButton>
            </>
          )}
          {Array.isArray(lesson.extras) && lesson.extras.map((ex, idx) => (
            <LinkButton key={idx} variant="chip" href={ex.url} ariaLabel={`${ex.label} for ${lesson.title}`}>
              {ex.label}
            </LinkButton>
          ))}
          {(hasDoc || hasSlides) && (
            <button
              type="button"
              onClick={() => setShowPreview((s) => !s)}
              className="ml-auto text-sm text-annisa-blue underline underline-offset-4 hover:text-annisa-blue-700 focus:outline-none focus:ring-2 focus:ring-annisa-blue rounded"
              aria-expanded={showPreview}
            >
              {showPreview ? "Hide Preview" : "Preview"}
            </button>
          )}
        </div>
      </div>

      {showPreview && (
        <div className="mt-6 space-y-4">
          {hasDoc && (
            <details className="bg-annisa-blue-50 rounded-xl border border-annisa-blue/20 p-4" open>
              <summary className="cursor-pointer text-sm font-medium text-annisa-blue-700 hover:text-annisa-blue">Lesson Guide Preview</summary>
              <div className="mt-3 overflow-hidden rounded-lg">
                <iframe
                  title={`Doc preview for ${lesson.title}`}
                  src={toDocView(lesson.docUrl)}
                  className="w-full h-[480px] bg-white border border-slate-200 rounded-lg"
                  loading="lazy"
                />
              </div>
            </details>
          )}
          {hasSlides && (
            <details className="bg-annisa-blue-50 rounded-xl border border-annisa-blue/20 p-4" open>
              <summary className="cursor-pointer text-sm font-medium text-annisa-blue-700 hover:text-annisa-blue">Slides Preview</summary>
              <div className="mt-3 overflow-hidden rounded-lg">
                <iframe
                  title={`Slides preview for ${lesson.title}`}
                  src={toSlidesEmbed(lesson.slidesUrl)}
                  className="w-full h-[480px] bg-white border border-slate-200 rounded-lg"
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