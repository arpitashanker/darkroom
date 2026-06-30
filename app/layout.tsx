//build the html document, insert the different components in your react 
import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";  // added Fraunces (a cozy serif)
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// NEW: a warm serif for headings — this is what gives the elegant Sill look
const fraunces = Fraunces({
  variable: "--font-fraunces",    // we'll reference this variable in CSS
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polaroid Diary",                          // updated from the default
  description: "Your cozy photo board",             // updated from the default
};

export default function RootLayout({ //dont touch 
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // added ${fraunces.variable} so the serif is available app-wide
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}