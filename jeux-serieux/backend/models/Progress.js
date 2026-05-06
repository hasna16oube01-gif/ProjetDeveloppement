const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
      required: true,
    },
    listenCompleted: { type: Boolean, default: false },
    answers: [
      {
        questionIndex: Number,
        selectedAnswer: Number,
        isCorrect: Boolean,
      },
    ],
    score: { type: Number, default: 0 },
    stars: { type: Number, default: 0 }, // 0-3
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Unique constraint: one progress per student per story
progressSchema.index({ student: 1, story: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
