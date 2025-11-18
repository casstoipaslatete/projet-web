import {ScoreService} from "../../scripts/scoreService"

// Changer le contenu de la constante pour chaque jeu
const GAME_ID = "TEMPLATE_GAME"

const gameState = {
    isRunning: false,
    lastTimestamp: 0,
    // Variables de jeu à ajouter
};

const ui = {
    scoreValue: null,
    statusText: null,
    startBtn: null,
    backBtn: null,
    gameArea: null,
};

document.addEventListener("DOMContentLoaded", () => {
    initGame();
});

async function initGame() {
    // Récupération des éléments UI
    ui.scoreValue = document.getElementById("scoreValue");
    ui.statusText = document.getElementById("statusText");
    ui.startBtn = document.getElementById("startGameBtn");
    ui.backBtn = document.getElementById("backToMenuBtn");
    ui.gameArea = document.getElementById("gameArea");

    // Hooks UI
    ui.startBtn.addEventListener("click", startGame);
    ui.backBtn.addEventListener("click", () => {
        // À adapter selon router
        window.location.href = "/index.html";
    });

    // Chargement du score actuel depuis la BDD via scoreService
    const currentScore = await ScoreService.getScore(GAME_ID);
    ui.scoreValue.textContent = currentScore ?? 0;

    ui.statusText.textContent = "Prêt à jouer!";

    setupGame();
}

// À personnaliser selon le jeu
function setupGame() {
    // À ajouter selon le jeu
}

function startGame() {
    if (gameState.isRunning) return;

    gameState.isRunning = true;
    gameState.lastTimestamp = performance.now();
    ui.statusText.textContent = "Partie en cours!";

    // Reset des variables de jeu ici

    requestAnimationFrame(gameLoop);
}

function stopGameLoop() {
    gameState.isRunning = false;
}

function gameLoop(timestamp) {
    if (!gameState.isRunning) return;

    const dt = (timestamp - gameState.lastTimestamp) / 1000;
    gameState.lastTimestamp = timestamp;

    updateGame(dt);
    renderGame();

    requestAnimationFrame(gameLoop);
}

// --- Logique de jeu ---

function updateGame(dt) {
    // Gestion du gameplay, à modifier et adapter
}

function renderGame() {
    // Mise à jour de l'affichage du jeu si besoin
}

// --- Score et game over ---

async function addPoints(amount) {
    const newScore = await ScoreService.addPoints(GAME_ID, amount);
    ui.scoreValue.textContent = newScore;
}

async function resetScore() {
    const newScore = await ScoreService.resetScore(GAME_ID);
    ui.scoreValue.textContent = newScore;
}

async function gameOver(reason = "Game over") {
    if(!gameState.isRunning) return;

    stopGameLoop();
    ui.statusText.textContent = reason;
}