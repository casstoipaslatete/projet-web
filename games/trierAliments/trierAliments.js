const aliments = [
    // Fruits
    { label: "🍎 Pomme",      category: "fruits" },
    { label: "🍌 Banane",     category: "fruits" },
    { label: "🍓 Fraise",     category: "fruits" },
    { label: "🍐 Poire",      category: "fruits" },
    { label: "🍇 Raisin",     category: "fruits" },
    { label: "🫐 Bleuet",     category: "fruits" },
    { label: "🍍 Ananas",     category: "fruits" },
    { label: "🍉 Melon d'eau",category: "fruits" },

    // Légumes
    { label: "🥕 Carotte",    category: "legumes" },
    { label: "🥦 Brocoli",    category: "legumes" },
    { label: "🥔 Patate",     category: "legumes" },
    { label: "🥒 Concombre",  category: "legumes" },
    { label: "🧅 Oignon",     category: "legumes" },
    { label: "🫛 Petits pois",category: "legumes" },
    { label: "🍆 Aubergine",  category: "legumes" },
    { label: "🥬 Laitue",     category: "legumes" },

    // Desserts
    { label: "🍰 Gâteau",       category: "desserts" },
    { label: "🍦 Crème glacée", category: "desserts" },
    { label: "🧁 Cupcake",      category: "desserts" },
    { label: "🍪 Biscuit",      category: "desserts" },
    { label: "🍩 Beigne",       category: "desserts" },
    { label: "🍫 Chocolat",     category: "desserts" },
    { label: "🍬 Bonbon",       category: "desserts" },
    { label: "🍿 Popcorn",      category: "desserts" },

    // Viandes
    { label: "🍗 Poulet",    category: "viandes" },
    { label: "🥩 Steak",     category: "viandes" },
    { label: "🌭 Saucisse",  category: "viandes" },
    { label: "🥓 Bacon",     category: "viandes" },
    { label: "🥚 Oeuf",      category: "viandes" },
    { label: "🍤 Crevette",  category: "viandes" },
    { label: "🐟 Poisson",   category: "viandes" },
    { label: "🍖 Boeuf",     category: "viandes" },
];

const NB_ALIMENTS_PAR_PARTIE = 10;

let itemsContainer;
let zones;
let scoreSpan;
let scoreWrapper;
let summaryDiv;
let finalScoreSpan;
let startBtn;
let replayBtn;
let currentItemWrapper;

let totalAliments = 0;
let bienPlaces = 0;

// Ordre aléatoire des aliments
let ordreAliments = [];
let currentIndex = 0;   
let currentItem = null; 

function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Afficher l'aliment
function afficherAlimentCourant() {
    itemsContainer.innerHTML = "";

    // S’il n’y a plus d’aliments à afficher
    if (currentIndex >= ordreAliments.length) {
        currentItem = null;
        return;
    }

    currentItem = ordreAliments[currentIndex];

    const card = document.createElement("div");
    card.classList.add("item");
    card.textContent = currentItem.label;

    itemsContainer.appendChild(card);
}

// initialiser le jeu
function initialiserJeu() {
    ordreAliments = shuffle(aliments).slice(0, NB_ALIMENTS_PAR_PARTIE);
    bienPlaces = 0;
    currentIndex = 0;
    currentItem = null;
    totalAliments = ordreAliments.length;

    // Affichage en cours de partie
    scoreSpan.textContent = "0";
    summaryDiv.classList.add("hidden");
    currentItemWrapper.classList.remove("hidden");
    scoreWrapper.classList.remove("hidden");
    startBtn.classList.add("hidden");
    zones.forEach((zone) => {
        const titre = zone.querySelector(".zone-title");
        zone.innerHTML = "";
        if (titre) {
            zone.appendChild(titre);
        }
    });

    afficherAlimentCourant();
}

function initialiserZones() {
    zones.forEach((zone) => {
        zone.addEventListener("click", () => {
            if (!currentItem) return;

            const categorieZone = zone.dataset.category;
            const bonneCategorie = currentItem.category;

            if (categorieZone === bonneCategorie) {
                const sorted = document.createElement("div");
                sorted.classList.add("item", "correct");
                sorted.textContent = currentItem.label;
                zone.appendChild(sorted);

                bienPlaces++;
                scoreSpan.textContent = String(bienPlaces);

                if (bienPlaces === totalAliments) {
                    // Affichage en fin de partie
                    itemsContainer.innerHTML = "";
                    currentItem = null;
                    finalScoreSpan.textContent = String(bienPlaces);
                    currentItemWrapper.classList.add("hidden");
                    scoreWrapper.classList.add("hidden");
                    summaryDiv.classList.remove("hidden");
                } else {
                    // Aliment suivant
                    currentIndex++;
                    afficherAlimentCourant();
                }
            } else {
                // Animation d’erreur
                zone.classList.add("wrong");
                setTimeout(() => {
                    zone.classList.remove("wrong");
                }, 200);
            }
        });
    });
}


document.addEventListener("DOMContentLoaded", () => {
    itemsContainer = document.getElementById("items-container");
    zones = document.querySelectorAll(".zone");
    scoreSpan = document.getElementById("score");
    scoreWrapper = document.getElementById("score-wrapper");
    summaryDiv = document.getElementById("summary");
    finalScoreSpan = document.getElementById("final-score");
    startBtn = document.getElementById("start-btn");
    replayBtn = document.getElementById("cl-replay");
    currentItemWrapper = document.getElementById("current-item-wrapper");

    // Affichage du début
    currentItemWrapper.classList.add("hidden");
    scoreWrapper.classList.add("hidden");
    summaryDiv.classList.add("hidden");

    initialiserZones();

    // Interactions avec les boutons
    startBtn.addEventListener("click", () => {
        initialiserJeu();
    });
    replayBtn.addEventListener("click", () => {
        initialiserJeu();
    });
});
