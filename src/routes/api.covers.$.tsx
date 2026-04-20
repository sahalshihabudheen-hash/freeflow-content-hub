import { createFileRoute } from "@tanstack/react-router";

const COVERS = "https://uploads.mangadex.org";

async function proxy(splat: string): Promise<Response> {
  const target = `${COVERS}/${splat}`;
  const res = await fetch(target, {
    headers: {
      // MangaDex blocks requests without a Referer matching mangadex.org
      Referer: "https://mangadex.org/",
      "User-Agent": "Mozilla/5.0 JarvisComics/1.0",
    },
  });
  const body = await res.arrayBuffer();
  return new Response(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export const Route = createFileRoute("/api/covers/$")({
  server: {
    handlers: {
      GET: ({ params }: { params: { _splat?: string } }) => proxy(params._splat ?? ""),
    },
  },
} as any);
