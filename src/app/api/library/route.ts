import { familyBySlug } from "@/lib/families";
import { libraryPayload } from "@/lib/mcp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const family = new URL(request.url).searchParams.get("family");
  if (family && !familyBySlug(family)) {
    return Response.json({ error: "Unknown family." }, { status: 400, headers: { "cache-control": "no-store" } });
  }
  return Response.json(await libraryPayload(family), { headers: { "cache-control": "no-store" } });
}
