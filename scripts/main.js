window.addEventListener("DOMContentLoaded", () => {
  // Affichage score
  const scoreValue = document.getElementById("score-value");
  if (scoreValue) {
    scoreValue.textContent = ScoreService.getScore();
    window.addEventListener("score:changed", (e) => {
      scoreValue.textContent = e.detail.score;
    });
  }

  // Boutons de navigation - délégation d'événements sur le body
  // Cela attrape les éléments actuels et futurs, et évite les problèmes
  // d'initialisation si le DOMContentLoaded a déjà été déclenché.
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-route]');
    if (!btn) return;
    const route = btn.getAttribute('data-route');
    if (!route) return;
    // Empêcher le comportement par défaut si on a JS (fallback vers href sinon)
    e.preventDefault();
    Router.goTo(route);
  });

  // Routes
  //games
  Router.register("games", async (root) => {
    root.innerHTML = '<p>Chargement des mini-jeux...</p>';
    try {
      const res = await fetch('/public/games.html');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Extraire le template #menu-template du document fetché
      const tpl = doc.getElementById('games');
      if (tpl) {
        root.innerHTML = tpl.innerHTML;

        // Exécuter les <script> (inline ou externes) présents dans le template
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
        // fallback si le template n'existe pas dans index.html
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

  //page d'accueil - menu
  Router.register("menu", async (root) => {
    root.innerHTML = '<p>Chargement du profil...</p>';
    try {
      const res = await fetch('/public/index.html');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Extraire le template #menu-template du document fetché
      const tpl = doc.getElementById('menu');
      if (tpl) {
        root.innerHTML = tpl.innerHTML;

        // Exécuter les <script> (inline ou externes) présents dans le template
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
        // fallback si le template n'existe pas dans index.html
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

  Router.register("gameA", (root) => {
    // Le JS de gameA doit être chargé (via <script> dans index.html ou async/import)
    if (typeof initGameA === "function") {
      initGameA(root, ScoreService);
    } else {
      root.innerHTML = "<p>Game A pas encore prêt</p>";
    }
  });


  //Route - profile
  Router.register('profile', async (root) => {
  root.innerHTML = '<p>Chargement du menu...</p>';
    try {
      const res = await fetch('/public/profile.html');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Extraire le contenu
      const tpl = doc.getElementById('profile-page');
      if (tpl) {
        root.innerHTML = tpl.innerHTML;

        // Exécuter les <script> (inline ou externes) présents dans le template
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
        // fallback si le template n'existe pas dans index.html
        root.innerHTML = `
          <h2>Profil</h2>
          <p>Personnalise ton profil !</p>
        `;
      }
    } catch (err) {
      root.innerHTML = '<p>Impossible de charger la page profile.</p>';
      console.error(err);
    }
  });

  Router.start();
});
