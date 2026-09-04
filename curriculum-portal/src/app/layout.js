import { Atkinson_Hyperlegible, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Cultivating Character - A K–5 SEL Curriculum",
  description: "Calm minds, kind hearts, wise choices. Explore competencies and lessons across our K-5 Social-Emotional Learning curriculum.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${atkinson.variable} ${geistMono.variable} bg-cream font-[var(--font-atkinson)] antialiased text-ink`}>
        <header className="sticky top-0 z-20 border-b border-annisa-blue/25 bg-white/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 md:px-6">
            <Link href="/" className="focus-ring flex items-center gap-3 rounded-full no-underline text-inherit">
              <Image src="/brand/logo.svg" alt="AnNisa Education" width={120} height={32} />
            </Link>
            <nav className="ml-auto flex items-center gap-2">
              <Link href="/" className="btn-secondary hidden px-3 py-2 sm:inline-flex">
                Curriculum
              </Link>
              <Link href="/admin" className="btn-primary px-3 py-2">
                Admin
              </Link>
            </nav>
            <form action="/search" method="GET" className="order-last w-full md:order-none md:ml-2 md:w-auto" role="search" aria-label="Search lessons">
              <input
                type="search"
                name="q"
                placeholder="Search lessons"
                className="field-input w-full py-2 md:w-64"
              />
            </form>
          </div>
        </header>
        <main className="page-shell">
          {children}
        </main>
        <footer className="mt-8 bg-annisa-blue text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-annisa-blue-50 md:flex-row md:items-center md:justify-between md:px-6">
            <p>© {new Date().getFullYear()} AnNisa Education</p>
            <p>Clear SEL resources for classrooms and families.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
