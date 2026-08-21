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

  // Don't bundle these server-side — they're browser-only WASM packages
  serverExternalPackages: [
    "@imgly/background-removal",
    "onnxruntime-web",
    "onnxruntime-common",
    "onnxruntime-node",
  ],

  // Tree-shake lucide-react properly
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Stub out browser-only WASM/ONNX packages on the server
      // These only run in the browser via dynamic import
      const noopPath = path.join(__dirname, "lib", "noop-ort.js");
      config.resolve.alias = {
        ...config.resolve.alias,
        "@imgly/background-removal": noopPath,
        "onnxruntime-web": noopPath,
        "onnxruntime-common": noopPath,
        "onnxruntime-node": noopPath,
        // Also catch deep imports like onnxruntime-web/webgpu
        "onnxruntime-web/webgpu": noopPath,
        "onnxruntime-web/wasm": noopPath,
        "onnxruntime-web/ort-wasm-simd-threaded": noopPath,
        "onnxruntime-web/ort-wasm-simd-threaded.jsep": noopPath,
      };

      // Ignore .mjs files from node_modules that contain ESM syntax
      // (onnxruntime-web ships .mjs files that SWC can't parse)
      config.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules\/onnxruntime/,
        type: "javascript/auto",
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
