import { generateObject, zodSchema } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { FAMILIES, familyBySlug, type Family } from "./families";
import { aspectFromSize } from "./time";
import type { AiMode, Analysis, AnalyzeInput } from "./types";

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "your",
  "you",
  "are",
  "was",
  "were",
  "have",
  "has",
  "http",
  "https",
  "www",
  "com",
  "org",
  "net",
  "html",
  "htm",
  "php",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "img",
  "image",
  "photo",
  "picture",
  "screenshot",
  "untitled",
  "final",
  "copy",
  "edit",
  "dsc",
  "scan",
]);

const familyEnum = FAMILIES.map((family) => family.slug) as [string, ...string[]];

const analysisSchema = z.object({
  title: z.string().min(3).max(90),
  family: z.enum(familyEnum),
  explanation: z.string().min(20).max(420),
  keywords: z.array(z.string().min(2).max(32)).min(4).max(8),
  imagePrompt: z.string().min(40).max(900),
  siteBrief: z.string().min(40).max(900),
});

export function currentAiMode(): AiMode {
  return liveKey() ? "live" : "stub";
}

function liveKey(): "gateway" | "openai" | null {
  if (process.env.AI_GATEWAY_API_KEY) return "gateway";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function haystack(input: AnalyzeInput): string {
  return [input.filename, input.title, input.description, input.note, input.sourceUrl]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function scoreFamily(text: string): Family {
  let best = FAMILIES[0];
  let bestScore = 0;
  for (const family of FAMILIES) {
    let score = 0;
    for (const cue of family.cues) {
      const pattern = new RegExp(`\\b${cue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (pattern.test(text)) score += 2;
      else if (text.includes(cue)) score += 1;
    }
    if (score > bestScore) {
      best = family;
      bestScore = score;
    }
  }
  if (bestScore === 0) return FAMILIES[hash(text || "inspiration") % FAMILIES.length];
  return best;
}

function tokens(text: string): string[] {
  return text.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? [];
}

function titleFrom(input: AnalyzeInput, family: Family): string {
  const explicit = (input.title || "").replace(/\s+/g, " ").trim();
  if (explicit && !/^(img|image|screenshot|photo|picture|untitled|dsc)[ _-]?\d*$/i.test(explicit)) {
    return explicit.slice(0, 90);
  }
  const fromFile = (input.filename || "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\d{3,}/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (fromFile && !STOP.has(fromFile.toLowerCase()) && fromFile.length > 2) {
    return fromFile.replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 90);
  }
  return family.fallbackTitle;
}

function keywordList(text: string, family: Family): string[] {
  const counts = new Map<string, number>();
  for (const word of tokens(text)) {
    if (STOP.has(word) || word.length < 3) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([word]) => word);
  const out: string[] = [];
  for (const word of [...family.signature, ...ranked]) {
    const clean = word.trim().toLowerCase();
    if (!clean || out.includes(clean)) continue;
    out.push(clean);
    if (out.length === 8) break;
  }
  return out;
}

export function categorizeStub(input: AnalyzeInput): Analysis {
  const text = haystack(input);
  const family = scoreFamily(text);
  const aspect = aspectFromSize(input.width, input.height);
  const title = titleFrom(input, family);
  const keywords = keywordList(`${text} ${family.signature.join(" ")}`, family);
  const note = input.note?.replace(/\s+/g, " ").trim();
  const description = input.description?.replace(/\s+/g, " ").trim();
  const subject = description || note || title;
  const extra = note || description;
  const explanation = extra
    ? `${family.tldr} ${extra.charAt(0).toUpperCase()}${extra.slice(1, 240)}${extra.length > 240 ? "…" : ""}`
    : family.tldr;

  return {
    title,
    family: family.slug,
    explanation,
    keywords,
    imagePrompt: `${family.camera} ${aspect} frame. ${subject}. Hold onto ${keywords.join(
      ", ",
    )}. ${family.light} No text, no logo, no watermark.`,
    siteBrief: [
      `Reference: ${title}.`,
      `Family: ${family.label}.`,
      `Palette: ${family.palette}.`,
      `Type: ${family.typeNote}.`,
      `Layout: ${family.layout}.`,
      `Motion: ${family.motion}.`,
      `Carry these words into the page: ${keywords.join(", ")}.`,
      `Avoid: ${family.avoid}.`,
    ].join(" "),
    aspect,
    sorter: "Heuristic",
    aiMode: "stub",
  };
}

function model() {
  const which = liveKey();
  if (which === "gateway") {
    return createOpenAI({
      apiKey: process.env.AI_GATEWAY_API_KEY,
      baseURL: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
      name: "ai-gateway",
    }).chat("openai/gpt-4o-mini");
  }
  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }).chat("gpt-4o-mini");
}

export async function categorize(input: AnalyzeInput): Promise<Analysis> {
  const fallback = categorizeStub(input);
  if (!liveKey()) return fallback;

  const allowed = FAMILIES.map((family) => `${family.slug} (${family.label})`).join(", ");
  try {
    const { object } = await generateObject({
      model: model(),
      schema: zodSchema(analysisSchema),
      schemaName: "InspirationAnalysis",
      schemaDescription: "Aesthetic family, keywords, image prompt, and site brief for one reference.",
      prompt: [
        "You sort one design reference for a personal inspiration library.",
        "Pick exactly one family slug from:",
        allowed,
        "explanation is two sentences a designer can skim. No markdown.",
        "keywords are concrete visual tags, lowercase, no hashes.",
        "imagePrompt is a production prompt a model can run: subject, crop, light, materials. No text or logos in the picture.",
        "siteBrief is an agent-ready website brief: palette, type, layout, motion, and what to avoid. Plain sentences.",
        "Do not invent a brand, a client, or a metric.",
        "",
        `Title hint: ${input.title || "(none)"}`,
        `Filename: ${input.filename || "(none)"}`,
        `Description: ${input.description || "(none)"}`,
        `Note: ${input.note || "(none)"}`,
        `Source: ${input.sourceUrl || "(upload)"}`,
        `Aspect hint: ${fallback.aspect}`,
        `Heuristic guess: ${fallback.family}`,
      ].join("\n"),
    });
    const family = familyBySlug(object.family) ?? familyBySlug(fallback.family)!;
    return {
      title: object.title.trim(),
      family: family.slug,
      explanation: object.explanation.trim(),
      keywords: object.keywords.map((word) => word.trim().toLowerCase()).filter(Boolean).slice(0, 8),
      imagePrompt: object.imagePrompt.trim(),
      siteBrief: object.siteBrief.trim(),
      aspect: fallback.aspect,
      sorter: "GPT-4o mini",
      aiMode: "live",
    };
  } catch (error) {
    console.error("Live sort failed, using heuristic", error);
    return fallback;
  }
}
