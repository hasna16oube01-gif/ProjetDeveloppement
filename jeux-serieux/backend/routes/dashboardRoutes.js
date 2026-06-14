const express    = require('express');
const router     = express.Router();
const Class      = require('../models/Class');
const User       = require('../models/User');
const Assignment = require('../models/Assignment');
const Progress   = require('../models/Progress');
const { protect, teacherOnly } = require('../middleware/auth');

// ── GET /api/dashboard/class/:classId/overview  (prof) ───────────────────────
// Pour chaque élève : name, avatar, level, totalPoints, totalStars,
//                     nbAssignmentsTermines, nbAssignmentsTotal
router.get('/class/:classId/overview', protect, teacherOnly, async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.classId, teacher: req.user._id })
      .populate('students', 'name avatar level totalPoints totalStars');
    if (!cls) return res.status(404).json({ message: 'Classe introuvable' });

    // IDs des assignments actifs + prêts de la classe
    const assignmentIds = await Assignment.find({
      classId: req.params.classId,
      status:  'ready',
      active:  true,
    }).distinct('_id');

    const totalAssignments = assignmentIds.length;
    const studentIds = cls.students.map((s) => s._id);

    // Nb de completions par élève en une seule agrégation
    const completedCounts = await Progress.aggregate([
      {
        $match: {
          assignment: { $in: assignmentIds },
          student:    { $in: studentIds },
          completed:  true,
        },
      },
      { $group: { _id: '$student', count: { $sum: 1 } } },
    ]);
    const completedMap = {};
    completedCounts.forEach((c) => { completedMap[c._id.toString()] = c.count; });

    const result = cls.students.map((student) => ({
      _id:                   student._id,
      name:                  student.name,
      avatar:                student.avatar,
      level:                 student.level,
      totalPoints:           student.totalPoints,
      totalStars:            student.totalStars,
      nbAssignmentsTermines: completedMap[student._id.toString()] || 0,
      nbAssignmentsTotal:    totalAssignments,
    }));

    res.json(result);
  } catch (error) {
    console.error('dashboard overview error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/dashboard/student/:studentId/radar  (prof) ──────────────────────
// Agrège les Progress terminés de l'élève par objectif → [{ objective, averageScore }]
// averageScore = moyenne du score en % (0-100)
router.get('/student/:studentId/radar', protect, teacherOnly, async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId).select('classId name');
    if (!student) return res.status(404).json({ message: 'Élève introuvable' });

    // Vérifier que l'élève est dans une classe de ce prof
    if (student.classId) {
      const cls = await Class.findOne({ _id: student.classId, teacher: req.user._id });
      if (!cls) return res.status(403).json({ message: 'Accès non autorisé' });
    } else {
      return res.status(403).json({ message: 'Cet élève n\'est dans aucune de vos classes' });
    }

    const progresses = await Progress.find({
      student:   req.params.studentId,
      completed: true,
    })
      .populate('assignment', 'questions')
      .select('objective score assignment');

    // Agréger par objectif (score en pourcentage)
    const objectiveData = {};
    for (const p of progresses) {
      if (!p.objective) continue;
      const total       = p.assignment?.questions?.length || 5;
      const scorePct    = total > 0 ? Math.round((p.score / total) * 100) : 0;
      if (!objectiveData[p.objective]) objectiveData[p.objective] = { sum: 0, count: 0 };
      objectiveData[p.objective].sum   += scorePct;
      objectiveData[p.objective].count += 1;
    }

    const radar = Object.entries(objectiveData).map(([objective, data]) => ({
      objective,
      averageScore: Math.round(data.sum / data.count),
    }));

    res.json(radar);
  } catch (error) {
    console.error('dashboard radar error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
