import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ClientOnly } from "@/components/providers/client-only";
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
    icon: "/favicon.png",
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

/**
 * Suppress the "message channel closed" error from browser extensions.
 *
 * This happens when a browser extension (password manager, ad blocker,
 * etc.) registers a chrome.runtime.onMessage listener that returns true
 * for async responses. When the page reloads, navigates, or the worker
 * terminates, the extension's message channel closes before it can
 * respond — producing an uncaught promise rejection.
 *
 * This script runs before React to catch these errors globally.
 */
const SUPPRESS_EXTENSION_ERRORS = `
  (function() {
    window.addEventListener('unhandledrejection', function(e) {
      var msg = String(e.reason && e.reason.message ? e.reason.message : e.reason || '');
      if (
        msg.indexOf('message channel closed') !== -1 ||
        msg.indexOf('asynchronous response') !== -1 ||
        msg.indexOf('response was not received') !== -1 ||
        msg.indexOf('A listener indicated') !== -1
      ) {
        e.preventDefault();
      }
    });
    window.addEventListener('error', function(e) {
      var msg = String(e.message || e.filename || '');
      if (
        msg.indexOf('message channel closed') !== -1 ||
        msg.indexOf('asynchronous response') !== -1 ||
        msg.indexOf('response was not received') !== -1
      ) {
        e.preventDefault();
        return false;
      }
    });
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="suppress-extension-errors"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: SUPPRESS_EXTENSION_ERRORS }}
        />
      </head>
      <body className={`${inter.className} flex min-h-screen flex-col`} suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
            >
              Skip to content
            </a>
            <ClientOnly>
              <Header />
            </ClientOnly>
            <main id="main" className="flex-1">
              {children}
            </main>
            <ClientOnly>
              <Footer />
            </ClientOnly>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
