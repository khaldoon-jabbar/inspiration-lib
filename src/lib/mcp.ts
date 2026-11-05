import { FAMILIES, familyBySlug } from "./families";
import { currentAiMode } from "./ai";
import { getItem, listItems } from "./store";
export type McpTool = {
  name: "list_items" | "get_item" | "search_by_family";
  description: string;
  inputSchema: Record<string, unknown>;
  endpoint: string;
};

export function toolCatalog(origin = ""): McpTool[] {
  const root = origin.replace(/\/$/, "");
  return [
    {
      name: "list_items",
      description: "List inspiration library items, newest first, including prompts and briefs.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      endpoint: `${root}/api/library`,
    },
    {
      name: "get_item",
      description: "Get one library item by id, including imagePrompt and siteBrief.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Item id, for example seed-vessel." },
        },
        required: ["id"],
        additionalProperties: false,
      },
      endpoint: `${root}/api/library/{id}`,
    },
    {
      name: "search_by_family",
      description: "Filter items by aesthetic family slug or label.",
      inputSchema: {
        type: "object",
        properties: {
          family: {
            type: "string",
            description: `Slug or label. Slugs: ${FAMILIES.map((family) => family.slug).join(", ")}.`,
          },
        },
        required: ["family"],
        additionalProperties: false,
      },
      endpoint: `${root}/api/library?family={family}`,
    },
  ];
}

export function mcpDescriptor(origin = "") {
  return {
    name: "inspiration-lib",
    version: "0.1.0",
    description: "Read a personal design inspiration library: aesthetic family, keywords, image prompt, and site brief.",
    protocol: "mcp",
    protocolVersion: "2025-06-18",
    transport: { type: "http", url: `${origin.replace(/\/$/, "")}/mcp` },
    aiMode: currentAiMode(),
    families: FAMILIES.map((family) => ({ slug: family.slug, label: family.label })),
    tools: toolCatalog(origin),
  };
}

export async function libraryPayload(family?: string | null) {
  const items = await listItems();
  const match = family ? familyBySlug(family) : undefined;
  const filtered = match ? items.filter((item) => item.family === match.slug) : items;
  return {
    aiMode: currentAiMode(),
    families: FAMILIES.map((entry) => ({ slug: entry.slug, label: entry.label })),
    family: match ? { slug: match.slug, label: match.label } : null,
    count: filtered.length,
    items: filtered,
  };
}

export async function callTool(
  name: string,
  args: Record<string, unknown> | undefined,
): Promise<{ ok: true; data: unknown } | { ok: false; message: string }> {
  if (name === "list_items") {
    return { ok: true, data: await libraryPayload() };
  }
  if (name === "get_item") {
    const id = typeof args?.id === "string" ? args.id : "";
    if (!id) return { ok: false, message: "get_item requires an id." };
    const item = await getItem(id);
    if (!item) return { ok: false, message: "No item with that id." };
    return { ok: true, data: { item } };
  }
  if (name === "search_by_family") {
    const family = typeof args?.family === "string" ? args.family : "";
    if (!family) return { ok: false, message: "search_by_family requires a family." };
    if (!familyBySlug(family)) {
      return {
        ok: false,
        message: `Unknown family. Use one of: ${FAMILIES.map((entry) => entry.slug).join(", ")}.`,
      };
    }
    return { ok: true, data: await libraryPayload(family) };
  }
  return { ok: false, message: `Unknown tool: ${name}` };
}
