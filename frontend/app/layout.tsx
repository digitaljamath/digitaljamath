import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    default: "Project Mizan | Digital Jamath Management",
    template: "%s | Project Mizan"
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
  authors: [{ name: "Project Mizan Team" }],
  creator: "Project Mizan",
  publisher: "Project Mizan",

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
    siteName: "Project Mizan",
    title: "Project Mizan | Digital Jamath Management",
    description: "Comprehensive mosque and community management platform for memberships, finances, welfare, and community engagement.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Project Mizan - Digital Jamath Management Platform",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Project Mizan | Digital Jamath Management",
    description: "Comprehensive mosque and community management platform for memberships, finances, welfare, and community engagement.",
    images: ["/twitter-image.png"],
    creator: "@projectmizan",
  },

  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  // Manifest for PWA
  manifest: "/manifest.json",

  // App-specific
  applicationName: "Project Mizan",
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
  name: "Project Mizan",
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
    name: "Project Mizan",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
