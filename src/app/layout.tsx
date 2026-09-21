import type { Metadata } from "next";
import { Inter, Instrument_Serif, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/* Book-style serif for greetings, page titles, and headline numbers. */
const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-newsreader",
  display: "swap",
});

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ITERA — Transaction Management for Real Estate Agents",
  description:
    "Purpose-built transaction management that builds the right checklist automatically and keeps clients informed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${display.variable} ${serif.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
