(() => {
  const GAMES = [
    {
      id: "Simon",
      title: "Simon",
      subtitle: "Mémorise la séquence de couleurs!",
      icon: "../static/Simon.svg",
    },
    {
      id: "mathDash",
      title: "Math Dash",
      subtitle: "Résous les additions le plus vite possible!",
      icon: "../static/MathDash.svg",
    },
    {
      id: "speedTyping",
      title: "Tape Éclair",
      subtitle: "Tape les mots avant la fin du temps ",
      icon: "../static/TapeEclair.svg",
    },
    {
      id: "colorRush",
      title: "Color Rush",
      subtitle:
        "Trouve la bonne couleur écrite le plus vite possible dans ce tourbillon arc-en-ciel!",
      icon: "../static/ColorRush.svg",
    },
    {
      id: "atelierPotions",
      title: "Atelier de potions",
      subtitle: "Ouvre les bons robinets pour la potion parfaite!",
      icon: "../static/AtelierPotions.svg",
    },
    {
      id: "puzzleElectrique",
      title: "Puzzle électrique",
      subtitle: "Relie les bons câbles pour allumer le circuit!",
      icon: "../static/PuzzleElectrique.svg",
    },
    {
      id: "trierAliments",
      title: "Trier les aliments",
      subtitle: "Place les aliments dans leur bonne catégorie!",
      icon: "../static/TrierAliments.svg",
    },
    {
      id: "motMystere",
      title: "Mot Mystere",
      subtitle: "Trouve le mot mélangé le plus vite possible!",
      icon: "../static/MotMystere.svg",
    },
  ];

  // --- Appel pour le router ---
  window.initGameSelectCarousel = function initGameSelectCarousel() {
    const track = document.getElementById("game-track");
    const prevBtn = document.getElementById("game-prev");
    const nextBtn = document.getElementById("game-next");

    if (!track || !prevBtn || !nextBtn) {
      console.warn("[gameSelect] Carrousel non trouvé dans le DOM");
      return;
    }

    // --- Génération des cartes ---
    track.innerHTML = "";

    GAMES.forEach((game) => {
      const card = document.createElement("article");
      card.className = "game-card";

      card.innerHTML = `
        <img src="${game.icon}" alt="${game.title}" class="game-card-icon">

        <div class="game-card-hover">
          <h2>${game.title}</h2>
          <p>${game.subtitle}</p>
        </div>
      `;

      card.addEventListener("click", () => {
        const gameId = game.id;

        if (window.Router && typeof Router.goToGame === "function") {
          Router.goToGame(gameId);
        } else {
          window.location.href = `/games/${gameId}/${gameId}.html`;
        }
      });

      track.appendChild(card);
    });

    // --- Logique du carrousel infini ---
    let isAnimating = false;

    function getStep() {
      const firstCard = track.children[0];
      if (!firstCard) return 0;

      const styles = window.getComputedStyle(track);
      const gap = parseFloat(styles.gap) || 0;

      return firstCard.offsetWidth + gap;
    }

    function slideNext() {
      if (isAnimating) return;
      const step = getStep();
      if (!step) return;

      isAnimating = true;

      track.style.transition = "transform 0.35s ease-in-out";
      track.style.transform = `translateX(-${step}px)`;

      const onTransitionEnd = () => {
        track.removeEventListener("transitionend", onTransitionEnd);

        track.style.transition = "none";
        track.style.transform = "translateX(0)";

        const first = track.firstElementChild;
        if (first) {
          track.appendChild(first);
        }

        void track.offsetWidth;

        track.style.transition = "";
        isAnimating = false;
      };

      track.addEventListener("transitionend", onTransitionEnd);
    }

    function slidePrev() {
      if (isAnimating) return;
      const step = getStep();
      if (!step) return;

      isAnimating = true;

      track.style.transition = "none";

      const last = track.lastElementChild;
      if (last) {
        track.insertBefore(last, track.firstElementChild);
      }

      track.style.transform = `translateX(-${step}px)`;

      void track.offsetWidth;

      track.style.transition = "transform 0.35s ease-in-out";
      track.style.transform = "translateX(0)";

      const onTransitionEnd = () => {
        track.removeEventListener("transitionend", onTransitionEnd);
        track.style.transition = "";
        isAnimating = false;
      };

      track.addEventListener("transitionend", onTransitionEnd);
    }

    // --- Boutons ---
    prevBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      slidePrev();
    });

    nextBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      slideNext();
    });

    track.style.transform = "translateX(0)";
  };
})();
