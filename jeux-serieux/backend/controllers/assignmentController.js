const Assignment = require('../models/Assignment');
const Story      = require('../models/Story');
const Class      = require('../models/Class');
const Progress   = require('../models/Progress');
const { generateChallenges } = require('../services/openaiService');

// ── Traitement IA en arrière-plan ─────────────────────────────────────────────
async function generateQuestionsAsync(assignmentId, narratedText, title, objective) {
  try {
    const { questions } = await generateChallenges(narratedText, title, objective);
    await Assignment.findByIdAndUpdate(assignmentId, { questions, status: 'ready' });
    console.log(`✅ Assignment ${assignmentId} prêt (${questions.length} défis, objectif: ${objective})`);
  } catch (error) {
    await Assignment.findByIdAndUpdate(assignmentId, { status: 'error' });
    console.error(`❌ Erreur génération défis ${assignmentId} :`, error.message);
  }
}

// ── POST /api/assignments  (prof) ─────────────────────────────────────────────
exports.createAssignment = async (req, res) => {
  try {
    const { storyId, classId, objective, level } = req.body;
    if (!storyId || !classId || !objective) {
      return res.status(400).json({ message: 'storyId, classId et objective sont requis' });
    }

    const story = await Story.findOne({ _id: storyId, createdBy: req.user._id });
    if (!story) return res.status(404).json({ message: 'Histoire introuvable' });
    if (story.status !== 'ready') {
      return res.status(400).json({ message: "L'histoire n'est pas encore prête (status: " + story.status + ')' });
    }

    const cls = await Class.findOne({ _id: classId, teacher: req.user._id });
    if (!cls) return res.status(404).json({ message: 'Classe introuvable' });

    const assignment = await Assignment.create({
      story:      storyId,
      classId,
      assignedBy: req.user._id,
      objective,
      level:      level || 1,
      status:     'processing',
    });

    // Génération des défis sans bloquer la réponse
    generateQuestionsAsync(assignment._id, story.narratedText, story.title, objective);

    res.status(201).json({
      message: "Défis en cours de génération par l'IA...",
      assignment: {
        id:        assignment._id,
        status:    assignment.status,
        objective: assignment.objective,
        level:     assignment.level,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Cette histoire est déjà assignée à cette classe pour cet objectif',
      });
    }
    console.error('createAssignment error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/assignments/class/:classId  (prof) ───────────────────────────────
exports.getClassAssignments = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.classId, teacher: req.user._id });
    if (!cls) return res.status(404).json({ message: 'Classe introuvable' });

    const assignments = await Assignment.find({ classId: req.params.classId })
      .populate('story', 'title coverEmoji difficulty status')
      .sort({ level: 1, createdAt: -1 })
      .select('-questions'); // questions réservées au détail
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/assignments/:id  (prof OU élève) ─────────────────────────────────
// Prof  → réponse complète (avec questions + bonnes réponses)
// Élève → questions sans correctAnswer/correctOrder/explanation, si niveau débloqué
exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('story', 'title coverEmoji difficulty narratedText')
      .populate('classId', 'name');
    if (!assignment) return res.status(404).json({ message: 'Assignment introuvable' });

    if (req.user.role === 'teacher') {
      if (assignment.assignedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Non autorisé' });
      }
      return res.json(assignment);
    }

    // Élève
    const classId = assignment.classId._id || assignment.classId;
    if (!req.user.classId || req.user.classId.toString() !== classId.toString()) {
      return res.status(403).json({ message: "Tu n'appartiens pas à cette classe" });
    }
    if (assignment.level > req.user.level) {
      return res.status(403).json({ message: 'Ce niveau est verrouillé' });
    }
    if (!assignment.active || assignment.status !== 'ready') {
      return res.status(404).json({ message: 'Assignment non disponible' });
    }

    // Masquer les bonnes réponses et explications
    const safe = assignment.toObject();
    safe.questions = safe.questions.map((q) => {
      const stripped = { type: q.type, question: q.question };
      if (q.options) stripped.options = q.options;
      if (q.events)  stripped.events  = q.events;
      return stripped;
    });
    return res.json(safe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE /api/assignments/:id  (prof) ───────────────────────────────────────
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndDelete({
      _id: req.params.id, assignedBy: req.user._id,
    });
    if (!assignment) return res.status(404).json({ message: 'Assignment introuvable' });

    await Progress.deleteMany({ assignment: req.params.id });
    res.json({ message: 'Assignment et progressions associées supprimés' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/assignments/student  (élève) ─────────────────────────────────────
// Renvoie les assignments ready+active de la classe de l'élève, groupés par level.
// Niveaux verrouillés : locked:true, sans questions ni bonnes réponses.
exports.getStudentAssignments = async (req, res) => {
  try {
    if (!req.user.classId) {
      return res.json({ levels: [], unlockedLevel: req.user.level });
    }

    const assignments = await Assignment.find({
      classId: req.user.classId,
      status:  'ready',
      active:  true,
    })
      .populate('story', 'title coverEmoji difficulty')
      .sort({ level: 1, createdAt: -1 });

    // Récupérer la progression de l'élève pour ces assignments
    const assignmentIds = assignments.map((a) => a._id);
    const progresses = await Progress.find({
      student:    req.user._id,
      assignment: { $in: assignmentIds },
    }).select('assignment attempts score stars completed');

    const progressMap = {};
    progresses.forEach((p) => { progressMap[p.assignment.toString()] = p; });

    const unlockedLevel = req.user.level;

    // Grouper par level
    const grouped = {};
    for (const a of assignments) {
      const lvl      = a.level;
      const isLocked = lvl > unlockedLevel;
      const progress = progressMap[a._id.toString()];

      let progressState = 'not_started';
      if (progress) {
        progressState = progress.completed ? 'completed'
          : progress.attempts.length >= 1 ? 'attempted'
          : 'not_started';
      }

      const item = {
        _id:           a._id,
        objective:     a.objective,
        level:         a.level,
        dueDate:       a.dueDate,
        story: {
          _id:        a.story._id,
          title:      a.story.title,
          coverEmoji: a.story.coverEmoji,
          difficulty: a.story.difficulty,
        },
        locked:        isLocked,
        progressState,
        stars:         progress?.stars  || 0,
        score:         progress?.score  || 0,
      };

      if (!grouped[lvl]) grouped[lvl] = [];
      grouped[lvl].push(item);
    }

    const levels = Object.entries(grouped)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, items]) => ({ level: Number(level), assignments: items }));

    res.json({ levels, unlockedLevel });
  } catch (error) {
    console.error('getStudentAssignments error:', error.message);
    res.status(500).json({ message: error.message });
  }
};
