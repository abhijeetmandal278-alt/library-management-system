const express = require('express');
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  getBookByBookId
} = require('../controllers/bookController');
const { protect } = require('../middleware/auth');
const { check } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.route('/')
  .get(getBooks)
  .post(protect, [
    check('title', 'Title is required').not().isEmpty(),
    check('author', 'Author is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty(),
    check('totalCopies', 'Total copies must be a positive number').isInt({ min: 1 })
  ], validate, createBook);

router.route('/scan/:bookId')
  .get(getBookByBookId);

router.route('/:id')
  .get(getBook)
  .put(protect, updateBook)
  .delete(protect, deleteBook);

module.exports = router;
