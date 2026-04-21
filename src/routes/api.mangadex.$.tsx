import { createFileRoute } from "@tanstack/react-router";

const API = "https://api.mangadex.org";

async function proxy(request: Request, splat: string): Promise<Response> {
  const incoming = new URL(request.url);
  const target = `${API}/${splat}${incoming.search}`;
  const res = await fetch(target, {
    headers: {
      "User-Agent": "Mozilla/5.0 JarvisComics/1.0",
      Accept: "application/json",
    },
  });
  const body = await res.arrayBuffer();
  return new Response(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export const Route = createFileRoute("/api/mangadex/$")({
  server: {
    handlers: {
      GET: ({ request, params }: { request: Request; params: { _splat?: string } }) =>
        proxy(request, params._splat ?? ""),
    },
  },
} as any);
