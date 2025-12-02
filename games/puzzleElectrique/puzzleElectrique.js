import { ScoreService } from "../../scripts/scoreService.js";

// ==============================
// CONFIG DES PUZZLES
// ==============================
//
// Chaque puzzle contient:
// - sources: batteries possibles
// - modules: câbles / modules
// - outputs: sorties (lampes, moteur, etc.)
// - valid: combinaison correcte { sourceId, moduleId, outputId }
//
const PUZZLES = [
  {
    name: "Lampe du salon",
    sources: [
      {
        id: "bat_neuve",
        icon: "🔋",
        label: "Batterie neuve",
        hint: "Courant stable et puissant.",
      },
      {
        id: "bat_usee",
        icon: "🔋",
        label: "Batterie presque vide",
        hint: "Elle n'a presque plus d'énergie...",
      },
    ],
    modules: [
      {
        id: "fil_propre",
        icon: "📏",
        label: "Câble intact",
        hint: "Le courant passe bien.",
      },
      {
        id: "fil_coupe",
        icon: "✂️",
        label: "Câble coupé",
        hint: "Circuit ouvert, le courant ne passera pas.",
      },
      {
        id: "court_circuit",
        icon: "⚡",
        label: "Fil dénudé",
        hint: "Aïe, ça risque de faire un court-circuit...",
      },
    ],
    outputs: [
      {
        id: "lampe_ok",
        icon: "💡",
        label: "Lampe du salon",
        hint: "S'allume si le courant est bon.",
      },
      {
        id: "moteur",
        icon: "🌀",
        label: "Petit moteur",
        hint: "Il tourne, mais ce n'est pas ce qu'on veut.",
      },
      {
        id: "chauffage",
        icon: "🔥",
        label: "Résistance chauffante",
        hint: "Ça chauffe beaucoup!",
      },
    ],
    valid: {
      sourceId: "bat_neuve",
      moduleId: "fil_propre",
      outputId: "lampe_ok",
    },
  },
  {
    name: "Lampe du couloir",
    sources: [
      {
        id: "bat_neuve2",
        icon: "🔋",
        label: "Bloc pile",
        hint: "Parfait pour un long couloir.",
      },
      {
        id: "adaptateur_mur",
        icon: "🔌",
        label: "Prise murale",
        hint: "Beaucoup d'énergie... à utiliser avec soin.",
      },
    ],
    modules: [
      {
        id: "fil_long",
        icon: "〰️",
        label: "Câble long",
        hint: "Légère perte, mais ça passe.",
      },
      {
        id: "fil_torsade",
        icon: "🧵",
        label: "Câble emmêlé",
        hint: "Pas très fiable...",
      },
      {
        id: "protege_court_circuit",
        icon: "🧯",
        label: "Protection",
        hint: "Empêche les gros dégâts en cas d'erreur.",
      },
    ],
    outputs: [
      {
        id: "lampe_couloir",
        icon: "💡",
        label: "Lampe du couloir",
        hint: "Doit s'allumer sans tout faire sauter.",
      },
      {
        id: "sirene",
        icon: "📢",
        label: "Sirène",
        hint: "Aïe les oreilles...",
      },
      {
        id: "ventilateur",
        icon: "🌀",
        label: "Ventilateur",
        hint: "Ça souffle, mais ce n'est pas la lumière.",
      },
    ],
    valid: {
      sourceId: "adaptateur_mur",
      moduleId: "protege_court_circuit",
      outputId: "lampe_couloir",
    },
  },
  {
    name: "Lampe de la chambre",
    sources: [
      {
        id: "bat_pile_bouton",
        icon: "🔋",
        label: "Petite pile",
        hint: "Parfaite pour une lampe de chevet.",
      },
      {
        id: "bat_trop_forte",
        icon: "⚡",
        label: "Super batterie",
        hint: "Beaucoup trop puissante pour une petite lampe!",
      },
    ],
    modules: [
      {
        id: "fil_chevet",
        icon: "🧵",
        label: "Fil de chevet",
        hint: "Adapté à une petite lampe.",
      },
      {
        id: "fil_brico",
        icon: "🛠️",
        label: "Fil bricolé",
        hint: "On n'est pas certain que ce soit sécuritaire...",
      },
      {
        id: "court_circuit2",
        icon: "⚡",
        label: "Court-circuit risqué",
        hint: "Pas une bonne idée.",
      },
    ],
    outputs: [
      {
        id: "lampe_chambre",
        icon: "💡",
        label: "Lampe de chambre",
        hint: "Doux éclairage pour raconter des histoires.",
      },
      {
        id: "chauffage2",
        icon: "🔥",
        label: "Radiateur",
        hint: "Ça chauffe, mais ça n'éclaire pas.",
      },
      {
        id: "machine_bizarre",
        icon: "🧪",
        label: "Machine étrange",
        hint: "On ne sait pas trop ce que ça fait.",
      },
    ],
    valid: {
      sourceId: "bat_pile_bouton",
      moduleId: "fil_chevet",
      outputId: "lampe_chambre",
    },
  },
];

