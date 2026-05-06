# 🎮 Jeux Sérieux — Plateforme Narrative & Éducative IA

Plateforme web full-stack pour transformer l'apprentissage de la lecture chez les enfants du primaire (6-11 ans).

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- MongoDB (local ou MongoDB Atlas)
- Clé API OpenAI

### Installation

```bash
# 1. Cloner / extraire le projet
cd jeux-serieux

# 2. Installer toutes les dépendances
npm run install:all

# 3. Configurer les variables d'environnement
cp backend/.env.example backend/.env
# Éditer backend/.env avec vos clés

# 4. Lancer le projet (frontend + backend simultanément)
npm run dev
```

### URLs
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:5000

## 📁 Structure du Projet

```
jeux-serieux/
├── frontend/          # React 18 + Vite + Tailwind CSS
│   └── src/
│       ├── components/
│       │   ├── auth/       # Login, SignUp
│       │   ├── teacher/    # Dashboard enseignant
│       │   ├── student/    # Interface jeu étudiant
│       │   └── shared/     # Composants communs
│       ├── pages/          # Pages principales
│       ├── context/        # Auth & App context
│       └── hooks/          # Custom hooks
└── backend/           # Node.js + Express
    ├── routes/         # Routes API
    ├── controllers/    # Logique métier
    ├── models/         # Modèles MongoDB
    ├── services/       # Services IA (OpenAI)
    └── middleware/     # Auth JWT, upload
```

## 🔑 Variables d'Environnement (backend/.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/jeux-serieux
JWT_SECRET=votre_secret_jwt_super_long
OPENAI_API_KEY=sk-votre_clé_openai
NODE_ENV=development
```

## 👤 Comptes de Test

Après `npm run dev`, créez des comptes via l'interface :
- Enseignant : inscription avec rôle "teacher"
- Étudiant : inscription avec rôle "student"

## 🛠️ Stack Technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, Mongoose |
| Base de données | MongoDB |
| IA | OpenAI GPT-4o-mini + TTS |
| Auth | JWT + bcrypt |
| Upload | Multer |
