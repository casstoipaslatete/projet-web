
export const ScoreService = (() => {

  let GAME_ID = null;
  let PROFILE_ID;

  function init(gameId, profileId = 1) {
    GAME_ID = gameId;
    PROFILE_ID = profileId;
  }

  // récupérer le score pour un jeu
  async function getScore() {
    const res = await fetch(`/api/scores/${GAME_ID}`);
    if (!res.ok) return 0;

    const data = await res.json();
    return data.scores ?? 0;
  }

  // récupérer le score pour un profil
  async function getScoresProfile() {
    const res = await fetch(`/api/profile/${PROFILE_ID}/scores`);
    if (!res.ok) return 0;

    const data = await res.json();
    return data.scores ?? 0;
  }

  // async function addPoints(points) {
  //   const res = await fetch(`/api/scores/${GAME_ID}/add`, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ amount: points }),
  //   });

  //   const data = await res.json();

  //   window.dispatchEvent(new CustomEvent("score:addPoints", {
  //     detail: { added: points, total: data.score }
  //   }));

  //   return data.score;
  // }

  // async function resetScore() {
  //   const res = await fetch(`/api/scores/${GAME_ID}/reset`, {
  //     method: "POST"
  //   });

  //   const data = await res.json();

  //   window.dispatchEvent(new CustomEvent("score:reset", {
  //     detail: { score: data.score }
  //   }));

  //   return data.score;
  // }

  // enregistrer un score pour un jeu et un profil
  async function saveScore(game, score, profileId) {
    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ game, score, profileId }),
      });

      if (!response.ok) {
        throw new Error('Failed to save score');
      }

      const result = await response.json();
      console.log(result.message);
    } catch (error) {
      console.error('Error saving score:', error);
    }
  }

  // récupérer les leaderboards
  async function getLeaderboards() {
    const res = await fetch('/api/leaderboard/');
    if (!res.ok) return 0;

    const data = await res.json();
    return data.leaderboards ?? 0;
  }

  return {
    init,
    getScore,
    getScoresProfile,
    // addPoints,
    // resetScore,
    saveScore,
    getLeaderboards
  };
})();

// /**
//  * Service de gestion des scores
//  * Communique avec l'API pour sauvegarder et récupérer les scores
//  */
// const ScoreService = (() => {

//   let GAME_ID = null;
//   let currentUserId = null;
//   let currentUsername = null;

//   function init(gameId, userId = null, username = null) {
//     GAME_ID = gameId;
//     currentUserId = userId || localStorage.getItem('userId');
//     currentUsername = username || localStorage.getItem('username');
//   }

//   // Récupère le leaderboard d'un jeu (top 10 scores)
//   async function getLeaderboard(gameId = GAME_ID) {
//     try {
//       if (!gameId) throw new Error('Game ID not set');
      
//       const res = await fetch(`/api/scores/${gameId}`);
//       if (!res.ok) return [];
//       const data = await res.json();
//       return data;
//     } catch (error) {
//       console.error('Erreur lors de la récupération du leaderboard:', error);
//       return [];
//     }
//   }

//   // Sauvegarde un score
//   async function saveScore(scoreValue) {
//     try {
//       if (!GAME_ID) throw new Error('Game ID not set');

//       const response = await fetch('/api/score', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ 
//           game: GAME_ID, 
//           score: scoreValue,
//           userId: currentUserId ? parseInt(currentUserId) : null,
//           username: currentUsername
//         }),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to save score');
//       }

//       const result = await response.json();
//       console.log('Score sauvegardé:', result.message);
      
//       // Ancienne logique d'événement (conservée en commentaire):
//       // // Dispatcher un événement pour mettre à jour l'UI
//       // window.dispatchEvent(new CustomEvent("score:saved", {
//       //   detail: { game: GAME_ID, score: scoreValue }
//       // }));
//       // On garde un log non bloquant
//       console.log('Event score:saved was previously dispatched (now commented)');

//       return result;
//     } catch (error) {
//       console.error('Erreur lors de la sauvegarde du score:', error);
//     }
//   }

//   // Récupère les scores de l'utilisateur actuel
//   async function getUserScores() {
//     if (!currentUserId) {
//       console.warn('Aucun utilisateur connecté');
//       return [];
//     }

//     try {
//       const res = await fetch(`/api/user/${currentUserId}/scores`);
//       if (!res.ok) return [];
//       const data = await res.json();
//       return data;
//     } catch (error) {
//       console.error('Erreur lors de la récupération des scores utilisateur:', error);
//       return [];
//     }
//   }

//   return {
//     init,
//     getLeaderboard,
//     saveScore,
//     getUserScores,
//   };
// })();