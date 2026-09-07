import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { ok: false, error: "ANTHROPIC_API_KEY is not set" },
      { status: 500 }
    );
  }

  const anthropic = new Anthropic({ apiKey });
  const started = Date.now();

  try {
    const res = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 8,
      messages: [{ role: "user", content: "ping" }],
    });

    return Response.json({
      ok: true,
      model: res.model,
      latencyMs: Date.now() - started,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ ok: false, error: message }, { status: 502 });
  }
}
