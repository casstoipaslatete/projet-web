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
      id: "circuitLogique",
      title: "Potions Logiques",
      subtitle: "Ouvre les bons robinets pour la potion parfaite!",
      icon: "../static/AtelierPotions.svg",
    },
  ];

  const VISIBLE_COUNT = 5; // on vise 5 cartes visibles sur grand écran

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

    // --- Logique du carrousel ---
    let position = 0; // index de la première carte visible

    function updateCarousel() {
      const firstCard = track.children[0];
      if (!firstCard) return;

      // largeur de la carte + gap (14px défini en CSS)
      const cardWidth = firstCard.offsetWidth + 14;

      const max = Math.max(0, GAMES.length - VISIBLE_COUNT);
      if (position > max) position = max;

      const offset = -position * cardWidth;
      track.style.transform = `translateX(${offset}px)`;
    }

    prevBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      position = Math.max(0, position - 1);
      updateCarousel();
    });

    nextBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const max = Math.max(0, GAMES.length - VISIBLE_COUNT);
      position = Math.min(max, position + 1);
      updateCarousel();
    });

    window.addEventListener("resize", updateCarousel);

    // Premier placement après que le layout soit calculé
    setTimeout(updateCarousel, 0);
  };
})();
