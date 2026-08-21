import { fileURLToPath } from "url";
import path from "path";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  generateEtags: true,

  // Let Next.js properly transpile @imgly/background-removal.
  // Do NOT include onnxruntime-web here — transpilePackages runs SWC on
  // the package files, and SWC can't handle import.meta in .mjs files.
  transpilePackages: ["@imgly/background-removal"],

  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Server side: stub out browser-only WASM/ONNX packages
      const noopPath = path.join(__dirname, "lib", "noop-ort.js");
      config.resolve.alias = {
        ...config.resolve.alias,
        "@imgly/background-removal": noopPath,
        "onnxruntime-web": noopPath,
        "onnxruntime-common": noopPath,
        "onnxruntime-node": noopPath,
        "onnxruntime-web/webgpu": noopPath,
        "onnxruntime-web/wasm": noopPath,
        "onnxruntime-web/ort-wasm-simd-threaded": noopPath,
        "onnxruntime-web/ort-wasm-simd-threaded.jsep": noopPath,
      };
    }

    if (!isServer) {
      // onnxruntime-web .mjs files contain import.meta (valid ESM) but
      // webpack's default "javascript/auto" makes SWC treat them as CJS
      // → "'import.meta' cannot be used outside of module code".
      // Fix: explicitly mark them as ESM so SWC handles them correctly.
      // The resulting "Critical dependency" warnings are harmless — they
      // don't break the build or runtime.
      config.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules[\\/]onnxruntime-web/,
        type: "javascript/esm",
      });
    }

    return config;
  },

  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|woff|woff2|ttf|eot)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
