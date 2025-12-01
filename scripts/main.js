// scripts/main.js

window.addEventListener("DOMContentLoaded", () => {
  // Affichage score global (si présent)
  const scoreValue = document.getElementById("score-value");
  if (scoreValue && typeof ScoreService !== "undefined") {
    scoreValue.textContent = ScoreService.getScore();
    window.addEventListener("score:changed", (e) => {
      scoreValue.textContent = e.detail.score;
    });
  }

  // Navigation : on intercepte les clics sur [data-route]
  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-route]");
    if (!btn) return;

    const route = btn.getAttribute("data-route");
    if (!route) return;

    // JS prend le contrôle, mais href reste comme fallback
    e.preventDefault();
    Router.goTo(route);
  });

  // =========================
  // Route GAMES (gameSelect)
  // =========================
  Router.register("games", async (root) => {
    root.innerHTML = '<p>Chargement des mini-jeux...</p>';
    try {
      const res = await fetch('/public/gameSelect.html');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const tpl = doc.getElementById('games');
      if (tpl) {
        root.innerHTML = tpl.innerHTML;

        // On initialise le carrousel maintenant que le HTML est en place
        if (window.initGameSelectCarousel) {
          window.initGameSelectCarousel();
        } else {
          console.warn("[router/games] initGameSelectCarousel n'est pas défini");
        }
      } else {
        root.innerHTML = `
          <h2>Liste de jeux</h2>
          <p>Choisis un mini-jeu!</p>
        `;
      }
    } catch (err) {
      root.innerHTML = '<p>Impossible de charger les mini-jeux.</p>';
      console.error(err);
    }
  });


  // =========================
  // Route MENU (index.html)
  // =========================
  Router.register("menu", async (root) => {
    root.innerHTML = '<p>Chargement du menu...</p>';
    try {
      const res = await fetch('/public/index.html');    // ⬅ ICI
      if (!res.ok) throw new Error('HTTP ' + res.status);

      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const tpl = doc.getElementById('menu');
      if (tpl) {
        root.innerHTML = tpl.innerHTML;
      } else {
        root.innerHTML = `
          <h2>Menu</h2>
          <p>Choisis un mini-jeu!</p>
        `;
      }
    } catch (err) {
      root.innerHTML = '<p>Impossible de charger le menu.</p>';
      console.error(err);
    }
  });

  // =========================
  // Route GAME A (si tu l'utilises)
  // =========================
  Router.register("gameA", (root) => {
    if (typeof initGameA === "function") {
      initGameA(root, ScoreService);
    } else {
      root.innerHTML = "<p>Game A pas encore prêt</p>";
    }
  });

  // =========================
  // Route PROFILE
  // =========================
  Router.register('profile', async (root) => {
    root.innerHTML = '<p>Chargement du profil...</p>';
    try {
      const res = await fetch('/public/profile.html');   // ⬅ ICI
      if (!res.ok) throw new Error('HTTP ' + res.status);

      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const tpl = doc.getElementById('profile-page');
      if (tpl) {
        root.innerHTML = tpl.innerHTML;

        Array.from(root.querySelectorAll('script')).forEach(oldScript => {
          const s = document.createElement('script');
          if (oldScript.src) {
            s.src = oldScript.src;
            s.async = false;
            s.addEventListener('load', () => s.remove());
          } else {
            s.textContent = oldScript.textContent;
          }
          document.body.appendChild(s);
        });
      } else {
        root.innerHTML = `
          <h2>Profil</h2>
          <p>Personnalise ton profil !</p>
        `;
      }
    } catch (err) {
      root.innerHTML = '<p>Impossible de charger la page profil.</p>';
      console.error(err);
    }
  });

  // Démarre le routage (charge menu ou la route du hash courant)
  Router.start();
});
