import { fileURLToPath } from "url";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  generateEtags: true,

  // Tree-shake lucide-react properly
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Stub out browser-only WASM/ONNX packages on the server
      // These only run in the browser via dynamic import
      const noopPath = path.resolve(__dirname, "lib/noop-ort.js");
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
