const express = require('express');
const router  = express.Router();
const {
  markListened,
  submitQuiz,
  getStoryProgress,
  getMyProgress,
} = require('../controllers/progressController');
const { protect, teacherOnly } = require('../middleware/auth');

router.post('/listen/:storyId',  protect, markListened);
router.post('/submit/:storyId',  protect, submitQuiz);
router.get('/story/:storyId',    protect, teacherOnly, getStoryProgress);
router.get('/me',                protect, getMyProgress);

module.exports = router;
