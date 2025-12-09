window.ProfileManager = (function () {
  const DEFAULT_PROFILE = {
    pseudo: "",
    avatar: "😺",
    color: "#ffcc00",
  };

  function getUserId() {
    const raw = localStorage.getItem("userId");
    const id = raw ? parseInt(raw, 10) : null;
    return Number.isNaN(id) ? null : id;
  }

  // Charge le profil courant depuis l'API
  async function load() {
    try {
      const response = await fetch("/api/profile", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.warn("[ProfileManager] /api/profile a répondu", response.status);
        return DEFAULT_PROFILE;
      }

      const data = await response.json();

      return {
        pseudo: data.pseudo ?? "",
        avatar: data.avatar ?? "😺",
        color: data.color ?? "#ffcc00",
      };
    } catch (err) {
      console.error("[ProfileManager] Erreur lors du chargement du profil :", err);
      return DEFAULT_PROFILE;
    }
  }

  // Sauvegarde le profil via l'API
  async function save({ pseudo, avatar, color }) {
    try {
      const userId = getUserId();
      if (!userId) {
        console.warn("[ProfileManager] Aucun userId trouvé dans le localStorage");
      }

      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          pseudo,
          avatar,
          color,
        }),
      });

      console.log("[ProfileManager] Profil sauvegardé !");
    } catch (err) {
      console.error("[ProfileManager] Erreur lors de la sauvegarde du profil :", err);
      throw err;
    }
  }

  return {
    load,
    save,
  };
})();
