import { ScoreService } from "../../scripts/scoreService.js";

const aliments = [
  // Fruits
  { label: "🍎 Pomme",       category: "fruits" },
  { label: "🍌 Banane",      category: "fruits" },
  { label: "🍓 Fraise",      category: "fruits" },
  { label: "🍐 Poire",       category: "fruits" },
  { label: "🍇 Raisin",      category: "fruits" },
  { label: "🫐 Bleuet",      category: "fruits" },
  { label: "🍍 Ananas",      category: "fruits" },
  { label: "🍉 Melon d'eau", category: "fruits" },

  // Légumes
  { label: "🥕 Carotte",     category: "legumes" },
  { label: "🥦 Brocoli",     category: "legumes" },
  { label: "🥔 Patate",      category: "legumes" },
  { label: "🥒 Concombre",   category: "legumes" },
  { label: "🧅 Oignon",      category: "legumes" },
  { label: "🫛 Petits pois", category: "legumes" },
  { label: "🍆 Aubergine",   category: "legumes" },
  { label: "🥬 Laitue",      category: "legumes" },

  // Desserts
  { label: "🍰 Gâteau",        category: "desserts" },
  { label: "🍦 Crème glacée",  category: "desserts" },
  { label: "🧁 Cupcake",       category: "desserts" },
  { label: "🍪 Biscuit",       category: "desserts" },
  { label: "🍩 Beigne",        category: "desserts" },
  { label: "🍫 Chocolat",      category: "desserts" },
  { label: "🍬 Bonbon",        category: "desserts" },
  { label: "🍿 Popcorn",       category: "desserts" },

  // Viandes
  { label: "🍗 Poulet",   category: "viandes" },
  { label: "🥩 Steak",    category: "viandes" },
  { label: "🌭 Saucisse", category: "viandes" },
  { label: "🥓 Bacon",    category: "viandes" },
  { label: "🥚 Œuf",      category: "viandes" },
  { label: "🍤 Crevette", category: "viandes" },
  { label: "🐟 Poisson",  category: "viandes" },
  { label: "🍖 Bœuf",     category: "viandes" },
];

const NB_ALIMENTS_PAR_PARTIE = 10;

// ------- ÉTAT -------
let ordreAliments = [];
let currentIndex = 0;
let currentItem = null;
let bienPlaces = 0;
let scorePartie = 0;
let totalAliments = 0;
let aDejaRateAliment = false;

// ------- DOM -------
const itemsContainer = document.getElementById("ta-items-container");
const zones = Array.from(document.querySelectorAll(".ta-zone"));
const scoreSpan = document.getElementById("ta-score");
const indexSpan = document.getElementById("ta-index");
const totalSpan = document.getElementById("ta-total");

const startWrapper = document.getElementById("ta-start-wrapper");
const startBtn = document.getElementById("ta-start");

const currentItemWrapper = document.getElementById("ta-current-item-wrapper");

const feedbackDiv = document.getElementById("ta-feedback");

const summaryDiv = document.getElementById("ta-summary");
const finalScoreSpan = document.getElementById("ta-final-score");
const finalTotalSpan = document.getElementById("ta-final-total");
const bestRow = document.getElementById("ta-best-row");
const bestScoreSpan = document.getElementById("ta-best-score");
const replayBtn = document.getElementById("ta-replay");
const backMenuBtn = document.getElementById("ta-back-menu");
const backMenuInGameBtn = document.getElementById("ta-back-menu-ingame");

// ------- MUSIQUE ET SONS -------
let sfxClic, sfxError, sfxSuccess;
let bgMusic;

