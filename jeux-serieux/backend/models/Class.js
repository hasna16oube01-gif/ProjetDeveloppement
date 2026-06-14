const mongoose = require('mongoose');
const { OBJECTIVES } = require('./constants');

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    joinCode: { type: String, unique: true },

    // Objectif PAR DÉFAUT proposé au prof lors d'une nouvelle assignation
    pedagogicalObjective: { type: String, enum: OBJECTIVES, default: 'comprehension' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Class', classSchema);