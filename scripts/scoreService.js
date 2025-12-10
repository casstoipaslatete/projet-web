// Penser à appeler ScoreService.init("NomDuJeu") avant d'utiliser getScore/addPoints/resetScore.

export const ScoreService = (() => {

  let GAME = null;

  function init(gameId) {
    GAME = gameId;
  }

  const DEFAULT_PROFILE_ID = 5; // ID de profil par défaut --> en BDD "anonyme"

  // récupérer le score pour un jeu
  async function getScore() {
    const res = await fetch(`/api/scores/${GAME}`);
    if (!res.ok) return 0;

    const data = await res.json();
    return data.scores ?? 0;
  }

  // récupérer le score pour un profil
  async function getScoresProfile(profileId = DEFAULT_PROFILE_ID) {
    const res = await fetch(`/api/profile/${profileId}/scores`);
    if (!res.ok) return 0;

    const data = await res.json();
    return data.scores ?? 0;
  }

  // enregistrer un score pour un jeu et un profil
  async function saveScore(game, score, profileId = DEFAULT_PROFILE_ID) {
    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ game, score, profileId }),
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

  // récupérer les leaderboards
  async function getLeaderboards() {
    const res = await fetch('/api/leaderboard/');
    if (!res.ok) return 0;

    const data = await res.json();
    return data.leaderboards ?? 0;
  }

  // récupérer les leaderboards
  async function getLeaderboards() {
    const res = await fetch('/api/leaderboard/');
    if (!res.ok) return 0;

    const data = await res.json();
    return data.leaderboards ?? 0;
  }

  return {
    init,
    getScore,
    getScoresProfile,
    saveScore,
    getLeaderboards
  };
})();