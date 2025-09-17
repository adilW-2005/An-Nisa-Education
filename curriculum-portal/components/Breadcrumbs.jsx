import Link from "next/link";

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-600 mb-6">
      <ol className="flex items-center gap-2 flex-wrap">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2">
            {idx > 0 && <span aria-hidden className="text-slate-300">/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-annisa-blue hover:underline focus:outline-none focus:ring-2 focus:ring-annisa-blue rounded">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-annisa-blue-700">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 