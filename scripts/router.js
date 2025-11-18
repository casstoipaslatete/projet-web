export const Router = (() => {
  const routes = {};    // { menu: handler, profile: handler, leaderboard: handler }
  const rootId = "app-root";

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
