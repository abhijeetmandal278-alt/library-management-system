import React, { useState, useEffect } from 'react';
import { 
  MdLibraryBooks, 
  MdCheckCircle, 
  MdAssignment, 
  MdWarning, 
  MdQrCodeScanner, 
  MdOutlineAssignmentReturn, 
  MdAnalytics,
  MdSearch,
  MdDownload,
  MdOutlineDescription
} from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DashboardPage = () => {
  const [stats, setStats] = useState({ totalBooks: 0, totalTitles: 0, availableBooks: 0, issuedBooks: 0, overdueBooks: 0 });
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, issuedRes] = await Promise.all([
        api.dashboard.getStats(),
        api.dashboard.getIssuedBooks()
      ]);
      setStats(statsRes.data.data);
      setIssuedBooks(issuedRes.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type) => {
    try {
      const apiCall = type === 'csv' ? api.exports.exportCSV : api.exports.exportExcel;
      const response = await apiCall({});

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `library_transactions.${type === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(`Failed to download ${type.toUpperCase()}`);
    }
  };

  const filteredBooks = issuedBooks.filter(item => {
    const bookTitle = item.book?.title || '';
    const bookAuthor = item.book?.author || '';
    const term = searchTerm.toLowerCase();
    return (
      bookTitle.toLowerCase().includes(term) ||
      bookAuthor.toLowerCase().includes(term) ||
      item.borrowerName?.toLowerCase().includes(term) ||
      item.borrowerId?.toLowerCase().includes(term)
    );
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back. Here's what's happening in your library today.</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={<MdLibraryBooks className="h-7 w-7 text-indigo-600" />} 
          title="Total Books" 
          value={stats.totalBooks} 
          subtitle={`${stats.totalTitles} titles in catalog`} 
          bgColor="bg-indigo-50"
          accentColor="text-indigo-600"
        />
        <StatCard 
          icon={<MdCheckCircle className="h-7 w-7 text-emerald-600" />} 
          title="Available" 
          value={stats.availableBooks} 
          bgColor="bg-emerald-50"
          accentColor="text-emerald-600"
        />
        <StatCard 
          icon={<MdAssignment className="h-7 w-7 text-amber-600" />} 
          title="Issued" 
          value={stats.issuedBooks} 
          bgColor="bg-amber-50"
          accentColor="text-amber-600"
        />
        <StatCard 
          icon={<MdWarning className="h-7 w-7 text-rose-600" />} 
          title="Overdue" 
          value={stats.overdueBooks} 
          bgColor="bg-rose-50"
          accentColor="text-rose-600"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <ActionCard 
            title="Issue Book" 
            description="Scan QR or enter ID to issue" 
            icon={<MdQrCodeScanner className="h-6 w-6" />} 
            onClick={() => navigate('/scanner')}
            color="indigo"
          />
          <ActionCard 
            title="Return Book" 
            description="Process a book return quickly" 
            icon={<MdOutlineAssignmentReturn className="h-6 w-6" />} 
            onClick={() => navigate('/scanner')}
            color="emerald"
          />
          <ActionCard 
            title="View Reports" 
            description="Generate detailed library reports" 
            icon={<MdAnalytics className="h-6 w-6" />} 
            onClick={() => navigate('/reports')}
            color="slate"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Currently Issued Books</h2>
              <p className="text-sm text-slate-500 mt-1">Manage all currently active book transactions</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MdSearch className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search title, borrower..."
                  className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-shadow outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleDownload('csv')} 
                  className="inline-flex items-center bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 px-3 rounded-lg border border-slate-300 text-sm transition-colors"
                >
                  <MdOutlineDescription className="mr-1.5 h-4 w-4 text-slate-500" />
                  CSV
                </button>
                <button 
                  onClick={() => handleDownload('xlsx')} 
                  className="inline-flex items-center bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 px-3 rounded-lg border border-slate-300 text-sm transition-colors"
                >
                  <MdDownload className="mr-1.5 h-4 w-4 text-slate-500" />
                  Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Book Info</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Book ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Borrower</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dates</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredBooks.map((item, index) => {
                const isOverdue = item.daysOverdue > 0 || item.status === 'overdue';
                return (
                  <tr key={item._id} className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{item.book?.title || 'N/A'}</span>
                        <span className="text-sm text-slate-500">{item.book?.author || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-700">
                        {item.book?.bookId || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{item.borrowerName}</span>
                        <span className="text-xs text-slate-500">ID: {item.borrowerId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col text-sm">
                        <span className="text-slate-900">Issued: {new Date(item.issueDate).toLocaleDateString()}</span>
                        <span className={`mt-0.5 ${isOverdue ? 'text-rose-600 font-medium' : 'text-slate-500'}`}>
                          Due: {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isOverdue ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
                          {item.daysOverdue} days overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                          On Time
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredBooks.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="bg-slate-100 rounded-full p-3 mb-3">
                        <MdLibraryBooks className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-sm font-medium text-slate-900">No issued books found</h3>
                      <p className="mt-1 text-sm text-slate-500">No transactions match your current search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, subtitle, bgColor, accentColor }) => (
  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 flex items-start transition-all duration-200 hover:shadow-md hover:-translate-y-1">
    <div className={`p-3 rounded-2xl ${bgColor} mr-4 flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-1 text-3xl font-bold ${accentColor} tracking-tight`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const ActionCard = ({ title, description, icon, onClick, color }) => {
  const colorStyles = {
    indigo: "hover:border-indigo-300 hover:bg-indigo-50/50 text-indigo-600 icon-bg-indigo-100",
    emerald: "hover:border-emerald-300 hover:bg-emerald-50/50 text-emerald-600 icon-bg-emerald-100",
    slate: "hover:border-slate-300 hover:bg-slate-50/50 text-slate-700 icon-bg-slate-100"
  };
  
  const style = colorStyles[color] || colorStyles.slate;
  
  return (
    <button 
      onClick={onClick}
      className={`flex items-center p-5 bg-white rounded-2xl shadow-sm border border-slate-200 transition-all duration-200 text-left group hover:shadow-md ${style.split(' ').slice(0, 2).join(' ')}`}
    >
      <div className={`p-3 rounded-xl mr-4 flex-shrink-0 bg-slate-100 group-hover:bg-white transition-colors`}>
        <div className={style.split(' ')[2]}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
};

export default DashboardPage;
