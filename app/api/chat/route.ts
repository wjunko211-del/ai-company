import Anthropic from "@anthropic-ai/sdk";
import { getAgent } from "@/lib/agents";

export const dynamic = "force-dynamic";

type IncomingMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const agentId = body?.agentId as string | undefined;
  const messages = body?.messages as IncomingMessage[] | undefined;

  const agent = agentId ? getAgent(agentId) : undefined;
  if (!agent) {
    return Response.json({ error: "Unknown agentId" }, { status: 400 });
  }
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages is required" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const res = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: agent.systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = res.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return Response.json({ reply: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
}
