const express = require('express');
const router  = express.Router();
const {
  createStory,
  getTeacherStories,
  getStudentStories,
  getStoryById,
  deleteStory,
} = require('../controllers/storyController');
const { protect, teacherOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ── Enseignant ────────────────────────────────────────────────
router.post('/',       protect, teacherOnly, upload.single('storyFile'), createStory);
router.get('/teacher', protect, teacherOnly, getTeacherStories);
router.delete('/:id',  protect, teacherOnly, deleteStory);

// ── Élève ─────────────────────────────────────────────────────
// IMPORTANT : /student DOIT être AVANT /:id
router.get('/student', protect, getStudentStories);

// ── Partagé ───────────────────────────────────────────────────
router.get('/:id', protect, getStoryById);

module.exports = router;
