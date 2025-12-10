import { ScoreService } from "../../scripts/scoreService.js";

// ==============================
// LIBRAIRIE DES MODULES
// ==============================
const MODULE_LIBRARY = {
  wire: {
    id: "wire",
    icon: "➖",
    baseLabel: "Fil",
    baseHint: "Relie deux parties du circuit.",
    passes: true,
    hazard: false,
  },
  broken_wire: {
    id: "broken_wire",
    icon: "✂️",
    baseLabel: "Fil cassé",
    baseHint: "Le courant ne peut pas passer.",
    passes: false,
    hazard: false,
  },
  switch_on: {
    id: "switch_on",
    icon: "🔛",
    baseLabel: "Interrupteur ON",
    baseHint: "Laisse passer le courant.",
    passes: true,
    hazard: false,
  },
  switch_off: {
    id: "switch_off",
    icon: "⛔",
    baseLabel: "Interrupteur OFF",
    baseHint: "Bloque le courant.",
    passes: false,
    hazard: false,
  },
  diode_forward: {
    id: "diode_forward",
    icon: "▶️",
    baseLabel: "Diode ➜",
    baseHint: "Le courant passe dans ce sens.",
    passes: true,
    hazard: false,
  },
  diode_reverse: {
    id: "diode_reverse",
    icon: "◀️",
    baseLabel: "Diode ⬅",
    baseHint: "Le courant est bloqué.",
    passes: false,
    hazard: false,
  },
  short_wire: {
    id: "short_wire",
    icon: "⚡",
    baseLabel: "Fil dangereux",
    baseHint: "Le circuit marche, mais c’est risqué.",
    passes: true,
    hazard: true,
  },
};

// ==============================
// PUZZLES (plus variés & fun)
// ==============================
// goal:
//  - "LAMP_ON"       → lampe doit s’allumer
//  - "SAFE_LAMP_ON"  → lampe allumée SANS danger
//  - "LAMP_OFF"      → lampe doit rester éteinte (circuit bloqué mais sans danger)
//  - "SAFE"          → on veut juste un circuit sans danger
//
// palette: { moduleId: maxQuantité }  (avec compteur xN restants)
// maxModules: nombre max de modules posés dans les 3 slots (facultatif)
const PUZZLES = [
  {
    id: "p1",
    name: "Circuit simple",
    description:
      "Relie la batterie à la lampe avec des fils. Commence doucement !",
    goal: "LAMP_ON",
    maxModules: 3,
    palette: {
      wire: 3,
    },
  },
  {
    id: "p2",
    name: "Le fil cassé",
    description:
      "Un des fils est cassé. Allume la lampe sans utiliser le fil cassé.",
    goal: "LAMP_ON",
    maxModules: 3,
    palette: {
      wire: 2,
      broken_wire: 1,
    },
  },
  {
    id: "p3",
    name: "Interrupteur magique",
    description:
      "Utilise l’interrupteur ON pour allumer la lampe. OFF la bloque.",
    goal: "LAMP_ON",
    maxModules: 3,
    palette: {
      wire: 2,
      switch_on: 1,
      switch_off: 1,
    },
  },
  {
    id: "p4",
    name: "Chambre endormie",
    description:
      "Le circuit est branché, mais la lampe doit rester ÉTEINTE (sans danger).",
    goal: "LAMP_OFF",
    maxModules: 3,
    palette: {
      wire: 2,
      switch_off: 1,
      broken_wire: 1,
    },
  },
  {
    id: "p5",
    name: "Diode directionnelle",
    description:
      "La flèche de la diode doit aller de la batterie vers la lampe pour que ça s’allume.",
    goal: "SAFE_LAMP_ON",
    maxModules: 3,
    palette: {
      wire: 2,
      diode_forward: 1,
      diode_reverse: 1,
    },
  },
  {
    id: "p6",
    name: "Circuit sans danger",
    description:
      "Allume la lampe sans utiliser le fil dangereux. La sécurité avant tout !",
    goal: "SAFE_LAMP_ON",
    maxModules: 3,
    palette: {
      wire: 2,
      short_wire: 1,
      switch_on: 1,
    },
  },
  {
    id: "p7",
    name: "Mini-circuit",
    description: "Allume la lampe avec au maximum 2 modules.",
    goal: "LAMP_ON",
    maxModules: 2,
    palette: {
      wire: 3,
    },
  },
  {
    id: "p8",
    name: "Puzzle final",
    description:
      "Combine interrupteur, diode et fil pour un circuit SÛR qui allume la lampe.",
    goal: "SAFE_LAMP_ON",
    maxModules: 3,
    palette: {
      wire: 2,
      switch_on: 1,
      diode_forward: 1,
      short_wire: 1,
    },
  },
];

