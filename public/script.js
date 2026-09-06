// 画面の操作と、サーバー（/api/consult）とのやり取りだけを担当。
// Claude APIへの通信はすべてサーバー側で行われ、APIキーはこのファイルに登場しない。

const instructionEl = document.getElementById("instruction");
const askBtn = document.getElementById("ask-btn");
const answerSection = document.getElementById("answer-section");
const answerBox = document.getElementById("answer-box");
const suggestionSection = document.getElementById("suggestion-section");
const suggestionList = document.getElementById("suggestion-list");
const errorSection = document.getElementById("error-section");
const errorBox = document.getElementById("error-box");

function showError(message) {
  errorBox.textContent = message;
  errorSection.hidden = false;
  answerSection.hidden = true;
  suggestionSection.hidden = true;
}

function hideError() {
  errorSection.hidden = true;
}

function setLoading(isLoading) {
  askBtn.disabled = isLoading;
  askBtn.innerHTML = isLoading
    ? '<span class="btn-icon">⏳</span> 考え中...'
    : '<span class="btn-icon">💬</span> AI社員に相談する';
}

async function handleAsk() {
  const instruction = instructionEl.value.trim();
  if (!instruction) {
    showError("相談内容を入力してください。");
    return;
  }

  hideError();
  setLoading(true);

  try {
    const res = await fetch("/api/consult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "エラーが発生しました。もう一度お試しください。");
    }

    answerBox.textContent = data.answer;
    answerSection.hidden = false;

    suggestionList.innerHTML = "";
    (data.nextActions || []).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      suggestionList.appendChild(li);
    });
    suggestionSection.hidden = false;

    answerSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (err) {
    showError(
      err.message || "通信中にエラーが発生しました。しばらくしてからもう一度お試しください。"
    );
  } finally {
    setLoading(false);
  }
}

async function loadEmployeeProfile() {
  try {
    const res = await fetch("/api/employee");
    if (!res.ok) return;
    const employee = await res.json();
    document.getElementById("employee-name").textContent = employee.name;
    document.getElementById("employee-role").textContent = employee.role;
    document.getElementById("employee-trait").textContent =
      `${employee.personality}です！なんでもお申し付けください✨`;
  } catch {
    // プロフィール取得に失敗してもHTML側の初期表示のまま使えるため無視する
  }
}

askBtn.addEventListener("click", handleAsk);
loadEmployeeProfile();
