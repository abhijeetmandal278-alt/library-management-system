const { Parser } = require('json2csv');
const exceljs = require('exceljs');
const Transaction = require('../models/Transaction');

exports.exportCSV = async (req, res, next) => {
  try {
    let query = {};
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.createdAt.$lte = new Date(req.query.endDate);
    }
    
    const transactions = await Transaction.find(query).populate('book', 'title author bookId');
    
    const fields = [
      { label: 'Book Title', value: 'book.title' },
      { label: 'Author', value: 'book.author' },
      { label: 'Book ID', value: 'book.bookId' },
      { label: 'Issued To (Name)', value: 'borrowerName' },
      { label: 'Borrower ID', value: 'borrowerId' },
      { label: 'Issue Date', value: 'issueDate' },
      { label: 'Due Date', value: 'dueDate' },
      { label: 'Return Date', value: 'returnDate' },
      { label: 'Status', value: 'status' },
      { label: 'Days Overdue', value: 'daysOverdue' }
    ];
    
    const parser = new Parser({ fields });
    const csv = parser.parse(transactions);
    
    res.header('Content-Type', 'text/csv');
    res.attachment('transactions.csv');
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};

exports.exportExcel = async (req, res, next) => {
  try {
    let query = {};
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.createdAt.$lte = new Date(req.query.endDate);
    }
    
    const transactions = await Transaction.find(query).populate('book', 'title author bookId');
    
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');
    
    worksheet.columns = [
      { header: 'Book Title', key: 'title', width: 30 },
      { header: 'Author', key: 'author', width: 25 },
      { header: 'Book ID', key: 'bookId', width: 15 },
      { header: 'Issued To (Name)', key: 'borrowerName', width: 25 },
      { header: 'Borrower ID', key: 'borrowerId', width: 15 },
      { header: 'Issue Date', key: 'issueDate', width: 20 },
      { header: 'Due Date', key: 'dueDate', width: 20 },
      { header: 'Return Date', key: 'returnDate', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Days Overdue', key: 'daysOverdue', width: 15 }
    ];
    
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    transactions.forEach(t => {
      worksheet.addRow({
        title: t.book ? t.book.title : 'N/A',
        author: t.book ? t.book.author : 'N/A',
        bookId: t.book ? t.book.bookId : 'N/A',
        borrowerName: t.borrowerName,
        borrowerId: t.borrowerId,
        issueDate: t.issueDate ? t.issueDate.toISOString().split('T')[0] : '',
        dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : '',
        returnDate: t.returnDate ? t.returnDate.toISOString().split('T')[0] : '',
        status: t.status,
        daysOverdue: t.daysOverdue
      });
    });
    
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment('transactions.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};