const TOTAL_PUZZLES = PUZZLES.length;

// ==============================
// AUDIO – musique & sfx
// ==============================
let sfxClic, sfxPowerOn, sfxZap, sfxError;
let bgMusic;

const audio = new Audio("music/puzzleElectriqueMusic.mp3");
audio.loop = true;
audio.volume = 0.40;
audio.play().catch(() => {});

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

// ==============================
// ÉTAT DU JEU
// ==============================
let currentPuzzleIndex = 0;
let currentPuzzle = PUZZLES[0];

let solvedCount = 0;
let puzzleAlreadyCounted = false;

// slots = tableau de 3 positions (0,1,2)
let currentSlots = [null, null, null]; // moduleId ou null
let selectedModuleId = null;
// combien de fois chaque module est utilisé dans ce puzzle
let usedCounts = {};

// ==============================
// DOM
// ==============================
const puzzleIndexSpan = document.getElementById("ce-puzzle-index");
const puzzleTotalSpan = document.getElementById("ce-puzzle-total");
const scoreSpan = document.getElementById("ce-score");

const lampEl = document.getElementById("ce-lamp");
const lampLabelEl = document.getElementById("ce-lamp-label");
const wirePathEl = document.getElementById("ce-wire-path");

const instructionsEl = document.getElementById("ce-instructions");

const slotsEls = Array.from(document.querySelectorAll(".ce-slot"));
const paletteContainer = document.getElementById("ce-palette");
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

const actionsRow = document.getElementById("ce-actions");

// ==============================
// NAVIGATION ARCADE
// ==============================
function goBackToMenu() {
  window.location.hash = "#menu";

  if (!window.Router) {
    window.location.href = "/public/index.html#games";
  }
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
    wirePathEl.classList.add("ce-wire-on");
  } else {
    lampEl.classList.remove("ce-lamp-on");
    lampEl.classList.add("ce-lamp-off");
    lampLabelEl.textContent = text || "Lampe éteinte";
    wirePathEl.classList.remove("ce-wire-on");
  }
}

function resetSlots() {
  currentSlots = [null, null, null];
  slotsEls.forEach((slot) => {
    slot.innerHTML = "";
    slot.classList.remove("ce-filled");
  });
}

function resetUsedCounts() {
  usedCounts = {};
  if (!currentPuzzle || !currentPuzzle.palette) return;
  Object.keys(currentPuzzle.palette).forEach((id) => {
    usedCounts[id] = 0;
  });
}

function updatePaletteCounts() {
  if (!currentPuzzle || !currentPuzzle.palette) return;
  const limits = currentPuzzle.palette;

  const cards = paletteContainer.querySelectorAll(".ce-module-card");
  cards.forEach((card) => {
    const id = card.dataset.id;
    const limit = limits[id] ?? 0;
    const used = usedCounts[id] ?? 0;
    const remaining = Math.max(0, limit - used);

    const labelEl = card.querySelector(".ce-module-label");
    const hintEl = card.querySelector(".ce-module-hint");

    const base = MODULE_LIBRARY[id]?.baseLabel || id;
    labelEl.textContent = base;

    if (limit > 0) {
      hintEl.textContent = `${MODULE_LIBRARY[id]?.baseHint || ""} (x${remaining} restants)`;
    } else {
      hintEl.textContent = MODULE_LIBRARY[id]?.baseHint || "";
    }

    card.disabled = remaining <= 0;
    card.classList.toggle("ce-selected", id === selectedModuleId && remaining > 0);
  });
}

