const express = require('express');
const router  = express.Router();
const Class   = require('../models/Class');
const User    = require('../models/User');
const { protect, teacherOnly } = require('../middleware/auth');

// ── POST /api/classes — créer une classe ──────────────────────────────────────
router.post('/', protect, teacherOnly, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Nom de classe requis' });

    const joinCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const cls = await Class.create({ name, teacher: req.user._id, joinCode });
    res.status(201).json(cls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/classes/teacher — classes de l'enseignant ───────────────────────
router.get('/teacher', protect, teacherOnly, async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.user._id })
      .populate('students', 'name avatar email totalStars');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── POST /api/classes/join — élève rejoint une classe ────────────────────────
router.post('/join', protect, async (req, res) => {
  try {
    const { joinCode } = req.body;
    if (!joinCode) return res.status(400).json({ message: 'Code requis' });

    const cls = await Class.findOne({ joinCode: joinCode.toUpperCase() });
    if (!cls) return res.status(404).json({ message: 'Code de classe invalide' });

    // Ajouter l'élève à la classe s'il n'y est pas déjà
    if (!cls.students.includes(req.user._id)) {
      cls.students.push(req.user._id);
      await cls.save();
    }

    // Mettre à jour le classId de l'élève
    await User.findByIdAndUpdate(req.user._id, { classId: cls._id });

    res.json({ message: 'Classe rejointe avec succès !', class: cls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
