import { ScoreService } from "../../scripts/scoreService.js";

const TOTAL_WORDS = 10;

let level = 1;
let score = 0;
let roundIndex = 0;
let correctStreak = 0;

let currentWord = "";
let scrambledWord = "";
let timerId = null;
let timeLeftMs = 0;
let maxTimeMs = 8000;
let awaitingAnswer = false;

// mots 6-9 ans
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

// Mélanger les lettres d'un mot
function scramble(word) {
  return word
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// DOM
const roundSpan = document.getElementById("mm-round");
const scoreSpan = document.getElementById("mm-score");
const levelSpan = document.getElementById("mm-level");
const wordSpan = document.getElementById("mm-word");
const input = document.getElementById("mm-input");
const validateBtn = document.getElementById("mm-validate");
const timerBar = document.getElementById("mm-timer-bar");
const feedbackDiv = document.getElementById("mm-feedback");

const summary = document.getElementById("mm-summary");
const finalScoreSpan = document.getElementById("mm-final-score");
const bestRow = document.getElementById("mm-best-row");
const bestScoreSpan = document.getElementById("mm-best-score");

const startBtn = document.getElementById("mm-start");
const replayBtn = document.getElementById("mm-replay");

// Choisir un mot selon le niveau
function pickWord(level) {
  const arr = level === 1 ? WORDS_LEVEL_1 : level === 2 ? WORDS_LEVEL_2 : WORDS_LEVEL_3;
  return arr[Math.floor(Math.random() * arr.length)];
}

function updateLevel(isCorrect) {
  if (isCorrect) correctStreak++;
  else correctStreak = Math.max(0, correctStreak - 1);

  if (correctStreak >= 6) level = 3;
  else if (correctStreak >= 3) level = 2;
  else level = 1;

  levelSpan.textContent = level;
}

// Timer
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
      timerBar.style.width = ratio * 100 + "%";

      if (ratio < 0.3) timerBar.style.backgroundColor = "#e74c3c";
      else if (ratio < 0.6) timerBar.style.backgroundColor = "#f1c40f";
      else timerBar.style.backgroundColor = "#2ecc71";
    }
  }, 100);
}

// Nouvelle manche
function nextRound() {
  roundIndex++;
  if (roundIndex > TOTAL_WORDS) return endGame();

  roundSpan.textContent = roundIndex;
  feedbackDiv.textContent = "";
  feedbackDiv.className = "";

  currentWord = pickWord(level);
  scrambledWord = scramble(currentWord);

  // éviter un mot identique si shuffle mauvais
  if (scrambledWord === currentWord) scrambledWord = scramble(currentWord);

  wordSpan.textContent = scrambledWord;
  input.value = "";
  input.focus();

  awaitingAnswer = true;
  startTimer();
}

function startGame() {
  score = 0;
  level = 1;
  roundIndex = 0;
  correctStreak = 0;
  awaitingAnswer = false;

  scoreSpan.textContent = "0";
  levelSpan.textContent = "1";
  roundSpan.textContent = "0";

  summary.classList.add("hidden");
  startBtn.classList.add("hidden");
  replayBtn.classList.add("hidden");

  input.disabled = false;
  validateBtn.disabled = false;

  nextRound();
}

function handleValidate() {
  if (!awaitingAnswer) return;

  const typed = input.value.trim().toLowerCase();
  awaitingAnswer = false;
  clearInterval(timerId);

  const isCorrect = typed === currentWord.toLowerCase();
  updateLevel(isCorrect);

  if (isCorrect) {
    score++;
    scoreSpan.textContent = score;
    feedbackDiv.textContent = "Bravo !";
    feedbackDiv.classList.add("good");
  } else {
    feedbackDiv.textContent = `Le mot était "${currentWord}".`;
    feedbackDiv.classList.add("bad");
  }

  setTimeout(nextRound, 900);
}

function handleTimeout() {
  if (!awaitingAnswer) return;
  awaitingAnswer = false;

  updateLevel(false);

  feedbackDiv.textContent = `Temps écoulé ! Le mot était "${currentWord}".`;
  feedbackDiv.classList.add("bad");

  setTimeout(nextRound, 1000);
}

function endGame() {
  clearInterval(timerId);

  wordSpan.textContent = "Fin !";
  input.disabled = true;
  validateBtn.disabled = true;

  finalScoreSpan.textContent = score;
  summary.classList.remove("hidden");

  replayBtn.classList.remove("hidden");
}

// Events
startBtn.addEventListener("click", startGame);
replayBtn.addEventListener("click", startGame);
validateBtn.addEventListener("click", handleValidate);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleValidate();
});

// Init
function initMotMystere() {
  feedbackDiv.textContent = "Clique sur Commencer pour jouer !";
  input.disabled = true;
  validateBtn.disabled = true;
  summary.classList.add("hidden");
  replayBtn.classList.add("hidden");
}

initMotMystere();