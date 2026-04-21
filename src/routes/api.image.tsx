import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_HOSTS = new Set([
  "uploads.mangadex.org",
  "cmdxd98sb0x3yprd.mangadex.network",
  "cmdxd98sb0x3yprd.mangadex.org",
]);

function isAllowedTarget(target: string): boolean {
  try {
    const url = new URL(target);
    if (url.protocol !== "https:") return false;
    return (
      ALLOWED_HOSTS.has(url.hostname) ||
      url.hostname.endsWith(".mangadex.network") ||
      url.hostname.endsWith(".mangadex.org")
    );
  } catch {
    return false;
  }
}

async function proxy(request: Request): Promise<Response> {
  const incoming = new URL(request.url);
  const target = incoming.searchParams.get("url");

  if (!target || !isAllowedTarget(target)) {
    return new Response("Invalid image URL", {
      status: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const upstream = await fetch(target, {
    headers: {
      Referer: "https://mangadex.org/",
      Origin: "https://mangadex.org",
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "User-Agent": "Mozilla/5.0 JarvisComics/1.0",
    },
  });

  const body = await upstream.arrayBuffer();

  return new Response(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": upstream.ok ? "public, max-age=86400" : "no-store",
    },
  });
}

export const Route = createFileRoute("/api/image")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => proxy(request),
    },
  },
} as any);
