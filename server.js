// AI会社の最小バックエンド。
// 静的ファイル（public/）を配信しつつ、/api/consult でだけ Claude API を呼び出す。
// ブラウザ側のコードにAPIキーが渡ることは一切ない。
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { AI_EMPLOYEE } from "./employee.config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;
const MODEL = "claude-opus-5";

// ANTHROPIC_API_KEY が設定されていれば自動で読み込まれる（コードには書かない）。
const client = new Anthropic();

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function buildSystemPrompt() {
  return `あなたはAI会社で働くAI社員「${AI_EMPLOYEE.name}」です。
役職: ${AI_EMPLOYEE.role}
性格: ${AI_EMPLOYEE.personality}

社長（利用者）から相談や指示を受けたら、この性格に沿って日本語で丁寧に答えてください。
・回答は具体的かつ簡潔に（3〜5文程度）
・社長の指示に答えるだけでなく、次にやるべきことを自分から3つ提案する
・next_actions は抽象的な表現を避け、すぐ着手できる具体的な作業にする`;
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
    next_actions: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["answer", "next_actions"],
  additionalProperties: false,
};

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function serveStatic(req, res) {
  const requestedPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const fullPath = path.join(PUBLIC_DIR, safePath);

  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const data = await fs.readFile(fullPath);
    const ext = path.extname(fullPath);
    res.writeHead(200, { "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  }
}

async function handleConsult(req, res) {
  let instruction = "";
  try {
    const raw = await readRequestBody(req);
    const body = raw ? JSON.parse(raw) : {};
    instruction = typeof body.instruction === "string" ? body.instruction.trim() : "";
  } catch {
    sendJson(res, 400, { error: "リクエストの形式が正しくありません。もう一度お試しください。" });
    return;
  }

  if (!instruction) {
    sendJson(res, 400, { error: "相談内容を入力してください。" });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    sendJson(res, 500, {
      error: "サーバーにAPIキーが設定されていません。管理者に ANTHROPIC_API_KEY の設定を確認してもらってください。",
    });
    return;
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: RESPONSE_SCHEMA },
      },
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: instruction }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock) {
      throw new Error("Claude応答にテキストブロックが含まれていません");
    }
    const data = JSON.parse(textBlock.text);

    sendJson(res, 200, {
      employeeName: AI_EMPLOYEE.name,
      answer: data.answer,
      nextActions: Array.isArray(data.next_actions) ? data.next_actions.slice(0, 3) : [],
    });
  } catch (error) {
    console.error("Claude API error:", error);

    let message = `${AI_EMPLOYEE.name}が今うまく応答できませんでした。しばらくしてからもう一度お試しください。`;
    if (error instanceof Anthropic.AuthenticationError) {
      message = "APIキーが正しくありません。サーバーの ANTHROPIC_API_KEY の値を確認してください。";
    } else if (error instanceof Anthropic.RateLimitError) {
      message = "ただいまアクセスが集中しています。少し時間をおいてから再度お試しください。";
    } else if (error instanceof Anthropic.APIError) {
      message = `Claude APIでエラーが発生しました（ステータス: ${error.status}）。しばらくしてからお試しください。`;
    }
    sendJson(res, 502, { error: message });
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/consult") {
    handleConsult(req, res);
    return;
  }
  if (req.method === "GET" && req.url === "/api/employee") {
    sendJson(res, 200, AI_EMPLOYEE);
    return;
  }
  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }
  res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Method Not Allowed");
});

server.listen(PORT, () => {
  console.log(`AI会社サーバーを起動しました: http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("警告: ANTHROPIC_API_KEY が設定されていません。/api/consult はエラーになります。");
  }
});
