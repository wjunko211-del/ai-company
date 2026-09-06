// ダミー応答ロジック（API接続は未実装）

const instructionEl = document.getElementById("instruction");
const askBtn = document.getElementById("ask-btn");
const answerSection = document.getElementById("answer-section");
const answerBox = document.getElementById("answer-box");
const suggestionSection = document.getElementById("suggestion-section");
const suggestionList = document.getElementById("suggestion-list");

const OPENERS = [
  "了解しました！",
  "承知いたしました！",
  "かしこまりました！",
  "はい、お任せください！",
];

const BODY_TEMPLATES = [
  (task) =>
    `「${task}」について、さっそく整理してみますね。まずは全体の流れをまとめてから、具体的な進め方をご提案します。`,
  (task) =>
    `「${task}」ですね！ポイントを3つに分けて考えてみました。優先順位をつけて進めれば、スムーズに形にできそうです。`,
  (task) =>
    `「${task}」の件、承知しました。関係する情報を整理しつつ、社長にすぐ確認いただけるようたたき台を作成しますね。`,
];

const CLOSERS = [
  "ご不明な点があれば、いつでも声をかけてください😊",
  "少しでもお役に立てるよう頑張ります！",
  "スピード重視で進めますので、ご安心くださいね。",
];

const SUGGESTION_POOL = [
  "たたき台の資料を作成する",
  "関連メンバーへの共有スケジュールを決める",
  "必要な情報・データを整理する",
  "スケジュール案を3パターン用意する",
  "参考事例をリサーチする",
  "社長へ確認事項をリストアップする",
  "次回ミーティングのアジェンダを準備する",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function generateDummyAnswer(task) {
  const opener = pickRandom(OPENERS);
  const body = pickRandom(BODY_TEMPLATES)(task);
  const closer = pickRandom(CLOSERS);
  return `${opener}\n${body}\n${closer}`;
}

function generateDummySuggestions() {
  return pickRandomN(SUGGESTION_POOL, 3);
}

function handleAsk() {
  const task = instructionEl.value.trim();
  const target = task || "ご相談内容";

  askBtn.disabled = true;
  askBtn.innerHTML = '<span class="btn-icon">⏳</span> 考え中...';

  setTimeout(() => {
    answerBox.textContent = generateDummyAnswer(target);
    answerSection.hidden = false;

    suggestionList.innerHTML = "";
    generateDummySuggestions().forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      suggestionList.appendChild(li);
    });
    suggestionSection.hidden = false;

    askBtn.disabled = false;
    askBtn.innerHTML = '<span class="btn-icon">💬</span> AI社員に相談する';

    answerSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 600);
}

askBtn.addEventListener("click", handleAsk);
