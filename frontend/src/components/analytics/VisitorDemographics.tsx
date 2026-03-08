import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDemographics } from '@/store/thunks/analyticsThunks';
import { AppDispatch, RootState } from '@/store';

interface DemographicItem {
  name: string;
  count: number;
  percentage?: number;
}

interface Demographics {
  location: DemographicItem[];
  jobFunction: DemographicItem[];
  seniority: DemographicItem[];
  industry: DemographicItem[];
  companySize: DemographicItem[];
}

interface VisitorDemographicsProps {
  source?: 'visitors' | 'followers';
}

export const VisitorDemographics: React.FC<VisitorDemographicsProps> = ({ source = 'visitors' }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { demographics, loading, error } = useSelector((state: RootState) => state.analytics);
  const [activeCategory, setActiveCategory] = useState<keyof Demographics>('companySize');

  useEffect(() => {
    dispatch(fetchDemographics({ source }));
  }, [dispatch, source]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!demographics || Object.keys(demographics).length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span className="text-sm text-blue-700">No demographic data was found</span>
      </div>
    );
  }

  const categoryLabels: Record<keyof Demographics, string> = {
    companySize: 'Company size',
    jobFunction: 'Job function',
    industry: 'Industry',
    location: 'Location',
    seniority: 'Seniority',
  };

  const categories = Object.keys(categoryLabels) as (keyof Demographics)[];
  const currentData = demographics[activeCategory] || [];

  // Calculate total for percentages
  const total = currentData.reduce((sum, item) => sum + item.count, 0);

  // Calculate percentages and get top items
  const dataWithPercentages = currentData
    .map(item => ({
      ...item,
      percentage: total > 0 ? (item.count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Get top 5 for display, rest goes to "Others"
  const topItems = dataWithPercentages.slice(0, 5);
  const othersCount = dataWithPercentages.slice(5).reduce((sum, item) => sum + item.count, 0);
  const othersPercentage = total > 0 ? (othersCount / total) * 100 : 0;

  const displayData = [...topItems];
  if (othersCount > 0) {
    displayData.push({
      name: 'Others',
      count: othersCount,
      percentage: othersPercentage,
    });
  }

  // Get max count for bar width calculation
  const maxCount = Math.max(...displayData.map(item => item.count), 1);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {source === 'visitors' ? 'Visitor' : 'Follower'} demographics
        </h3>

        {/* Category Selector */}
        <div className="mb-6">
          <div className="relative inline-block">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value as keyof Demographics)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabels[cat]}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Category Tabs (Alternative UI) */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* Demographic Data Display */}
        {displayData.length > 0 ? (
          <div className="space-y-4">
            {displayData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {item.name}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.count} ({item.percentage?.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      item.name === 'Others' ? 'bg-gray-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No data available for {categoryLabels[activeCategory].toLowerCase()}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total {source}:</span>
            <span className="font-semibold text-gray-900">{total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
