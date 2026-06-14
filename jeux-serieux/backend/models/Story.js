const mongoose = require('mongoose');

// /!\ Les questions, l'objectif, le niveau et les assignations
//     ne sont PLUS ici -> ils vivent maintenant dans Assignment.
const storySchema = new mongoose.Schema(
  {
    title:        { type: String, required: true },
    originalText: { type: String, required: true }, // texte source fourni par le prof
    // Histoire COMPLÈTE réécrite façon conteur (pas un résumé). C'est ce texte qui est lu en audio.
    narratedText: { type: String },
    audioPath:    { type: String },

    difficulty:   { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    coverEmoji:   { type: String, default: '📖' },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Story', storySchema);