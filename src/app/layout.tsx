import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/ui/nav";
import { AppProvider } from "@/lib/context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "pecunio2 — 투자 심리 훈련",
  description: "행동경제학 기반 투자 훈련 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-text-primary">
        <AppProvider>
          <Nav />
          <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8">
            {children}
          </main>
          <footer className="pb-6 pt-4 text-center text-[13px] text-text-tertiary">
            pecunio2 — 투자 심리 훈련
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
