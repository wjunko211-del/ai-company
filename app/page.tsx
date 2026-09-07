"use client";

import { useEffect, useRef, useState } from "react";
import { AGENTS } from "@/lib/agents";

type ChatMessage = { role: "user" | "assistant" | "error"; content: string };

type HealthState =
  | { status: "checking" }
  | { status: "ok"; model: string; latencyMs: number }
  | { status: "error"; error: string };

export default function Home() {
  const [activeAgentId, setActiveAgentId] = useState(AGENTS[0].id);
  const [historyByAgent, setHistoryByAgent] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<HealthState>({ status: "checking" });
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeAgent = AGENTS.find((a) => a.id === activeAgentId)!;
  const messages = historyByAgent[activeAgentId] ?? [];

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setHealth({ status: "ok", model: data.model, latencyMs: data.latencyMs });
        } else {
          setHealth({ status: "error", error: data.error ?? "unknown error" });
        }
      })
      .catch((e) => setHealth({ status: "error", error: String(e) }));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const nextHistory = [...messages, { role: "user" as const, content: text }];
    setHistoryByAgent((prev) => ({ ...prev, [activeAgentId]: nextHistory }));
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: activeAgentId,
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "request failed");

      setHistoryByAgent((prev) => ({
        ...prev,
        [activeAgentId]: [...nextHistory, { role: "assistant", content: data.reply }],
      }));
    } catch (e) {
      setHistoryByAgent((prev) => ({
        ...prev,
        [activeAgentId]: [
          ...nextHistory,
          { role: "error", content: `エラー: ${e instanceof Error ? e.message : String(e)}` },
        ],
      }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">🏢 AI Company</div>
        <div className="status">
          <span
            className={`dot ${
              health.status === "ok" ? "ok" : health.status === "error" ? "err" : ""
            }`}
          />
          {health.status === "checking" && "Claude API 接続確認中..."}
          {health.status === "ok" &&
            `Claude API 接続OK (${health.model}, ${health.latencyMs}ms)`}
          {health.status === "error" && `Claude API 接続エラー: ${health.error}`}
        </div>
      </header>

      <div className="main">
        <nav className="sidebar">
          {AGENTS.map((agent) => (
            <button
              key={agent.id}
              className={`agent-btn ${agent.id === activeAgentId ? "active" : ""}`}
              onClick={() => setActiveAgentId(agent.id)}
            >
              {agent.emoji} {agent.name}
              <span className="agent-role">{agent.role}</span>
            </button>
          ))}
        </nav>

        <section className="chat">
          <div className="messages">
            {messages.length === 0 && (
              <div className="msg assistant">
                {activeAgent.emoji} {activeAgent.name}({activeAgent.role})です。
                何でも聞いてください。
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && <div className="msg assistant">考え中...</div>}
            <div ref={bottomRef} />
          </div>

          <div className="composer">
            <textarea
              rows={2}
              placeholder={`${activeAgent.name}にメッセージを送る...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}>
              送信
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
