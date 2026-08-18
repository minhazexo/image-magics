import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://imagetools.example.com"),
  title: {
    default: "ImageTools — Free Online Image Optimizer, Compressor & Converter",
    template: "%s | ImageTools",
  },
  description:
    "Optimize, compress, resize, convert, crop and remove backgrounds from images directly in your browser. Privacy-first, free and no uploads.",
  applicationName: "ImageTools",
  keywords: [
    "image optimizer",
    "image compressor",
    "image resizer",
    "image converter",
    "background remover",
    "webp converter",
    "avif converter",
  ],
  openGraph: {
    type: "website",
    siteName: "ImageTools",
    title: "ImageTools — Powerful Image Tools. Simple. Fast. Private.",
    description:
      "Optimize, compress, resize, convert, crop and remove backgrounds from images directly in your browser.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ImageTools — Powerful Image Tools. Simple. Fast. Private.",
    description:
      "Optimize, compress, resize, convert, crop and remove backgrounds from images directly in your browser.",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e14" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <ThemeProvider>
          <ToastProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
            >
              Skip to content
            </a>
            <Header />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}