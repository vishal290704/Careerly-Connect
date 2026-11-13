import type { Metadata } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader" });

export const metadata: Metadata = {
  title: "Applyora — Stop Searching, Start Applying.",
  description: "A calmer way to discover and manage your next opportunity.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${newsreader.variable}`}>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
