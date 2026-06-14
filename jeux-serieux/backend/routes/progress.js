const express = require('express');
const router  = express.Router();
const { submitAttempt, getMyProgress } = require('../controllers/progressController');
const { protect, studentOnly } = require('../middleware/auth');

// ── Élève ─────────────────────────────────────────────────────
router.post('/:assignmentId/submit', protect, studentOnly, submitAttempt);
router.get('/me',                    protect, studentOnly, getMyProgress);

module.exports = router;
