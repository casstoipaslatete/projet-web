// Penser à appeler ScoreService.init("NomDuJeu") avant d'utiliser getScore/addPoints/resetScore.

export const ScoreService = (() => {
  let GAME_ID = null;

  function init(gameId) {
    GAME_ID = gameId;
  }

  function ensureGameId() {
    if (!GAME_ID) {
      console.warn("[ScoreService] GAME_ID non initialisé. Appelle ScoreService.init(gameId) d'abord.");
      return false;
    }
    return true;
  }

  // Récupère le score courant du jeu
  async function getScore() {
    if (!ensureGameId()) return 0;

    try {
      const res = await fetch(`/api/scores/${GAME_ID}`);
      if (!res.ok) return 0;

      const data = await res.json();
      return data.score ?? 0;
    } catch (err) {
      console.error("[ScoreService] Erreur dans getScore :", err);
      return 0;
    }
  }

  // Ajoute des points au score courant
  async function addPoints(points) {
    if (!ensureGameId()) return 0;

    try {
      const res = await fetch(`/api/scores/${GAME_ID}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: points }),
      });

      const data = await res.json();
      const total = data.score ?? 0;

      // Événement détaillé (ajout + total)
      window.dispatchEvent(new CustomEvent("score:addPoints", {
        detail: { added: points, total },
      }));

      // Événement générique "score changé"
      window.dispatchEvent(new CustomEvent("score:changed", {
        detail: { score: total },
      }));

      return total;
    } catch (err) {
      console.error("[ScoreService] Erreur dans addPoints :", err);
      return 0;
    }
  }

  // Remet le score à zéro sur l'API
  async function resetScore() {
    if (!ensureGameId()) return 0;

    try {
      const res = await fetch(`/api/scores/${GAME_ID}/reset`, {
        method: "POST",
      });

      const data = await res.json();
      const score = data.score ?? 0;

      window.dispatchEvent(new CustomEvent("score:reset", {
        detail: { score },
      }));

      window.dispatchEvent(new CustomEvent("score:changed", {
        detail: { score },
      }));

      return score;
    } catch (err) {
      console.error("[ScoreService] Erreur dans resetScore :", err);
      return 0;
    }
  }

  // Sauvegarde d’un score "final" (leaderboard, etc.)
  async function saveScore(game, score) {
    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ game, score }),
      });

      if (!response.ok) {
        throw new Error("Failed to save score");
      }

      const result = await response.json();
      console.log("[ScoreService] Score sauvegardé :", result.message);
      return result;
    } catch (error) {
      console.error("[ScoreService] Erreur lors de la sauvegarde du score :", error);
      return null;
    }
  }

  return {
    init,
    getScore,
    addPoints,
    resetScore,
    saveScore,
  };
})();
