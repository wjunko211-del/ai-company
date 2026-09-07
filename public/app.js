const statusEl = document.getElementById("status");
const employeeSelect = document.getElementById("employee");
const messagesEl = document.getElementById("messages");
const form = document.getElementById("chat-form");
const input = document.getElementById("message");

function addMessage(text, cls) {
  const div = document.createElement("div");
  div.className = `msg ${cls}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function loadEmployees() {
  const res = await fetch("/api/employees");
  const data = await res.json();
  employeeSelect.innerHTML = data.employees
    .map((e) => `<option value="${e.id}">${e.name}（${e.role}）</option>`)
    .join("");
}

async function checkHealth() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    if (data.claudeConnected) {
      statusEl.textContent = `Claude API 接続OK (${data.model})`;
      statusEl.className = "status ok";
    } else {
      statusEl.textContent = `Claude API 未接続: ${data.message || data.error || "unknown"}`;
      statusEl.className = "status bad";
    }
  } catch (err) {
    statusEl.textContent = "サーバーに接続できません";
    statusEl.className = "status bad";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;
  addMessage(message, "user");
  input.value = "";
  input.disabled = true;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: employeeSelect.value, message }),
    });
    const data = await res.json();
    if (res.ok) {
      addMessage(data.reply, "assistant");
    } else {
      addMessage(`エラー: ${data.error}`, "error");
    }
  } catch (err) {
    addMessage(`通信エラー: ${err.message}`, "error");
  } finally {
    input.disabled = false;
    input.focus();
  }
});

loadEmployees();
checkHealth();
