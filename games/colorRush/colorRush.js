import { ScoreService } from "../../scripts/scoreService.js";

const TOTAL_ROUNDS = 10;

let level = 1;
let localScore = 0;
let roundIndex = 0;
let correctStreak = 0;

let currentTargetColor = null;
let awaitingAnswer = false;

let timerId = null;
let timeLeftMs = 0;
let maxTimeMs = 7000;

const COLORS = [
  { value: "rouge",  label: "ROUGE",  css: "#e74c3c" },
  { value: "bleu",   label: "BLEU",   css: "#3498db" },
  { value: "vert",   label: "VERT",   css: "#27ae60" },
  { value: "jaune",  label: "JAUNE",  css: "#f1c40f" },
  { value: "violet", label: "VIOLET", css: "#8e44ad" },
  { value: "orange", label: "ORANGE", css: "#e67e22" },
  { value: "blanc",  label: "BLANC",  css: "#ecf0f1" },
  { value: "brun",   label: "BRUN",   css: "#8d6e63" },
];

// DOM
const roundSpan = document.getElementById("cr-round");
const scoreSpan = document.getElementById("cr-score");
const levelSpan = document.getElementById("cr-level");
const wordSpan = document.getElementById("cr-word");
const timerBar = document.getElementById("cr-timer-bar");
const feedbackDiv = document.getElementById("cr-feedback");

const buttonsContainer = document.getElementById("cr-buttons");
let colorButtons = []; // sera rempli dynamiquement

const summary = document.getElementById("cr-summary");
const finalScoreSpan = document.getElementById("cr-final-score");
const bestRow = document.getElementById("cr-best-row");
const bestScoreSpan = document.getElementById("cr-best-score");

const startBtn = document.getElementById("cr-start");
const replayBtn = document.getElementById("cr-replay");
const backMenuBtn2 = document.getElementById("cr-back-menu2");

// ---------- Navigation vers l'arcade ----------
function goBackToMenu() {
  window.location.href = "/index.html#menu";
}
backMenuBtn2.addEventListener("click", goBackToMenu);

// ---------- Helpers ----------
function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function pickRandomColor() {
  return COLORS[randomInt(COLORS.length)];
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

  if (level === 1) maxTimeMs = 7000;
  else if (level === 2) maxTimeMs = 5500;
  else maxTimeMs = 4500;

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

// ---------- Création dynamique des boutons ----------
function createColorButtons() {
  buttonsContainer.innerHTML = "";
  colorButtons = COLORS.map(colorObj => {
    const btn = document.createElement("button");
    btn.className = "cr-color-btn";
    btn.dataset.color = colorObj.value;
    btn.textContent = colorObj.label;
    buttonsContainer.appendChild(btn);

    btn.addEventListener("click", handleColorClick);
    return btn;
  });
}

// ---------- Setup de chaque tour ----------
function setupRound() {
  roundIndex++;
  if (roundIndex > TOTAL_ROUNDS) {
    endGame();
    return;
  }

  roundSpan.textContent = roundIndex.toString();
  feedbackDiv.textContent = "";
  feedbackDiv.className = "";

  // Choix de la couleur cible
  const target = pickRandomColor();
  currentTargetColor = target.value;

  // Choix si on active un "piège" Stroop
  let useTrap = false;
  if (level === 2) {
    useTrap = Math.random() < 0.4;
  } else if (level === 3) {
    useTrap = Math.random() < 0.8;
  }

  let displayColorCss = target.css;
  if (useTrap) {
    const otherChoices = COLORS.filter(c => c.value !== target.value);
    const trapColor = otherChoices[randomInt(otherChoices.length)];
    displayColorCss = trapColor.css;
  }

  wordSpan.textContent = target.label;
  wordSpan.style.color = displayColorCss;

  // On mélange l'ordre des couleurs pour les boutons
  const shuffledColors = shuffle(COLORS);
  shuffledColors.forEach((colorObj, idx) => {
    const btn = colorButtons[idx];
    if (!btn) return;
    btn.dataset.color = colorObj.value;
    btn.textContent = colorObj.label;
  });

  awaitingAnswer = true;
  startTimer();
}

// ---------- Logique du jeu ----------
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
  wordSpan.style.color = "white";
  wordSpan.textContent = "Prépare-toi...";

  ScoreService.init("colorRush");
  ScoreService.resetScore().catch(err =>
    console.warn("resetScore colorRush:", err)
  );

  setTimeout(() => {
    setupRound();
  }, 700);
}

function handleColorClick(event) {
  if (!awaitingAnswer) return;

  const chosenColor = event.currentTarget.dataset.color;
  clearInterval(timerId);
  awaitingAnswer = false;

  const isCorrect = chosenColor === currentTargetColor;
  updateLevel(isCorrect);

  if (isCorrect) {
    localScore++;
    scoreSpan.textContent = localScore.toString();
    feedbackDiv.textContent = "Bravo!";
    feedbackDiv.classList.add("good");

    ScoreService.addPoints(1).catch(err =>
      console.warn("addPoints colorRush:", err)
    );
  } else {
    const correctLabel =
      COLORS.find(c => c.value === currentTargetColor)?.label || "";
    feedbackDiv.textContent = `La bonne couleur était ${correctLabel}.`;
    feedbackDiv.classList.add("bad");
  }

  setTimeout(() => {
    setupRound();
  }, 900);
}

function handleTimeout() {
  if (!awaitingAnswer) return;
  awaitingAnswer = false;

  updateLevel(false);

  const correctLabel =
    COLORS.find(c => c.value === currentTargetColor)?.label || "";

  feedbackDiv.textContent = `Temps écoulé! La bonne couleur était ${correctLabel}.`;
  feedbackDiv.classList.add("bad");

  setTimeout(() => {
    setupRound();
  }, 1200);
}

async function endGame() {
  clearInterval(timerId);
  awaitingAnswer = false;

  wordSpan.textContent = "Bien joué!";
  wordSpan.style.color = "white";

  finalScoreSpan.textContent = localScore.toString();
  summary.classList.remove("hidden");

  try {
    await ScoreService.saveScore("colorRush", localScore);
  } catch (e) {
    console.warn("saveScore colorRush:", e);
  }

  try {
    const globalScore = await ScoreService.getScore();
    bestScoreSpan.textContent = globalScore.toString();
    bestRow.classList.remove("hidden");
  } catch (e) {
    console.warn("getScore colorRush:", e);
    bestRow.classList.add("hidden");
  }
}

// ---------- Events & init ----------
createColorButtons();

startBtn.addEventListener("click", startGame);
replayBtn.addEventListener("click", startGame);

// init de base pour le service de score
ScoreService.init("colorRush");
