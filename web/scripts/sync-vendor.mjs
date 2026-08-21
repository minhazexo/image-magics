import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const vendor = path.join(root, "public", "vendor");

const imglySrc = path.join(root, "node_modules", "@imgly", "background-removal", "dist", "index.mjs");
const ortWasmSrc = path.join(root, "node_modules", "onnxruntime-web", "dist", "ort.bundle.min.mjs");
const ortWebgpuSrc = path.join(root, "node_modules", "onnxruntime-web", "dist", "ort.webgpu.bundle.min.mjs");

const imglyOutDir = path.join(vendor, "imgly");
const ortOutDir = path.join(vendor, "onnxruntime-web");
await mkdir(imglyOutDir, { recursive: true });
await mkdir(ortOutDir, { recursive: true });

let source = await readFile(imglySrc, "utf8");
source = source.replaceAll(
  'import("onnxruntime-web/webgpu")',
  'import("/vendor/onnxruntime-web/ort.webgpu.bundle.min.mjs")',
);
source = source.replaceAll(
  'import("onnxruntime-web")',
  'import("/vendor/onnxruntime-web/ort.bundle.min.mjs")',
);
if (source.includes('import("onnxruntime')) {
  throw new Error("unresolved onnxruntime specifier remains in vendored bundle");
}
await writeFile(path.join(imglyOutDir, "index.mjs"), source);

await copyFile(ortWasmSrc, path.join(ortOutDir, "ort.bundle.min.mjs"));
await copyFile(ortWebgpuSrc, path.join(ortOutDir, "ort.webgpu.bundle.min.mjs"));

console.log("vendored AI runtime -> public/vendor (imgly + onnxruntime-web)");
