const express = require('express');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  sendMessage,
  uploadAndSummarize,
  getSessions,
  getSession,
  deleteSession,
} = require('../controllers/chatController');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/message', sendMessage);
router.post('/upload', upload.single('file'), uploadAndSummarize);
router.get('/sessions', getSessions);
router.get('/sessions/:id', getSession);
router.delete('/sessions/:id', deleteSession);

module.exports = router;
