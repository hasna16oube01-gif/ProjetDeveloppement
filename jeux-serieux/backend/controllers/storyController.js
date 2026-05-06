const fs = require('fs');
const Story = require('../models/Story');
const Progress = require('../models/Progress');
const Class = require('../models/Class'); // L'importation cruciale ajoutée ici
const { processStoryWithAI, generateAudio } = require('../services/openaiService');

// @POST /api/stories - Teacher uploads a story
exports.createStory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Fichier texte requis' });
    }
    const { title, difficulty, coverEmoji } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Titre requis' });
    }
    const originalText = fs.readFileSync(req.file.path, 'utf-8');
    if (originalText.length < 50) {
      return res.status(400).json({ message: 'Le texte est trop court (min 50 caractères)' });
    }
    const story = await Story.create({
      title,
      originalText,
      difficulty: difficulty || 'medium',
      coverEmoji: coverEmoji || '📚',
      status: 'processing',
      createdBy: req.user._id,
    });
    processStoryAsync(story._id, originalText, title);
    res.status(201).json({
      message: "Histoire en cours de traitement par l'IA...",
      story: { id: story._id, title: story.title, status: story.status },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Background processing
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
    console.log(`✅ Histoire ${storyId} traitée avec succès`);
  } catch (error) {
    await Story.findByIdAndUpdate(storyId, { status: 'error' });
    console.error(`❌ Erreur traitement histoire ${storyId}:`, error.message);
  }
}

// @GET /api/stories - Teacher gets their stories
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

// @GET /api/stories/student - Student gets assigned stories (LA NOUVELLE FONCTION)
exports.getStudentStories = async (req, res) => {
  try {
    let stories = [];

    // Si l'élève a rejoint une classe
    if (req.user.classId) {
      const studentClass = await Class.findById(req.user.classId);
      
      if (studentClass) {
        // L'élève récupère TOUTES les histoires de son professeur
        stories = await Story.find({
          createdBy: studentClass.teacher,
          status: 'ready',
        })
          .sort({ createdAt: -1 })
          .select('-originalText -questions');
      }
    }

    // Récupérer la progression
    const storyIds = stories.map((s) => s._id);
    const progresses = await Progress.find({
      student: req.user._id,
      story: { $in: storyIds },
    });

    const progressMap = {};
    progresses.forEach((p) => {
      progressMap[p.story.toString()] = p;
    });

    const storiesWithProgress = stories.map((s) => ({
      ...s.toObject(),
      progress: progressMap[s._id.toString()] || null,
    }));

    res.json(storiesWithProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/stories/:id - Get story details (LES FONCTIONS MANQUANTES)
exports.getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Histoire introuvable' });
    if (req.user.role === 'student') {
      const safeStory = story.toObject();
      safeStory.questions = safeStory.questions.map(({ question, options }) => ({
        question,
        options,
      }));
      return res.json(safeStory);
    }
    res.json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/stories/:id/assign - Assign story to students
exports.assignStory = async (req, res) => {
  try {
    const { studentIds, classIds } = req.body;
    const story = await Story.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!story) return res.status(404).json({ message: 'Histoire introuvable' });
    if (studentIds) story.assignedStudents = [...new Set([...story.assignedStudents, ...studentIds])];
    if (classIds) story.assignedClasses = [...new Set([...story.assignedClasses, ...classIds])];
    await story.save();
    res.json({ message: 'Histoire assignée avec succès', story });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/stories/:id
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!story) return res.status(404).json({ message: 'Histoire introuvable' });
    res.json({ message: 'Histoire supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};