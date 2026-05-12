import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Atelier - Lyric App",
  description: "A tool for lyricists",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${notoSansJP.variable} bg-background text-primary font-sans antialiased h-screen w-screen overflow-hidden flex`}>
        {/* Left Navigation */}
        <nav className="w-20 md:w-64 h-full border-r border-border bg-surface flex flex-col py-6 px-4 shrink-0">
          <div className="font-bold text-2xl mb-12 hidden md:block text-primary">Atelier</div>
          <div className="font-bold text-2xl mb-12 block md:hidden text-center text-primary">A</div>
          
          <ul className="space-y-2 flex-1">
            <li>
              <a href="/analyze" className="block p-3 rounded-md transition-colors text-secondary hover:bg-accent hover:text-primary">
                Analyze
              </a>
            </li>
            <li>
              <a href="/stock" className="block p-3 rounded-md transition-colors text-secondary hover:bg-accent hover:text-primary">
                Stock
              </a>
            </li>
            <li>
              <a href="/write" className="block p-3 rounded-md transition-colors text-secondary hover:bg-accent hover:text-primary">
                Write
              </a>
            </li>
          </ul>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-y-auto bg-background">
          {children}
        </main>
      </body>
    </html>
  );
}
