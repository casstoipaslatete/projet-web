// scripts/gameSelect.js
import { Router } from "./router.js";

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll("[data-game-id]");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const gameId = btn.dataset.gameId;
      if (!gameId) return;
      Router.goToGame(gameId);  // /games/{gameId}/{gameId}.html
    });
  });
});
