import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerProvider from "@/components/ServiceWorkerProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sports App - Find Your Perfect Game",
    template: "%s | Sports App"
  },
  description: "Connect with sports enthusiasts in your area. Discover matches, join games, and never miss an opportunity to play your favorite sport.",
  keywords: ["sports", "games", "matches", "community", "football", "basketball", "tennis", "cricket"],
  authors: [{ name: "Sports App Team" }],
  creator: "Sports App",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sportsapp.com",
    title: "Sports App - Find Your Perfect Game",
    description: "Connect with sports enthusiasts in your area. Discover matches, join games, and never miss an opportunity to play your favorite sport.",
    siteName: "Sports App",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sports App - Find Your Perfect Game",
    description: "Connect with sports enthusiasts in your area. Discover matches, join games, and never miss an opportunity to play your favorite sport.",
    creator: "@sportsapp",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sports App",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerProvider />
        {children}
      </body>
    </html>
  );
}
