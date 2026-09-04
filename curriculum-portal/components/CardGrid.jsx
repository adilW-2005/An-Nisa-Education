export default function CardGrid({ children }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:gap-6">
      {children}
    </div>
  );
} 