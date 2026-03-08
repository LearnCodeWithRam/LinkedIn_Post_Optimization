import React from 'react';
import { UserCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface StepProps {
  onNext: () => void;
  onSkip: () => void;
  progress: number;
}

export const AnalyzingProfile: React.FC<StepProps> = ({ onNext, onSkip, progress }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <button
        onClick={onSkip}
        className="absolute top-6 right-6 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        Skip
      </button>

      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0d569e] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#0d569e]/10 mb-6">
              <UserCircleIcon className="w-12 h-12 text-[#0d569e] animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Analyzing Your LinkedIn Profile
            </h1>
            <p className="text-lg text-gray-600">
              We're reviewing your profile to personalize your experience
            </p>
          </div>

          {/* Loading Animation */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-3 h-3 bg-[#0d569e] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-[#0d569e] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-[#0d569e] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>

          {/* Tip */}
          <div className="bg-[#0d569e]/5 border-l-4 border-[#0d569e] p-6 rounded-r-lg">
            <div className="flex items-start">
              <CheckCircleIcon className="w-6 h-6 text-[#0d569e] flex-shrink-0 mt-1" />
              <div className="ml-4 text-left">
                <p className="text-sm font-semibold text-gray-900">Tip</p>
                <p className="text-sm text-gray-800 mt-1">
                  Consistency is more important than frequency when building an audience.
                  Focus on maintaining a regular posting schedule rather than posting frequently without a plan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
