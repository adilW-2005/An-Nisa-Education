import Link from "next/link";

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-stone-600">
      <ol className="flex items-center gap-2 flex-wrap">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2">
            {idx > 0 && <span aria-hidden className="text-stone-300">/</span>}
            {item.href ? (
              <Link href={item.href} className="quiet-link">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-bold text-ink">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 