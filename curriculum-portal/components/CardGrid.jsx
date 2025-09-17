export default function CardGrid({ children }) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:gap-10">
      {children}
    </div>
  );
} 