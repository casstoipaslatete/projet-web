window.addEventListener("DOMContentLoaded", () => {
  // Affichage score
  const scoreValue = document.getElementById("score-value");
  if (scoreValue) {
    scoreValue.textContent = ScoreService.getScore();
    window.addEventListener("score:changed", (e) => {
      scoreValue.textContent = e.detail.score;
    });
  }

  // Boutons de navigation
  document.querySelectorAll("nav [data-route]").forEach(btn => {
    btn.addEventListener("click", () => {
      const route = btn.getAttribute("data-route");
      Router.goTo(route);
    });
  });

  // Routes
  Router.register("menu", (root) => {
    root.innerHTML = `
      <h2>Menu</h2>
      <p>Choisis un mini-jeu!</p>
    `;
  });

  Router.register("gameA", (root) => {
    // Le JS de gameA doit être chargé (via <script> dans index.html ou async/import)
    if (typeof initGameA === "function") {
      initGameA(root, ScoreService);
    } else {
      root.innerHTML = "<p>Game A pas encore prêt</p>";
    }
  });

  // TO DO: ajouter les infos du joueur
  Router.register("profile", (root) => {
    root.innerHTML = `
      <h2>Profil</h2>
      <p>Infos du joueur à ajouter.</p>
    `;
  });

  Router.start();
});
