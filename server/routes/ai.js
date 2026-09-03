const express = require('express');
const { chat, smartSearch } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/chat', chat);
router.post('/smart-search', smartSearch);

module.exports = router;
