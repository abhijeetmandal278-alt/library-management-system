const Transaction = require('../models/Transaction');
const Book = require('../models/Book');

const updateOverdueStatuses = async () => {
  await Transaction.updateMany(
    { status: 'issued', dueDate: { $lt: new Date() } },
    { $set: { status: 'overdue' } }
  );
};

exports.getStats = async (req, res, next) => {
  try {
    await updateOverdueStatuses();
    
    const books = await Book.find({});
    
    let totalBooks = 0;
    let availableBooks = 0;
    
    books.forEach(book => {
      totalBooks += book.totalCopies;
      availableBooks += book.availableCopies;
    });
    
    const totalTitles = await Book.countDocuments();
    
    const issuedBooks = await Transaction.countDocuments({ status: 'issued' });
    const overdueBooks = await Transaction.countDocuments({ status: 'overdue' });
    
    res.status(200).json({
      success: true,
      data: {
        totalBooks,
        totalTitles,
        availableBooks,
        issuedBooks,
        overdueBooks
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getIssuedBooks = async (req, res, next) => {
  try {
    await updateOverdueStatuses();
    
    const transactions = await Transaction.find({ status: 'issued' })
      .populate('book')
      .populate('issuedBy', 'name email')
      .sort({ dueDate: 1 });
      
    res.status(200).json({ success: true, data: transactions });
  } catch (err) {
    next(err);
  }
};

exports.getOverdueBooks = async (req, res, next) => {
  try {
    await updateOverdueStatuses();
    
    const transactions = await Transaction.find({ status: 'overdue' })
      .populate('book')
      .populate('issuedBy', 'name email')
      .sort({ dueDate: 1 });
      
    res.status(200).json({ success: true, data: transactions });
  } catch (err) {
    next(err);
  }
};
