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
    totalStars:{ type: Number, default: 0 },
    badges:   [{ type: String }],
  },
  { timestamps: true }
);

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Comparaison mot de passe
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
