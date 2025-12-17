console.log("[leaderboard] script chargé");

// --- Liste des jeux ---
const GAMES = [
  { id: "Simon", name: "Simon" },
  { id: "mathDash", name: "Math dash" },
  { id: "speedTyping", name: "Tape éclair" },
  { id: "colorRush", name: "Color rush" },
  { id: "atelierPotions", name: "Atelier de potions" },
  { id: "puzzleElectrique", name: "Puzzle électrique" },
  { id: "trierAliments", name: "Trier les aliments" },
  { id: "motMystere", name: "Mot mystère" },
];

// --- Logique de recherche du meilleur score ---
async function fetchBestScore(gameId) {
  try {
    const res = await fetch(`/api/scores/${gameId}`);
    if (!res.ok) {
      console.warn("[leaderboard] /api/scores status", res.status, "pour", gameId);
      return null;
    }

    const data = await res.json();
    console.log("[leaderboard] /api/scores data pour", gameId, data);

    let scoresArray = [];
    if (Array.isArray(data?.scores)) {
      scoresArray = data.scores;
    }
    
    let best = 0;
    for (const entry of scoresArray) {
      const value =
        typeof entry === "number"
          ? entry
          : (entry && (entry.score ?? entry.value ?? 0)) || 0;

      if (value > best) best = value;
    }

    return best;
  } catch (err) {
    console.error("[leaderboard] fetchBestScore erreur pour", gameId, err);
    return null;
  }
}

// --- Logique d'affichage du tableau ---
async function renderLeaderboard() {
  const tbody = document.getElementById("leaderboard-body");
  if (!tbody) {
    console.warn("[leaderboard] tbody #leaderboard-body introuvable");
    return;
  }

  tbody.innerHTML = "";

  for (const game of GAMES) {
    const score = await fetchBestScore(game.id);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${game.name}</td>
      <td>${score ?? "-"}</td>
    `;
    tbody.appendChild(tr);
  }
}

window.initLeaderboardPage = function () {
  console.log("[leaderboard] initLeaderboardPage appelé");
  renderLeaderboard();

  const backBtn = document.getElementById("ta-back-menu-ingame");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (window.GlobalAudio) {
        GlobalAudio.playClick();
      }
      Router.goTo("menu");
    });
  } else {
    console.warn("[leaderboard] Bouton retour introuvable");
  }
};
