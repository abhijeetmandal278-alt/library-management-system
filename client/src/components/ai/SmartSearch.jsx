import React, { useState } from 'react';
import { MdAutoAwesome } from 'react-icons/md';
import toast from 'react-hot-toast';

const SmartSearch = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      onSearch(query);
      toast.success(`AI-powered search: "${query}"`);
    } catch (error) {
      toast.error('Smart search failed. Falling back to regular search.');
      onSearch(query);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <MdAutoAwesome className={`h-5 w-5 ${loading ? 'text-indigo-400 animate-pulse' : 'text-indigo-500'}`} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="AI Search: e.g., 'find science books about space'"
          className="block w-full rounded-xl border-0 bg-indigo-50 py-2.5 pl-11 pr-24 text-slate-900 ring-1 ring-inset ring-indigo-200 placeholder:text-indigo-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm transition-all duration-200"
          disabled={loading}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40 transition-all duration-200"
          >
            {loading ? 'Thinking...' : 'AI Search'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SmartSearch;
