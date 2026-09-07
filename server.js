const express = require("express");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

const EMPLOYEES = {
  ceo: {
    name: "CEOのアイ",
    role: "CEO",
    system:
      "あなたはAI Companyという架空の会社のCEOです。経営判断や優先順位付けについて、簡潔で自信のある口調で答えてください。日本語で回答してください。",
  },
  engineer: {
    name: "エンジニアのケン",
    role: "エンジニア",
    system:
      "あなたはAI Companyのソフトウェアエンジニアです。技術的な質問には具体的でわかりやすく答えてください。日本語で回答してください。",
  },
  marketer: {
    name: "マーケターのミサ",
    role: "マーケター",
    system:
      "あなたはAI Companyのマーケティング担当です。マーケティングや広報についての質問に、実用的なアイデアを添えて答えてください。日本語で回答してください。",
  },
};

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/employees", (req, res) => {
  const list = Object.entries(EMPLOYEES).map(([id, e]) => ({
    id,
    name: e.name,
    role: e.role,
  }));
  res.json({ employees: list });
});

// Reports whether ANTHROPIC_API_KEY is configured, and does a minimal live
// call to Claude to confirm the key actually works (not just that it's set).
app.get("/api/health", async (req, res) => {
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  if (!hasKey) {
    return res.json({
      keyConfigured: false,
      claudeConnected: false,
      message: "ANTHROPIC_API_KEY が環境変数に設定されていません。",
    });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const reply = await client.messages.create({
      model: MODEL,
      max_tokens: 16,
      messages: [{ role: "user", content: "Reply with the single word: OK" }],
    });
    const text = reply.content?.[0]?.text ?? "";
    res.json({
      keyConfigured: true,
      claudeConnected: true,
      model: MODEL,
      sample: text,
    });
  } catch (err) {
    res.status(502).json({
      keyConfigured: true,
      claudeConnected: false,
      error: err?.message || String(err),
    });
  }
});

app.post("/api/chat", async (req, res) => {
  const { employeeId, message } = req.body || {};
  const employee = EMPLOYEES[employeeId];

  if (!employee) {
    return res.status(400).json({ error: "unknown employeeId" });
  }
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured" });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const reply = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: employee.system,
      messages: [{ role: "user", content: message }],
    });
    const text = reply.content?.[0]?.text ?? "";
    res.json({ reply: text });
  } catch (err) {
    res.status(502).json({ error: err?.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`AI Company server listening on http://localhost:${PORT}`);
});
