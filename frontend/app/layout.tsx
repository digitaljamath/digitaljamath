import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO Configuration
export const metadata: Metadata = {
  // Basic Meta
  title: {
    default: "DigitalJamath | Modern Masjid Management",
    template: "%s | DigitalJamath"
  },
  description: "Comprehensive mosque and community management platform. Manage memberships, finances (Baitul Maal), welfare (Khidmat), surveys, and more for your Jamath.",
  keywords: [
    "mosque management",
    "masjid software",
    "jamath management",
    "Islamic community software",
    "baitul maal",
    "zakat management",
    "membership management",
    "muslim community",
    "welfare management",
    "digital mosque"
  ],
  authors: [{ name: "DigitalJamath Team" }],
  creator: "DigitalJamath",
  publisher: "DigitalJamath",

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Open Graph (Facebook, LinkedIn, etc.)
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "DigitalJamath",
    title: "DigitalJamath | Digital Jamath Management",
    description: "Comprehensive mosque and community management platform for memberships, finances, welfare, and community engagement.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DigitalJamath - Digital Jamath Management Platform",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "DigitalJamath | Digital Jamath Management",
    description: "Comprehensive mosque and community management platform for memberships, finances, welfare, and community engagement.",
    images: ["/twitter-image.png"],

  },

  // Icons handled automatically by app/icon.png

  // Manifest for PWA
  manifest: "/manifest.json",

  // App-specific
  applicationName: "DigitalJamath",
  category: "Community Management",

  // Verification (add your actual verification codes)
  // verification: {
  //   google: "your-google-verification-code",
  //   yandex: "your-yandex-verification-code",
  // },

  // Alternate Languages (for future i18n)
  alternates: {
    canonical: "/",
    languages: {
      "en-IN": "/en-IN",
      "ar": "/ar",
      "ur": "/ur",
    },
  },
};

// Viewport configuration
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DigitalJamath",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "Comprehensive mosque and community management platform for memberships, finances, welfare, and community engagement.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "150",
  },
  author: {
    "@type": "Organization",
    name: "DigitalJamath",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
