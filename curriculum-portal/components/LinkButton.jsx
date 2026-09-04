export default function LinkButton({ href, children, variant = "primary", ariaLabel }) {
  const styles = {
    primary: "btn-primary gap-2",
    secondary: "btn-secondary gap-2",
    chip: "btn-chip",
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