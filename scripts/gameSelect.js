// scripts/gameSelect.js

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

  // On expose une fonction globale que le router pourra appeler
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

        // Si le Router global existe, on l'utilise
        if (window.Router && typeof Router.goToGame === "function") {
          Router.goToGame(gameId);
        } else {
          // Fallback : navigation directe
          window.location.href = `/games/${gameId}/${gameId}.html`;
        }
      });

      track.appendChild(card);
    });

    // --- Logique du carrousel infini ---

    let isAnimating = false;

    // Calcule dynamiquement la taille d'un "pas" (carte + gap)
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

      // On anime vers la gauche
      track.style.transition = "transform 0.35s ease-in-out";
      track.style.transform = `translateX(-${step}px)`;

      const onTransitionEnd = () => {
        track.removeEventListener("transitionend", onTransitionEnd);

        // On enlève la transition pour réorganiser les cartes sans voir le jump
        track.style.transition = "none";
        track.style.transform = "translateX(0)";

        // On déplace la première carte à la fin => effet infini
        const first = track.firstElementChild;
        if (first) {
          track.appendChild(first);
        }

        // On force le navigateur à appliquer les changements avant de réactiver la transition
        // (évite des glitches visuels)
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

      // On enlève d'abord la transition, on place la dernière carte au début
      track.style.transition = "none";

      const last = track.lastElementChild;
      if (last) {
        track.insertBefore(last, track.firstElementChild);
      }

      // On place la track déjà décalée vers la gauche
      track.style.transform = `translateX(-${step}px)`;

      // On force le reflow pour que le navigateur "prenne en compte" ce transform
      void track.offsetWidth;

      // Puis on anime pour revenir à 0
      track.style.transition = "transform 0.35s ease-in-out";
      track.style.transform = "translateX(0)";

      const onTransitionEnd = () => {
        track.removeEventListener("transitionend", onTransitionEnd);
        track.style.transition = "";
        isAnimating = false;
      };

      track.addEventListener("transitionend", onTransitionEnd);
    }

    // Boutons
    prevBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      slidePrev();
    });

    nextBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      slideNext();
    });

    // On s'assure que le transform est bien initialisé
    track.style.transform = "translateX(0)";
  };
})();
