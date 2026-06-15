const Progress   = require('../models/Progress');
const Assignment = require('../models/Assignment');
const User       = require('../models/User');
const { computeQuestionPoints, computeStars } = require('../services/gameService');
const { POINTS_PER_CORRECT, LEVEL_UNLOCK_RATIO } = require('../config/gameConfig');

// ── POST /api/progress/:assignmentId/submit  (élève) ─────────────────────────
// Enregistre une tentative et renvoie le SCORE (sans révéler les corrections).
exports.submitAttempt = async (req, res) => {
  try {
    const { answers, listenCompleted } = req.body;
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment introuvable' });
    if (assignment.status !== 'ready') {
      return res.status(400).json({ message: "Cet assignment n'est pas encore prêt" });
    }
    if (!req.user.classId || req.user.classId.toString() !== assignment.classId.toString()) {
      return res.status(403).json({ message: "Tu n'appartiens pas à la classe de cet assignment" });
    }
    if (assignment.level > req.user.level) {
      return res.status(403).json({ message: 'Ce niveau est verrouillé' });
    }

    let progress = await Progress.findOne({ student: req.user._id, assignment: assignmentId });
    if (!progress) {
      progress = new Progress({ student: req.user._id, assignment: assignmentId, objective: assignment.objective });
    }
    if (progress.completed || progress.attempts.length >= 2) {
      return res.status(400).json({ message: 'Déjà terminé, tu as utilisé tes tentatives' });
    }

    const attemptNumber = progress.attempts.length + 1;

    const gradedAnswers = (answers || []).map((a) => {
      const question = assignment.questions[a.questionIndex];
      if (!question) {
        return { questionIndex: a.questionIndex, selectedAnswer: a.selectedAnswer, isCorrect: false, hintUsed: false, points: 0 };
      }
      const hintUsed = attemptNumber === 1 ? !!a.hintUsed : false; // pas d'indice en 2e tentative
      const { isCorrect, points } = computeQuestionPoints(question, a.selectedAnswer, hintUsed, attemptNumber);
      return { questionIndex: a.questionIndex, selectedAnswer: a.selectedAnswer, isCorrect, hintUsed, points };
    });

    const total = assignment.questions.length;
    const score = gradedAnswers.reduce((s, a) => s + a.points, 0);
    const stars = computeStars(score, total);

    progress.attempts.push({
      attemptNumber,
      listenCompleted: !!listenCompleted,
      answers: gradedAnswers,
      score,
      stars,
      submittedAt: new Date(),
    });
    await progress.save();

    // On renvoie SEULEMENT le score, pas les corrections
    return res.json({ attemptNumber, score, total, canRetry: attemptNumber < 2 });
  } catch (error) {
    console.error('submitAttempt error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/progress/:assignmentId/finish  (élève) ─────────────────────────
// Finalise (sur la DERNIÈRE tentative) et révèle les corrections. Idempotent.
exports.finishAttempt = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment introuvable' });

    const progress = await Progress.findOne({ student: req.user._id, assignment: assignmentId });
    if (!progress || progress.attempts.length === 0) {
      return res.status(400).json({ message: 'Aucune tentative à finaliser' });
    }

    const total       = assignment.questions.length;
    const lastAttempt = progress.attempts[progress.attempts.length - 1];

    let levelUp  = false;
    let newLevel = req.user.level;

    if (!progress.completed) {
      const score        = lastAttempt.score;
      const stars        = computeStars(score, total);
      const pointsEarned = Math.round(score * POINTS_PER_CORRECT);

      progress.score        = score;
      progress.stars        = stars;
      progress.pointsEarned = pointsEarned;
      progress.completed    = true;
      progress.completedAt  = new Date();
      await progress.save();

      const user = await User.findById(req.user._id);
      user.totalPoints += pointsEarned;
      user.totalStars  += stars;
      const prev = user.levelPoints.get(String(assignment.level)) || 0;
      user.levelPoints.set(String(assignment.level), prev + pointsEarned);

      if (user.level === assignment.level) {
        const levelAssignments = await Assignment.find({
          classId: req.user.classId, level: assignment.level, status: 'ready', active: true,
        });
        const maxPts    = levelAssignments.reduce((s, a) => s + (a.questions.length * POINTS_PER_CORRECT), 0);
        const earnedPts = user.levelPoints.get(String(assignment.level)) || 0;
        if (maxPts > 0 && earnedPts >= LEVEL_UNLOCK_RATIO * maxPts) {
          user.level = assignment.level + 1;
          levelUp    = true;
        }
      }
      newLevel = user.level;
      await user.save();
    } else {
      const user = await User.findById(req.user._id);
      newLevel = user.level;
    }

    // Corrections de la DERNIÈRE tentative
    const corrections = assignment.questions.map((q, i) => {
      const graded = lastAttempt.answers.find((a) => a.questionIndex === i);
      const base = { questionIndex: i, isCorrect: graded ? graded.isCorrect : false, explanation: q.explanation };
      if (q.type === 'order_events') base.correctOrder = q.correctOrder;
      else base.correctAnswer = q.correctAnswer;
      return base;
    });

    res.json({
      score: progress.score,
      total,
      revealAnswers: true,
      stars: progress.stars,
      pointsEarned: progress.pointsEarned,
      levelUp,
      newLevel,
      corrections,
    });
  } catch (error) {
    console.error('finishAttempt error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/progress/me  (élève) ────────────────────────────────────────────
exports.getMyProgress = async (req, res) => {
  try {
    const progresses = await Progress.find({ student: req.user._id })
      .populate({
        path: 'assignment', select: 'objective level story',
        populate: { path: 'story', select: 'title coverEmoji' },
      })
      .sort({ updatedAt: -1 });
    res.json(progresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
