import React, { useState } from 'react';
import { MdSearch, MdClear } from 'react-icons/md';

const SearchBar = ({ onSearch, placeholder = 'Search...', debounceMs = 400 }) => {
  const [value, setValue] = useState('');
  const [timer, setTimer] = useState(null);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      onSearch(newValue);
    }, debounceMs);
    setTimer(newTimer);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className="relative flex-1 min-w-[200px]">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
        <MdSearch className="h-5 w-5 text-slate-400" />
      </div>
      <input
        type="text"
        className="block w-full rounded-xl border-0 bg-white py-2.5 pl-11 pr-10 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm transition-all duration-200"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
        >
          <MdClear className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
