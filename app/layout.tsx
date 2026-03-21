import type { Metadata } from "next";
import { Inter, Noto_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/Analytics";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-noto-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "tickr — AI Investment Research",
  description:
    "Set your investment thesis. Our AI monitors the market and delivers personalized, thesis-aligned trade ideas with cited sources.",
  keywords: [
    "AI investment research",
    "trade ideas",
    "stock market",
    "investment thesis",
    "market analysis",
  ],
  authors: [{ name: "tickr" }],
  openGraph: {
    title: "tickr — Your AI Investment Analyst",
    description:
      "Set your investment thesis. Our AI monitors the market and delivers personalized trade ideas with cited sources.",
    type: "website",
    siteName: "tickr",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "tickr — Your AI Investment Analyst",
    description:
      "Set your investment thesis. Our AI monitors the market and delivers personalized trade ideas with cited sources.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${notoSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Analytics />
        {children}
      </body>
    </html>
  );
}
