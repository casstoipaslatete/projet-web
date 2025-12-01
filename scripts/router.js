// scripts/router.js

// Router global - routage côté client basé sur les hashes (#)
// Définit `window.Router` si non présent, et évite la redéclaration si le script
// est accidentellement chargé plusieurs fois (préserve l'état précédemment enregistré).
if (!window.Router) {
  window.Router = (() => {
    const routes = {};          // { menu: handler, profile: handler, leaderboard: handler }
    const rootId = "app-root";  // injection dans #app-root

    function register(routeName, handler) {
      routes[routeName] = handler;
    }

    function goTo(routeName) {
      window.location.hash = "#" + routeName;
    }

    function handleRouteChange() {
      const hash = window.location.hash.replace("#", "") || "menu";
      const root = document.getElementById(rootId);
      if (!root) return;

      const handler = routes[hash];
      if (!handler) {
        root.innerHTML = `<p>404 - Page ${hash} non trouvée</p>`;
        return;
      }

      // Appelle le handler avec le conteneur
      handler(root);
    }

    window.addEventListener("hashchange", handleRouteChange);

    return {
      register,
      goTo,
      start: handleRouteChange,
      goToGame: (gameId) => {
        window.location.href = `/games/${gameId}/${gameId}.html`;
      }
    };
  })();
}

// Expose `Router` dans le scope global
var Router = window.Router;
