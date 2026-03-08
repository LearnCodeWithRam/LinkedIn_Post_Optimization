import React from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';

export const IdeasTab: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm border border-gray-100">
      <LightBulbIcon className="w-16 h-16 text-gray-300 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Ideas Tab</h3>
      <p className="text-gray-500 text-center max-w-md">
        Content ideas and inspiration will be displayed here. Stay tuned for more features!
      </p>
    </div>
  );
};
