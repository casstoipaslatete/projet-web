async function loadProfile() {
    const response = await fetch("/api/profile");
    const data = await response.json();

    document.getElementById("profile-pseudo").value = data.pseudo || "";

    // avatar
    document.getElementById("preview-avatar").textContent = data.avatar;

    // couleur
    document.getElementById("preview-color").style.backgroundColor = data.color;
}

async function saveProfile() {
    const pseudo = document.getElementById("profile-pseudo").value;
    const avatar = document.getElementById("preview-avatar").textContent;
    const color = getComputedStyle(document.getElementById("preview-color")).backgroundColor;

    await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo, avatar, color })
    });
    
    console.log('Profil sauvegardé !');
}

document.getElementById("save-profile").addEventListener("click", saveProfile);

// charger le profil au démarrage
loadProfile();
