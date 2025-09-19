import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-annisa-blue-50 text-slate-900`}>
        <div className="h-2 w-full bg-annisa-blue" aria-hidden></div>
        <header className="border-b bg-gradient-to-r from-annisa-blue-100 to-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 no-underline text-inherit focus:outline-none focus:ring-2 focus:ring-annisa-blue rounded-full">
              <Image src="/brand/logo.svg" alt="AnNisa Education" width={120} height={32} />
            </Link>
            <form action="/search" method="GET" className="ml-auto hidden md:block" role="search" aria-label="Search lessons">
              <input
                type="search"
                name="q"
                placeholder="Search lessons"
                className="w-64 rounded-full border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-annisa-blue"
              />
            </form>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-10">
          {children}
        </main>
        <footer className="mt-12 border-t bg-annisa-blue text-white">
          <div className="mx-auto max-w-7xl px-4 py-8 text-center">
            <p className="text-annisa-blue-100">© {new Date().getFullYear()} AnNisa Education</p>
            <p className="text-sm mt-2 text-annisa-blue-100">Empowering communities through education and support.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
