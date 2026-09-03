import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { MdFilterList, MdClear } from 'react-icons/md';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, statusFilter, startDate, endDate]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.transactions.getTransactions(params);
      setTransactions(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, daysOverdue) => {
    if (status === 'returned') {
      return <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">Returned</span>;
    }
    if (status === 'overdue' || daysOverdue > 0) {
      return <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-red-100 text-red-700">Overdue ({daysOverdue} days)</span>;
    }
    return <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-amber-100 text-amber-700">Issued</span>;
  };

  const clearFilters = () => {
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Transaction History</h1>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Status</label>
            <select
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="issued">Issued</option>
              <option value="returned">Returned</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm"
            />
          </div>
          
          {(statusFilter || startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              <MdClear /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Book Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Book ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Borrower</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timeline</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx._id} className={`hover:bg-slate-50 transition-colors ${tx.status === 'overdue' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4 align-top">
                      <p className="text-sm font-bold text-slate-900">{tx.book?.title || 'Unknown Title'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{tx.book?.author || 'Unknown Author'}</p>
                    </td>
                    <td className="px-6 py-4 align-top whitespace-nowrap">
                      <span className="text-sm text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                        {tx.book?.bookId || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="text-sm font-medium text-slate-900">{tx.borrowerName}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{tx.borrowerId}</p>
                    </td>
                    <td className="px-6 py-4 align-top whitespace-nowrap">
                      <div className="text-xs text-slate-500 space-y-1">
                        <p><span className="font-semibold text-slate-700 w-12 inline-block">Issued:</span> {tx.issueDate ? format(new Date(tx.issueDate), 'MMM dd, yyyy') : '-'}</p>
                        <p><span className="font-semibold text-slate-700 w-12 inline-block">Due:</span> {tx.dueDate ? format(new Date(tx.dueDate), 'MMM dd, yyyy') : '-'}</p>
                        {tx.returnDate && (
                          <p><span className="font-semibold text-slate-700 w-12 inline-block">Returned:</span> {format(new Date(tx.returnDate), 'MMM dd, yyyy')}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top whitespace-nowrap">
                      {getStatusBadge(tx.status, tx.daysOverdue)}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center text-slate-500 bg-slate-50/50">
                      <div className="flex flex-col items-center justify-center">
                        <MdFilterList className="text-4xl text-slate-300 mb-2" />
                        <p className="text-sm font-medium">No transactions found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
