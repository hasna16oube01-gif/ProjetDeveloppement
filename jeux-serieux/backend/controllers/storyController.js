const fs      = require('fs');
const Story   = require('../models/Story');
const { narrateStory } = require('../services/openaiService');

// ── Narration IA en arrière-plan ──────────────────────────────────────────────
async function narrateStoryAsync(storyId, originalText, title) {
  try {
    const { narratedText } = await narrateStory(originalText, title);
    await Story.findByIdAndUpdate(storyId, { narratedText, status: 'ready' });
    console.log(`✅ Histoire "${title}" (${storyId}) narrée avec succès`);
  } catch (error) {
    await Story.findByIdAndUpdate(storyId, { status: 'error' });
    console.error(`❌ Erreur narration histoire ${storyId} :`, error.message);
  }
}

// ── POST /api/stories ─────────────────────────────────────────────────────────
exports.createStory = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: 'Fichier texte requis' });

    const { title, difficulty, coverEmoji } = req.body;
    if (!title)
      return res.status(400).json({ message: 'Titre requis' });

    const originalText = fs.readFileSync(req.file.path, 'utf-8');
    if (originalText.trim().length < 50)
      return res.status(400).json({ message: 'Texte trop court (min 50 caractères)' });

    const story = await Story.create({
      title,
      originalText,
      difficulty: difficulty || 'medium',
      coverEmoji: coverEmoji || '📖',
      status:     'processing',
      createdBy:  req.user._id,
    });

    // Narration IA sans bloquer la réponse
    narrateStoryAsync(story._id, originalText, title);

    res.status(201).json({
      message: "Histoire en cours de narration par l'IA...",
      story: { id: story._id, title: story.title, status: story.status },
    });
  } catch (error) {
    console.error('createStory error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/stories/teacher ──────────────────────────────────────────────────
exports.getTeacherStories = async (req, res) => {
  try {
    const stories = await Story.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .select('-originalText');
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/stories/student ──────────────────────────────────────────────────
// Conservé pour compatibilité. Les histoires sont désormais accessibles via
// /api/assignments/student. Cette route retourne toutes les histoires 'ready'.
exports.getStudentStories = async (req, res) => {
  try {
    const stories = await Story.find({ status: 'ready' })
      .sort({ createdAt: -1 })
      .select('-originalText -narratedText');
    res.json(stories);
  } catch (error) {
    console.error('getStudentStories error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/stories/:id ──────────────────────────────────────────────────────
exports.getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Histoire introuvable' });

    if (req.user.role === 'student') {
      // Les élèves ne voient pas le texte brut, seulement le narratedText
      const safe = story.toObject();
      delete safe.originalText;
      return res.json(safe);
    }

    res.json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE /api/stories/:id ───────────────────────────────────────────────────
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findOneAndDelete({
      _id: req.params.id, createdBy: req.user._id,
    });
    if (!story) return res.status(404).json({ message: 'Histoire introuvable' });
    res.json({ message: 'Histoire supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