const TOTAL_PUZZLES = PUZZLES.length;

// ==============================
// AUDIO – musique & sfx
// ==============================
let sfxClic, sfxPowerOn, sfxZap;
let bgMusic;

try {
  sfxClic = new Audio("sfx/clic.mp3");           // clic local du jeu
  sfxPowerOn = new Audio("sfx/powerOn.mp3");     // lampe qui s'allume
  sfxZap = new Audio("sfx/zap.mp3");             // court-circuit / erreur

  bgMusic = new Audio("music/circuitElectriqueMusic.mp3");
  bgMusic.loop = true;
  bgMusic.volume = 0.7;
} catch (e) {
  console.warn("Audio circuitElectrique non disponible:", e);
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

// ==============================
// ÉTAT DU JEU
// ==============================
let currentPuzzleIndex = 0;
let solvedCount = 0;
let puzzleAlreadyCounted = false;

let selectedSourceId = null;
let selectedModuleId = null;
let selectedOutputId = null;

// ==============================
// DOM
// ==============================
const puzzleIndexSpan = document.getElementById("ce-puzzle-index");
const puzzleTotalSpan = document.getElementById("ce-puzzle-total");
const scoreSpan = document.getElementById("ce-score");

const lampEl = document.getElementById("ce-lamp");
const lampLabelEl = document.getElementById("ce-lamp-label");
const wireEl = document.getElementById("ce-wire");

const sourcesContainer = document.getElementById("ce-sources");
const modulesContainer = document.getElementById("ce-modules");
const outputsContainer = document.getElementById("ce-outputs");

const feedbackDiv = document.getElementById("ce-feedback");

const startBtn = document.getElementById("ce-start");
const launchBtn = document.getElementById("ce-launch");
const clearBtn = document.getElementById("ce-clear");

const summary = document.getElementById("ce-summary");
const finalScoreSpan = document.getElementById("ce-final-score");
const bestRow = document.getElementById("ce-best-row");
const bestScoreSpan = document.getElementById("ce-best-score");

const replayBtn = document.getElementById("ce-replay");
const backMenuBtn2 = document.getElementById("ce-back-menu2");
const backMenuBtn3 = document.getElementById("ce-back-menu3");

// ==============================
// NAVIGATION ARCADE
// ==============================
function goBackToMenu() {
  window.location.href = "/index.html#menu";
}

// ==============================
// HELPERS UI
// ==============================
function setFeedback(message, type) {
  feedbackDiv.textContent = message || "";
  feedbackDiv.className = "";
  if (type === "good") {
    feedbackDiv.classList.add("ce-good");
  } else if (type === "bad") {
    feedbackDiv.classList.add("ce-bad");
  }
}

function setLamp(on, text) {
  if (on) {
    lampEl.classList.add("ce-lamp-on");
    lampEl.classList.remove("ce-lamp-off");
    lampLabelEl.textContent = text || "La lampe est allumée !";
    wireEl.classList.add("ce-wire-on");
  } else {
    lampEl.classList.remove("ce-lamp-on");
    lampEl.classList.add("ce-lamp-off");
    lampLabelEl.textContent = text || "Lampe éteinte";
    wireEl.classList.remove("ce-wire-on");
  }
}

function clearSelections() {
  selectedSourceId = null;
  selectedModuleId = null;
  selectedOutputId = null;

  document
    .querySelectorAll(".ce-card")
    .forEach((card) => card.classList.remove("ce-selected"));
}

function refreshSelectionUI() {
  document.querySelectorAll(".ce-card").forEach((card) => {
    const group = card.dataset.group;
    const id = card.dataset.id;

    let shouldSelect = false;
    if (group === "source" && id === selectedSourceId) shouldSelect = true;
    if (group === "module" && id === selectedModuleId) shouldSelect = true;
    if (group === "output" && id === selectedOutputId) shouldSelect = true;

    card.classList.toggle("ce-selected", shouldSelect);
  });
}

// ==============================
// CHARGEMENT D'UN PUZZLE
// ==============================
function createCard(item, group) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "ce-card";
  card.dataset.group = group;
  card.dataset.id = item.id;

  card.innerHTML = `
    <div class="ce-card-icon">${item.icon}</div>
    <div class="ce-card-main">
      <div class="ce-card-label">${item.label}</div>
      <div class="ce-card-hint">${item.hint}</div>
    </div>
  `;

  card.addEventListener("click", () => {
    if (group === "source") {
      selectedSourceId = item.id;
    } else if (group === "module") {
      selectedModuleId = item.id;
    } else if (group === "output") {
      selectedOutputId = item.id;
    }
    refreshSelectionUI();
    setFeedback("", null);
  });

  return card;
}

