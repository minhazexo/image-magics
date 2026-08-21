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
      // Stub out browser-only WASM/ONNX packages on the server
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

    // @imgly/background-removal v1.7.0 ships a broken .cjs entry that contains
    // import.meta.url (from ONNX Runtime WASM). SWC cannot parse import.meta in
    // a CommonJS context. Fix: point webpack to the .mjs (ESM) entry for both
    // client and server, and tell webpack not to parse the .cjs at all.
    const imglyMjsPath = path.join(
      __dirname,
      "node_modules",
      "@imgly",
      "background-removal",
      "dist",
      "index.mjs",
    );

    if (!isServer) {
      // Client side: resolve to the .mjs entry (ESM handles import.meta correctly)
      config.resolve.alias = {
        ...config.resolve.alias,
        "@imgly/background-removal": imglyMjsPath,
      };
    }

    // Prevent webpack from parsing the broken .cjs file from @imgly
    // (it contains import.meta in a CJS context which SWC rejects)
    config.module.rules.push({
      test: /node_modules[\\/]@imgly[\\/]background-removal[\\/]dist[\\/]index\.cjs$/,
      type: "javascript/auto",
      resolve: { fullySpecified: false },
    });

    // Also prevent SWC from trying to parse onnxruntime .mjs files
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules[\\/]onnxruntime/,
      type: "javascript/auto",
      resolve: { fullySpecified: false },
    });

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
