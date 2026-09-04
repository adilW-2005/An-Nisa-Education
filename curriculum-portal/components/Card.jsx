import Link from "next/link";

export default function Card({ title, description, href, icon }) {
  const Wrapper = href ? Link : "div";
  const wrapperProps = href
    ? { href, className: "group focus-ring block rounded-3xl text-inherit no-underline" }
    : { className: "group" };

  return (
    <Wrapper {...wrapperProps} aria-label={href ? title : undefined}>
      <div className="surface-card relative flex h-full min-h-[180px] overflow-hidden p-7 transition duration-200 group-hover:-translate-y-1 group-hover:border-annisa-blue/30 group-hover:shadow-[0_22px_55px_rgba(15,118,110,0.12)] md:p-8">
        <div className="absolute inset-y-6 left-0 w-1 rounded-r-full bg-annisa-blue/70 opacity-70" aria-hidden></div>
        <div className="flex flex-col justify-between gap-6">
          {icon ? <div className="text-annisa-blue text-3xl" aria-hidden>{icon}</div> : null}
          <div>
            <h3 className="text-2xl font-bold tracking-[-0.02em] text-ink transition-colors group-hover:text-annisa-blue-700 md:text-3xl">{title}</h3>
            {description ? (
              <p className="mt-3 max-w-prose text-base leading-7 text-stone-600">{description}</p>
            ) : null}
          </div>
          {href ? (
            <span className="text-sm font-bold text-annisa-blue-700">
              Open section
            </span>
          ) : null}
        </div>
      </div>
    </Wrapper>
  );
} 