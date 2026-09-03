const mongoose = require('mongoose');
const qrcode = require('qrcode');

const BookSchema = new mongoose.Schema({
  bookId: {
    type: String,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'Please add an author'],
    trim: true
  },
  isbn: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
  },
  category: {
    type: String,
    required: [true, 'Please add a category']
  },
  totalCopies: {
    type: Number,
    required: [true, 'Please add total copies'],
    min: [1, 'At least 1 copy is required']
  },
  availableCopies: {
    type: Number,
    required: true,
    min: 0
  },
  qrCode: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

BookSchema.index({ title: 'text', author: 'text', category: 'text' });

BookSchema.virtual('status').get(function() {
  return this.availableCopies > 0 ? 'available' : 'unavailable';
});

BookSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this.bookId) {
      const count = await this.constructor.countDocuments();
      this.bookId = `LIB-${String(count + 1).padStart(6, '0')}`;
    }
    
    if (!this.qrCode) {
      try {
        this.qrCode = await qrcode.toDataURL(this.bookId);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }
  }
  next();
});

module.exports = mongoose.model('Book', BookSchema);
