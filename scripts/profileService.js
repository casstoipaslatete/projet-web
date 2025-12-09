/**
 * Service de gestion des profils
 * Communique avec l'API pour charger et sauvegarder les profils
 */
const ProfileService = (() => {
  
  // Charger le profil de l'utilisateur
  async function loadProfile(profileId) {
    try {
      const response = await fetch(`/api/profile/${profileId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        console.warn('Profil non trouvé, utilisation des valeurs par défaut');
        return null;
      }

      const profile = await response.json();
      
      // Stocker dans localStorage pour accès rapide
      localStorage.setItem('pseudo', profile.pseudo || '');
      localStorage.setItem('avatar', profile.avatar || '😺');
      localStorage.setItem('color', profile.color || '#ffcc00');

      console.log('Profil chargé:', profile);
      return profile;
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      return null;
    }
  }

  // Sauvegarder le profil de l'utilisateur
  async function saveProfile(pseudo, avatar, color) {
    try {

      const response = await fetch('/api/profile', {
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

      const result = await response.json();

      // Mettre à jour localStorage
      localStorage.setItem('pseudo', pseudo);
      localStorage.setItem('avatar', avatar);
      localStorage.setItem('color', color);

      console.log('Profil sauvegardé:', result);

      //ajout profileId
      localStorage.setItem('profileId', result.profile_res.id);
      
      // Dispatcher un événement
      window.dispatchEvent(new CustomEvent('profile:updated', {
        detail: { pseudo, avatar, color }
      }));

      return result;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      throw error;
    }
  }

  // Sauvegarder le profil de l'utilisateur
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

      const result = await response.json();

      // Mettre à jour localStorage
      localStorage.setItem('profileId', profileId);
      localStorage.setItem('pseudo', pseudo);
      localStorage.setItem('avatar', avatar);
      localStorage.setItem('color', color);

      console.log('Profil sauvegardé:', result);
      
      // Dispatcher un événement
      window.dispatchEvent(new CustomEvent('profile:updated', {
        detail: { pseudo, avatar, color }
      }));

      return result;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      throw error;
    }
  }

  return {
    loadProfile,
    saveProfile, 
    updateProfile
  };
})();
