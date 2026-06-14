const mongoose = require('mongoose');
const { OBJECTIVES } = require('./constants');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mcq', 'true_false', 'fill_blank', 'order_events', 'odd_one_out'],
    default: 'mcq',
  },
  question:      { type: String, required: true },
  options:       [{ type: String }],
  correctAnswer: { type: mongoose.Schema.Types.Mixed },
  correctOrder:  [{ type: Number }],
  events:        [{ type: String }],
  explanation:   { type: String },
}, { _id: false });

const assignmentSchema = new mongoose.Schema(
  {
    story:      { type: mongoose.Schema.Types.ObjectId, ref: 'Story', required: true },
    classId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true }, // le prof

    // Objectif choisi par le prof -> guide la génération IA des questions
    objective:  { type: String, enum: OBJECTIVES, required: true },

    // Niveau auquel appartient cet assignment (système de déblocage élève)
    level:      { type: Number, default: 1 },

    // Défis générés par l'IA SELON l'objectif (propres à cette classe)
    questions:  [questionSchema],

    // L'IA génère les questions de façon asynchrone
    status:     { type: String, enum: ['processing', 'ready', 'error'], default: 'processing' },

    active:     { type: Boolean, default: true },
    dueDate:    { type: Date }, // optionnel
  },
  { timestamps: true }
);

// Une même histoire peut être assignée à une classe pour des objectifs DIFFÉRENTS,
// mais pas deux fois pour le même objectif.
assignmentSchema.index({ classId: 1, story: 1, objective: 1 }, { unique: true });

module.exports = mongoose.model('Assignment', assignmentSchema);