// ==============================
// CREATION PALETTE & SLOTS
// ==============================
function createModuleCard(moduleId, limit) {
  const def = MODULE_LIBRARY[moduleId];
  if (!def) return null;

  const card = document.createElement("button");
  card.type = "button";
  card.className = "ce-module-card";
  card.dataset.id = moduleId;

  card.innerHTML = `
    <div class="ce-module-icon">${def.icon}</div>
    <div class="ce-module-main">
      <div class="ce-module-label">${def.baseLabel}</div>
      <div class="ce-module-hint">${def.baseHint}</div>
    </div>
  `;

  card.addEventListener("click", () => {
    // si déjà sélectionné → on désélectionne
    if (selectedModuleId === moduleId) {
      selectedModuleId = null;
    } else {
      selectedModuleId = moduleId;
    }
    updatePaletteCounts();
    setFeedback("", null);
  });

  return card;
}

function renderPaletteForPuzzle(puzzle) {
  paletteContainer.innerHTML = "";
  const palette = puzzle.palette || {};

  Object.entries(palette).forEach(([moduleId, limit]) => {
    if (!MODULE_LIBRARY[moduleId] || limit <= 0) return;
    const card = createModuleCard(moduleId, limit);
    if (card) {
      paletteContainer.appendChild(card);
    }
  });

  resetUsedCounts();
  selectedModuleId = null;
  updatePaletteCounts();
}

function onSlotClick(slotIndex) {
  return () => {
    if (!currentPuzzle) return;

    const previousModule = currentSlots[slotIndex];

    // Si aucun module sélectionné → on vide la case
    if (!selectedModuleId) {
      if (previousModule) {
        usedCounts[previousModule] = Math.max(
          0,
          (usedCounts[previousModule] || 0) - 1
        );
        currentSlots[slotIndex] = null;
        slotsEls[slotIndex].innerHTML = "";
        slotsEls[slotIndex].classList.remove("ce-filled");
        updatePaletteCounts();
      }
      return;
    }

    const limit = currentPuzzle.palette[selectedModuleId] ?? 0;
    const alreadyUsed = usedCounts[selectedModuleId] ?? 0;

    // si on veut enlever le même module → toggle off
    if (previousModule === selectedModuleId) {
      usedCounts[selectedModuleId] = Math.max(0, alreadyUsed - 1);
      currentSlots[slotIndex] = null;
      slotsEls[slotIndex].innerHTML = "";
      slotsEls[slotIndex].classList.remove("ce-filled");
      updatePaletteCounts();
      return;
    }

    // check limite avant de remplacer
    if (alreadyUsed >= limit) {
      setFeedback("Tu as déjà utilisé ce module au maximum.", "bad");
      playSfx(sfxError);
      return;
    }

    // libère l’ancien module si présent
    if (previousModule) {
      usedCounts[previousModule] = Math.max(
        0,
        (usedCounts[previousModule] || 0) - 1
      );
    }

    // place le nouveau
    usedCounts[selectedModuleId] = alreadyUsed + 1;
    currentSlots[slotIndex] = selectedModuleId;

    const def = MODULE_LIBRARY[selectedModuleId];
    slotsEls[slotIndex].innerHTML = def ? def.icon : "?";
    slotsEls[slotIndex].classList.add("ce-filled");

    updatePaletteCounts();
    setFeedback("", null);
  };
}

