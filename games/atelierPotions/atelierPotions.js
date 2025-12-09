import { ScoreService } from "../../scripts/scoreService.js";

/**
 * faucetStates = [bool, bool, bool]
 * true  = robinet OUVERT
 * false = robinet FERMÉ
 *
 * Index 0 = ROUGE (gauche)
 * Index 1 = JAUNE (milieu)
 * Index 2 = BLEU (droite)
 */

// --- SONS ET MUSIQUE ---
let sfxClic, sfxFaucet, sfxSuccess, sfxError;
try {
  sfxClic = new Audio("sfx/clic.mp3");
  sfxFaucet = new Audio("sfx/faucet.mp3");
  sfxSuccess = new Audio("sfx/success.mp3");
  sfxError = new Audio("sfx/error.mp3");
} catch (e) {
  console.warn("Audio non disponible:", e);
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

// Musique du mini-jeu
const audio = new Audio("music/atelierPotionsMusic.mp3");
audio.loop = true;
audio.volume = 0.25;
audio.play().catch(() => {});

// --- Mélanges de couleurs ---
function computeMixColor(states) {
  const colors = [];
  if (states[0]) colors.push("rouge");
  if (states[1]) colors.push("jaune");
  if (states[2]) colors.push("bleu");

  const key = colors.sort().join("+");

  switch (key) {
    case "":
      return { name: "VIDE", css: "#1c2833" };
    case "rouge":
      return { name: "ROUGE", css: "#e74c3c" };
    case "jaune":
      return { name: "JAUNE", css: "#f1c40f" };
    case "bleu":
      return { name: "BLEU", css: "#3498db" };
    case "jaune+rouge":
      return { name: "ORANGE", css: "#e67e22" };
    case "bleu+jaune":
      return { name: "VERTE", css: "#2ecc71" };
    case "bleu+rouge":
      return { name: "VIOLETTE", css: "#9b59b6" };
    case "bleu+jaune+rouge":
      return { name: "BRUNE", css: "#8e5b3a" };
    default:
      return { name: "INCONNUE", css: "#7f8c8d" };
  }
}

// --- Énigmes ---
const PUZZLES = [
  {
    text: "Potion logique : exactement 1 robinet doit être OUVERT.",
    validate: (s) => s.filter(Boolean).length === 1,
  },
  {
    text: "Potion ROUGE pure : seulement le robinet ROUGE doit être OUVERT.",
    validate: (s) => s[0] === true && s[1] === false && s[2] === false,
  },
  {
    text: "Grosse potion : au moins 2 robinets doivent être OUVERTS.",
    validate: (s) => s.filter(Boolean).length >= 2,
  },
  {
    text: "Potion JAUNE pure : seulement le robinet JAUNE doit être OUVERT.",
    validate: (s) => s[0] === false && s[1] === true && s[2] === false,
  },
  {
    text: "Potion du milieu : SEUL le robinet du MILIEU doit être OUVERT.",
    validate: (s) => s[0] === false && s[1] === true && s[2] === false,
  },
  {
    text: "Potion BLEUE pure : seulement le robinet BLEU doit être OUVERT.",
    validate: (s) => s[0] === false && s[1] === false && s[2] === true,
  },
  {
    text: "Potion des extrémités : exactement 2 robinets OUVERTS, mais celui du MILIEU doit rester FERMÉ.",
    validate: (s) => {
      const onCount = s.filter(Boolean).length;
      return onCount === 2 && s[1] === false;
    },
  },
  {
    text: "Potion ORANGE : mélange ROUGE et JAUNE.",
    validate: (s) => s[0] === true && s[1] === true && s[2] === false,
  },
  {
    text: "Potion équilibrée : les robinets de GAUCHE et du MILIEU doivent être PAREILS, et celui de DROITE doit être DIFFÉRENT.",
    validate: (s) => s[0] === s[1] && s[2] !== s[0],
  },
  {
    text: "Potion VERTE : mélange JAUNE et BLEU.",
    validate: (s) => s[0] === false && s[1] === true && s[2] === true,
  },
  {
    text: "Potion déséquilibrée : le robinet de GAUCHE et celui de DROITE doivent être DIFFÉRENTS.",
    validate: (s) => s[0] !== s[2],
  },
  {
    text: "Potion VIOLETTE : mélange ROUGE et BLEU.",
    validate: (s) => s[0] === true && s[1] === false && s[2] === true,
  },
  {
    text: "Potion fragile : au moins un robinet doit être OUVERT, mais pas les trois.",
    validate: (s) => {
      const onCount = s.filter(Boolean).length;
      return onCount >= 1 && onCount < 3;
    },
  },
  {
    text: "Potion BRUNE très forte : les TROIS robinets doivent être OUVERTS.",
    validate: (s) => s[0] === true && s[1] === true && s[2] === true,
  },
];

const TOTAL_PUZZLES = PUZZLES.length;

// État du jeu
let faucetStates = [false, false, false];
let currentPuzzleIndex = 0;
let solvedCount = 0;
let puzzleAlreadyCounted = false;

// DOM
const puzzleIndexSpan = document.getElementById("cl-puzzle-index");
const puzzleTotalSpan = document.getElementById("cl-puzzle-total");
const scoreSpan = document.getElementById("cl-score");
const puzzleText = document.getElementById("cl-puzzle-text");

const faucets = Array.from(document.querySelectorAll(".cl-faucet"));
const indicator = document.getElementById("cl-indicator");
const indicatorLabel = document.getElementById("cl-indicator-label");
const potionBar = document.getElementById("cl-potion-bar");
const feedbackDiv = document.getElementById("cl-feedback");

const startBtn = document.getElementById("cl-start");
const validateBtn = document.getElementById("cl-validate");
const nextBtn = document.getElementById("cl-next");

const summary = document.getElementById("cl-summary");
const finalScoreSpan = document.getElementById("cl-final-score");
const finalTotalSpan = document.getElementById("cl-final-total");
const bestRow = document.getElementById("cl-best-row");
const bestScoreSpan = document.getElementById("cl-best-score");

const replayBtn = document.getElementById("cl-replay");
const backBtn = document.getElementById("cl-back");

// ---------- État initial de l'interface ----------
function initUI() {
  // Texte d'intro
  puzzleIndexSpan.textContent = "1";
  puzzleTotalSpan.textContent = TOTAL_PUZZLES.toString();
  puzzleText.textContent =
    'Appuie sur « Commencer » pour préparer ta première potion.';

  // Potion vide
  faucetStates = [false, false, false];
  updateFaucetUI();
  potionBar.style.width = "0%";
  potionBar.style.backgroundColor = "#1c2833";
  indicatorLabel.textContent = "Potion actuelle : VIDE";
  indicator.classList.add("off");
  indicator.classList.remove("on");
  setFeedback("", null);

  // Boutons visibles / cachés au démarrage
  startBtn.classList.remove("hidden");
  startBtn.disabled = false;

  validateBtn.classList.add("hidden");
  validateBtn.disabled = true;

  nextBtn.classList.add("hidden");
  nextBtn.disabled = true;

  summary.classList.add("hidden");
}

// ---------- Navigation ----------
function goBackToMenu() {
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {}

  if (window.GlobalAudio) {
    GlobalAudio.startMusic();
  }

  window.location.href = "/public/index.html#games";
}

if (backBtn) {
  backBtn.addEventListener("click", withClickSfx(goBackToMenu));
}

// ---------- Helpers UI ----------
function updateFaucetUI() {
  faucets.forEach((btn, index) => {
    const isOpen = faucetStates[index];
    btn.classList.toggle("open", isOpen);
    btn.textContent = isOpen ? "Ouvert" : "Fermé";
  });
}

function updatePotionVisual() {
  const mix = computeMixColor(faucetStates);
  const openCount = faucetStates.filter(Boolean).length;

  const ratio = openCount / 3;
  potionBar.style.width = `${ratio * 100}%`;
  potionBar.style.backgroundColor = mix.css;

  indicatorLabel.textContent = `Potion actuelle : ${mix.name}`;
}

function showValidationResult(valid) {
  indicator.classList.toggle("on", valid);
  indicator.classList.toggle("off", !valid);
}

function setFeedback(message, type) {
  feedbackDiv.textContent = message || "";
  feedbackDiv.className = "";
  if (type) {
    feedbackDiv.classList.add(type);
  }
}

function loadPuzzle(index) {
  currentPuzzleIndex = index;
  puzzleAlreadyCounted = false;

  const puzzle = PUZZLES[currentPuzzleIndex];
  puzzleText.textContent = puzzle.text;
  puzzleIndexSpan.textContent = (currentPuzzleIndex + 1).toString();
  puzzleTotalSpan.textContent = TOTAL_PUZZLES.toString();

  // reset robinets
  faucetStates = [false, false, false];
  updateFaucetUI();
  potionBar.style.width = "0%";
  potionBar.style.backgroundColor = "#1c2833";
  indicatorLabel.textContent = "Potion actuelle : VIDE";
  indicator.classList.add("off");
  indicator.classList.remove("on");
  setFeedback("", null);

  // on remet "Valider" actif pour la nouvelle énigme
  validateBtn.classList.remove("hidden");
  validateBtn.disabled = false;

  nextBtn.classList.add("hidden");
  nextBtn.disabled = true;
}

function isCurrentPuzzleValid() {
  const puzzle = PUZZLES[currentPuzzleIndex];
  return puzzle.validate(faucetStates);
}

// ---------- Logique ----------
function startGame() {
  ScoreService.init("atelierPotions");
  ScoreService.resetScore().catch((err) =>
    console.warn("resetScore atelierPotions:", err)
  );

  solvedCount = 0;
  scoreSpan.textContent = "0";
  summary.classList.add("hidden");

  // pendant la partie : on cache "Commencer", on active "Valider"
  startBtn.classList.add("hidden");
  validateBtn.classList.remove("hidden");
  validateBtn.disabled = false;
  nextBtn.classList.add("hidden");
  nextBtn.disabled = true;

  loadPuzzle(0);
}

function handleFaucetClick(event) {
  const index = Number(event.currentTarget.dataset.index);
  faucetStates[index] = !faucetStates[index];
  updateFaucetUI();
  updatePotionVisual();
  playSfx(sfxFaucet);
}

async function handleValidate() {
  const valid = isCurrentPuzzleValid();
  showValidationResult(valid);

  if (valid) {
    setFeedback("Bravo! Tu as créé la bonne potion!", "good");
    playSfx(sfxSuccess);

    // une fois correct → on ne peut plus re-valider
    validateBtn.classList.add("hidden");
    validateBtn.disabled = true;

    if (!puzzleAlreadyCounted) {
      puzzleAlreadyCounted = true;
      solvedCount++;
      scoreSpan.textContent = solvedCount.toString();

      try {
        await ScoreService.addPoints(1);
      } catch (e) {
        console.warn("addPoints atelierPotions:", e);
      }
    }

    if (currentPuzzleIndex < TOTAL_PUZZLES - 1) {
      nextBtn.disabled = false;
      nextBtn.classList.remove("hidden");
      nextBtn.classList.add("btn-pop");
      setTimeout(() => nextBtn.classList.remove("btn-pop"), 300);
    } else {
      await endGame();
    }
  } else {
    setFeedback(
      "Hmm... cette potion ne correspond pas encore à la recette. Essaie une autre combinaison!",
      "bad"
    );
    playSfx(sfxError);
  }
}

async function endGame() {
  finalScoreSpan.textContent = solvedCount.toString();
  finalTotalSpan.textContent = TOTAL_PUZZLES.toString();
  summary.classList.remove("hidden");

  // Fin de partie :
  // - on CACHE Commencer / Valider / Prochaine potion
  // - on ne garde visibles que Rejouer + Retour
  startBtn.classList.add("hidden");
  validateBtn.classList.add("hidden");
  validateBtn.disabled = true;
  nextBtn.classList.add("hidden");
  nextBtn.disabled = true;

  try {
    await ScoreService.saveScore("atelierPotions", solvedCount);
  } catch (e) {
    console.warn("saveScore atelierPotions:", e);
  }

  try {
    const globalScore = await ScoreService.getScore();
    bestScoreSpan.textContent = globalScore.toString();
    bestRow.classList.remove("hidden");
  } catch (e) {
    console.warn("getScore atelierPotions:", e);
    bestRow.classList.add("hidden");
  }
}

function handleNext() {
  if (currentPuzzleIndex < TOTAL_PUZZLES - 1) {
    loadPuzzle(currentPuzzleIndex + 1);
    startBtn.classList.add("hidden"); // on garde "Commencer" caché
  }
}

// ---------- Events ----------
faucets.forEach((btn) => {
  btn.addEventListener("click", handleFaucetClick);
});

startBtn.addEventListener("click", withClickSfx(startGame));
validateBtn.addEventListener("click", withClickSfx(handleValidate));
nextBtn.addEventListener("click", withClickSfx(handleNext));
replayBtn.addEventListener("click", withClickSfx(startGame));

// Init de base
ScoreService.init("atelierPotions");
initUI();
