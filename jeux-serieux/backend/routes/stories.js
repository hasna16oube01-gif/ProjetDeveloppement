const express = require('express');
const router = express.Router();
const {
  createStory,
  getTeacherStories,
  getStudentStories,
  getStoryById,
  assignStory,
  deleteStory,
} = require('../controllers/storyController');
const { protect, teacherOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Teacher routes
router.post('/', protect, teacherOnly, upload.single('storyFile'), createStory);
router.get('/teacher', protect, teacherOnly, getTeacherStories);
router.post('/:id/assign', protect, teacherOnly, assignStory);
router.delete('/:id', protect, teacherOnly, deleteStory);

// Student routes
router.get('/student', protect, getStudentStories);

// Shared
router.get('/:id', protect, getStoryById);

module.exports = router;
