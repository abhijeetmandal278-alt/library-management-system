const express = require('express');
const {
  issueBook,
  returnBook,
  getTransactions,
  getTransaction
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
const { check } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTransactions);

router.post('/issue', [
  check('bookId', 'Book ID is required').not().isEmpty(),
  check('borrowerName', 'Borrower name is required').not().isEmpty(),
  check('borrowerId', 'Borrower ID is required').not().isEmpty()
], validate, issueBook);

router.post('/return', [
  check('bookId', 'Book ID is required').not().isEmpty(),
  check('borrowerId', 'Borrower ID is required').not().isEmpty()
], validate, returnBook);

router.route('/:id')
  .get(getTransaction);

module.exports = router;
