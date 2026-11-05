import { mcpGet } from "@/lib/mcp-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return mcpGet(request);
}
