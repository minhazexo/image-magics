import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICE_URL = process.env.BG_REMOVER_URL ?? "http://127.0.0.1:8765";
const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_PROCESSING_MS = 120_000;

const FORWARD_FIELDS = [
  "mode",
  "alphaMatting",
  "alphaMattingForegroundThreshold",
  "alphaMattingBackgroundThreshold",
  "alphaMattingErodeSize",
  "trimTransparent",
  "outputFormat",
  "colorTolerance",
  "colorR",
  "colorG",
  "colorB",
] as const;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const image = form.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json({ success: false, error: "Missing 'image' file field." }, { status: 400 });
    }
    if (image.size === 0) {
      return NextResponse.json({ success: false, error: "Empty image upload." }, { status: 400 });
    }
    if (image.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ success: false, error: "Image exceeds the 25 MB limit." }, { status: 400 });
    }

    const upstream = new FormData();
    upstream.set("image", image, image.name);
    for (const field of FORWARD_FIELDS) {
      const value = form.get(field);
      if (typeof value === "string" && value.length > 0) upstream.set(field, value);
    }

    let res: Response;
    try {
      res = await fetch(`${SERVICE_URL}/transparent-image`, {
        method: "POST",
        body: upstream,
        signal: AbortSignal.timeout(MAX_PROCESSING_MS),
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { success: false, error: `Background removal service is unavailable (${reason}). Is the bg-remover service running?` },
        { status: 503 }
      );
    }

    if (res.ok) {
      const data = Buffer.from(await res.arrayBuffer());
      return new NextResponse(data, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Length": String(data.byteLength),
          "X-Has-Alpha": "true",
          "Cache-Control": "no-store",
        },
      });
    }

    let detail = `Upstream error ${res.status}.`;
    try {
      const json = (await res.json()) as { detail?: string; error?: string };
      detail = json.detail ?? json.error ?? detail;
    } catch {
      // non-JSON error body; keep default detail
    }
    return NextResponse.json({ success: false, error: detail }, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unexpected error." },
      { status: 500 }
    );
  }
}