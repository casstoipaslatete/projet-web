// --- MUSIQUE ET SONS GLOBAUX ---
if (!window.GlobalAudio) {
  window.GlobalAudio = {
    music: null,
    sfxClick: null,
    needsUnlock: false,

    init() {
      try {
        this.music = new Audio("/static/music/mainMusic.mp3");
        this.music.loop = true;
        this.music.volume = 0.6;

        this.sfxClick = new Audio("/static/sfx/clic.mp3");
        this.sfxClick.volume = 0.9;
      } catch (e) {
        console.warn("Audio global non disponible:", e);
      }
    },

    startMusic() {
      if (!this.music) return;

      if (!this.music.paused) return;

      this.music.currentTime = 0;
      const p = this.music.play();
      if (p && typeof p.then === "function") {
        p.catch(() => {
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
    GlobalAudio.startMusic();
  }

  const scoreValue = document.getElementById("score-value");
  if (scoreValue && typeof ScoreService !== "undefined") {
    scoreValue.textContent = ScoreService.getScore();
    window.addEventListener("score:changed", (e) => {
      scoreValue.textContent = e.detail.score;
    });
  }

  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-route]");
    if (!btn) return;

    const route = btn.getAttribute("data-route");
    if (!route) return;

    if (window.GlobalAudio) {
      GlobalAudio.playClick();
      GlobalAudio.startMusic();
    }

    e.preventDefault();
    Router.goTo(route);
  });

  document.body.addEventListener("click", (e) => {
    if (!window.GlobalAudio) return;

    if (GlobalAudio.needsUnlock) {
      GlobalAudio.needsUnlock = false;
      GlobalAudio.startMusic();
    }
  });

// --- ROUTE GAMES ---
  Router.register("games", async (root) => {
    if (window.GlobalAudio) {
          GlobalAudio.startMusic();
        }

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

// --- ROUTE MENU ---
  Router.register("menu", async (root) => {
    if (window.GlobalAudio) {
      GlobalAudio.startMusic();
    }

    root.innerHTML = '<p>Chargement du menu...</p>';

    try {
      const res = await fetch('/public/index.html');
      if (!res.ok) throw new Error('HTTP ' + res.status);

      const html = await res.text();
      const doc  = new DOMParser().parseFromString(html, 'text/html');

      const screen = doc.getElementById('screen');
      if (screen) {
        root.innerHTML = screen.outerHTML;
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

// --- ROUTE PROFILE ---
  Router.register("profile", async (root) => {
    if (window.GlobalAudio) {
      GlobalAudio.startMusic();
    }

    root.innerHTML = '<p>Chargement du profil...</p>';

    try {
      const res = await fetch('/public/profile.html');
      if (!res.ok) throw new Error('HTTP ' + res.status);

      const html = await res.text();
      const doc  = new DOMParser().parseFromString(html, 'text/html');

      const screen = doc.getElementById('screen');
      if (screen) {
        root.innerHTML = screen.outerHTML;

        if (window.initProfilePage) {
          window.initProfilePage();
        } else {
          console.warn('[router/profile] initProfilePage non défini');
        }
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

// ROUTE LEADERBOARD ---
Router.register("leaderboard", async (root) => {
  if (window.GlobalAudio) {
    GlobalAudio.startMusic();
  }

  root.innerHTML = "<p>Chargement des scores...</p>";

  try {
    const res = await fetch("/public/leaderboard.html");
    if (!res.ok) throw new Error("HTTP " + res.status);

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    const screen = doc.querySelector(".arcade-game-root");
    if (!screen) {
      root.innerHTML = "<p>Leaderboard introuvable.</p>";
      return;
    }

    root.innerHTML = screen.outerHTML;

    if (window.initLeaderboardPage) {
      window.initLeaderboardPage();
    }
  } catch (err) {
    root.innerHTML = "<p>Impossible de charger le leaderboard.</p>";
    console.error(err);
  }
});

  Router.start();
});

window.addEventListener("pageshow", (event) => {
  if (window.GlobalAudio) {
    GlobalAudio.startMusic();
  }
});