import type { Metadata } from "next";
import { Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "ReMe",
  description: "A tool for lyricists",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${zenKakuGothicNew.variable} bg-background text-primary font-sans antialiased h-screen w-screen overflow-hidden flex`}>
        <Navigation />
        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-y-auto bg-background">
          {children}
        </main>
      </body>
    </html>
  );
}
