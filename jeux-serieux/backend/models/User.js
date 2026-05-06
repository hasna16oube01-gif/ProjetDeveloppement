const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['teacher', 'student'], required: true },
    avatar: { type: String, default: '🦁' },
    // For students: short login code
    loginCode: { type: String, unique: true, sparse: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    // Gamification
    totalStars: { type: Number, default: 0 },
    badges: [{ type: String }],
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