// ==============================
// SIMULATION DU COURANT
// ==============================
function simulateCircuit(slots) {
  let modulesCount = 0;
  let hasHazard = false;
  let blocked = false;

  for (const moduleId of slots) {
    if (!moduleId) continue;
    const def = MODULE_LIBRARY[moduleId];
    if (!def) continue;

    modulesCount++;
    if (!def.passes) {
      blocked = true;
    }
    if (def.hazard) {
      hasHazard = true;
    }
  }

  const hasPower = modulesCount > 0 && !blocked;

  return {
    hasPower,
    hasHazard,
    modulesCount,
  };
}

function evaluateGoal(puzzle, sim) {
  const { hasPower, hasHazard, modulesCount } = sim;

  if (modulesCount === 0) {
    return { ok: false, reason: "empty" };
  }

  if (puzzle.maxModules && modulesCount > puzzle.maxModules) {
    return { ok: false, reason: "too_many" };
  }

  if (puzzle.goal === "SAFE_LAMP_ON" || puzzle.goal === "SAFE") {
    if (hasHazard) {
      return { ok: false, reason: "hazard" };
    }
  }

  switch (puzzle.goal) {
    case "LAMP_ON":
    case "SAFE_LAMP_ON":
      if (!hasPower) return { ok: false, reason: "no_power" };
      return { ok: true };

    case "LAMP_OFF":
      if (hasPower) return { ok: false, reason: "lamp_on" };
      if (hasHazard) return { ok: false, reason: "hazard" };
      return { ok: true };

    case "SAFE":
      if (hasHazard) return { ok: false, reason: "hazard" };
      return { ok: true };

    default:
      return { ok: false, reason: "unknown" };
  }
}

// ==============================
// CHARGEMENT D’UN PUZZLE
// ==============================
function loadPuzzle(index) {
  currentPuzzleIndex = index;
  currentPuzzle = PUZZLES[currentPuzzleIndex];
  puzzleAlreadyCounted = false;

  puzzleIndexSpan.textContent = (currentPuzzleIndex + 1).toString();
  puzzleTotalSpan.textContent = TOTAL_PUZZLES.toString();

  instructionsEl.textContent = currentPuzzle.description;

  setLamp(false, "Lampe éteinte");
  setFeedback(`Circuit : ${currentPuzzle.name}`, null);

  resetSlots();
  renderPaletteForPuzzle(currentPuzzle);

  launchBtn.disabled = false;
  clearBtn.disabled = false;
}

// ==============================
// LOGIQUE DU JEU
// ==============================
function startGame() {
  ensureMusic();

  ScoreService.init("puzzleElectrique");

  solvedCount = 0;
  scoreSpan.textContent = "0";

  summary.classList.add("ce-hidden");
  setLamp(false, "Lampe éteinte");
  setFeedback("Place des modules puis lance le courant !", null);

  actionsRow.classList.remove("ce-hidden");
  backMenuBtn2.classList.remove("ce-hidden");
  startBtn.classList.add("ce-hidden");

  launchBtn.disabled = false;
  clearBtn.disabled = false;

  loadPuzzle(0);
}

function clearCircuit() {
  resetSlots();
  resetUsedCounts();
  selectedModuleId = null;
  updatePaletteCounts();
  setLamp(false, "Lampe éteinte");
  setFeedback("Circuit effacé. Recommence ton montage !", null);
}

