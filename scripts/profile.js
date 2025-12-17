(function () {
  function initProfilePage() {
    const pageRoot = document.getElementById("profile-page");
    if (!pageRoot) return;

    const pseudoInput   = pageRoot.querySelector("#profile-pseudo");
    const avatarButtons = pageRoot.querySelectorAll(".avatar-emoji");
    const colorPicker   = pageRoot.querySelector("#profile-color");
    const colorButtons  = pageRoot.querySelectorAll(".color-choice");
    const previewAvatar = pageRoot.querySelector("#preview-avatar");
    const previewColor  = pageRoot.querySelector("#preview-color");
    const saveButton    = pageRoot.querySelector("#save-profile");
    const backButton    = pageRoot.querySelector("#back-to-arcade");

    if (!pseudoInput || !previewAvatar || !previewColor) return;

    // --- DOM ---
    function applyProfileToUI(profile) {
      const pseudo = profile.pseudo ?? "";
      const avatar = profile.avatar ?? "😺";
      const color  = profile.color ?? "#ffcc00";

      pseudoInput.value = pseudo;
      previewAvatar.textContent = avatar;
      previewColor.style.backgroundColor = color;

      if (colorPicker) {
        try {
          if (typeof color === "string" && color.startsWith("#")) {
            colorPicker.value = color;
          }
        } catch {}
      }

      avatarButtons.forEach((btn) => {
        const emoji = (btn.dataset.avatar || btn.textContent || "").trim();
        btn.classList.toggle("selected", emoji === avatar);
      });

      colorButtons.forEach((btn) => {
        const c = btn.getAttribute("data-color");
        btn.classList.toggle("selected", c === color);
      });

      localStorage.setItem("pseudo", pseudo);
      localStorage.setItem("avatar", avatar);
      localStorage.setItem("color", color);

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

      if (colorPicker && colorPicker.value) {
        color = colorPicker.value;
      } else {
        const selectedBtn = pageRoot.querySelector(".color-choice.selected");
        if (selectedBtn) {
          color = selectedBtn.getAttribute("data-color") || color;
        } else if (previewColor.style.backgroundColor) {
          color = previewColor.style.backgroundColor;
        }
      }

      return { pseudo, avatar, color };
    }

// --- UI ---
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

    if (saveButton) {
      saveButton.addEventListener("click", async () => {
        const profile = getProfileFromUI();

        try {
          if (window.ProfileManager && typeof ProfileManager.saveProfile === "function") {
            await ProfileManager.saveProfile(profile.pseudo, profile.avatar, profile.color);
          } else {
            console.log("[profile] Profil (fallback, pas d'API):", profile);
          }

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

    if (backButton) {
      backButton.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.Router && typeof Router.goTo === "function") {
          Router.goTo("menu");
        } else {
          window.location.href = "/public/index.html#menu";
        }
      });
    }

// --- CHARGEMENT DEPUIS API ---
    (async () => {
      let profile;
      if (window.ProfileManager && typeof ProfileManager.loadProfile === "function") {
        profile = await ProfileManager.loadProfile();
      } else {
        applyProfileToUI({ pseudo: "anonyme", avatar: "😺", color: "#ffcc00" });
      }
      applyProfileToUI(profile);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProfilePage);
  } else {
    initProfilePage();
  }

  window.initProfilePage = initProfilePage;
})();
