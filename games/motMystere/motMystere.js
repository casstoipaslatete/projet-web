import { ScoreService } from "../../scripts/scoreService.js";

/* --------------------------------------------------
    MUSIQUE + SFX
-------------------------------------------------- */
let sfxClick, sfxSuccess, sfxError;
let music;

const audio = new Audio("music/motMystereMusic.mp3");
audio.loop = true;
audio.volume = 0.25;
audio.play().catch(() => {});

function playSfx(a) {
  if (!a) return;
  try {
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}
}

function clickWrap(handler) {
  return function (e) {
    playSfx(sfxClick);
    return handler(e);
  };
}

/* --------------------------------------------------
    LOGIQUE DU JEU
-------------------------------------------------- */

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

// mots enfants
const WORDS_LEVEL_1 = [
  "chat","chien","papa","maman","nez","mer","lune","soleil",
  "main","livre","porte","table","tasse"
];

const WORDS_LEVEL_2 = [
  "maison","ecole","banane","orange","pantalon","salade",
  "camion","biscuit","chocolat","brouillard","caneton"
];

const WORDS_LEVEL_3 = [
  "dinosaure","ordinateur","telephone","papillon","robotique",
  "bibliotheque","squelette","pingouin","parapluie","astronaute"
];

function scramble(word) {
  return word
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

/* --------------------------------------------------
   DOM
-------------------------------------------------- */

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
const backBtn = document.getElementById("mm-back");

/* --------------------------------------------------
   SÉLECTION DES MOTS
-------------------------------------------------- */

function pickWord(level) {
  const arr =
    level === 1 ? WORDS_LEVEL_1 :
    level === 2 ? WORDS_LEVEL_2 :
                  WORDS_LEVEL_3;
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

/* --------------------------------------------------
   TIMER
-------------------------------------------------- */

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

/* --------------------------------------------------
   MANCHE
-------------------------------------------------- */

function nextRound() {
  roundIndex++;
  if (roundIndex > TOTAL_WORDS) return endGame();

  roundSpan.textContent = roundIndex;
  feedbackDiv.textContent = "";
  feedbackDiv.className = "";

  currentWord = pickWord(level);
  scrambledWord = scramble(currentWord);

  if (scrambledWord === currentWord) scrambledWord = scramble(currentWord);

  wordSpan.textContent = scrambledWord;
  input.value = "";
  input.focus();

  awaitingAnswer = true;
  startTimer();
}

function startGame() {
  playSfx(sfxClick);
  if (music) music.play().catch(() => {});

  score = 0;
  level = 1;
  roundIndex = 0;
  correctStreak = 0;
  awaitingAnswer = false;

  ScoreService.init("motMystere");

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

/* --------------------------------------------------
   VALIDATION
-------------------------------------------------- */

function handleValidate() {
  if (!awaitingAnswer) return;

  playSfx(sfxClick);

  const typed = input.value.trim().toLowerCase();
  awaitingAnswer = false;
  clearInterval(timerId);

  const isCorrect = typed === currentWord.toLowerCase();
  updateLevel(isCorrect);

  if (isCorrect) {
    playSfx(sfxSuccess);
    score++;
    scoreSpan.textContent = score;
    feedbackDiv.textContent = "Bravo !";
    feedbackDiv.classList.add("good");
  } else {
    playSfx(sfxError);
    feedbackDiv.textContent = `Le mot était « ${currentWord} ».`;
    feedbackDiv.classList.add("bad");
  }

  setTimeout(nextRound, 2000);
}

function handleTimeout() {
  if (!awaitingAnswer) return;
  awaitingAnswer = false;

  playSfx(sfxError);

  updateLevel(false);
  feedbackDiv.textContent = `Temps écoulé ! Le mot était « ${currentWord} ».`;
  feedbackDiv.classList.add("bad");

  setTimeout(nextRound, 2000);
}

/* --------------------------------------------------
   FIN DE PARTIE
-------------------------------------------------- */

async function endGame() {
  clearInterval(timerId);

  wordSpan.textContent = "Fin !";
  input.disabled = true;
  validateBtn.disabled = true;

  finalScoreSpan.textContent = score.toString();

  summary.classList.remove("hidden");

  try {
    await ScoreService.saveScore("motMystere", score);
  } catch (e) {
    console.warn("saveScore motMystere:", e);
  }

  try {
    const scores = await ScoreService.getScore();
    const globalScore = Math.max(...scores.map(s => s.score));
    bestScoreSpan.textContent = globalScore.toString();
    bestRow.classList.remove("ce-hidden");
  } catch (e) {
    console.warn("getScore motMystere:", e);
    bestRow.classList.add("ce-hidden");
  }

  replayBtn.classList.remove("hidden");
}

/* --------------------------------------------------
   BOUTON RETOUR
-------------------------------------------------- */

if (backBtn) {
  backBtn.addEventListener("click", () => {
    playSfx(sfxClick);
    window.location.href = "/public/index.html#games";
  });
}

/* --------------------------------------------------
   EVENTS
-------------------------------------------------- */

startBtn.addEventListener("click", clickWrap(startGame));
replayBtn.addEventListener("click", clickWrap(startGame));
validateBtn.addEventListener("click", handleValidate);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleValidate();
});

/* --------------------------------------------------
   INIT
-------------------------------------------------- */

function initMotMystere() {
  feedbackDiv.textContent = "Clique sur « Commencer » pour jouer !";
  input.disabled = true;
  validateBtn.disabled = true;
  summary.classList.add("hidden");
  replayBtn.classList.add("hidden");
}

initMotMystere();