function loadPuzzle(index) {
  currentPuzzleIndex = index;
  puzzleAlreadyCounted = false;

  const puzzle = PUZZLES[currentPuzzleIndex];

  puzzleIndexSpan.textContent = (currentPuzzleIndex + 1).toString();
  puzzleTotalSpan.textContent = TOTAL_PUZZLES.toString();

  // Reset UI
  setLamp(false, "Lampe éteinte");
  setFeedback(`Circuit : ${puzzle.name}`, null);
  clearSelections();

  sourcesContainer.innerHTML = "";
  modulesContainer.innerHTML = "";
  outputsContainer.innerHTML = "";

  puzzle.sources.forEach((src) => {
    const card = createCard(src, "source");
    sourcesContainer.appendChild(card);
  });

  puzzle.modules.forEach((mod) => {
    const card = createCard(mod, "module");
    modulesContainer.appendChild(card);
  });

  puzzle.outputs.forEach((out) => {
    const card = createCard(out, "output");
    outputsContainer.appendChild(card);
  });

  launchBtn.disabled = false;
  clearBtn.disabled = false;
}

// ==============================
// LOGIQUE DU JEU
// ==============================
function startGame() {
  ensureMusic();

  ScoreService.init("circuitElectrique");
  ScoreService.resetScore().catch((err) =>
    console.warn("resetScore circuitElectrique:", err)
  );

  solvedCount = 0;
  scoreSpan.textContent = "0";

  summary.classList.add("ce-hidden");
  setLamp(false, "Lampe éteinte");
  setFeedback("Choisis tes composants puis lance le courant !", null);

  startBtn.classList.add("ce-hidden");
  launchBtn.disabled = true;
  clearBtn.disabled = true;

  loadPuzzle(0);
}

function clearChoices() {
  clearSelections();
  setFeedback("Choix effacés. Recommence ton circuit.", null);
  setLamp(false, "Lampe éteinte");
}

function isCurrentCombinationValid() {
  const puzzle = PUZZLES[currentPuzzleIndex];
  const { sourceId, moduleId, outputId } = puzzle.valid;

  return (
    selectedSourceId === sourceId &&
    selectedModuleId === moduleId &&
    selectedOutputId === outputId
  );
}

async function handleLaunchCurrent() {
  if (!selectedSourceId || !selectedModuleId || !selectedOutputId) {
    setFeedback(
      "Tu dois choisir une batterie, un câble et une sortie avant de lancer le courant.",
      "bad"
    );
    playSfx(sfxZap);
    return;
  }

  const ok = isCurrentCombinationValid();

  if (ok) {
    setLamp(true, "La lampe s'allume, bravo !");
    setFeedback("Bravo ! Ton circuit est parfait, la lampe s'allume ! ⚡", "good");
    playSfx(sfxPowerOn);

    if (!puzzleAlreadyCounted) {
      puzzleAlreadyCounted = true;
      solvedCount++;
      scoreSpan.textContent = solvedCount.toString();

      try {
        await ScoreService.addPoints(1);
      } catch (e) {
        console.warn("addPoints circuitElectrique:", e);
      }
    }

    // Passage au puzzle suivant
    launchBtn.disabled = true;
    clearBtn.disabled = true;

    if (currentPuzzleIndex < TOTAL_PUZZLES - 1) {
      setTimeout(() => {
        loadPuzzle(currentPuzzleIndex + 1);
      }, 1000);
    } else {
      await endGame();
    }
  } else {
    // Mauvais circuit : court-circuit / erreur
    setLamp(false, "Lampe éteinte");
    setFeedback(
      "Oups... ce circuit ne fonctionne pas. Essaie une autre combinaison !",
      "bad"
    );
    playSfx(sfxZap);
  }
}

async function endGame() {
  finalScoreSpan.textContent = solvedCount.toString();
  summary.classList.remove("ce-hidden");

  startBtn.classList.remove("ce-hidden");
  launchBtn.disabled = true;
  clearBtn.disabled = true;

  try {
    await ScoreService.saveScore("circuitElectrique", solvedCount);
  } catch (e) {
    console.warn("saveScore circuitElectrique:", e);
  }

  try {
    const globalScore = await ScoreService.getScore();
    bestScoreSpan.textContent = globalScore.toString();
    bestRow.classList.remove("ce-hidden");
  } catch (e) {
    console.warn("getScore circuitElectrique:", e);
    bestRow.classList.add("ce-hidden");
  }
}

// ==============================
// EVENTS
// ==============================
startBtn.addEventListener("click", withClickSfx(startGame));
launchBtn.addEventListener("click", withClickSfx(handleLaunchCurrent));
clearBtn.addEventListener("click", withClickSfx(clearChoices));

replayBtn.addEventListener("click", withClickSfx(startGame));
backMenuBtn2.addEventListener("click", withClickSfx(goBackToMenu));
backMenuBtn3.addEventListener("click", withClickSfx(goBackToMenu));

// Init de base
ScoreService.init("circuitElectrique");
puzzleTotalSpan.textContent = TOTAL_PUZZLES.toString();
setLamp(false, "Lampe éteinte");
setFeedback("Appuie sur « Commencer » pour réparer ton premier circuit !", null);
