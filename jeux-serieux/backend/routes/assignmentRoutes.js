const express = require('express');
const router  = express.Router();
const {
  createAssignment,
  getClassAssignments,
  getAssignmentById,
  deleteAssignment,
  getStudentAssignments,
} = require('../controllers/assignmentController');
const { protect, teacherOnly, studentOnly } = require('../middleware/auth');

// ── Élève ─────────────────────────────────────────────────────
// IMPORTANT : /student DOIT être AVANT /:id
router.get('/student', protect, studentOnly, getStudentAssignments);

// ── Enseignant ────────────────────────────────────────────────
router.post('/',                 protect, teacherOnly, createAssignment);
router.get('/class/:classId',   protect, teacherOnly, getClassAssignments);
router.delete('/:id',           protect, teacherOnly, deleteAssignment);

// ── Partagé (rôle vérifié dans le controller) ─────────────────
router.get('/:id', protect, getAssignmentById);

module.exports = router;
