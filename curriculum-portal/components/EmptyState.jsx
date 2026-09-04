export default function EmptyState({ message, children }) {
  return (
    <div className="surface-card p-10 text-center">
      <p className="text-stone-700">{message}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
} 