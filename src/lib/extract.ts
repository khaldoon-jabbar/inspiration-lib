import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { sniffImage } from "./image";

const MAX_BYTES = 8 * 1024 * 1024;
const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.internal",
]);

export type FetchedAsset = {
  finalUrl: string;
  title: string;
  description: string;
  filename: string;
  image?: { bytes: Buffer; mime: string; ext: string };
};

function isPrivateIp(ip: string): boolean {
  const value = ip.toLowerCase();
  if (value === "::1" || value === "::") return true;
  if (value.startsWith("fe80:") || value.startsWith("fc") || value.startsWith("fd")) return true;
  if (value.startsWith("::ffff:")) return isPrivateIp(value.slice(7));
  if (value.includes(":")) return false;
  const parts = value.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Enter a full http or https link.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https links can be saved.");
  }
  if (url.username || url.password) {
    throw new Error("Links with a username or password are not saved.");
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    BLOCKED_HOSTS.has(host) ||
    host.endsWith(".local") ||
    host.endsWith(".localhost") ||
    host.endsWith(".internal")
  ) {
    throw new Error("That link points at a private address.");
  }
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error("That link points at a private address.");
    return url;
  }
  let records: { address: string }[] = [];
  try {
    records = await lookup(host, { all: true });
  } catch {
    throw new Error("Could not resolve that link.");
  }
  if (records.length === 0 || records.some((record) => isPrivateIp(record.address))) {
    throw new Error("That link points at a private address.");
  }
  return url;
}

async function fetchPublic(raw: string): Promise<{ response: Response; url: URL }> {
  let current = raw;
  for (let hop = 0; hop < 4; hop += 1) {
    const url = await assertPublicUrl(current);
    let response: Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(12_000),
        headers: {
          Accept: "text/html,application/xhtml+xml,image/avif,image/webp,image/png,image/jpeg;q=0.9,*/*;q=0.8",
          "User-Agent": "InspirationLib/0.1 (+https://github.com/khaldoon-jabbar/inspiration-lib)",
        },
      });
    } catch {
      throw new Error("Could not reach that page.");
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("That page redirected without a destination.");
      current = new URL(location, url).toString();
      continue;
    }
    if (!response.ok) throw new Error("That page returned an error.");
    return { response, url };
  }
  throw new Error("That page redirected too many times.");
}

async function readBody(response: Response): Promise<Buffer> {
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_BYTES) throw new Error("That file is larger than 8MB.");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error("That file is larger than 8MB.");
  return bytes;
}

function decode(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, num: string) => String.fromCodePoint(Number(num)))
    .replace(/&#x([0-9a-f]+);/gi, (_, num: string) => String.fromCodePoint(parseInt(num, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html: string, key: string): string {
  const tags = html.match(/<meta\s[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const name = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (name !== key) continue;
    const content =
      tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1] ??
      tag.match(/content\s*=\s*([^\s"'>]+)/i)?.[1];
    if (content) return decode(content);
  }
  return "";
}

function filenameFromUrl(url: URL): string {
  const last = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "");
  return last || url.hostname;
}

export async function readPublicPage(raw: string): Promise<FetchedAsset> {
  const { response, url } = await fetchPublic(raw.trim());
  const bytes = await readBody(response);
  const headerType = (response.headers.get("content-type") || "").toLowerCase();
  const sniffed = sniffImage(bytes);
  if (headerType.startsWith("image/") || sniffed) {
    const mime = sniffed?.mime || headerType.split(";")[0].trim();
    const ext = sniffed?.ext || "jpg";
    return {
      finalUrl: url.toString(),
      title: filenameFromUrl(url).replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " "),
      description: "",
      filename: filenameFromUrl(url),
      image: { bytes, mime, ext },
    };
  }

  const html = bytes.subarray(0, 750_000).toString("utf8");
  const title =
    metaContent(html, "og:title") ||
    decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "") ||
    url.hostname;
  const description =
    metaContent(html, "og:description") ||
    metaContent(html, "description") ||
    metaContent(html, "twitter:description");
  const imageRef =
    metaContent(html, "og:image") ||
    metaContent(html, "og:image:url") ||
    metaContent(html, "twitter:image");

  let image: FetchedAsset["image"];
  if (imageRef) {
    try {
      const resolved = new URL(imageRef, url).toString();
      const fetched = await fetchPublic(resolved);
      const imageBytes = await readBody(fetched.response);
      const imageType = (fetched.response.headers.get("content-type") || "").toLowerCase();
      const imageSniff = sniffImage(imageBytes);
      if (imageType.startsWith("image/") || imageSniff) {
        image = {
          bytes: imageBytes,
          mime: imageSniff?.mime || imageType.split(";")[0].trim(),
          ext: imageSniff?.ext || "jpg",
        };
      }
    } catch (error) {
      console.error("OG image skipped", error);
    }
  }

  return {
    finalUrl: url.toString(),
    title: title.slice(0, 140),
    description: description.slice(0, 600),
    filename: filenameFromUrl(url),
    image,
  };
}
