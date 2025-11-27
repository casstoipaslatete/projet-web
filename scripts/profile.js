// --- Sélecteurs ---
const avatarButtons = document.querySelectorAll(".avatar-emoji");
const previewAvatar = document.getElementById("preview-avatar");

const colorPicker = document.getElementById("profile-color");
const previewColor = document.getElementById("preview-color");
const colorButtons = document.querySelectorAll(".color-choice");

const pseudoInput = document.getElementById("profile-pseudo");
const saveButton = document.getElementById("save-profile");

// --- État du profil ---
let currentProfile = {
  pseudo: '',
  avatar: '😺',
  color: '#ffcc00'
};

// --- Initialisation au démarrage ---
window.addEventListener("DOMContentLoaded", () => {
  // Charger depuis localStorage
  const savedAvatar = localStorage.getItem('avatar') || '😺';
  const savedColor = localStorage.getItem('color') || '#ffcc00';
  const savedPseudo = localStorage.getItem('pseudo') || '';

  currentProfile.avatar = savedAvatar;
  currentProfile.color = savedColor;
  currentProfile.pseudo = savedPseudo;

  updatePreview();
});

// --- Mise à jour de l'aperçu ---
function updatePreview() {
  previewAvatar.textContent = currentProfile.avatar;
  previewColor.style.backgroundColor = currentProfile.color;
  pseudoInput.value = currentProfile.pseudo;
  colorPicker.value = currentProfile.color;
}

// --- Changement d'avatar ---
avatarButtons.forEach(button => {
  button.addEventListener("click", () => {
    const chosenAvatar = button.getAttribute("data-avatar");
    currentProfile.avatar = chosenAvatar;
    previewAvatar.textContent = chosenAvatar;
  });
});

// --- Changement de couleur via color picker ---
colorPicker.addEventListener("input", () => {
  currentProfile.color = colorPicker.value;
  previewColor.style.backgroundColor = colorPicker.value;
});

// --- Changement de couleur via boutons prédéfinis ---
colorButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const chosenColor = btn.getAttribute("data-color");
    currentProfile.color = chosenColor;
    previewColor.style.backgroundColor = chosenColor;
    colorPicker.value = chosenColor;
  });
});

// --- Changement du pseudo ---
pseudoInput.addEventListener("input", () => {
  currentProfile.pseudo = pseudoInput.value;
});

// --- Sauvegarde du profil ---
saveButton.addEventListener("click", () => {
  // Sauvegarder dans localStorage
  localStorage.setItem('pseudo', currentProfile.pseudo);
  localStorage.setItem('avatar', currentProfile.avatar);
  localStorage.setItem('color', currentProfile.color);
  
  // Feedback non bloquant: log console
  console.log('Profil sauvegardé avec succès ✓');
});
