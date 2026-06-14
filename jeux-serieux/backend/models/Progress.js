const mongoose = require('mongoose');
const { OBJECTIVES } = require('./constants');

const answerSchema = new mongoose.Schema({
  questionIndex:  { type: Number },
  selectedAnswer: { type: mongoose.Schema.Types.Mixed },
  isCorrect:      { type: Boolean },
}, { _id: false });

// Une tentative = une passe complète (écoute + réponses). Max 2.
const attemptSchema = new mongoose.Schema({
  attemptNumber:   { type: Number, required: true }, // 1 ou 2
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
    // On suit la progression sur un ASSIGNMENT (qui connaît story + classe + objectif)
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },

    // Snapshot de l'objectif -> alimente le Radar Chart du prof sans populate
    objective: { type: String, enum: OBJECTIVES },

    attempts:  { type: [attemptSchema], default: [] }, // feedback détaillé seulement après la 2e

    // Résultat final retenu (dernière tentative)
    score:        { type: Number, default: 0 },
    stars:        { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 }, // ajouté à totalPoints / levelPoints

    completed:   { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Une seule progression par élève par assignment
progressSchema.index({ student: 1, assignment: 1 }, { unique: true });

progressSchema.methods.canAttempt = function () {
  return this.attempts.length < 2;
};

module.exports = mongoose.model('Progress', progressSchema);