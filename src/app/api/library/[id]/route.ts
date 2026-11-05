import { getItem } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await getItem(id);
  if (!item) {
    return Response.json({ error: "No item with that id." }, { status: 404, headers: { "cache-control": "no-store" } });
  }
  return Response.json({ item }, { headers: { "cache-control": "no-store" } });
}
