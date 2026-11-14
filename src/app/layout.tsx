import type { Metadata } from "next";
import { Chakra_Petch, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const chakra = Chakra_Petch({ variable: "--font-chakra", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")),
  title: "LeftOnTable — claim every dollar your job already promised you",
  description:
    "Upload your benefits guide. AI reads the fine print, checks it against your paycheck, and shows exactly how much money you're leaving on the table — and how to claim it.",
  openGraph: {
    title: "LeftOnTable",
    description: "Find the money your employer already owes you.",
    images: ["/art/hand-laptop.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} ${chakra.variable} antialiased`}>{children}</body>
    </html>
  );
}
