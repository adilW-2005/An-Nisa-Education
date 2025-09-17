import Link from "next/link";

export default function Card({ title, description, href, icon }) {
  const Wrapper = href ? Link : "div";
  const wrapperProps = href
    ? { href, className: "block no-underline text-inherit focus:outline-none focus:ring-2 focus:ring-annisa-blue rounded-3xl group" }
    : { className: "group" };

  return (
    <Wrapper {...wrapperProps} aria-label={href ? title : undefined}>
      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 p-10 md:p-12 h-full overflow-hidden min-h-[200px] flex items-center justify-center">
        <div className="absolute left-0 top-0 h-full w-2 bg-annisa-blue opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-annisa-blue/10 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden></div>
        <div className="relative text-center">
          {icon ? <div className="text-annisa-blue text-3xl mb-4" aria-hidden>{icon}</div> : null}
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 group-hover:text-annisa-blue-700 transition-colors mb-2">{title}</h3>
            {description ? (
              <p className="text-lg text-slate-600 leading-7">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
    </Wrapper>
  );
} 