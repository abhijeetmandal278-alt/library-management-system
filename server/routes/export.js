const express = require('express');
const { exportCSV, exportExcel } = require('../controllers/exportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/csv', exportCSV);
router.get('/excel', exportExcel);

module.exports = router;
