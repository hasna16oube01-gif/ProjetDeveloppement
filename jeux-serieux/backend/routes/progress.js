const express = require('express');
const router  = express.Router();
const { submitAttempt, finishAttempt, getMyProgress } = require('../controllers/progressController');
const { protect, studentOnly } = require('../middleware/auth');

router.post('/:assignmentId/submit', protect, studentOnly, submitAttempt);
router.post('/:assignmentId/finish', protect, studentOnly, finishAttempt);
router.get('/me',                    protect, studentOnly, getMyProgress);

module.exports = router;