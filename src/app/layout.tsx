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
          <div className="mt-auto border-t border-border pt-4">
            <a href="/settings" className="block p-3 rounded-md transition-colors text-secondary hover:bg-accent hover:text-primary flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              <span className="hidden md:inline">Settings</span>
            </a>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-y-auto bg-background">
          {children}
        </main>
      </body>
    </html>
  );
}
