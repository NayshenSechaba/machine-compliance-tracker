import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Ops Gate — Fleet & Site Compliance",
  description: "Pre-start checklists and expiry tracking for South African fleets and sites.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable} font-body antialiased`}>
        <div className="min-h-screen flex flex-col">
          <Nav />
          <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 pb-24 sm:px-6 sm:pb-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
