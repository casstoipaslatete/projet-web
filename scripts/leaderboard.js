const GAMES = [
  { id: "simon", name: "Simon" },
  { id: "mathDash", name: "Math dash" },
  { id: "speedTyping", name: "Tape éclair" },
  { id: "colorRush", name: "Color rush" },
  { id: "atelierPotions", name: "Atelier de potions" },
  { id: "puzzleElectrique", name: "Puzzle électrique" },
  { id: "trierAliments", name: "Trier les aliments" },
  { id: "motMystere", name: "Mot mystère" },
];

async function fetchBestScore(gameId) {
  try {
    const res = await fetch(`/api/scores/${gameId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.score ?? null;
  } catch {
    return null;
  }
}

async function renderLeaderboard() {
  const tbody = document.getElementById("leaderboard-body");
  if (!tbody) return;

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

// ✅ appelée par le Router
window.initLeaderboardPage = function () {
  renderLeaderboard();

  const backBtn = document.getElementById("ta-back-menu-ingame");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (window.GlobalAudio) {
        GlobalAudio.playClick();
      }
      Router.goTo("menu");
    });
  }
};
