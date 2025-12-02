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

const audio = new Audio('music/atelierPotionsMusic.mp3');

audio.loop = true;

audio.play();

// To stop the loop later:
// audio.pause();
// audio.currentTime = 0; // Optional: reset playback position

// --- Mélanges de couleurs ---
// On détermine la couleur de la potion en fonction des robinets ouverts.
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
  // 1) LOGIQUE : exactement 1 robinet ouvert
  {
    text: "Potion logique : exactement 1 robinet doit être OUVERT.",
    validate: (s) => s.filter(Boolean).length === 1,
  },

  // 2) COULEUR : ROUGE pure
  {
    text: "Potion ROUGE pure : seulement le robinet ROUGE doit être OUVERT.",
    validate: (s) => s[0] === true && s[1] === false && s[2] === false,
  },

  // 3) LOGIQUE : au moins 2 robinets ouverts
  {
    text: "Grosse potion : au moins 2 robinets doivent être OUVERTS.",
    validate: (s) => s.filter(Boolean).length >= 2,
  },

  // 4) COULEUR : JAUNE pure
  {
    text: "Potion JAUNE pure : seulement le robinet JAUNE doit être OUVERT.",
    validate: (s) => s[0] === false && s[1] === true && s[2] === false,
  },

  // 5) LOGIQUE : seulement le milieu ouvert
  {
    text: "Potion du milieu : SEUL le robinet du MILIEU doit être OUVERT.",
    // [false, true, false]
    validate: (s) => s[0] === false && s[1] === true && s[2] === false,
  },

  // 6) COULEUR : BLEUE pure
  {
    text: "Potion BLEUE pure : seulement le robinet BLEU doit être OUVERT.",
    validate: (s) => s[0] === false && s[1] === false && s[2] === true,
  },

  // 7) LOGIQUE : 2 ouverts, milieu fermé
  {
    text: "Potion des extrémités : exactement 2 robinets OUVERTS, mais celui du MILIEU doit rester FERMÉ.",
    // 2 ON, milieu = false
    validate: (s) => {
      const onCount = s.filter(Boolean).length;
      return onCount === 2 && s[1] === false;
    },
  },

  // 8) COULEUR : ORANGE (rouge + jaune)
  {
    text: "Potion ORANGE : mélange ROUGE et JAUNE.",
    validate: (s) => s[0] === true && s[1] === true && s[2] === false,
  },

  // 9) LOGIQUE : gauche & milieu pareils, droite différente
  {
    text: "Potion équilibrée : les robinets de GAUCHE et du MILIEU doivent être PAREILS, et celui de DROITE doit être DIFFÉRENT.",
    // s0 == s1 && s2 != s0
    validate: (s) => s[0] === s[1] && s[2] !== s[0],
  },

  // 10) COULEUR : VERTE (jaune + bleu)
  {
    text: "Potion VERTE : mélange JAUNE et BLEU.",
    validate: (s) => s[0] === false && s[1] === true && s[2] === true,
  },

  // 11) LOGIQUE : gauche et droite différents
  {
    text: "Potion déséquilibrée : le robinet de GAUCHE et celui de DROITE doivent être DIFFÉRENTS.",
    // XOR entre 1er et 3e
    validate: (s) => s[0] !== s[2],
  },

  // 12) COULEUR : VIOLETTE (rouge + bleu)
  {
    text: "Potion VIOLETTE : mélange ROUGE et BLEU.",
    validate: (s) => s[0] === true && s[1] === false && s[2] === true,
  },

  // 13) LOGIQUE : au moins 1 robinet, mais pas les 3
  {
    text: "Potion fragile : au moins un robinet doit être OUVERT, mais pas les trois.",
    // 1 ou 2 ON, mais pas 0 ni 3
    validate: (s) => {
      const onCount = s.filter(Boolean).length;
      return onCount >= 1 && onCount < 3;
    },
  },

  // 14) COULEUR : BRUNE (les 3 ouverts)
  {
    text: "Potion BRUNE très forte : les TROIS robinets doivent être OUVERTS.",
    validate: (s) => s[0] === true && s[1] === true && s[2] === true,
  },
];

