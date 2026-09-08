const redirectorOrigin = process.env.RESOURCE_REDIRECTOR_ORIGIN?.replace(/\/+$/, "") ?? "";
const resourceAccessToken = process.env.RESOURCE_ACCESS_TOKEN ?? "";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

function message(status: number, body: string) {
  return Response.json({ message: body }, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function isSafePath(segments: string[]) {
  return segments.length > 0 && segments.every((segment) => (
    segment.length > 0 &&
    segment !== "." &&
    segment !== ".." &&
    !segment.includes("\0") &&
    !segment.includes("\\")
  ));
}

function isTrustedS3Url(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (
      url.hostname === "s3.amazonaws.com" ||
      url.hostname.endsWith(".amazonaws.com")
    );
  } catch {
    return false;
  }
}

function shouldRelayThroughServer(path: string[]) {
  return path.at(-1)?.toLowerCase().endsWith(".json") ?? false;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  if (!isSafePath(path)) return message(404, "Không tìm thấy tài liệu.");
  if (!redirectorOrigin || !resourceAccessToken) {
    return message(503, "Kho tài liệu chưa được cấu hình.");
  }

  const encodedPath = path.map(encodeURIComponent).join("/");
  const upstreamUrl = new URL(`${redirectorOrigin}/resources/${encodedPath}`);
  upstreamUrl.searchParams.set("access", resourceAccessToken);

  try {
    const upstream = await fetch(upstreamUrl, {
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
    });
    const location = upstream.headers.get("location");

    if (upstream.status !== 302 || !location || !isTrustedS3Url(location)) {
      console.error("Resource redirector rejected the request", { status: upstream.status });
      return message(upstream.status === 403 ? 403 : 502, "Chưa thể mở tài liệu.");
    }

    // JSON is consumed by fetch(), so relay these small index files from the
    // same origin. Large PDF/audio assets still redirect straight to S3.
    if (shouldRelayThroughServer(path)) {
      const object = await fetch(location, {
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      });
      if (!object.ok || !object.body) return message(502, "Chưa đọc được danh mục tài liệu.");
      return new Response(object.body, {
        status: 200,
        headers: {
          "cache-control": "public, max-age=60, s-maxage=300",
          "content-type": object.headers.get("content-type") ?? "application/json; charset=utf-8",
          "x-content-type-options": "nosniff",
        },
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        "cache-control": "private, no-store",
        location,
        "referrer-policy": "no-referrer",
      },
    });
  } catch (error) {
    console.error("Resource redirector is unavailable", error);
    return message(502, "Kho tài liệu tạm thời chưa phản hồi.");
  }
}
