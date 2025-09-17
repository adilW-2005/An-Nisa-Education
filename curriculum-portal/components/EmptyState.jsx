export default function EmptyState({ message, children }) {
  return (
    <div className="text-center bg-white rounded-2xl border shadow-sm p-10">
      <p className="text-slate-700">{message}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
} 