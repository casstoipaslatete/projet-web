import { ScoreService } from "../../scripts/scoreService.js";

const TOTAL_WORDS = 10;

let level = 1;
let localScore = 0;
let roundIndex = 0;
let correctStreak = 0;

let currentWord = "";
let timerId = null;
let timeLeftMs = 0;
let maxTimeMs = 8000;
let awaitingAnswer = false;

// mots adaptés 6-9 ans
const WORDS_LEVEL_1 = [
  "chat", "chien", "papa", "maman", "nez", "mer", "lune", "soleil",
  "main", "livre", "porte", "table", "tasse"
];

const WORDS_LEVEL_2 = [
  "maison", "ecole", "banane", "orange", "pantalon", "salade",
  "camion", "biscuit", "chocolat", "brouillard", "caneton"
];

const WORDS_LEVEL_3 = [
  "dinosaure", "ordinateur", "telephone", "papillon", "robotique",
  "bibliotheque", "squelette", "pingouin", "parapluie", "astronaute"
];

// DOM
const roundSpan = document.getElementById("st-round");
const scoreSpan = document.getElementById("st-score");
const levelSpan = document.getElementById("st-level");
const wordSpan = document.getElementById("st-word");
const input = document.getElementById("st-input");
const validateBtn = document.getElementById("st-validate");
const timerBar = document.getElementById("st-timer-bar");
const feedbackDiv = document.getElementById("st-feedback");

const summary = document.getElementById("st-summary");
const finalScoreSpan = document.getElementById("st-final-score");
const bestRow = document.getElementById("st-best-row");
const bestScoreSpan = document.getElementById("st-best-score");

const startBtn = document.getElementById("st-start");
const replayBtn = document.getElementById("st-replay");
const backMenuBtn2 = document.getElementById("st-back-menu2");

// ---- navigation vers l'arcade ----
function goBackToMenu() {
  window.location.href = "/index.html#menu";
}
backMenuBtn2.addEventListener("click", goBackToMenu);

// ---- helpers ----
function pickWordForLevel(level) {
  let arr;
  if (level === 1) arr = WORDS_LEVEL_1;
  else if (level === 2) arr = WORDS_LEVEL_2;
  else arr = WORDS_LEVEL_3;

  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

function updateLevel(isCorrect) {
  if (isCorrect) {
    correctStreak++;
  } else {
    correctStreak = Math.max(0, correctStreak - 1);
  }

  if (correctStreak >= 6) level = 3;
  else if (correctStreak >= 3) level = 2;
  else level = 1;

  level = Math.min(3, Math.max(1, level));
  levelSpan.textContent = level.toString();
}

function startTimer() {
  clearInterval(timerId);

  if (level === 1) maxTimeMs = 8000;
  else if (level === 2) maxTimeMs = 6500;
  else maxTimeMs = 5500;

  timeLeftMs = maxTimeMs;
  timerBar.style.width = "100%";
  timerBar.style.backgroundColor = "#2ecc71";

  timerId = setInterval(() => {
    timeLeftMs -= 100;
    if (timeLeftMs <= 0) {
      clearInterval(timerId);
      timerBar.style.width = "0%";
      handleTimeout();
    } else {
      const ratio = timeLeftMs / maxTimeMs;
      timerBar.style.width = `${ratio * 100}%`;
      if (ratio < 0.3) {
        timerBar.style.backgroundColor = "#e74c3c";
      } else if (ratio < 0.6) {
        timerBar.style.backgroundColor = "#f1c40f";
      } else {
        timerBar.style.backgroundColor = "#2ecc71";
      }
    }
  }, 100);
}

// ---- logique du jeu ----
function startGame() {
  clearInterval(timerId);
  level = 1;
  localScore = 0;
  roundIndex = 0;
  correctStreak = 0;
  awaitingAnswer = false;

  scoreSpan.textContent = "0";
  levelSpan.textContent = "1";
  roundSpan.textContent = "0";
  feedbackDiv.textContent = "";
  feedbackDiv.className = "";
  summary.classList.add("hidden");

  // reset score global pour ce jeu côté API
  ScoreService.init("speedTyping");
  ScoreService.resetScore().catch(err =>
    console.warn("resetScore speedTyping:", err)
  );

  nextRound();
}

function nextRound() {
  roundIndex++;
  if (roundIndex > TOTAL_WORDS) {
    endGame();
    return;
  }

  roundSpan.textContent = roundIndex.toString();
  feedbackDiv.textContent = "";
  feedbackDiv.className = "";

  currentWord = pickWordForLevel(level);
  wordSpan.textContent = currentWord;
  input.value = "";
  input.focus();

  awaitingAnswer = true;
  startTimer();
}

function handleValidate() {
  if (!awaitingAnswer) return;

  const typed = input.value.trim().toLowerCase();
  const expected = currentWord.toLowerCase();

  clearInterval(timerId);
  awaitingAnswer = false;

  const isCorrect = typed === expected;
  updateLevel(isCorrect);

  if (isCorrect) {
    localScore++;
    scoreSpan.textContent = localScore.toString();
    feedbackDiv.textContent = "Bravo!";
    feedbackDiv.classList.add("good");

    ScoreService.addPoints(1).catch(err =>
      console.warn("addPoints speedTyping:", err)
    );
  } else {
    feedbackDiv.textContent = `Le mot était "${currentWord}".`;
    feedbackDiv.classList.add("bad");
  }

  setTimeout(nextRound, 1000);
}

function handleTimeout() {
  if (!awaitingAnswer) return;
  awaitingAnswer = false;

  updateLevel(false);
  feedbackDiv.textContent = `Temps écoulé! Le mot était "${currentWord}".`;
  feedbackDiv.classList.add("bad");

  setTimeout(nextRound, 1200);
}

async function endGame() {
  clearInterval(timerId);
  awaitingAnswer = false;

  wordSpan.textContent = "Bon travail!";
  input.value = "";

  finalScoreSpan.textContent = localScore.toString();
  summary.classList.remove("hidden");

  try {
    await ScoreService.saveScore("speedTyping", localScore);
  } catch (e) {
    console.warn("saveScore speedTyping:", e);
  }

  try {
    const globalScore = await ScoreService.getScore();
    bestScoreSpan.textContent = globalScore.toString();
    bestRow.classList.remove("hidden");
  } catch (e) {
    console.warn("getScore speedTyping:", e);
    bestRow.classList.add("hidden");
  }
}

// ---- events ----
startBtn.addEventListener("click", startGame);
replayBtn.addEventListener("click", startGame);

validateBtn.addEventListener("click", handleValidate);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleValidate();
  }
});

// init
ScoreService.init("speedTyping");
