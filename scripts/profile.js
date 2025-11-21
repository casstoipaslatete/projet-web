// --- Sélecteurs ---
const avatarButtons = document.querySelectorAll(".avatar-emoji");
const previewAvatar = document.getElementById("preview-avatar");

const colorPicker = document.getElementById("profile-color");
const previewColor = document.getElementById("preview-color");
const colorButtons = document.querySelectorAll(".color-choice"); // boutons prédéfinis

// --- Changement d'avatar ---
avatarButtons.forEach(button => {
    button.addEventListener("click", () => {
        const chosenAvatar = button.textContent;
        previewAvatar.textContent = chosenAvatar;
    });
});

// --- Changement de couleur via color picker ---
colorPicker.addEventListener("input", () => {
    previewColor.style.backgroundColor = colorPicker.value;
});

// --- Changement de couleur via boutons prédéfinis ---
colorButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const chosenColor = btn.dataset.color;
        previewColor.style.backgroundColor = chosenColor;
        colorPicker.value = chosenColor; // synchronise le color picker
    });
});
