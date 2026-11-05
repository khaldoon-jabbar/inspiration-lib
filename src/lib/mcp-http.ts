import { callTool, mcpDescriptor, toolCatalog } from "./mcp";

function originOf(request: Request) {
  return new URL(request.url).origin;
}

export function mcpGet(request: Request) {
  return Response.json(mcpDescriptor(originOf(request)), {
    headers: { "cache-control": "no-store" },
  });
}

export async function mcpPost(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    id?: unknown;
    method?: string;
    params?: { name?: string; arguments?: Record<string, unknown> };
  } | null;

  if (!body || typeof body.method !== "string") {
    return Response.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400 },
    );
  }

  const id = body.id ?? null;

  if (body.method === "initialize") {
    return Response.json({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2025-06-18",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "inspiration-lib", version: "0.1.0" },
        instructions:
          "Read-only inspiration library. Tools: list_items, get_item, search_by_family. REST mirrors live at /api/library.",
      },
    });
  }

  if (body.method === "notifications/initialized" || body.method === "notifications/cancelled") {
    return new Response(null, { status: 202 });
  }

  if (body.method === "ping") {
    return Response.json({ jsonrpc: "2.0", id, result: {} });
  }

  if (body.method === "tools/list") {
    return Response.json({
      jsonrpc: "2.0",
      id,
      result: {
        tools: toolCatalog(originOf(request)).map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      },
    });
  }

  if (body.method === "tools/call") {
    const name = body.params?.name ?? "";
    const result = await callTool(name, body.params?.arguments);
    if (!result.ok) {
      return Response.json({
        jsonrpc: "2.0",
        id,
        result: { isError: true, content: [{ type: "text", text: result.message }] },
      });
    }
    return Response.json({
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text: JSON.stringify(result.data) }],
        structuredContent: result.data,
      },
    });
  }

  return Response.json({
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: "Method not found" },
  });
}
