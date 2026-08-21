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

  // Let Next.js properly transpile these packages so webpack
  // handles their ESM/CJS modules correctly.
  transpilePackages: ["@imgly/background-removal", "onnxruntime-web"],

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
      // onnxruntime-web's .mjs files use import.meta which webpack
      // treats as invalid in default mode. transpilePackages above
      // handles most of it, but we also need noParse for the pre-bundled
      // .min.mjs files to skip SWC parsing (they're self-contained).
      config.module.rules.push({
        test: /\.min\.mjs$/,
        include: /node_modules[\\/]onnxruntime-web/,
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
