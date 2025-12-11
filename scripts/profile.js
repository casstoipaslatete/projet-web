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

      // UI
      pseudoInput.value = pseudo;
      previewAvatar.textContent = avatar;
      previewColor.style.backgroundColor = color;

      // Color picker si on reçoit bien un hex
      if (colorPicker) {
        try {
          if (typeof color === "string" && color.startsWith("#")) {
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

      // Persistance locale
      localStorage.setItem("pseudo", pseudo);
      localStorage.setItem("avatar", avatar);
      localStorage.setItem("color", color);

      // Notifier le reste de l'app
      window.dispatchEvent(
        new CustomEvent("profile:updated", {
          detail: { pseudo, avatar, color },
        })
      );
    }

    function getProfileFromUI() {
      const pseudo = pseudoInput.value.trim();
      const avatar = (previewAvatar.textContent || "😺").trim();

      let color = "#ffcc00";

      // 1) color picker si dispo
      if (colorPicker && colorPicker.value) {
        color = colorPicker.value;
      } else {
        // 2) bouton couleur sélectionné
        const selectedBtn = pageRoot.querySelector(".color-choice.selected");
        if (selectedBtn) {
          color = selectedBtn.getAttribute("data-color") || color;
        } else if (previewColor.style.backgroundColor) {
          // 3) fallback sur la couleur CSS
          color = previewColor.style.backgroundColor;
        }
      }

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

        try {
          if (window.ProfileManager && typeof ProfileManager.saveProfile === "function") {
            await ProfileManager.saveProfile(profile.pseudo, profile.avatar, profile.color);
          } else {
            console.log("[profile] Profil (fallback, pas d'API):", profile);
          }

          // Mise à jour locale + event global
          localStorage.setItem("pseudo", profile.pseudo);
          localStorage.setItem("avatar", profile.avatar);
          localStorage.setItem("color", profile.color);

          window.dispatchEvent(
            new CustomEvent("profile:updated", {
              detail: profile,
            })
          );

          console.log("[profile] Profil mis à jour !");
        } catch (err) {
          console.error("[profile] Erreur lors de la sauvegarde du profil :", err);
        }
      });
    }

    // Retour au menu
    if (backButton) {
      backButton.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.Router && typeof Router.goTo === "function") {
          Router.goTo("menu");
        } else {
          // fallback si pas de router
          window.location.href = "/public/index.html#menu";
        }
      });
    }

    // -----------------------
    // Chargement depuis l'API
    // -----------------------
    (async () => {
      let profile;
      if (window.ProfileManager && typeof ProfileManager.loadProfile === "function") {
        profile = await ProfileManager.loadProfile();
      } else {
        // Profil par défaut si pas d'API
        applyProfileToUI({ pseudo: "anonyme", avatar: "😺", color: "#ffcc00" });
      }
      applyProfileToUI(profile);
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
})();
