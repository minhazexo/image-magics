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
      const ortBase = path.join(
        __dirname,
        "node_modules",
        "onnxruntime-web",
        "dist",
      );

      const ortCjs = {
        "onnxruntime-web": path.join(ortBase, "ort.min.js"),
        "onnxruntime-web/webgpu": path.join(ortBase, "ort.webgpu.min.js"),
        "onnxruntime-web/wasm": path.join(ortBase, "ort.wasm.min.js"),
        "onnxruntime-web/webgl": path.join(ortBase, "ort.webgl.min.js"),
        "onnxruntime-web/all": path.join(ortBase, "ort.all.min.js"),
      };

      // Custom resolver: use the "beforeResolve" hook which fires before
      // any resolution including exports field lookup.
      config.resolve.plugins = config.resolve.plugins || [];
      config.resolve.plugins.push({
        apply(resolver) {
          resolver
            .getHook("beforeResolve")
            .tapAsync(
              "OnnxCjsResolver",
              (request, resolveContext, callback) => {
                const req =
                  request.request || request.path || request;
                if (typeof req === "string" && ortCjs[req]) {
                  request.request = ortCjs[req];
                }
                callback();
              },
            );
        },
      });

      // Fallback aliases
      config.resolve.alias = {
        ...config.resolve.alias,
        ...ortCjs,
      };

      // These CJS bundles use dynamic require() patterns (e.g. require(var))
      // that webpack can't statically analyze, causing "Critical dependency"
      // warnings. They're pre-bundled — no need to parse their internals.
      // noParse tells webpack to include them as-is without dependency scanning.
      config.module.noParse = [
        ...(config.module.noParse || []),
        /node_modules[\\/]onnxruntime-web[\\/]dist[\\/]ort[\\w.]*\.js$/,
      ];
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
