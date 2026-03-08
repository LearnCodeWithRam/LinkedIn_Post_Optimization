import React from 'react';
import { SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface StepProps {
  onNext: () => void;
  onSkip: () => void;
  progress: number;
}

export const WelcomeToDashboard: React.FC<StepProps> = ({ onNext, onSkip, progress }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0d569e] transition-all duration-500"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#0d569e]/10 mb-6">
              <SparklesIcon className="w-12 h-12 text-[#0d569e]" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Your Dashboard! 🎉
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Everything is ready. Let's start optimizing your LinkedIn content!
            </p>
          </div>

          {/* Success Checklist */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-3 text-left">
              <CheckCircleIcon className="w-6 h-6 text-[#0d569e] flex-shrink-0" />
              <span className="text-gray-700">Profile analyzed</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-left">
              <CheckCircleIcon className="w-6 h-6 text-[#0d569e] flex-shrink-0" />
              <span className="text-gray-700">Audience insights ready</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-left">
              <CheckCircleIcon className="w-6 h-6 text-[#0d569e] flex-shrink-0" />
              <span className="text-gray-700">Content strategy created</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-left">
              <CheckCircleIcon className="w-6 h-6 text-[#0d569e] flex-shrink-0" />
              <span className="text-gray-700">Performance tracking enabled</span>
            </div>
          </div>

          <button
            onClick={onNext}
            className="px-8 py-4 bg-[#ff6700] text-white font-bold text-lg rounded-xl hover:bg-[#e55d00] transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
