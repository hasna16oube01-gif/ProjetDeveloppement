const Progress = require('../models/Progress');
const Story = require('../models/Story');
const User = require('../models/User');

// @POST /api/progress/listen/:storyId
exports.markListened = async (req, res) => {
  try {
    const progress = await Progress.findOneAndUpdate(
      { student: req.user._id, story: req.params.storyId },
      { listenCompleted: true },
      { upsert: true, new: true }
    );
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/progress/submit/:storyId
exports.submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body; // [{ questionIndex, selectedAnswer }]
    const story = await Story.findById(req.params.storyId);

    if (!story) return res.status(404).json({ message: 'Histoire introuvable' });

    // Grade answers
    const gradedAnswers = answers.map((a) => ({
      questionIndex: a.questionIndex,
      selectedAnswer: a.selectedAnswer,
      isCorrect: story.questions[a.questionIndex]?.correctAnswer === a.selectedAnswer,
    }));

    const correctCount = gradedAnswers.filter((a) => a.isCorrect).length;
    const totalQuestions = story.questions.length;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);

    // Calculate stars
    let stars = 0;
    if (scorePercent >= 50) stars = 1;
    if (scorePercent >= 75) stars = 2;
    if (scorePercent === 100) stars = 3;

    // Save progress
    const progress = await Progress.findOneAndUpdate(
      { student: req.user._id, story: req.params.storyId },
      {
        answers: gradedAnswers,
        score: scorePercent,
        stars,
        completed: true,
        completedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Update user total stars
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalStars: stars } });

    // Check for badges
    const badges = [];
    if (scorePercent === 100) badges.push('⭐ Parfait!');
    if (stars === 3) badges.push('🏆 Champion!');

    // Return results with correct answers + explanations
    const results = story.questions.map((q, i) => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      userAnswer: gradedAnswers[i]?.selectedAnswer,
      isCorrect: gradedAnswers[i]?.isCorrect,
    }));

    res.json({ progress, results, badges, correctCount, totalQuestions, scorePercent, stars });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/progress/story/:storyId - Teacher views student progress
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

// @GET /api/progress/me - Student views own progress
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
