
export const ScoreService = (() => {

  let GAME_ID = null;

  function init(gameId) {
    GAME_ID = gameId;
    PROFILE_ID = profileId;
  }

  // récupérer le score pour un jeu
  async function getScore() {
    const res = await fetch(`/api/scores/${GAME_ID}`);
    if (!res.ok) return 0;

    const data = await res.json();
    return data.scores ?? 0;
  }

  // récupérer le score pour un profil
  async function getScoresProfile() {
    const res = await fetch(`/api/profile/${PROFILE_ID}/scores`);
    if (!res.ok) return 0;

    const data = await res.json();
    return data.scores ?? 0;
  }

  // enregistrer un score pour un jeu et un profil
  async function saveScore(game, score, profileId) {
    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ game, score, profileId }),
      });

      if (!response.ok) {
        throw new Error('Failed to save score');
      }

      const result = await response.json();
      console.log(result.message);
    } catch (error) {
      console.error('Error saving score:', error);
    }
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