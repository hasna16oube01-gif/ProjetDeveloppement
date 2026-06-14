const Progress   = require('../models/Progress');
const Assignment = require('../models/Assignment');
const User       = require('../models/User');
const { gradeAnswer, computeStars } = require('../services/gameService');
const { POINTS_PER_CORRECT, LEVEL_UNLOCK_RATIO } = require('../config/gameConfig');

// ── POST /api/progress/:assignmentId/submit  (élève) ─────────────────────────
exports.submitAttempt = async (req, res) => {
  try {
    const { answers, listenCompleted } = req.body;
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment introuvable' });
    if (assignment.status !== 'ready') {
      return res.status(400).json({ message: "Cet assignment n'est pas encore prêt" });
    }

    // L'élève doit appartenir à la classe de l'assignment
    if (!req.user.classId || req.user.classId.toString() !== assignment.classId.toString()) {
      return res.status(403).json({ message: "Tu n'appartiens pas à la classe de cet assignment" });
    }

    // Niveau doit être débloqué
    if (assignment.level > req.user.level) {
      return res.status(403).json({ message: 'Ce niveau est verrouillé' });
    }

    // Récupérer ou créer le Progress
    let progress = await Progress.findOne({ student: req.user._id, assignment: assignmentId });
    if (!progress) {
      progress = new Progress({
        student:    req.user._id,
        assignment: assignmentId,
        objective:  assignment.objective,
      });
    }

    if (!progress.canAttempt()) {
      return res.status(400).json({ message: 'Déjà terminé, tu as utilisé tes 2 tentatives' });
    }

    const attemptNumber = progress.attempts.length + 1;

    // Corriger chaque réponse
    const gradedAnswers = (answers || []).map((a) => {
      const question = assignment.questions[a.questionIndex];
      return {
        questionIndex:  a.questionIndex,
        selectedAnswer: a.selectedAnswer,
        isCorrect:      question ? gradeAnswer(question, a.selectedAnswer) : false,
      };
    });

    const score        = gradedAnswers.filter((a) => a.isCorrect).length;
    const total        = assignment.questions.length;
    const stars        = computeStars(score);
    const pointsEarned = score * POINTS_PER_CORRECT;

    progress.attempts.push({
      attemptNumber,
      listenCompleted: !!listenCompleted,
      answers:         gradedAnswers,
      score,
      stars,
      submittedAt: new Date(),
    });

    // ── 1re tentative : on garde le suspense ──────────────────
    if (attemptNumber === 1) {
      await progress.save();
      return res.json({
        attemptNumber: 1,
        score,
        total,
        canRetry:      true,
        revealAnswers: false,
        message: `Bravo ! Tu as ${score} bonne${score > 1 ? 's' : ''} réponse${score > 1 ? 's' : ''} sur ${total}. Réécoute bien l'histoire pour corriger tes erreurs !`,
      });
    }

    // ── 2e tentative : finaliser ──────────────────────────────
    progress.score        = score;
    progress.stars        = stars;
    progress.pointsEarned = pointsEarned;
    progress.completed    = true;
    progress.completedAt  = new Date();
    await progress.save();

    // Mettre à jour l'élève
    const user = await User.findById(req.user._id);
    user.totalPoints += pointsEarned;
    user.totalStars  += stars;

    const prevLevelPts = user.levelPoints.get(String(assignment.level)) || 0;
    user.levelPoints.set(String(assignment.level), prevLevelPts + pointsEarned);

    // Déblocage de niveau (seulement si l'élève est encore à ce niveau)
    let levelUp  = false;
    let newLevel = user.level;

    if (user.level === assignment.level) {
      const levelAssignments = await Assignment.find({
        classId: req.user.classId,
        level:   assignment.level,
        status:  'ready',
        active:  true,
      });
      const maxPts    = levelAssignments.length * 5 * POINTS_PER_CORRECT;
      const earnedPts = user.levelPoints.get(String(assignment.level)) || 0;

      if (maxPts > 0 && earnedPts >= LEVEL_UNLOCK_RATIO * maxPts) {
        user.level = assignment.level + 1;
        newLevel   = user.level;
        levelUp    = true;
      }
    }

    await user.save();

    // Corrections (révélées seulement à la 2e tentative)
    const corrections = assignment.questions.map((q, i) => {
      const graded = gradedAnswers.find((a) => a.questionIndex === i);
      const base = {
        questionIndex: i,
        isCorrect:     graded ? graded.isCorrect : false,
        explanation:   q.explanation,
      };
      if (q.type === 'order_events') {
        base.correctOrder = q.correctOrder;
      } else {
        base.correctAnswer = q.correctAnswer;
      }
      return base;
    });

    res.json({
      attemptNumber: 2,
      score,
      total,
      revealAnswers: true,
      stars,
      pointsEarned,
      levelUp,
      newLevel,
      corrections,
    });
  } catch (error) {
    console.error('submitAttempt error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/progress/me  (élève) ────────────────────────────────────────────
exports.getMyProgress = async (req, res) => {
  try {
    const progresses = await Progress.find({ student: req.user._id })
      .populate({
        path:     'assignment',
        select:   'objective level story',
        populate: { path: 'story', select: 'title coverEmoji' },
      })
      .sort({ updatedAt: -1 });
    res.json(progresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
