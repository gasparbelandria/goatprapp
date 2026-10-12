import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { RootProviders } from "@/components/layout/RootProviders";
import { ToastContainer } from "@/components/ui/Toast";
import { ErrorLoggerInit } from "@/components/ErrorLoggerInit";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  adjustFontFallback: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});


export const metadata: Metadata = {
  icons: {
    icon: "/logo-goat.png",
    apple: "/logo-goat.png",
  },
  title: {
    template: "%s | GOATPR",
    default: "GOATPR | Track Personal Records & Challenge Friends",
  },
  description:
    "Track your personal records, follow your progress, and challenge friends with GOATPR. Your next PR starts here.",
  keywords: [
    "personal record",
    "PR tracker",
    "high school athletics",
    "gym PR",
    "bench press PR",
    "track and field records",
    "athlete leaderboard",
    "school sports",
    "personal best",
    "strength training",
    "sports records",
    "Massachusetts athletics",
  ],
  metadataBase: new URL("https://goatpr.app"),
  openGraph: {
    siteName: "GOATPR",
    type: "website",
    url: "https://goatpr.app",
    title: "GOATPR | Track Personal Records & Challenge Friends",
    description:
      "Track your personal records, follow your progress, and challenge friends with GOATPR. Your next PR starts here.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "GOATPR" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GOATPR | Track Personal Records & Challenge Friends",
    description:
      "Track your personal records, follow your progress, and challenge friends with GOATPR. Your next PR starts here.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <RootProviders>
            <ErrorLoggerInit />
            {children}
            <ToastContainer />
          </RootProviders>
        </ThemeProvider>
        <Script
          src="https://analytics.weblify.me/script.js"
          data-website-id="641105b7-6a44-4361-8ede-c619fd5d03a3"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
