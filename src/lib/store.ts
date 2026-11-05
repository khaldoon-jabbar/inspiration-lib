import { promises as fs } from "node:fs";
import path from "node:path";
import seedJson from "../../data/seed.json";
import type { LibraryItem } from "./types";

const SEED = seedJson as LibraryItem[];
const BLOB_INDEX = "library/user-items.json";

let queue: Promise<unknown> = Promise.resolve();
let roots: { index: string; uploads: string } | null = null;

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function blobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function writable(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
    const probe = path.join(dir, ".write-probe");
    await fs.writeFile(probe, "ok");
    await fs.unlink(probe);
    return true;
  } catch {
    return false;
  }
}

async function fsRoots() {
  if (roots) return roots;
  const dataDir = path.join(process.cwd(), "data");
  const base = (await writable(dataDir)) ? dataDir : path.join("/tmp", "inspiration-lib");
  const uploads = path.join(base, "uploads");
  await fs.mkdir(uploads, { recursive: true });
  roots = { index: path.join(base, "user-items.json"), uploads };
  return roots;
}

async function readUserItems(): Promise<LibraryItem[]> {
  if (blobEnabled()) {
    try {
      const { list } = await import("@vercel/blob");
      const found = await list({ prefix: BLOB_INDEX, limit: 20 });
      const blob = found.blobs.find((item) => item.pathname === BLOB_INDEX);
      if (!blob) return [];
      const response = await fetch(blob.url, { cache: "no-store" });
      if (!response.ok) return [];
      const json = (await response.json()) as unknown;
      return Array.isArray(json) ? (json as LibraryItem[]) : [];
    } catch (error) {
      console.error("Blob index read failed", error);
      return [];
    }
  }

  try {
    const { index } = await fsRoots();
    const raw = await fs.readFile(index, "utf8");
    const json = JSON.parse(raw) as unknown;
    return Array.isArray(json) ? (json as LibraryItem[]) : [];
  } catch {
    return [];
  }
}

async function writeUserItems(items: LibraryItem[]) {
  if (blobEnabled()) {
    const { put } = await import("@vercel/blob");
    await put(BLOB_INDEX, JSON.stringify(items), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }
  const { index } = await fsRoots();
  const temp = `${index}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(items, null, 2));
  await fs.rename(temp, index);
}

export async function listItems(): Promise<LibraryItem[]> {
  const user = await readUserItems();
  return [...user, ...SEED].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getItem(id: string): Promise<LibraryItem | null> {
  const items = await listItems();
  return items.find((item) => item.id === id) ?? null;
}

export async function addItem(item: LibraryItem): Promise<LibraryItem> {
  return enqueue(async () => {
    const items = await readUserItems();
    items.unshift(item);
    await writeUserItems(items);
    return item;
  });
}

export async function saveImage(input: {
  id: string;
  bytes: Buffer;
  contentType: string;
  ext: string;
}): Promise<string> {
  if (blobEnabled()) {
    const { put } = await import("@vercel/blob");
    const saved = await put(`library/images/${input.id}.${input.ext}`, input.bytes, {
      access: "public",
      addRandomSuffix: false,
      contentType: input.contentType,
    });
    return saved.url;
  }
  const { uploads } = await fsRoots();
  await fs.writeFile(path.join(uploads, `${input.id}.${input.ext}`), input.bytes);
  return `/api/media/${input.id}`;
}

export async function readImage(id: string): Promise<{ bytes: Buffer; contentType: string } | null> {
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(id)) return null;
  const { uploads } = await fsRoots();
  let names: string[] = [];
  try {
    names = await fs.readdir(uploads);
  } catch {
    return null;
  }
  const name = names.find((file) => file.startsWith(`${id}.`));
  if (!name) return null;
  const ext = name.split(".").pop()?.toLowerCase() || "jpg";
  const contentType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "gif"
          ? "image/gif"
          : ext === "svg"
            ? "image/svg+xml"
            : "image/jpeg";
  return { bytes: await fs.readFile(path.join(uploads, name)), contentType };
}
