export const ScoreService = (() => {

  let GAME_ID = null;

  function init(gameId) {
    GAME_ID = gameId;
  }

  async function getScore() {
    const res = await fetch(`/api/scores/${GAME_ID}`);
    if (!res.ok) return 0;

    const data = await res.json();
    return data.score ?? 0;
  }

  async function setScore(value) {
    const res = await fetch(`/api/scores/${GAME_ID}/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });

    const data = await res.json();

    window.dispatchEvent(new CustomEvent("score:changed", {
      detail: { score: data.score }
    }));

    return data.score;
  }

  async function addPoints(points) {
    const res = await fetch(`/api/scores/${GAME_ID}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: points }),
    });

    const data = await res.json();

    window.dispatchEvent(new CustomEvent("score:addPoints", {
      detail: { added: points, total: data.score }
    }));

    return data.score;
  }

  async function resetScore() {
    const res = await fetch(`/api/scores/${GAME_ID}/reset`, {
      method: "POST"
    });

    const data = await res.json();

    window.dispatchEvent(new CustomEvent("score:reset", {
      detail: { score: data.score }
    }));

    return data.score;
  }

  async function saveScore(game, score) {
    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ game, score }),
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

  return {
    init,
    getScore,
    addPoints,
    resetScore,
    saveScore,
  };
})();