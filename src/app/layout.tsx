import type { Metadata } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { RouteProgress } from "@/components/route-progress";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader" });

export const metadata: Metadata = {
  title: "Applyora — Stop Searching, Start Applying.",
  description: "A calmer way to discover and manage your next opportunity.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${newsreader.variable}`}>
        <RouteProgress />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
