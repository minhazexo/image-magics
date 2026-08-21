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
      // @imgly/background-removal v1.7.0 ships a .cjs entry containing
      // import.meta.url (from ONNX Runtime) — invalid in CJS, SWC rejects it.
      // Fix: tell webpack to prefer the "import" condition in package.json
      // exports, which maps to the .mjs (ESM) entry that handles import.meta
      // correctly. The "..." spreads default condition names so other packages
      // are unaffected.
      config.resolve.conditionNames = [
        "import",
        "module",
        "...",
      ];

      // Also treat .mjs files from these packages as auto (not strict ESM)
      // so webpack bundles them without SWC parse errors
      config.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules[\\/](?:@imgly|onnxruntime)/,
        type: "javascript/auto",
        resolve: { fullySpecified: false },
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
