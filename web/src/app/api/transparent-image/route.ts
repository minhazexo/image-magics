import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICE_URL = process.env.BG_REMOVER_URL ?? "http://127.0.0.1:8765";
const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_PROCESSING_MS = 120_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_000;

const FORWARD_FIELDS = [
  "mode",
  "alphaMatting",
  "edgeRefinement",
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

/** Check whether the bg-remover backend is reachable. */
async function isBackendUp(): Promise<boolean> {
  try {
    const res = await fetch(`${SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(3_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET() {
  const healthy = await isBackendUp();
  return NextResponse.json(
    { success: healthy, service: healthy ? "available" : "unavailable" },
    { status: healthy ? 200 : 503 }
  );
}

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

    let res: Response | null = null;
    let lastErr: unknown = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        res = await fetch(`${SERVICE_URL}/transparent-image`, {
          method: "POST",
          body: upstream,
          signal: AbortSignal.timeout(MAX_PROCESSING_MS),
        });
        break;
      } catch (err) {
        lastErr = err;
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
        }
      }
    }

    if (!res) {
      const reason = lastErr instanceof Error ? lastErr.message : String(lastErr);
      return NextResponse.json(
        { success: false, error: `Background removal service is unavailable after ${MAX_RETRIES + 1} attempts (${reason}). Is the bg-remover service running on ${SERVICE_URL}?` },
        { status: 503 }
      );
    }

    if (res.ok) {
      const data = Buffer.from(await res.arrayBuffer());
      const pipeline = res.headers.get("x-pipeline") ?? "unknown";
      const hasAlpha = res.headers.get("x-has-alpha") ?? "true";
      return new NextResponse(data, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Length": String(data.byteLength),
          "X-Has-Alpha": hasAlpha,
          "X-Pipeline": pipeline,
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