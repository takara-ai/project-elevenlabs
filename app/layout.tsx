import type { Metadata } from "next";
import { Geist, Geist_Mono, Young_Serif } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const youngSerif = Young_Serif({
  variable: "--font-young-serif",
  weight: ["400"],
  subsets: ["latin"],
});

const blackVesper = localFont({
  src: "./black-vesper.ttf",
  variable: "--font-black-vesper",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hanashi",
  description: "Hanashi means 'story' in Japanese.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full w-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${youngSerif.variable} ${blackVesper.variable} antialiased dark h-full w-full`}
      >
        {children}
      </body>
    </html>
  );
}
