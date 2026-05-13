const Progress = require('../models/Progress');
const Story    = require('../models/Story');
const User     = require('../models/User');

// ── Helpers ───────────────────────────────────────────────────────────────────
function checkAnswer(question, userAnswer) {
  if (question.type === 'order_events') {
    return JSON.stringify(userAnswer) === JSON.stringify(question.correctOrder);
  }
  // true_false → Boolean, mcq/fill_blank/odd_one_out → Number
  // eslint-disable-next-line eqeqeq
  return userAnswer == question.correctAnswer;
}

function buildResult(question, userAnswer) {
  const isCorrect = checkAnswer(question, userAnswer);
  const base = {
    type:          question.type || 'mcq',
    question:      question.question,
    explanation:   question.explanation,
    correctAnswer: question.correctAnswer,
    userAnswer,
    isCorrect,
  };
  if (question.type === 'order_events') {
    return { ...base, events: question.events, correctOrder: question.correctOrder };
  }
  return { ...base, options: question.options };
}

// ── POST /api/progress/listen/:storyId ───────────────────────────────────────
exports.markListened = async (req, res) => {
  try {
    const progress = await Progress.findOneAndUpdate(
      { student: req.user._id, story: req.params.storyId },
      { listenCompleted: true },
      { upsert: true, new: true }
    );
    res.json(progress);
  } catch (error) {
    console.error('markListened error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/progress/submit/:storyId ───────────────────────────────────────
exports.submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body;

    const story = await Story.findById(req.params.storyId);
    if (!story) return res.status(404).json({ message: 'Histoire introuvable' });

    // Correction
    const gradedAnswers = answers.map((a) => {
      const question   = story.questions[a.questionIndex];
      const userAnswer = a.selectedAnswer;
      return {
        questionIndex:  a.questionIndex,
        selectedAnswer: userAnswer,
        isCorrect:      checkAnswer(question, userAnswer),
      };
    });

    const correctCount   = gradedAnswers.filter((a) => a.isCorrect).length;
    const totalQuestions = story.questions.length;
    const scorePercent   = Math.round((correctCount / totalQuestions) * 100);

    let stars = 0;
    if (scorePercent >= 50)   stars = 1;
    if (scorePercent >= 75)   stars = 2;
    if (scorePercent === 100) stars = 3;

    // Sauvegarde
    const progress = await Progress.findOneAndUpdate(
      { student: req.user._id, story: req.params.storyId },
      { answers: gradedAnswers, score: scorePercent, stars, completed: true, completedAt: new Date() },
      { upsert: true, new: true }
    );

    // Mise à jour étoiles utilisateur
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalStars: stars } });

    // Badges
    const badges = [];
    if (scorePercent === 100) badges.push('⭐ Parfait !');
    if (stars === 3)          badges.push('🏆 Champion !');

    // Résultats détaillés
    const results = story.questions.map((q, i) =>
      buildResult(q, gradedAnswers[i]?.selectedAnswer)
    );

    res.json({ progress, results, badges, correctCount, totalQuestions, scorePercent, stars });
  } catch (error) {
    console.error('submitQuiz error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/progress/story/:storyId  (enseignant) ───────────────────────────
exports.getStoryProgress = async (req, res) => {
  try {
    const progresses = await Progress.find({ story: req.params.storyId })
      .populate('student', 'name avatar email')
      .sort({ completedAt: -1 });
    res.json(progresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/progress/me  (élève) ────────────────────────────────────────────
exports.getMyProgress = async (req, res) => {
  try {
    const progresses = await Progress.find({ student: req.user._id })
      .populate('story', 'title coverEmoji')
      .sort({ updatedAt: -1 });
    res.json(progresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
