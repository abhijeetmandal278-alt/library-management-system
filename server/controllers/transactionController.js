const Transaction = require('../models/Transaction');
const Book = require('../models/Book');

exports.issueBook = async (req, res, next) => {
  try {
    const { bookId, borrowerName, borrowerId } = req.body;

    const book = await Book.findOne({ bookId });
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    if (book.availableCopies <= 0) {
      return res.status(409).json({ success: false, error: 'Book is not available' });
    }

    const activeIssue = await Transaction.findOne({
      book: book._id,
      borrowerId,
      status: { $in: ['issued', 'overdue'] }
    });

    if (activeIssue) {
      return res.status(400).json({ success: false, error: 'Borrower already has this book issued' });
    }

    const updatedBook = await Book.findOneAndUpdate(
      { bookId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(409).json({ success: false, error: 'Book is not available' });
    }

    const transaction = await Transaction.create({
      book: book._id,
      borrowerName,
      borrowerId,
      issuedBy: req.user._id
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};

exports.returnBook = async (req, res, next) => {
  try {
    const { bookId, borrowerId } = req.body;

    console.log('--- RETURN DEBUG ---');
    console.log('req.body:', JSON.stringify(req.body));

    const book = await Book.findOne({ bookId });
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    console.log('Resolved book._id:', book._id.toString());

    const transaction = await Transaction.findOne({
      book: book._id,
      borrowerId,
      status: { $in: ['issued', 'overdue'] }
    });

    if (!transaction) {
      const allTxForBook = await Transaction.find({ book: book._id });
      console.log('All transactions for this book:', JSON.stringify(allTxForBook.map(t => ({
        borrowerId: t.borrowerId,
        status: t.status,
        book: t.book.toString()
      })), null, 2));
      return res.status(400).json({ success: false, error: 'No active transaction found for this book and borrower' });
    }

    transaction.status = 'returned';
    transaction.returnDate = new Date();
    await transaction.save();

    await Book.findByIdAndUpdate(book._id, { $inc: { availableCopies: 1 } });

    res.status(200).json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};

exports.getTransactions = async (req, res, next) => {
  try {
    let query;
    const reqQuery = { ...req.query };

    const removeFields = ['page', 'limit', 'startDate', 'endDate'];
    removeFields.forEach(param => delete reqQuery[param]);

    if (req.query.startDate || req.query.endDate) {
      reqQuery.createdAt = {};
      if (req.query.startDate) {
        reqQuery.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        reqQuery.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    if (req.query.bookId) {
      const book = await Book.findOne({ bookId: req.query.bookId });
      if (book) {
        reqQuery.book = book._id;
      } else {
        reqQuery.book = null; // Forces empty result if bookId doesn't exist
      }
      delete reqQuery.bookId;
    }

    query = Transaction.find(reqQuery).populate('book', 'title author bookId category').populate('issuedBy', 'name email');

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Transaction.countDocuments(reqQuery);

    query = query.skip(startIndex).limit(limit).sort({ createdAt: -1 });

    const transactions = await query;

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: transactions
    });
  } catch (err) {
    next(err);
  }
};

exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('book')
      .populate('issuedBy', 'name email');

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    res.status(200).json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};
