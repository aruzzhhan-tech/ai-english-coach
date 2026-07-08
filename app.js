const STORAGE_KEY = "ai-english-coach-state";

const lessonBank = [
  {
    goal: "Use five new words in a short answer about your workday.",
    vocabulary: [
      ["clarify", "to make something easier to understand"],
      ["reliable", "someone or something you can trust"],
      ["approach", "a way of doing something"],
      ["improve", "to make better"],
      ["confident", "feeling sure about your ability"]
    ],
    grammar: "Practice present perfect for experience: I have worked with..., I have learned...",
    speaking: "Tell your coach about a recent challenge at work or study.",
    writing: "Write five sentences about what you have improved this month.",
    homework: "Record yourself for one minute and repeat the answer more naturally."
  },
  {
    goal: "Describe a plan using future forms and polite transitions.",
    vocabulary: [
      ["schedule", "a plan for time"],
      ["priority", "something important"],
      ["deadline", "the latest time to finish"],
      ["adjust", "to change a little"],
      ["outcome", "the result"]
    ],
    grammar: "Compare going to, will, and present continuous for plans.",
    speaking: "Explain tomorrow's plan and why each task matters.",
    writing: "Write a polite message asking to move a meeting.",
    homework: "Review your message and replace basic verbs with stronger ones."
  }
];

const defaultState = {
  level: "B1",
  progress: 42,
  streak: 1,
  tasksDone: 0,
  activeLesson: 0,
  mistakes: [
    "Use articles with singular countable nouns.",
    "Say 'I have been learning', not 'I learning'."
  ],
  vocabulary: [],
  week: [15, 32, 18, 45, 55, 20, 36]
};

let state = loadState();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentLesson() {
  return lessonBank[state.activeLesson % lessonBank.length];
}

function renderDashboard() {
  const lesson = currentLesson();
  document.getElementById("levelSelect").value = state.level;
  document.getElementById("progressPercent").textContent = `${state.progress}%`;
  document.getElementById("progressBar").style.width = `${state.progress}%`;
  document.getElementById("wordsCount").textContent = state.vocabulary.length;
  document.getElementById("streakCount").textContent = `${state.streak} day${state.streak === 1 ? "" : "s"}`;
  document.getElementById("tasksDone").textContent = state.tasksDone;
  document.getElementById("dailyGoal").textContent = lesson.goal;
  document.getElementById("mistakeList").innerHTML = state.mistakes.map((item) => `<li>${item}</li>`).join("");
}

function renderLesson() {
  const lesson = currentLesson();
  const steps = [
    ["Vocabulary", lesson.vocabulary.map(([word, meaning]) => `${word} - ${meaning}`)],
    ["Grammar", [lesson.grammar]],
    ["Speaking", [lesson.speaking]],
    ["Writing", [lesson.writing]],
    ["Homework", [lesson.homework]]
  ];
  document.getElementById("lessonSteps").innerHTML = steps
    .map(
      ([title, items], index) => `
        <article class="lesson-card">
          <h3>${title}</h3>
          <ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>
          <button type="button" data-complete="${index}">Complete step</button>
        </article>`
    )
    .join("");
}

function renderVocabulary() {
  const words = state.vocabulary.length
    ? state.vocabulary
    : currentLesson().vocabulary.map(([word, meaning]) => ({
        word,
        meaning,
        example: `I can use "${word}" in a clear sentence.`,
        repeats: 0,
        level: "new"
      }));
  document.getElementById("vocabularyList").innerHTML = words
    .map(
      (item) => `
        <article class="vocab-card">
          <strong>${item.word}</strong>
          <p>${item.meaning}</p>
          <small>${item.example}</small>
          <p>Repeats: ${item.repeats} | Level: ${item.level}</p>
        </article>`
    )
    .join("");
}

function renderProgress() {
  document.getElementById("weekBars").innerHTML = state.week
    .map((value, index) => `<div class="bar" style="height:${value + 35}%">${["M", "T", "W", "T", "F", "S", "S"][index]}</div>`)
    .join("");
  document.getElementById("memoryPreview").textContent = JSON.stringify(
    {
      progress: `${state.progress}%`,
      vocabulary: state.vocabulary.length,
      mistakes: state.mistakes,
      settings: { level: state.level }
    },
    null,
    2
  );
}

function renderChatIntro() {
  const chatLog = document.getElementById("chatLog");
  if (chatLog.children.length) return;
  addMessage("coach", "Tell me about something you have improved recently. I will answer only in English and help you correct mistakes.");
}

function addMessage(role, text) {
  const message = document.createElement("div");
  message.className = `message ${role === "user" ? "user" : ""}`;
  message.innerHTML = `<strong>${role === "user" ? "You" : "Coach"}</strong>${text}`;
  document.getElementById("chatLog").append(message);
}

function coachReply(text) {
  const lower = text.toLowerCase();
  const correction = lower.includes("i learning")
    ? "Correction: say 'I am learning' or 'I have been learning'."
    : lower.includes("very")
      ? "Try a stronger adjective instead of 'very'."
      : "Good. Now add one reason and one example.";
  state.mistakes = [correction, ...state.mistakes].slice(0, 4);
  state.tasksDone += 1;
  state.progress = Math.min(100, state.progress + 2);
  saveState();
  addMessage("coach", `${correction}<br>Question: What made this progress possible?`);
  renderAll();
}

function renderAll() {
  renderDashboard();
  renderLesson();
  renderVocabulary();
  renderProgress();
  renderChatIntro();
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item, .view").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.view).classList.add("active");
  });
});

document.getElementById("levelSelect").addEventListener("change", (event) => {
  state.level = event.target.value;
  saveState();
  renderAll();
});

document.getElementById("newLessonBtn").addEventListener("click", () => {
  state.activeLesson += 1;
  state.streak += 1;
  saveState();
  renderAll();
});

document.getElementById("completeGoalBtn").addEventListener("click", () => {
  state.tasksDone += 1;
  state.progress = Math.min(100, state.progress + 5);
  saveState();
  renderAll();
});

document.getElementById("saveLessonBtn").addEventListener("click", () => {
  currentLesson().vocabulary.forEach(([word, meaning]) => {
    if (!state.vocabulary.some((item) => item.word === word)) {
      state.vocabulary.push({
        word,
        meaning,
        example: `Today I practiced the word "${word}".`,
        repeats: 1,
        level: "learning"
      });
    }
  });
  state.tasksDone += 5;
  state.progress = Math.min(100, state.progress + 8);
  saveState();
  renderAll();
});

document.getElementById("lessonSteps").addEventListener("click", (event) => {
  if (!event.target.matches("[data-complete]")) return;
  state.tasksDone += 1;
  state.progress = Math.min(100, state.progress + 3);
  saveState();
  renderAll();
});

document.getElementById("addWordBtn").addEventListener("click", () => {
  const word = prompt("New English word");
  if (!word) return;
  const meaning = prompt("Meaning") || "Personal vocabulary item";
  state.vocabulary.push({ word, meaning, example: `I want to remember "${word}".`, repeats: 0, level: "new" });
  saveState();
  renderAll();
});

document.getElementById("chatForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;
  addMessage("user", text);
  input.value = "";
  setTimeout(() => coachReply(text), 250);
});

renderAll();
