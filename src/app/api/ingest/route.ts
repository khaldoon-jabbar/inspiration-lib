import { randomUUID } from "node:crypto";
import { categorize } from "@/lib/ai";
import { readPublicPage } from "@/lib/extract";
import { imageSize, placeholderSvg } from "@/lib/image";
import { familyLabel } from "@/lib/families";
import { addItem, saveImage } from "@/lib/store";
import type { LibraryItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { url?: unknown; note?: unknown } | null;
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const note = typeof body?.note === "string" ? body.note.slice(0, 1000) : "";
  if (!url) return Response.json({ error: "Paste a link." }, { status: 400 });

  try {
    const page = await readPublicPage(url);
    const size = page.image ? imageSize(page.image.bytes) : null;
    const analysis = await categorize({
      title: page.title,
      description: page.description,
      filename: page.filename,
      note,
      sourceUrl: page.finalUrl,
      width: size?.width,
      height: size?.height,
    });
    const id = randomUUID();
    const imageUrl = page.image
      ? await saveImage({
          id,
          bytes: page.image.bytes,
          contentType: page.image.mime,
          ext: page.image.ext,
        })
      : await saveImage({
          id,
          bytes: Buffer.from(placeholderSvg(analysis.title, familyLabel(analysis.family)), "utf8"),
          contentType: "image/svg+xml",
          ext: "svg",
        });

    const item: LibraryItem = {
      id,
      title: analysis.title,
      family: analysis.family,
      explanation: analysis.explanation,
      keywords: analysis.keywords,
      imagePrompt: analysis.imagePrompt,
      siteBrief: analysis.siteBrief,
      imageUrl,
      sourceUrl: page.finalUrl,
      note,
      createdAt: new Date().toISOString(),
      sourceType: "url",
      aspect: analysis.aspect,
      sorter: analysis.sorter,
    };
    await addItem(item);
    return Response.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read that page.";
    return Response.json({ error: message }, { status: 400 });
  }
}
