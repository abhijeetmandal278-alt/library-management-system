import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { MdDownload, MdInsertDriveFile, MdTableChart, MdInfoOutline } from 'react-icons/md';

const ExportPage = () => {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [format, setFormat] = useState('csv'); // 'csv' or 'excel'

  const handleExport = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (status) params.status = status;

      let response;
      let filename = `library_export_${new Date().getTime()}`;

      if (format === 'csv') {
        response = await api.exports.exportCSV(params);
        filename += '.csv';
      } else {
        response = await api.exports.exportExcel(params);
        filename += '.xlsx';
      }

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} export completed successfully`);
    } catch (error) {
      toast.error('Failed to generate export file');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Export Reports</h1>
        <p className="mt-2 text-slate-500">Download transaction data for external reporting and analysis.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={handleExport} className="space-y-8">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Transaction Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm"
            >
              <option value="">All Statuses</option>
              <option value="issued">Issued</option>
              <option value="returned">Returned</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">Export Format</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`cursor-pointer flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${
                format === 'csv' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
              }`}>
                <input type="radio" name="format" value="csv" checked={format === 'csv'} onChange={() => setFormat('csv')} className="sr-only" />
                <MdInsertDriveFile className="text-3xl mb-2" />
                <span className="font-semibold text-sm">CSV File</span>
                <span className="text-xs mt-1 opacity-75">For Excel, Numbers, Sheets</span>
              </label>

              <label className={`cursor-pointer flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${
                format === 'excel' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
              }`}>
                <input type="radio" name="format" value="excel" checked={format === 'excel'} onChange={() => setFormat('excel')} className="sr-only" />
                <MdTableChart className="text-3xl mb-2" />
                <span className="font-semibold text-sm">Excel (.xlsx)</span>
                <span className="text-xs mt-1 opacity-75">Formatted spreadsheet</span>
              </label>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex gap-3 text-sm text-slate-600">
            <MdInfoOutline className="text-xl text-slate-400 flex-shrink-0" />
            <p>The exported file will contain all transactions matching your selected filters. If no filters are applied, the entire transaction history will be exported.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-indigo-600 text-white text-base font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating Export...' : (
              <>
                <MdDownload className="text-xl" />
                Download {format === 'csv' ? 'CSV' : 'Excel'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExportPage;
