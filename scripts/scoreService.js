const ScoreService = (() => {
  const STORAGE_KEY = "webproj_score";

  // Get score
  function getScore() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseInt(raw, 10) : 0;
  }

  // Changement de score
  function setScore(value) {
    localStorage.setItem(STORAGE_KEY, String(value));
    window.dispatchEvent(new CustomEvent("score:changed", {
      detail: { score: value }
    }));
  }

  // Ajouter points
  function addPoints(points) {
    const newScore = getScore() + points;
    setScore(newScore);
    window.dispatchEvent(new CustomEvent("score:addPoints", {
      detail: { added: points, total: newScore }
    }));
  }

  // Reset score
  function resetScore() {
    setScore(0);
    window.dispatchEvent(new CustomEvent("score:reset"));
  }

  return {
    getScore,
    addPoints,
    resetScore,
  };
})();