async function handleLaunchCurrent() {
  const sim = simulateCircuit(currentSlots);
  const result = evaluateGoal(currentPuzzle, sim);
  const { hasPower, hasHazard } = sim;

  if (result.ok) {
    setLamp(true, "La lampe s'allume, bravo !");
    setFeedback("Bravo ! Ton circuit fonctionne comme demandé ⚡", "good");
    playSfx(sfxPowerOn);

    if (!puzzleAlreadyCounted) {
      puzzleAlreadyCounted = true;
      solvedCount++;
      scoreSpan.textContent = solvedCount.toString();
    }

    if (currentPuzzleIndex < TOTAL_PUZZLES - 1) {
      launchBtn.disabled = true;
      clearBtn.disabled = true;
      setTimeout(() => {
        loadPuzzle(currentPuzzleIndex + 1);
      }, 1000);
    } else {
      await endGame();
    }
  } else {
    // Gestion des échecs plus fun
    if (result.reason === "empty") {
      setLamp(false, "Lampe éteinte");
      setFeedback(
        "Il n’y a encore aucun module dans le circuit. Ajoute des pièces !",
        "bad"
      );
      playSfx(sfxError);
    } else if (result.reason === "too_many") {
      setLamp(hasPower, hasPower ? "Lampe allumée" : "Lampe éteinte");
      setFeedback(
        "Tu as utilisé trop de pièces pour ce puzzle. Essaie avec moins de modules.",
        "bad"
      );
      playSfx(sfxError);
    } else if (result.reason === "hazard") {
      setLamp(hasPower, hasPower ? "Lampe allumée (dangereuse!)" : "Lampe éteinte");
      setFeedback(
        "Oups ! Ton circuit est dangereux. Évite le fil ⚡ risqué.",
        "bad"
      );
      playSfx(sfxZap);
    } else if (result.reason === "no_power") {
      setLamp(false, "Lampe éteinte");
      setFeedback(
        "Le courant n’arrive pas jusqu’à la lampe. Vérifie que rien ne bloque le chemin.",
        "bad"
      );
      playSfx(sfxError);
    } else if (result.reason === "lamp_on") {
      setLamp(true, "Lampe allumée (mais ce n’est pas ce qu’on veut)");
      setFeedback(
        "La lampe s’allume alors qu’elle devrait rester éteinte. Change ton montage.",
        "bad"
      );
      playSfx(sfxError);
    } else {
      setLamp(false, "Lampe éteinte");
      setFeedback("Ce circuit ne correspond pas à la consigne. Réessaie !", "bad");
      playSfx(sfxError);
    }
  }
}

async function endGame() {
  finalScoreSpan.textContent = solvedCount.toString();
  summary.classList.remove("ce-hidden");

  launchBtn.disabled = true;
  clearBtn.disabled = true;
  actionsRow.classList.add("ce-hidden");
  backMenuBtn2.classList.add("ce-hidden");

  try {
    await ScoreService.saveScore("puzzleElectrique", solvedCount);
  } catch (e) {
    console.warn("saveScore puzzleElectrique:", e);
  }

  try {
    const scores = await ScoreService.getScore();
    const globalScore = Math.max(...scores.map(s => s.score));
    bestScoreSpan.textContent = globalScore.toString();
    bestRow.classList.remove("ce-hidden");
  } catch (e) {
    console.warn("getScore puzzleElectrique:", e);
    bestRow.classList.add("ce-hidden");
  }
}

// ==============================
// EVENTS
// ==============================
startBtn.addEventListener("click", withClickSfx(startGame));
launchBtn.addEventListener("click", withClickSfx(handleLaunchCurrent));
clearBtn.addEventListener("click", withClickSfx(clearCircuit));

replayBtn.addEventListener("click", withClickSfx(startGame));
backMenuBtn2.addEventListener("click", withClickSfx(goBackToMenu));
backMenuBtn3.addEventListener("click", withClickSfx(goBackToMenu));

slotsEls.forEach((slot, index) => {
  slot.addEventListener("click", onSlotClick(index));
});

// Init de base
ScoreService.init("puzzleElectrique");
puzzleTotalSpan.textContent = TOTAL_PUZZLES.toString();
setLamp(false, "Lampe éteinte");
setFeedback(
  "Appuie sur « Commencer » puis ajoute des modules pour créer ton premier circuit !",
  null
);
launchBtn.disabled = true;
clearBtn.disabled = true;
startBtn.classList.remove("ce-hidden");
actionsRow.classList.remove("ce-hidden");
launchBtn.disabled = true;
clearBtn.disabled = true;

