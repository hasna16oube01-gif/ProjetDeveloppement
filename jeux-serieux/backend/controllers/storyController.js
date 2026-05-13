const fs       = require('fs');
const Story    = require('../models/Story');
const Progress = require('../models/Progress');
const { processStoryWithAI, generateAudio } = require('../services/openaiService');

// ── Traitement IA en arrière-plan ─────────────────────────────────────────────
async function processStoryAsync(storyId, originalText, title) {
  try {
    const { simplifiedText, questions } = await processStoryWithAI(originalText, title);
    const audioPath = await generateAudio(simplifiedText, storyId);
    await Story.findByIdAndUpdate(storyId, {
      simplifiedText,
      questions,
      audioPath,
      status: 'ready',
    });
    console.log(`✅ Histoire "${title}" (${storyId}) traitée avec succès`);
  } catch (error) {
    await Story.findByIdAndUpdate(storyId, { status: 'error' });
    console.error(`❌ Erreur traitement histoire ${storyId} :`, error.message);
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
      difficulty:  difficulty || 'medium',
      coverEmoji:  coverEmoji || '📖',
      status:      'processing',
      createdBy:   req.user._id,
    });

    // Lancement du traitement IA sans bloquer la réponse
    processStoryAsync(story._id, originalText, title);

    res.status(201).json({
      message: "Histoire en cours de traitement par l'IA...",
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
      .select('-originalText -questions');
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/stories/student ──────────────────────────────────────────────────
exports.getStudentStories = async (req, res) => {
  try {
    // Construire la requête selon si l'élève a une classe
    const query = { status: 'ready' };
    if (req.user.classId) {
      query.$or = [
        { assignedStudents: req.user._id },
        { assignedClasses:  req.user.classId },
      ];
    } else {
      query.assignedStudents = req.user._id;
    }

    const stories = await Story.find(query)
      .sort({ createdAt: -1 })
      .select('-originalText -questions');

    // Récupérer la progression pour chaque histoire
    const storyIds   = stories.map((s) => s._id);
    const progresses = await Progress.find({
      student: req.user._id,
      story:   { $in: storyIds },
    });

    const progressMap = {};
    progresses.forEach((p) => {
      progressMap[p.story.toString()] = p;
    });

    const result = stories.map((s) => ({
      ...s.toObject(),
      progress: progressMap[s._id.toString()] || null,
    }));

    res.json(result);
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

    // Les élèves ne voient pas les bonnes réponses
    if (req.user.role === 'student') {
      const safe = story.toObject();
      safe.questions = safe.questions.map((q) => ({
        type:     q.type,
        question: q.question,
        options:  q.options,
        events:   q.events,
      }));
      return res.json(safe);
    }

    res.json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/stories/:id/assign ──────────────────────────────────────────────
exports.assignStory = async (req, res) => {
  try {
    const { studentIds, classIds } = req.body;
    const story = await Story.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!story) return res.status(404).json({ message: 'Histoire introuvable' });

    if (Array.isArray(studentIds) && studentIds.length > 0) {
      story.assignedStudents = [
        ...new Set([...story.assignedStudents.map(String), ...studentIds]),
      ];
    }
    if (Array.isArray(classIds) && classIds.length > 0) {
      story.assignedClasses = [
        ...new Set([...story.assignedClasses.map(String), ...classIds]),
      ];
    }

    await story.save();
    res.json({ message: 'Histoire assignée avec succès', story });
  } catch (error) {
    console.error('assignStory error:', error.message);
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
