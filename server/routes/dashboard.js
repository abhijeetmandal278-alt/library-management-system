const express = require('express');
const {
  getStats,
  getIssuedBooks,
  getOverdueBooks
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/stats', getStats);
router.get('/issued', getIssuedBooks);
router.get('/overdue', getOverdueBooks);

module.exports = router;
