const Book = require('../models/Book');
const Transaction = require('../models/Transaction');

exports.getBooks = async (req, res, next) => {
  try {
    const filter = {};

    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Availability filter
    if (req.query.status === 'available') {
      filter.availableCopies = { $gt: 0 };
    } else if (req.query.status === 'unavailable') {
      filter.availableCopies = 0;
    }

    // Text search
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Book.countDocuments(filter);

    const books = await Book.find(filter)
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: books.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: books
    });
  } catch (err) {
    next(err);
  }
};

exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }
    res.status(200).json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

exports.createBook = async (req, res, next) => {
  try {
    const { title, author, category, totalCopies, isbn } = req.body;

    if (!title || !author || !category || !totalCopies) {
      return res.status(400).json({ success: false, error: 'Please provide title, author, category, and totalCopies' });
    }

    const bookData = {
      title,
      author,
      category,
      totalCopies,
      availableCopies: totalCopies,
      isbn: isbn || undefined
    };

    const book = await Book.create(bookData);
    res.status(201).json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

exports.updateBook = async (req, res, next) => {
  try {
    let book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const { totalCopies } = req.body;
    let updateData = { ...req.body };

    // Don't allow updating bookId or qrCode
    delete updateData.bookId;
    delete updateData.qrCode;
    delete updateData.availableCopies;

    if (totalCopies !== undefined) {
      const diff = totalCopies - book.totalCopies;
      const newAvailable = book.availableCopies + diff;

      if (newAvailable < 0) {
        return res.status(400).json({ success: false, error: 'Cannot reduce total copies below currently issued copies' });
      }

      updateData.availableCopies = newAvailable;
    }

    book = await Book.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const activeTransactions = await Transaction.countDocuments({
      book: req.params.id,
      status: { $in: ['issued', 'overdue'] }
    });

    if (activeTransactions > 0) {
      return res.status(400).json({ success: false, error: 'Cannot delete book with active issued transactions' });
    }

    await book.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

exports.getBookByBookId = async (req, res, next) => {
  try {
    const book = await Book.findOne({ bookId: req.params.bookId });
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found. Invalid QR code or Book ID.' });
    }

    const activeTransactions = await Transaction.find({
      book: book._id,
      status: { $in: ['issued', 'overdue'] }
    }).populate('issuedBy', 'name email');

    res.status(200).json({
      success: true,
      data: {
        book,
        activeTransactions
      }
    });
  } catch (err) {
    next(err);
  }
};
