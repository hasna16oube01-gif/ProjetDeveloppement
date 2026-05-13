const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionIndex:  { type: Number },
  selectedAnswer: { type: mongoose.Schema.Types.Mixed }, // Number | Boolean | Array
  isCorrect:      { type: Boolean },
});

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
    answers:         [answerSchema],
    score:           { type: Number,  default: 0 },
    stars:           { type: Number,  default: 0 },
    completed:       { type: Boolean, default: false },
    completedAt:     { type: Date },
  },
  { timestamps: true }
);

// Un seul document de progression par élève par histoire
progressSchema.index({ student: 1, story: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
