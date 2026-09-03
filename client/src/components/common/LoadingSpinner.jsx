import React from 'react';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      <p className="mt-4 text-sm text-slate-400 font-medium">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
