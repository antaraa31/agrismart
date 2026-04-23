import React from 'react';

const Loader = ({ type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-lg shadow-sm shadow-green-900/5 space-y-md w-full">
        <div className="flex justify-between items-start">
          <div className="h-8 w-48 skeleton-pulse rounded-md"></div>
          <div className="h-6 w-16 skeleton-pulse rounded-full"></div>
        </div>
        <div className="h-4 w-full skeleton-pulse rounded-md"></div>
        <div className="h-4 w-3/4 skeleton-pulse rounded-md"></div>
        <div className="pt-md border-t border-gray-50">
          <div className="h-6 w-32 skeleton-pulse rounded-md mb-sm"></div>
          <div className="space-y-sm">
            <div className="h-4 w-full skeleton-pulse rounded-md"></div>
            <div className="h-4 w-full skeleton-pulse rounded-md"></div>
            <div className="h-4 w-2/3 skeleton-pulse rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 rounded-full border-4 border-outline-variant border-t-primary animate-spin"></div>
    </div>
  );
};

export default Loader;
