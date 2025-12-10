// scripts/ProfileManager.js

// Petit module global qui s'occupe UNIQUEMENT de parler à l'API.
// AUCUN accès au DOM ici.
window.ProfileManager = (function () {
  const DEFAULT_PROFILE = {
    pseudo: "anonyme",
    avatar: "😺",
    color: "#ffcc00",
  };

  async function loadProfile(profileId = null) {
    try {
      if(!profileId) {
        return DEFAULT_PROFILE;
      }

      const response = await fetch(`/api/profile/${profileId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        console.warn("[ProfileManager] /api/profile/{PROFILE_ID} a répondu", response.status);
        return DEFAULT_PROFILE;
      }

      const data = await response.json();

      return data.profile ? data.profile : DEFAULT_PROFILE;
    } catch (err) {
      console.error("[ProfileManager] Erreur lors du chargement du profil:", err);
      return DEFAULT_PROFILE;
    }
  }

  async function saveProfile(pseudo, avatar, color) {
    try {
      const response = await fetch(`/api/profile/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          pseudo, 
          avatar, 
          color 
        })
      });

      if(!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la sauvegarde");
      }

      const data = await response.json();

      console.log("[ProfileManager] Profil sauvegardé !");

      return data.profile ? data.profile : DEFAULT_PROFILE;
    } catch (err) {
      console.error("[ProfileManager] Erreur lors de la sauvegarde du profil:", err);
    }
  }

  async function updateProfile(profileId, pseudo, avatar, color) {
    try {

      const response = await fetch(`/api/profile/${profileId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pseudo,
          avatar,
          color
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la sauvegarde');
      }

      const data = await response.json();

      console.log("[ProfileManager] Profil modifié !");

      return data.profile ? data.profile : DEFAULT_PROFILE;

    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      throw error;
    }
  }

  async function deleteProfile(profileId) {
    try {
      await fetch(`/api/profile/${profileId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      console.log("[ProfileManager] Profil supprimé !");
    } catch (err) {
      console.error("[ProfileManager] Erreur lors de la suppression du profil:", err);
    }
  }

  return {
    loadProfile,
    saveProfile,
    updateProfile,
    deleteProfile,
  };
})();
