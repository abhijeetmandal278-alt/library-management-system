import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdQrCode, MdClose, MdLibraryBooks, MdSearch, MdFilterList, MdOutlineFileDownload } from 'react-icons/md';
import QRCode from 'react-qr-code';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SmartSearch from '../components/ai/SmartSearch';

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography', 'Self-Help', 'Other'];

const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedBook, setSelectedBook] = useState(null);

  // Form State
  const [formData, setFormData] = useState({ title: '', author: '', isbn: '', category: 'Fiction', totalCopies: 1 });

  useEffect(() => {
    fetchBooks();
  }, [currentPage, search, categoryFilter, availabilityFilter]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: 12 };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (availabilityFilter) params.status = availabilityFilter;

      const res = await api.books.getBooks(params);
      setBooks(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (error) {
      toast.error('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const openFormModal = (book = null) => {
    if (book) {
      setFormData({ title: book.title, author: book.author, isbn: book.isbn || '', category: book.category, totalCopies: book.totalCopies });
      setSelectedBook(book);
    } else {
      setFormData({ title: '', author: '', isbn: '', category: 'Fiction', totalCopies: 1 });
      setSelectedBook(null);
    }
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedBook) {
        await api.books.updateBook(selectedBook._id, formData);
        toast.success('Book updated successfully');
      } else {
        await api.books.createBook(formData);
        toast.success('Book added successfully');
      }
      setIsFormModalOpen(false);
      fetchBooks();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Action failed');
    }
  };

  const handleDelete = async () => {
    if (!selectedBook) return;
    try {
      await api.books.deleteBook(selectedBook._id);
      toast.success('Book deleted');
      setIsDeleteModalOpen(false);
      setSelectedBook(null);
      fetchBooks();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete book');
    }
  };

  const downloadQr = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${selectedBook?.bookId || selectedBook?.title}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Book Inventory</h1>
          <p className="text-slate-500 mt-1">Manage library catalog, categories, and inventory</p>
        </div>
        <button
          onClick={() => openFormModal()}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200"
        >
          <MdAdd className="mr-2 -ml-1 h-5 w-5" /> Add New Book
        </button>
      </div>

      <SmartSearch onSearch={(q) => { setSearch(q); setCurrentPage(1); }} />

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MdSearch className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            className="pl-10 pr-4 py-2.5 w-full border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none transition-shadow"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative min-w-[160px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdFilterList className="h-4 w-4 text-slate-400" />
            </div>
            <select
              className="pl-9 pr-8 py-2.5 w-full appearance-none border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none bg-white text-slate-700"
              value={categoryFilter} 
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <select
            className="px-4 py-2.5 w-full min-w-[140px] border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none bg-white text-slate-700"
            value={availabilityFilter} 
            onChange={(e) => { setAvailabilityFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="unavailable">All Issued</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12"><LoadingSpinner /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Book Info</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Book ID</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Availability</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {books.map((book, index) => (
                  <tr key={book._id} className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">{book.title}</span>
                        <span className="text-sm text-slate-500 mt-0.5">{book.author}</span>
                        {book.isbn && <span className="text-xs text-slate-400 mt-1">ISBN: {book.isbn}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {book.bookId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {book.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-slate-900">
                          {book.availableCopies} <span className="text-slate-400 font-normal">/ {book.totalCopies}</span>
                        </span>
                        {book.availableCopies > 0 ? (
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-800">
                            All Issued
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => { setSelectedBook(book); setIsQrModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Show QR Code"
                        >
                          <MdQrCode className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => openFormModal(book)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Book"
                        >
                          <MdEdit className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => { setSelectedBook(book); setIsDeleteModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Book"
                        >
                          <MdDelete className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {books.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="bg-slate-100 rounded-full p-4 mb-4">
                          <MdLibraryBooks className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-base font-medium text-slate-900">No books found</h3>
                        <p className="mt-1 text-sm text-slate-500">Adjust your filters or add a new book to the inventory.</p>
                        <button
                          onClick={() => openFormModal()}
                          className="mt-6 inline-flex items-center rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          <MdAdd className="mr-2 h-4 w-4" /> Add Book
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {books.length > 0 && (
            <div className="border-t border-slate-200 px-6 py-4 bg-white">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsFormModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden z-10 animate-fade-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">{selectedBook ? 'Edit Book Details' : 'Add New Book'}</h2>
              <button 
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <MdClose className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title <span className="text-rose-500">*</span></label>
                <input 
                  required 
                  type="text" 
                  className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm py-2.5 px-3 outline-none transition-all" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="Enter book title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Author <span className="text-rose-500">*</span></label>
                <input 
                  required 
                  type="text" 
                  className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm py-2.5 px-3 outline-none transition-all" 
                  value={formData.author} 
                  onChange={e => setFormData({...formData, author: e.target.value})} 
                  placeholder="Enter author name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ISBN <span className="text-slate-400 font-normal">(optional)</span></label>
                <input 
                  type="text" 
                  className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm py-2.5 px-3 outline-none transition-all font-mono" 
                  value={formData.isbn} 
                  onChange={e => setFormData({...formData, isbn: e.target.value})} 
                  placeholder="e.g. 978-3-16-148410-0"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category <span className="text-rose-500">*</span></label>
                  <select 
                    className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm py-2.5 px-3 outline-none transition-all bg-white" 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Copies <span className="text-rose-500">*</span></label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm py-2.5 px-3 outline-none transition-all" 
                    value={formData.totalCopies} 
                    onChange={e => setFormData({...formData, totalCopies: parseInt(e.target.value) || 1})} 
                  />
                </div>
              </div>
              
              <div className="pt-4 mt-6 flex justify-end space-x-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsFormModalOpen(false)} 
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-sm"
                >
                  {selectedBook ? 'Save Changes' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {isQrModalOpen && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsQrModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center space-y-5 max-w-sm w-full z-10 animate-fade-in">
            <div className="text-center w-full border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 line-clamp-1" title={selectedBook.title}>{selectedBook.title}</h3>
              <p className="text-sm text-slate-500 font-mono mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded">{selectedBook.bookId}</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-sm">
              <QRCode id="qr-code-svg" value={selectedBook.bookId} size={200} />
            </div>
            
            <p className="text-sm text-slate-500 text-center leading-relaxed">
              Scan this QR code with the library scanner to quickly issue or return this book.
            </p>
            
            <div className="flex w-full space-x-3 pt-2">
              <button 
                onClick={() => setIsQrModalOpen(false)} 
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button 
                onClick={downloadQr} 
                className="flex-1 inline-flex justify-center items-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <MdOutlineFileDownload className="mr-1.5 h-4 w-4" /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Delete Book"
        message={`Are you sure you want to delete "${selectedBook?.title}"? This action will permanently remove it from the catalog.`}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

export default BooksPage;