const TOTAL_PUZZLES = PUZZLES.length;

// État du jeu
let faucetStates = [false, false, false]; // false = fermé, true = ouvert
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
const backMenuBtn = document.getElementById("cl-back-menu");
const backMenuBtn2 = document.getElementById("cl-back-menu2");

// ---------- Navigation ----------
function goBackToMenu() {
  window.location.href = "/index.html#menu";
}
backMenuBtn.addEventListener("click", goBackToMenu);
backMenuBtn2.addEventListener("click", goBackToMenu);

// ---------- Helpers UI ----------
function updateFaucetUI() {
  faucets.forEach((btn, index) => {
    const isOpen = faucetStates[index];
    btn.classList.toggle("open", isOpen);
    btn.textContent = isOpen ? "Ouvert" : "Fermé";
  });
}

// Met à jour UNIQUEMENT l'apparence de la potion (couleur + niveau),
// sans dire si la potion est correcte ou non.
function updatePotionVisual() {
  const mix = computeMixColor(faucetStates);
  const openCount = faucetStates.filter(Boolean).length;

  const ratio = openCount / 3;
  potionBar.style.width = `${ratio * 100}%`;
  potionBar.style.backgroundColor = mix.css;

  indicatorLabel.textContent = `Potion actuelle : ${mix.name}`;
}

// Sert uniquement au moment de la validation (après clic sur "Valider")
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
  indicator.classList.add("off");
  indicator.classList.remove("on");
  potionBar.style.width = "0%";
  potionBar.style.backgroundColor = "#1c2833";
  indicatorLabel.textContent = "Potion actuelle : VIDE";
  setFeedback("", null);

  // On cache et désactive "Prochaine énigme"
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
  ScoreService.resetScore().catch(err =>
    console.warn("resetScore atelierPotions:", err)
  );

  solvedCount = 0;
  scoreSpan.textContent = "0";
  summary.classList.add("hidden");

  // Pendant la partie : cacher Commencer, et cacher/désactiver Prochaine énigme
  startBtn.classList.add("hidden");
  nextBtn.classList.add("hidden");
  nextBtn.disabled = true;

  loadPuzzle(0);
}

function handleFaucetClick(event) {
  const index = Number(event.currentTarget.dataset.index);
  faucetStates[index] = !faucetStates[index];
  updateFaucetUI();
  updatePotionVisual(); // on met à jour la couleur, mais PAS la validité
  playSfx(sfxFaucet);
}

async function handleValidate() {
  const valid = isCurrentPuzzleValid();
  showValidationResult(valid);

  if (valid) {
    setFeedback("Bravo! Tu as créé la bonne potion!", "good");
    playSfx(sfxSuccess);

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
        nextBtn.classList.remove("hidden");   // on l’affiche
        nextBtn.classList.add("btn-pop");     // (si tu as ajouté l’anim)
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

  // Fin de partie : remettre les boutons dans l'état de départ
  startBtn.classList.remove("hidden");
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
    // on garde "Commencer" caché tant que la partie n'est pas finie
    startBtn.classList.add("hidden");
  }
}

// ---------- Events ----------

// Robinet : son spécial de robinet
faucets.forEach((btn) => {
  btn.addEventListener("click", handleFaucetClick);
});

// Boutons UI : clic standard + logique
startBtn.addEventListener("click", withClickSfx(startGame));
validateBtn.addEventListener("click", withClickSfx(handleValidate));
nextBtn.addEventListener("click", withClickSfx(handleNext));
replayBtn.addEventListener("click", withClickSfx(startGame));
backMenuBtn.addEventListener("click", withClickSfx(goBackToMenu));
backMenuBtn2.addEventListener("click", withClickSfx(goBackToMenu));

// Init de base
ScoreService.init("atelierPotions");
puzzleTotalSpan.textContent = TOTAL_PUZZLES.toString();
