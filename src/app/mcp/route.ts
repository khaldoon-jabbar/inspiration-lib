import { mcpGet, mcpPost } from "@/lib/mcp-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return mcpGet(request);
}

export function POST(request: Request) {
  return mcpPost(request);
}
