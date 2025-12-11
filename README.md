# 🎮 Mini-Arcade Web

Plateforme web de mini-jeux avec gestion de profils utilisateur, système de scores et leaderboards.

**Développé par:** Cassandra Bélanger, Nesrine Haggui, Guy Junior Calvet, Émilie Harel et Adèle Dalle

---

## 📋 Description

Projet web permettant de jouer à des petits jeux directement dans le navigateur.  
L'application inclut:
- Profils personnalisables (pseudo, avatar, couleur)
- Système de scores
- Leaderboards par jeu / global
- Mini-jeux (Simon, speedTyping, ...)

---

## 🛠 Technologies

### Backend
- **Node.js** v20.11.0+
- **Express** 4.21.2
- **Prisma** 5.21.1 (ORM)
- **SQLite** (Base de données)

### Frontend
- **HTML5**
- **CSS3**
- **JavaScript** (ES6+)

---

## 📦 Installation

### Prérequis
- Node.js v20.11.0+
- npm v10.2.4+

### Étapes

1. **Cloner le dépôt**
```bash
git clone https://github.com/casstoipaslatete/projet-web.git
cd projet-web
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Créer la base de données**
```bash
npx prisma migrate dev --name init
```

4. **Démarrer le serveur**
```bash
npm start
```

L'application sera accessible sur `http://localhost:3000`

---

## 🎮 Fonctionnalités

- ✅ Gestion de profil personnalisé (avatar/couleur)
- ✅ Mini-jeux
- ✅ Sauvegarde automatique des scores
- ✅ Leaderboard par jeu / global
- ✅ Interface responsive

---

## 📁 Structure

```
projet-web/
├── public/          # Pages HTML
├── games/           # Mini-jeux
├── scripts/         # Logique frontend
├── styles/          # Feuilles de style
├── prisma/          # Configuration BD
├── server.js        # Serveur Express
├── .env             # Variables d'env
└── package.json
```

