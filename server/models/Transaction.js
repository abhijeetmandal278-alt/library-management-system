const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  borrowerName: {
    type: String,
    required: [true, 'Please add borrower name'],
    trim: true
  },
  borrowerId: {
    type: String,
    required: [true, 'Please add borrower ID'],
    trim: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true,
    default: () => {
      const date = new Date();
      date.setDate(date.getDate() + 14);
      return date;
    }
  },
  returnDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['issued', 'returned', 'overdue'],
    default: 'issued'
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

TransactionSchema.virtual('daysOverdue').get(function() {
  if ((this.status === 'issued' || this.status === 'overdue') && this.dueDate < new Date()) {
    const diffTime = Math.abs(new Date() - this.dueDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

module.exports = mongoose.model('Transaction', TransactionSchema);
