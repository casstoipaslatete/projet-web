import { ScoreService } from "../../scripts/scoreService.js";

const pads = document.querySelectorAll('.simon-pad');
const startBtn = document.getElementById('start-btn');
const scoreDisplay = document.getElementById('score');

const summary = document.getElementById('summary');
const finalScoreDisplay = document.getElementById('final-score');
const replayBtn = document.getElementById('replay-btn');
const backMenuBtn = document.getElementById('back-menu-btn');

const colors = ['green', 'red', 'yellow', 'blue'];
let sequence = [];
let playerSequence = [];
let score = 0;
let sequenceTurn = false;
let gameOver = false;

// --- SONS ET MUSIQUE ---
let sfxSimonBeep, sfxClic, sfxError;
try {
  sfxSimonBeep = new Audio("sfx/simonBeep.mp3");
  sfxClic      = new Audio("sfx/clic.mp3");
  sfxError     = new Audio("sfx/error.mp3");
} catch (e) {
  console.warn("Audio non disponible:", e);
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

const audio = new Audio('music/simonMusic.mp3');

audio.loop = true;

audio.play();

// ---------- Listeners boutons ----------
startBtn.addEventListener('click', withClickSfx(startGame));
replayBtn.addEventListener('click', withClickSfx(startGame));
backMenuBtn.addEventListener('click', withClickSfx(() => {
  window.location.href = "/index.html#menu";
}));

function startGame() {
  sequence = [];
  playerSequence = [];
  score = 0;
  sequenceTurn = false;
  gameOver = false;

  ScoreService.init("Simon");

  updateScore(0);
  summary.classList.add('hidden');

  startBtn.classList.add('hidden');
  replayBtn.classList.add('hidden');

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
  await new Promise(resolve => setTimeout(resolve, 500));
  for (const color of sequence) {
    await flashPad(color);
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  sequenceTurn = false;
}

function flashPad(color) {
  return new Promise(resolve => {
    const pad = document.querySelector(`.simon-pad[data-color="${color}"]`);

    playSfx(sfxSimonBeep);

    pad.classList.add('active');
    setTimeout(() => {
      pad.classList.remove('active');
      resolve();
    }, 600);
  });
}

pads.forEach(pad => {
  pad.addEventListener('click', () => {
    if (sequenceTurn || gameOver) return;

    const clickedColor = pad.dataset.color;

    flashPad(clickedColor);
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
    updateScore(score + 1);
    setTimeout(nextTurn, 1000);
  }
}

function updateScore(newScore) {
  score = newScore;
  scoreDisplay.textContent = score;
}

async function endGame() {
  gameOver = true;

  finalScoreDisplay.textContent = score;
  summary.classList.remove('hidden');

  replayBtn.classList.remove('hidden');

  try {
    await ScoreService.saveScore("Simon", score);
  } catch (e) {
    console.warn("saveScore Simon:", e);
  }
}

// ---------- État initial ----------
function initSimon() {
  startBtn.classList.remove('hidden');
  replayBtn.classList.add('hidden');
  summary.classList.add('hidden');

  score = 0;
  updateScore(0);
}

initSimon();
