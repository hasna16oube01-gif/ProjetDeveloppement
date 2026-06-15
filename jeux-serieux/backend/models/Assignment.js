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
  hint:          { type: String }, // indice (1re tentative)
}, { _id: false });

const assignmentSchema = new mongoose.Schema(
  {
    story:      { type: mongoose.Schema.Types.ObjectId, ref: 'Story', required: true },
    classId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },

    objective:  { type: String, enum: OBJECTIVES, required: true },
    level:      { type: Number, default: 1 },
    questions:  [questionSchema],

    // Réglages choisis par le prof à la création
    questionCount: { type: Number, default: 5 },
    questionTypes: [{ type: String }],

    status:     { type: String, enum: ['processing', 'ready', 'error'], default: 'processing' },
    active:     { type: Boolean, default: true },
    dueDate:    { type: Date },
  },
  { timestamps: true }
);

assignmentSchema.index({ classId: 1, story: 1, objective: 1 }, { unique: true });

module.exports = mongoose.model('Assignment', assignmentSchema);