import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center space-y-6 py-16">
      <div className="w-16 h-16 mx-auto rounded-full bg-annisa-blue/10 flex items-center justify-center">
        <span className="text-2xl text-annisa-blue">404</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Page not found</h1>
        <p className="text-slate-600">We couldn't find the page you're looking for.</p>
      </div>
      <Link href="/" className="inline-block rounded-full bg-annisa-blue text-white px-6 py-3 hover:bg-annisa-blue-600 focus:outline-none focus:ring-2 focus:ring-annisa-blue transition">
        Go back home
      </Link>
    </div>
  );
} 