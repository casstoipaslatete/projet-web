import { ScoreService } from "../../scripts/scoreService.js";

// ---------- DOM ----------
const pads = document.querySelectorAll(".simon-pad");
const startBtn = document.getElementById("start-btn");
const scoreDisplay = document.getElementById("score");

const summary = document.getElementById("summary");
const finalScoreDisplay = document.getElementById("final-score");
const bestRow = document.getElementById("best-row");
const bestScoreSpan = document.getElementById("best-score");
const replayBtn = document.getElementById("replay-btn");
const backMenuBtn = document.getElementById("back-menu-btn");
const backBtnInGame = document.getElementById("btn-back");

// ---------- ÉTAT ----------
const colors = ["green", "red", "yellow", "blue"];
let sequence = [];
let playerSequence = [];
let score = 0;
let sequenceTurn = false;
let gameOver = false;

// ---------- AUDIO ----------
let sfxSimonBeep, sfxClic, sfxError;
let bgMusic;

try {
  // SFX
  sfxSimonBeep = new Audio("sfx/simonBeep.mp3");
  sfxClic      = new Audio("sfx/clic.mp3");
  sfxError     = new Audio("sfx/error.mp3");

  // Musique de fond
  bgMusic = new Audio("music/SimonMusic.mp3");
  bgMusic.loop = true;
  bgMusic.volume = 0.25;
  bgMusic.play().catch(() => {});
} catch (e) {
  console.warn("Audio Simon non disponible:", e);
}

function playSfx(audio) {
  if (!audio) return;
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {
    // ignore
  }
}

function withClickSfx(handler) {
  return function (event) {
    playSfx(sfxClic);
    return handler(event);
  };
}

function ensureMusic() {
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

// ---------- NAVIGATION ----------
function goBackToMenu() {
  stopMusic();

  // Hash pour la SPA
  window.location.hash = "#menu";

  // Fallback si jamais Router n'est pas là (chargé en standalone)
  if (!window.Router) {
    window.location.href = "/public/index.html#games";
  }
}

// ---------- LOGIQUE DU JEU ----------
function updateScore(newScore) {
  score = newScore;
  scoreDisplay.textContent = score.toString();
}

function startGame() {
  ensureMusic();

  const backBtnInGameLocal = document.getElementById("btn-back");
  if (backBtnInGameLocal) backBtnInGameLocal.classList.remove("hidden");

  ScoreService.init("Simon");

  sequence = [];
  playerSequence = [];
  score = 0;
  sequenceTurn = false;
  gameOver = false;

  ScoreService.init("Simon");

  updateScore(0);
  summary.classList.add("hidden");
  bestRow.classList.add("hidden");

  startBtn.classList.add("hidden");
  replayBtn.classList.add("hidden");

  nextTurn();
}

function nextTurn() {
  playerSequence = [];
  sequenceTurn = true;

  const nextColor = colors[Math.floor(Math.random() * colors.length)];
  sequence.push(nextColor);

  playSequence();
}

async function playSequence() {
  await wait(500);

  for (const color of sequence) {
    await flashPad(color);
    await wait(250);
  }

  sequenceTurn = false;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function flashPad(color) {
  return new Promise((resolve) => {
    const pad = document.querySelector(`.simon-pad[data-color="${color}"]`);
    if (!pad) return resolve();

    // son du pad
    playSfx(sfxSimonBeep);

    pad.classList.add("active");
    setTimeout(() => {
      pad.classList.remove("active");
      resolve();
    }, 500);
  });
}

pads.forEach((pad) => {
  pad.addEventListener("click", async () => {
    if (sequenceTurn || gameOver) return;

    const clickedColor = pad.dataset.color;

    // petit flash visuel + son au clic
    await flashPad(clickedColor);

    playerSequence.push(clickedColor);
    checkPlayerInput();
  });
});

function checkPlayerInput() {
  const currentStep = playerSequence.length - 1;

  if (playerSequence[currentStep] !== sequence[currentStep]) {
    playSfx(sfxError);
    endGame();
    return;
  }

  if (playerSequence.length === sequence.length) {
    const newScore = score + 1;
    updateScore(newScore);

    setTimeout(nextTurn, 900);
  }
}

async function endGame() {
  gameOver = true;

  // Cacher le bouton Retour du milieu en fin de partie
  const backBtnInGameLocal = document.getElementById("btn-back");
  if (backBtnInGameLocal) backBtnInGameLocal.classList.add("hidden");

  finalScoreDisplay.textContent = score.toString();
  summary.classList.remove("hidden");
  replayBtn.classList.remove("hidden");

  // Sauvegarde du meilleur score
  try {
    await ScoreService.saveScore("Simon", score);
  } catch (e) {
    console.warn("saveScore simon:", e);
  }

  try {
    const scores = await ScoreService.getScore();
    const best = Math.max(...scores.map(s => s.score));
    bestScoreSpan.textContent = best.toString();
    bestRow.classList.remove("hidden");
  } catch (e) {
    console.warn("getScore simon:", e);
    bestRow.classList.add("hidden");
  }
}

// ---------- EVENTS ----------
startBtn.addEventListener("click", withClickSfx(startGame));
replayBtn.addEventListener("click", withClickSfx(startGame));

backMenuBtn.addEventListener("click", withClickSfx(goBackToMenu));
backBtnInGame.addEventListener("click", withClickSfx(goBackToMenu));

// ---------- INIT ----------
function initSimon() {
  ScoreService.init("simon");

  startBtn.classList.remove("hidden");
  replayBtn.classList.add("hidden");
  summary.classList.add("hidden");
  bestRow.classList.add("hidden");

  updateScore(0);
}

initSimon();
