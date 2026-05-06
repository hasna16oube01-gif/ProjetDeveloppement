const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: Number, required: true }, // index of correct option
  explanation: { type: String },
});

const storySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    originalText: { type: String, required: true },
    simplifiedText: { type: String },
    audioPath: { type: String },
    audioDuration: { type: Number },
    questions: [questionSchema],
    ageGroup: { type: String, default: '6-11' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    coverEmoji: { type: String, default: '📖' },
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
    assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Story', storySchema);