try {
  sfxClic = new Audio("sfx/clic.mp3");
  sfxSuccess = new Audio("sfx/success.mp3");
  sfxError = new Audio("sfx/error.mp3");

  bgMusic = new Audio("music/trierAlimentsMusic.mp3");
  bgMusic.loop = true;
  bgMusic.volume = 0.7;
} catch (e) {
  console.warn("Audio trierAliments non disponible:", e);
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

// ------- NAVIGATION -------
function goBackToMenu() {
  stopMusic();
  window.location.hash = "#menu";
  if (!window.Router) {
    window.location.href = "/public/index.html#games";
  }
}

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function setFeedback(msg, type) {
  feedbackDiv.textContent = msg || "";
  feedbackDiv.className = "arcade-feedback";

  if (type === "good") {
    feedbackDiv.classList.add("arcade-feedback--good");
  } else if (type === "warn") {
    feedbackDiv.classList.add("arcade-feedback--warn");
  }
}

// ------- JEU -------
function afficherAlimentCourant() {
  itemsContainer.innerHTML = "";

  if (currentIndex >= ordreAliments.length) {
    currentItem = null;
    return;
  }

  currentItem = ordreAliments[currentIndex];

  aDejaRateAliment = false;

  indexSpan.textContent = String(currentIndex + 1);

  const card = document.createElement("div");
  card.classList.add("ta-item");
  card.textContent = currentItem.label;

  itemsContainer.appendChild(card);
}

function initialiserJeu() {
  ensureMusic();
  ScoreService.init("trierAliments");

  ordreAliments = shuffle(aliments).slice(0, NB_ALIMENTS_PAR_PARTIE);
  bienPlaces = 0;
  scorePartie = 0;
  currentIndex = 0;
  currentItem = null;
  totalAliments = ordreAliments.length;

  scoreSpan.textContent = "0";
  indexSpan.textContent = "0";
  totalSpan.textContent = String(totalAliments);
  finalTotalSpan.textContent = String(totalAliments);

  summaryDiv.classList.add("arcade-hidden");
  bestRow.classList.add("arcade-hidden");

  currentItemWrapper.classList.remove("arcade-hidden");
  startWrapper.classList.add("arcade-hidden");

  setFeedback("Clique sur une catégorie pour classer l’aliment.", null);

  zones.forEach((zone) => {
    zone.classList.remove("ta-zone--wrong");
    const title = zone.querySelector(".ta-zone-title");
    const children = Array.from(zone.children);
    children.forEach((c) => {
      if (!c.classList.contains("ta-zone-title")) zone.removeChild(c);
    });
  });

  afficherAlimentCourant();
}

function handleZoneClick(zone) {
  if (!currentItem) return;

  const categorieZone = zone.dataset.category;
  const bonneCategorie = currentItem.category;

  const estCorrect = (categorieZone === bonneCategorie);

  if (estCorrect) {
    playSfx(sfxSuccess);

    const sorted = document.createElement("div");
    sorted.classList.add("ta-item", "ta-item--correct");
    sorted.textContent = currentItem.label;
    zone.appendChild(sorted);

    bienPlaces++;

    if (!aDejaRateAliment) {
      scorePartie++;
      scoreSpan.textContent = String(scorePartie);
    }

    if (bienPlaces === totalAliments) {
      finDePartie();
    } else {
      currentIndex++;
      afficherAlimentCourant();
      setFeedback("Bien joué ! Continue de trier les aliments.", "good");
    }
  } else {
    aDejaRateAliment = true;

    playSfx(sfxError);
    setFeedback("Oups, ce n’est pas la bonne catégorie.", "warn");

    zone.classList.add("ta-zone--wrong");
    setTimeout(() => zone.classList.remove("ta-zone--wrong"), 220);
  }
}

async function finDePartie() {
  itemsContainer.innerHTML = "";
  currentItem = null;

  currentItemWrapper.classList.add("arcade-hidden");
  summaryDiv.classList.remove("arcade-hidden");

  finalScoreSpan.textContent = String(scorePartie);
  finalTotalSpan.textContent = String(totalAliments);

  setFeedback("", null);

  backMenuInGameBtn.classList.add("arcade-hidden");

  try {
    await ScoreService.saveScore("trierAliments", scorePartie);
  } catch (e) {
    console.warn("saveScore trierAliments:", e);
  }

  bestRow.classList.add("arcade-hidden");
}

zones.forEach((zone) => {
  zone.addEventListener("click", () => handleZoneClick(zone));
});

startBtn.addEventListener("click", withClickSfx(() => {
  backMenuInGameBtn.classList.remove("arcade-hidden");
  initialiserJeu();
}));

replayBtn.addEventListener("click", withClickSfx(() => {
  backMenuInGameBtn.classList.remove("arcade-hidden");
  initialiserJeu();
}));

backMenuBtn.addEventListener("click", withClickSfx(goBackToMenu));
backMenuInGameBtn.addEventListener("click", withClickSfx(goBackToMenu));

// ------- INITIALISATION -------
function initTrierAliments() {
  ScoreService.init("trierAliments");

  scoreSpan.textContent = "0";
  indexSpan.textContent = "0";
  totalSpan.textContent = String(NB_ALIMENTS_PAR_PARTIE);

  currentItemWrapper.classList.add("arcade-hidden");
  summaryDiv.classList.add("arcade-hidden");
  bestRow.classList.add("arcade-hidden");

  startWrapper.classList.remove("arcade-hidden");
  backMenuInGameBtn.classList.remove("arcade-hidden");

  setFeedback("Appuie sur « Jouer ! » pour commencer à trier les aliments.", null);
}

initTrierAliments();

