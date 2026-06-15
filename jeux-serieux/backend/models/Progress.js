const mongoose = require('mongoose');
const { OBJECTIVES } = require('./constants');

const answerSchema = new mongoose.Schema({
  questionIndex:  { type: Number },
  selectedAnswer: { type: mongoose.Schema.Types.Mixed },
  isCorrect:      { type: Boolean },
  hintUsed:       { type: Boolean, default: false },
  points:         { type: Number,  default: 0 },
}, { _id: false });

const attemptSchema = new mongoose.Schema({
  attemptNumber:   { type: Number, required: true },
  listenCompleted: { type: Boolean, default: false },
  answers:         [answerSchema],
  score:           { type: Number, default: 0 },
  stars:           { type: Number, default: 0 },
  submittedAt:     { type: Date, default: Date.now },
}, { _id: false });

const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    objective: { type: String, enum: OBJECTIVES },
    attempts:  { type: [attemptSchema], default: [] },

    score:        { type: Number, default: 0 },
    stars:        { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 },

    completed:   { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

progressSchema.index({ student: 1, assignment: 1 }, { unique: true });

progressSchema.methods.canAttempt = function () {
  return !this.completed && this.attempts.length < 2;
};

module.exports = mongoose.model('Progress', progressSchema);