import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../services/api';
import toast from 'react-hot-toast';
import { MdMenuBook, MdSearch, MdCheckCircle, MdWarning } from 'react-icons/md';

function QRScanner({ onScan, scanKey }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    }, false);

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear().catch(console.error);
      },
      (error) => { /* ignore scan errors */ }
    );

    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [scanKey, onScan]);

  return <div id="qr-reader" className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200" />;
}

const ScannerPage = () => {
  const [activeTab, setActiveTab] = useState('issue');
  const [scannedBook, setScannedBook] = useState(null);
  const [activeTransactions, setActiveTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [manualBookId, setManualBookId] = useState('');
  const [scanKey, setScanKey] = useState(0);

  // Transaction form state
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerId, setBorrowerId] = useState('');

  const handleScan = useCallback(async (bookId) => {
    if (loading) return;
    fetchBookDetails(bookId);
  }, [loading]);

  const fetchBookDetails = async (id) => {
    setLoading(true);
    try {
      const res = await api.books.scanBook(id);
      const { book, activeTransactions: activeTxns } = res.data.data;
      setScannedBook(book);
      setActiveTransactions(activeTxns || []);
      toast.success('Book scanned successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Book not found');
      setScannedBook(null);
      setActiveTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (manualBookId.trim()) {
      fetchBookDetails(manualBookId.trim());
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!scannedBook) return;

    if (!borrowerName.trim() || !borrowerId.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await api.transactions.issueBook({
        bookId: scannedBook.bookId,
        borrowerName: borrowerName.trim(),
        borrowerId: borrowerId.trim()
      });
      toast.success('Book issued successfully!');
      resetState();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to issue book');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    if (!scannedBook) return;

    if (!borrowerId.trim()) {
      toast.error('Please enter borrower ID');
      return;
    }

    setLoading(true);
    try {
      await api.transactions.returnBook({
        bookId: scannedBook.bookId,
        borrowerId: borrowerId.trim()
      });
      toast.success('Book returned successfully!');
      resetState();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to return book');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setScannedBook(null);
    setActiveTransactions([]);
    setBorrowerName('');
    setBorrowerId('');
    setManualBookId('');
    setScanKey(prev => prev + 1);
  };

  const availabilityPercentage = scannedBook ? (scannedBook.availableCopies / scannedBook.totalCopies) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Scanner Hub</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-1 shadow-sm border border-slate-200 inline-flex">
        <button
          onClick={() => { setActiveTab('issue'); resetState(); }}
          className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
            activeTab === 'issue' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Issue Book
        </button>
        <button
          onClick={() => { setActiveTab('return'); resetState(); }}
          className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
            activeTab === 'return' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Return Book
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6 animate-scale-in">
          {!scannedBook ? (
            <>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Scan QR Code</h3>
                <div className="rounded-xl overflow-hidden">
                  <QRScanner onScan={handleScan} scanKey={scanKey} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Or enter Book ID manually</h3>
                <form onSubmit={handleManualSearch} className="flex gap-3">
                  <div className="relative flex-1">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                    <input
                      type="text"
                      value={manualBookId}
                      onChange={(e) => setManualBookId(e.target.value)}
                      placeholder="e.g. LIB-000001"
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm font-mono"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50">
                    Search
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-indigo-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                  {scannedBook.category || 'General'}
                </span>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-24 bg-slate-100 rounded-lg flex items-center justify-center mb-5 shadow-inner border border-slate-200">
                  <MdMenuBook className="text-4xl text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{scannedBook.title}</h3>
                <p className="text-slate-500 font-medium mb-4">by {scannedBook.author}</p>
                <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 mb-6">
                  <p className="text-sm text-slate-600 font-mono">ID: {scannedBook.bookId}</p>
                </div>

                <div className="w-full max-w-xs mb-2">
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-700">Availability</span>
                    <span className={scannedBook.availableCopies > 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {scannedBook.availableCopies} / {scannedBook.totalCopies}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${scannedBook.availableCopies > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                      style={{ width: `${availabilityPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {activeTransactions.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Currently Borrowed By
                  </h4>
                  <ul className="space-y-2">
                    {activeTransactions.map((t) => (
                      <li key={t._id} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{t.borrowerName}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{t.borrowerId}</p>
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                          {new Date(t.issueDate).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button onClick={resetState} className="mt-8 w-full py-2.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors">
                Scan Another Book
              </button>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="animate-scale-in" style={{ animationDelay: '100ms' }}>
          {scannedBook ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className={`p-2 rounded-lg ${activeTab === 'issue' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {activeTab === 'issue' ? <MdMenuBook className="text-xl" /> : <MdCheckCircle className="text-xl" />}
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {activeTab === 'issue' ? 'Issue to Borrower' : 'Process Return'}
                </h3>
              </div>

              {activeTab === 'issue' ? (
                <form onSubmit={handleIssue} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                      Borrower Name
                    </label>
                    <input
                      required
                      type="text"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                      Borrower ID <span className="text-slate-400 font-normal ml-1">(student/employee code)</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={borrowerId}
                      onChange={(e) => setBorrowerId(e.target.value)}
                      placeholder="e.g. STU001"
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm font-mono uppercase"
                    />
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading || scannedBook.availableCopies === 0}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Processing...' : 'Confirm Issue'}
                    </button>
                    {scannedBook.availableCopies === 0 && (
                      <p className="flex items-center justify-center gap-1.5 text-red-500 text-sm mt-3 font-medium">
                        <MdWarning /> No copies available to issue
                      </p>
                    )}
                  </div>
                </form>
              ) : (
                <form onSubmit={handleReturn} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1.5">Borrower ID</label>
                    <input
                      required
                      type="text"
                      value={borrowerId}
                      onChange={(e) => setBorrowerId(e.target.value)}
                      placeholder="Enter the ID of the returning borrower"
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm font-mono uppercase"
                    />
                  </div>
                  
                  {activeTransactions.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-3">Active Borrowers</p>
                      <div className="space-y-2">
                        {activeTransactions.map((t) => (
                          <button
                            key={t._id}
                            type="button"
                            onClick={() => setBorrowerId(t.borrowerId)}
                            className="w-full flex justify-between items-center text-left bg-white border border-amber-100 hover:border-amber-300 px-3 py-2 rounded-lg transition-colors group"
                          >
                            <span className="text-sm font-medium text-slate-700 group-hover:text-amber-900">{t.borrowerName}</span>
                            <span className="text-xs font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded">{t.borrowerId}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Processing...' : 'Confirm Return'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-8">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                  <MdMenuBook className="text-3xl text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Waiting for Book</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {activeTab === 'issue' 
                    ? 'Scan a QR code or enter a Book ID to start the issuing process.' 
                    : 'Scan a QR code or enter a Book ID to process a return.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScannerPage;
