const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role:     { type: String, enum: ['teacher', 'student'], required: true },
    avatar:   { type: String, default: '🦁' },
    loginCode:{ type: String, unique: true, sparse: true },
    classId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },

    // --- Progression / Gamification (élève) ---
    level:       { type: Number, default: 1 },   // niveau le plus haut DÉBLOQUÉ
    totalPoints: { type: Number, default: 0 },   // points pédagogiques (servent au déblocage des niveaux)
    totalStars:  { type: Number, default: 0 },   // récompense purement ludique (étoiles)
    // Points obtenus PAR niveau -> vérifier le seuil de déblocage devient trivial
    // ex: { "1": 80, "2": 30 }
    levelPoints: { type: Map, of: Number, default: {} },

    badges:      [{ type: String }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);