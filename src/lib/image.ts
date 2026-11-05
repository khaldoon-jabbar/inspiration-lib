const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export function extForMime(mime: string): string | null {
  return MIME_EXT[mime.toLowerCase().split(";")[0].trim()] ?? null;
}

export function mimeForExt(ext: string): string {
  const found = Object.entries(MIME_EXT).find(([, value]) => value === ext);
  return found?.[0] ?? "application/octet-stream";
}

export function sniffImage(bytes: Buffer): { mime: string; ext: string } | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { mime: "image/png", ext: "png" };
  }
  if (bytes.length >= 6 && bytes.toString("ascii", 0, 6) === "GIF87a") {
    return { mime: "image/gif", ext: "gif" };
  }
  if (bytes.length >= 6 && bytes.toString("ascii", 0, 6) === "GIF89a") {
    return { mime: "image/gif", ext: "gif" };
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  const head = bytes.subarray(0, 180).toString("utf8").trimStart().toLowerCase();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) {
    return { mime: "image/svg+xml", ext: "svg" };
  }
  return null;
}

export function imageSize(bytes: Buffer): { width: number; height: number } | null {
  if (bytes.length > 24 && bytes[0] === 0x89 && bytes.toString("ascii", 1, 4) === "PNG") {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes.toString("ascii", 0, 3) === "GIF" && bytes.length >= 10) {
    return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8) };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset < bytes.length - 8) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2;
        continue;
      }
      const length = bytes.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc2) {
        return {
          height: bytes.readUInt16BE(offset + 5),
          width: bytes.readUInt16BE(offset + 7),
        };
      }
      if (length < 2) break;
      offset += 2 + length;
    }
  }
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    const chunk = bytes.toString("ascii", 12, 16);
    if (chunk === "VP8X" && bytes.length >= 30) {
      return {
        width: 1 + bytes.readUIntLE(24, 3),
        height: 1 + bytes.readUIntLE(27, 3),
      };
    }
    if (chunk === "VP8 " && bytes.length >= 30) {
      return {
        width: bytes.readUInt16LE(26) & 0x3fff,
        height: bytes.readUInt16LE(28) & 0x3fff,
      };
    }
  }
  return null;
}

export function placeholderSvg(title: string, family: string): string {
  const escape = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const heading = escape(title.slice(0, 80) || "Reference");
  const label = escape(family.slice(0, 48));
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
  <rect width="1200" height="1500" fill="#ececee"/>
  <rect x="96" y="96" width="1008" height="1308" rx="36" fill="#f7f7f8"/>
  <rect x="160" y="220" width="880" height="760" rx="24" fill="#e2e2e6"/>
  <circle cx="360" cy="520" r="70" fill="#f7f7f8"/>
  <path d="M250 860l180-220 140 160 90-80 290 280H250z" fill="#d4d4d8"/>
  <text x="160" y="1120" fill="#8e8e93" font-family="Helvetica, Arial, sans-serif" font-size="28">${label}</text>
  <text x="160" y="1180" fill="#1c1c1e" font-family="Helvetica, Arial, sans-serif" font-size="44" font-weight="600">${heading}</text>
</svg>`;
}
