import { randomUUID } from "node:crypto";
import { categorize } from "@/lib/ai";
import { extForMime, imageSize, sniffImage } from "@/lib/image";
import { addItem, saveImage } from "@/lib/store";
import type { LibraryItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Could not read that upload." }, { status: 400 });
  }

  const file = form.get("file");
  const noteValue = form.get("note");
  const note = typeof noteValue === "string" ? noteValue.slice(0, 1000) : "";
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose an image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Use an image under 8MB." }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImage(bytes);
  const ext = extForMime(file.type) || sniffed?.ext || null;
  const mime = sniffed?.mime || file.type;
  if (!ext || !mime.startsWith("image/")) {
    return Response.json({ error: "Use a PNG, JPG, WebP, or GIF." }, { status: 400 });
  }

  const size = imageSize(bytes);
  const analysis = await categorize({
    filename: file.name,
    note,
    width: size?.width,
    height: size?.height,
  });
  const id = randomUUID();
  const imageUrl = await saveImage({ id, bytes, contentType: mime, ext });
  const item: LibraryItem = {
    id,
    title: analysis.title,
    family: analysis.family,
    explanation: analysis.explanation,
    keywords: analysis.keywords,
    imagePrompt: analysis.imagePrompt,
    siteBrief: analysis.siteBrief,
    imageUrl,
    sourceUrl: "",
    note,
    createdAt: new Date().toISOString(),
    sourceType: "upload",
    aspect: analysis.aspect,
    sorter: analysis.sorter,
  };
  await addItem(item);
  return Response.json({ item });
}
