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

// --- SONS ET MUSIQUE ---
let sfxClic, sfxSuccess, sfxError;
let bgMusic;

try {
  sfxClic    = new Audio("sfx/clic.mp3");
  sfxSuccess = new Audio("sfx/success.mp3");
  sfxError   = new Audio("sfx/error.mp3");

  bgMusic = new Audio("music/speedTypingMusic.mp3");
  bgMusic.loop = true;
  bgMusic.volume = 0.25;
} catch (e) {
  console.warn("Audio speedTyping non disponible:", e);
}

function playSfx(audio) {
  if (!audio) return;
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {
    
  }
}

function withClickSfx(handler) {
  return function (event) {
    playSfx(sfxClic);
    return handler(event);
  };
}

function ensureMusic() {
  if (window.GlobalAudio && GlobalAudio.music) {
    try {
      GlobalAudio.music.pause();
    } catch {}
  }
  if (!bgMusic) return;
  if (bgMusic.paused) {
    bgMusic.play().catch(() => {});
  }
}

function stopMusic() {
  if (!bgMusic) return;
  bgMusic.pause();
  bgMusic.currentTime = 0;
}

// --- DOM ---
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
const backMenuBtn = document.getElementById("st-back-menu");
const backMenuBtn2 = document.getElementById("st-back-menu2");

// ---- NAVIGATION ----
function goBackToMenu() {
  stopMusic();

  window.location.hash = "#menu";

  if (!window.Router) {
    window.location.href = "/public/index.html#games";
  }
}

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

// ---- LOGIQUE ----
function startGame() {
  ensureMusic();

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
  bestRow.classList.add("hidden");

  startBtn.classList.add("hidden");
  replayBtn.classList.add("hidden");

  backMenuBtn.classList.remove("hidden");

  input.disabled = false;
  validateBtn.disabled = false;

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
    playSfx(sfxSuccess);

    localScore++;
    scoreSpan.textContent = localScore.toString();
    feedbackDiv.textContent = "Bravo!";
    feedbackDiv.classList.add("good");

  } else {
    playSfx(sfxError);
    feedbackDiv.textContent = `Le mot était "${currentWord}".`;
    feedbackDiv.classList.add("bad");
  }

  setTimeout(nextRound, 2000);
}

function handleTimeout() {
  if (!awaitingAnswer) return;
  awaitingAnswer = false;

  updateLevel(false);
  playSfx(sfxError);

  feedbackDiv.textContent = `Temps écoulé! Le mot était "${currentWord}".`;
  feedbackDiv.classList.add("bad");

  setTimeout(nextRound, 2000);
}

async function endGame() {
  clearInterval(timerId);
  awaitingAnswer = false;

  wordSpan.textContent = "Bon travail!";
  input.value = "";

  input.disabled = true;
  validateBtn.disabled = true;

  backMenuBtn.classList.add("hidden");

  finalScoreSpan.textContent = localScore.toString();
  summary.classList.remove("hidden");
  replayBtn.classList.remove("hidden");

  try {
    await ScoreService.saveScore("speedTyping", localScore);
  } catch (e) {
    console.warn("saveScore speedTyping:", e);
  }

  try {
    const scores = await ScoreService.getScore();
    const globalScore = Math.max(...scores.map(s => s.score));
    bestScoreSpan.textContent = globalScore.toString();
    bestRow.classList.remove("hidden");
  } catch (e) {
    console.warn("getScore speedTyping:", e);
    bestRow.classList.add("hidden");
  }
}

startBtn.addEventListener("click", withClickSfx(startGame));
replayBtn.addEventListener("click", withClickSfx(startGame));

backMenuBtn.addEventListener("click", withClickSfx(goBackToMenu));
backMenuBtn2.addEventListener("click", withClickSfx(goBackToMenu));

validateBtn.addEventListener("click", withClickSfx(handleValidate));

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleValidate();
  }
});

// ---- INITIALISATION ----
function initSpeedTyping() {
  ScoreService.init("speedTyping");

  clearInterval(timerId);
  level = 1;
  localScore = 0;
  roundIndex = 0;
  correctStreak = 0;
  awaitingAnswer = false;

  scoreSpan.textContent = "0";
  levelSpan.textContent = "1";
  roundSpan.textContent = "0";

  feedbackDiv.className = "";
  feedbackDiv.textContent = "Clique sur « Commencer » pour démarrer la partie !";

  wordSpan.textContent = "Prépare-toi à taper vite !";

  summary.classList.add("hidden");
  bestRow.classList.add("hidden");

  startBtn.classList.remove("hidden");
  replayBtn.classList.add("hidden");
  backMenuBtn.classList.remove("hidden");

  input.disabled = true;
  validateBtn.disabled = true;
}

initSpeedTyping();
