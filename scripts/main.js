// ==============================
// AUDIO GLOBAL – arcade (hors mini-jeux)
// ==============================
if (!window.GlobalAudio) {
  window.GlobalAudio = {
    music: null,
    sfxClick: null,
    needsUnlock: false,

    init() {
      try {
        // Musique globale de l'arcade
        this.music = new Audio("/static/music/mainMusic.mp3");
        this.music.loop = true;
        this.music.volume = 0.6;

        // Clic global pour le menu / profil / selection, etc.
        this.sfxClick = new Audio("/static/sfx/clic.mp3");
        this.sfxClick.volume = 0.9;
      } catch (e) {
        console.warn("Audio global non disponible:", e);
      }
    },

    startMusic() {
      if (!this.music) return;

      // si déjà en lecture → ne rien faire
      if (!this.music.paused) return;

      this.music.currentTime = 0;
      const p = this.music.play();
      if (p && typeof p.then === "function") {
        p.catch(() => {
          // navigateur pas content → on attend un clic utilisateur
          this.needsUnlock = true;
        });
      }
    },

    playClick() {
      if (!this.sfxClick) return;
      try {
        this.sfxClick.currentTime = 0;
        this.sfxClick.play().catch(() => {});
      } catch {}
    }
  };

  window.GlobalAudio.init();
}

window.addEventListener("DOMContentLoaded", () => {
  if (window.GlobalAudio) {
    GlobalAudio.startMusic();   // essai auto (peut être bloqué)
  }

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

    if (window.GlobalAudio) {
      GlobalAudio.playClick();
      GlobalAudio.startMusic();   // clic de nav = gesture utilisateur
    }

    e.preventDefault();
    Router.goTo(route);
  });

  // 🔓 Débloqueur global : si l'autoplay a été bloqué,
  // le prochain clic sur n'importe quel bouton/lien relance la musique.
  document.body.addEventListener("click", (e) => {
    if (!window.GlobalAudio) return;

    if (GlobalAudio.needsUnlock) {
      GlobalAudio.needsUnlock = false;
      GlobalAudio.startMusic();
    }
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
      const res = await fetch('/public/index.html');
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
      const res = await fetch('/public/profile.html');
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

  Router.start();
});

// pageshow à part, pour les retours via Back/Forward
window.addEventListener("pageshow", (event) => {
  if (window.GlobalAudio) {
    GlobalAudio.startMusic();
  }
});
