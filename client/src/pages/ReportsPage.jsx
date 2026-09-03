import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  MdLibraryBooks, 
  MdTrendingUp, 
  MdWarning, 
  MdDownload, 
  MdInsertDriveFile, 
  MdTableChart,
  MdAutoGraph,
  MdHistory
} from 'react-icons/md';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [statsRes, activityRes, allTxnsRes] = await Promise.all([
        api.dashboard.getStats(),
        api.transactions.getTransactions({ limit: 10 }),
        api.transactions.getTransactions({ limit: 100 }) // Fetch more for popular books aggregation
      ]);

      setStats(statsRes.data.data);
      setRecentActivity(activityRes.data.data || []);
      
      // Aggregate client-side for most borrowed books
      const txns = allTxnsRes.data.data || [];
      const bookCounts = {};
      
      txns.forEach(tx => {
        if (tx.book && tx.book.bookId) {
          if (!bookCounts[tx.book.bookId]) {
            bookCounts[tx.book.bookId] = {
              title: tx.book.title,
              author: tx.book.author,
              bookId: tx.book.bookId,
              count: 0
            };
          }
          bookCounts[tx.book.bookId].count += 1;
        }
      });
      
      const sortedBooks = Object.values(bookCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5
        
      setPopularBooks(sortedBooks);
      
    } catch (error) {
      console.error(error);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickExport = async (formatType) => {
    setExportLoading(true);
    try {
      let response;
      let filename = `quick_report_${new Date().getTime()}`;

      if (formatType === 'csv') {
        response = await api.exports.exportCSV({});
        filename += '.csv';
      } else {
        response = await api.exports.exportExcel({});
        filename += '.xlsx';
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${formatType.toUpperCase()} export completed`);
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics & Reports</h1>
          <p className="mt-2 text-slate-500">Overview of library performance and circulation statistics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleQuickExport('csv')}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <MdInsertDriveFile className="text-indigo-600 text-lg" />
            Quick CSV
          </button>
          <button 
            onClick={() => handleQuickExport('excel')}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <MdTableChart className="text-emerald-600 text-lg" />
            Quick Excel
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-scale-in">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <MdLibraryBooks className="text-2xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Collection</p>
                <h4 className="text-2xl font-bold text-slate-900">{stats.totalBooks} <span className="text-sm font-normal text-slate-400">items</span></h4>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <MdTrendingUp className="text-2xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Available</p>
                <h4 className="text-2xl font-bold text-slate-900">{stats.availableBooks}</h4>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <MdHistory className="text-2xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Currently Issued</p>
                <h4 className="text-2xl font-bold text-slate-900">{stats.issuedBooks}</h4>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <MdWarning className="text-2xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Overdue Items</p>
                <h4 className="text-2xl font-bold text-slate-900">{stats.overdueBooks}</h4>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Popular Books Section */}
        <div className="lg:col-span-1 space-y-6 animate-scale-in" style={{ animationDelay: '100ms' }}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MdAutoGraph className="text-indigo-600" /> Most Borrowed
              </h3>
            </div>
            <div className="p-2 flex-1">
              {popularBooks.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {popularBooks.map((book, index) => (
                    <li key={book.bookId} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs border border-slate-200">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{book.title}</p>
                        <p className="text-xs text-slate-500 truncate">{book.author}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg">
                          {book.count}x
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <p className="text-sm">Not enough data to calculate popular books.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 space-y-6 animate-scale-in" style={{ animationDelay: '200ms' }}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MdHistory className="text-indigo-600" /> Recent Activity
              </h3>
              <Link to="/transactions" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                View All
              </Link>
            </div>
            <div className="p-0 flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Book</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Borrower</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentActivity.map((tx) => {
                    const isReturned = tx.status === 'returned';
                    const isOverdue = tx.status === 'overdue' || tx.daysOverdue > 0;
                    
                    return (
                      <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 align-middle">
                          <p className="text-sm font-semibold text-slate-900">{tx.book?.title || 'Unknown'}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{tx.book?.bookId}</p>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <p className="text-sm font-medium text-slate-900">{tx.borrowerName}</p>
                          <p className="text-xs text-slate-500">{tx.borrowerId}</p>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          {isReturned ? (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">Returned</span>
                          ) : isOverdue ? (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Overdue</span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">Issued</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-middle whitespace-nowrap">
                          <p className="text-sm text-slate-600">
                            {isReturned && tx.returnDate 
                              ? format(new Date(tx.returnDate), 'MMM dd, yyyy')
                              : tx.issueDate 
                                ? format(new Date(tx.issueDate), 'MMM dd, yyyy') 
                                : '-'}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                  {recentActivity.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                        No recent activity found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportsPage;
