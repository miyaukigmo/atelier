import type { Metadata } from "next";
import { Klee_One } from "next/font/google";
import "./globals.css";
import ClientPanelLayout from "@/components/ClientPanelLayout";

const kleeOne = Klee_One({
  variable: "--font-klee",
  subsets: ["latin"],
  weight: ["400", "600"],
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
      <body className={`${kleeOne.variable} bg-background text-primary font-sans antialiased h-screen w-screen overflow-hidden`}>
        <ClientPanelLayout>
          {children}
        </ClientPanelLayout>
      </body>
    </html>
  );
}
