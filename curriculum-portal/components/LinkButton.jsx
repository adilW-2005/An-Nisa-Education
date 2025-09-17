export default function LinkButton({ href, children, variant = "primary", ariaLabel }) {
  const base = "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-annisa-blue transition";
  const styles = {
    primary: `${base} bg-annisa-blue text-white hover:bg-annisa-blue-600 shadow-sm`,
    secondary: `${base} bg-white text-annisa-blue border border-annisa-blue/40 hover:bg-annisa-blue-50`,
    chip: "inline-flex items-center rounded-full px-3 py-1 text-xs bg-slate-100 text-slate-700 border hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-annisa-blue",
  };

  const className = styles[variant] || styles.primary;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </a>
  );
} 