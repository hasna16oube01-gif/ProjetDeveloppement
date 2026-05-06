const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const storyRoutes = require('./routes/stories');
const classRoutes = require('./routes/classes');
const progressRoutes = require('./routes/progress');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (audio, uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/progress', progressRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Jeux Sérieux API running!' });
});
// Ajoute ça juste avant mongoose.connect
console.log("--- TEST CONFIG ---");
console.log("PORT:", process.env.PORT);
console.log("CLÉ GEMINI EXISTE ?:", process.env.GEMINI_API_KEY ? "OUI" : "NON");
console.log("-------------------");
// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connecté');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Serveur lancé sur http://localhost:${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erreur MongoDB:', err.message);
    process.exit(1);
  });
