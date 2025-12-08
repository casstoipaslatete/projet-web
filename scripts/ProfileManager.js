// scripts/ProfileManager.js

// Petit module global qui s'occupe UNIQUEMENT de parler à l'API.
// AUCUN accès au DOM ici.
window.ProfileManager = (function () {
  const DEFAULT_PROFILE = {
    pseudo: "",
    avatar: "😺",
    color: "#ffcc00",
  };

  const DEFAULT_PROFILE_ID = 1; // Simple default profile ID (no auth system)

  async function load() {
    try {
      const response = await fetch(`/api/profile/${DEFAULT_PROFILE_ID}`);
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
      console.error("[ProfileManager] Erreur lors du chargement du profil:", err);
      return DEFAULT_PROFILE;
    }
  }

  async function save(profile) {
    try {
      await fetch(`/api/profile/${DEFAULT_PROFILE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      console.log("[ProfileManager] Profil sauvegardé !");
    } catch (err) {
      console.error("[ProfileManager] Erreur lors de la sauvegarde du profil:", err);
    }
  }

  async function delete_profile() {
    try {
      await fetch(`/api/profile/${DEFAULT_PROFILE_ID}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      console.log("[ProfileManager] Profil supprimé !");
    } catch (err) {
      console.error("[ProfileManager] Erreur lors de la suppression du profil:", err);
    }
  }

  return {
    load,
    save,
    delete_profile,
  };
})();
