// scripts/profile.js
(function () {
  function initProfilePage() {
    const pageRoot = document.getElementById("profile-page");
    if (!pageRoot) return; // profil pas dans le DOM

    const pseudoInput   = pageRoot.querySelector("#profile-pseudo");
    const avatarButtons = pageRoot.querySelectorAll(".avatar-emoji");
    const colorPicker   = pageRoot.querySelector("#profile-color");
    const colorButtons  = pageRoot.querySelectorAll(".color-choice");
    const previewAvatar = pageRoot.querySelector("#preview-avatar");
    const previewColor  = pageRoot.querySelector("#preview-color");
    const saveButton    = pageRoot.querySelector("#save-profile");
    const backButton    = pageRoot.querySelector("#back-to-arcade");

    if (!pseudoInput || !previewAvatar || !previewColor) return;

    // -----------------------
    // Helpers DOM <-> profil
    // -----------------------

    function applyProfileToUI(profile) {
      const pseudo = profile.pseudo ?? "";
      const avatar = profile.avatar ?? "😺";
      const color  = profile.color ?? "#ffcc00";

      pseudoInput.value = pseudo;
      previewAvatar.textContent = avatar;
      previewColor.style.backgroundColor = color;

      if (colorPicker) {
        // si l'API renvoie un rgb(), on garde au moins la couleur visuelle
        try {
          if (color.startsWith("#")) {
            colorPicker.value = color;
          }
        } catch {}
      }

      // Sélection visuelle des avatars
      avatarButtons.forEach((btn) => {
        const emoji = (btn.dataset.avatar || btn.textContent || "").trim();
        btn.classList.toggle("selected", emoji === avatar);
      });

      // Sélection visuelle des couleurs
      colorButtons.forEach((btn) => {
        const c = btn.getAttribute("data-color");
        btn.classList.toggle("selected", c === color);
      });
    }

    function getProfileFromUI() {
      const pseudo = pseudoInput.value;
      const avatar = previewAvatar.textContent;
      const color  = getComputedStyle(previewColor).backgroundColor;
      return { pseudo, avatar, color };
    }

    // -----------------------
    // Listeners UI
    // -----------------------

    // Avatars
    avatarButtons.forEach((btn) => {
      const emoji = (btn.dataset.avatar || btn.textContent || "").trim();
      btn.addEventListener("click", () => {
        previewAvatar.textContent = emoji;

        avatarButtons.forEach((b) => {
          const e = (b.dataset.avatar || b.textContent || "").trim();
          b.classList.toggle("selected", e === emoji);
        });
      });
    });

    // Color picker
    if (colorPicker) {
      colorPicker.addEventListener("input", () => {
        const c = colorPicker.value;
        previewColor.style.backgroundColor = c;

        colorButtons.forEach((b) => {
          const col = b.getAttribute("data-color");
          b.classList.toggle("selected", col === c);
        });
      });
    }

    // Boutons couleurs
    colorButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const c = btn.getAttribute("data-color");
        if (!c) return;

        previewColor.style.backgroundColor = c;

        if (colorPicker && c.startsWith("#")) {
          colorPicker.value = c;
        }

        colorButtons.forEach((b) => {
          const col = b.getAttribute("data-color");
          b.classList.toggle("selected", col === c);
        });
      });
    });

    // Sauvegarde
    if (saveButton) {
      saveButton.addEventListener("click", async () => {
        const profile = getProfileFromUI();
        if (window.ProfileManager && typeof ProfileManager.saveProfile === "function") {
          await ProfileManager.saveProfile(profile);
        } else {
          console.log("Profil (fallback, pas d'API):", profile);
        }
      });
    }

    // Retour au menu
    if (backButton) {
      backButton.addEventListener("click", () => {
        if (window.Router) {
          Router.goTo("menu");
        } else {
          window.location.hash = "#menu";
        }
      });
    }

    // -----------------------
    // Chargement depuis l'API
    // -----------------------
    (async () => {
      if (window.ProfileManager && typeof ProfileManager.loadProfile === "function") {
        const profile = await ProfileManager.loadProfile();
        applyProfileToUI(profile);
      } else {
        // Profil par défaut si pas d'API
        applyProfileToUI({ pseudo: "anonyme", avatar: "😺", color: "#ffcc00" });
      }
    })();
  }

  // Cas "page profil ouverte directement" (hors router)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProfilePage);
  } else {
    initProfilePage();
  }

  // Cas SPA : on expose la fonction pour que le router puisse la rappeler
  window.initProfilePage = initProfilePage;

  const backButton = pageRoot.querySelector("#back-to-arcade");

  if (backButton && !window.Router) {
    backButton.addEventListener("click", () => {
      // Ici on renvoie vers l'arcade, où le router prend le relais
      window.location.href = "/public/index.html#menu";
    });
  }
})();
