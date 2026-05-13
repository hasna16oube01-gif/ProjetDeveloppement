const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mcq', 'true_false', 'fill_blank', 'order_events', 'odd_one_out'],
    default: 'mcq',
  },
  question:      { type: String, required: true },
  options:       [{ type: String }],
  correctAnswer: { type: mongoose.Schema.Types.Mixed }, // Number ou Boolean
  correctOrder:  [{ type: Number }],                    // order_events uniquement
  events:        [{ type: String }],                    // order_events uniquement
  explanation:   { type: String },
});

const storySchema = new mongoose.Schema(
  {
    title:          { type: String, required: true },
    originalText:   { type: String, required: true },
    simplifiedText: { type: String },
    audioPath:      { type: String },
    questions:      [questionSchema],
    difficulty:     { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    coverEmoji:     { type: String, default: '📖' },
    status: {
      type: String,
      enum: ['processing', 'ready', 'error'],
      default: 'processing',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedClasses:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Story', storySchema);
