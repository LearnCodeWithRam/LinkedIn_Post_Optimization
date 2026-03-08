import React, { useState } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

// Dummy data for scheduled posts
const scheduledPosts = [
  {
    id: 1,
    title: 'New Product Launch',
    date: '2025-12-15',
    time: '10:00 AM',
    status: 'scheduled',
    platform: 'LinkedIn',
    image: 'https://via.placeholder.com/40'
  },
  {
    id: 2,
    title: 'Team Building Event',
    date: '2025-12-18',
    time: '02:30 PM',
    status: 'draft',
    platform: 'Twitter',
    image: 'https://via.placeholder.com/40'
  },
  {
    id: 3,
    title: 'Monthly Newsletter',
    date: '2025-12-20',
    time: '09:15 AM',
    status: 'scheduled',
    platform: 'Facebook',
    image: 'https://via.placeholder.com/40'
  }
];


// Dummy data for best times to post
const bestTimesToPost = {
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  times: ['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'],
  // Engagement levels: 0-4 (0=lowest, 4=highest)
  engagement: [
    [1, 2, 3, 2, 1, 0], // Monday
    [1, 3, 4, 3, 2, 1], // Tuesday
    [2, 3, 4, 4, 3, 2], // Wednesday
    [1, 4, 4, 3, 2, 1], // Thursday
    [2, 3, 3, 2, 1, 0], // Friday
    [0, 1, 1, 0, 0, 0], // Saturday
    [0, 1, 1, 0, 0, 0], // Sunday
  ],
  summary: {
    bestDay: 'Wednesday',
    bestTime: '12 PM - 3 PM',
    engagementRate: 'High',
    trend: 'up', // 'up' or 'down'
    trendPercentage: '12%'
  }
};



// Dummy calendar data
const generateCalendar = () => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Add day names
  dayNames.forEach(day => {
    days.push({
      day,
      date: null,
      isCurrentMonth: false,
      isToday: false,
      isHeader: true
    });
  });
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push({
      day: '',
      date: null,
      isCurrentMonth: false,
      isToday: false,
      isHeader: false
    });
  }
  
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(currentYear, currentMonth, i);
    const isToday = 
      date.getDate() === today.getDate() && 
      date.getMonth() === today.getMonth() && 
      date.getFullYear() === today.getFullYear();
    
    days.push({
      day: i,
      date: date.toISOString().split('T')[0],
      isCurrentMonth: true,
      isToday,
      isHeader: false,
      hasEvent: scheduledPosts.some(post => post.date === date.toISOString().split('T')[0])
    });
  }
  
  return days;
};

export const PlanTab: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const calendarDays = generateCalendar();
  const today = new Date().toISOString().split('T')[0];
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    date: '',
    time: '',
    platform: 'LinkedIn',
    content: ''
  });
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const currentMonth = monthNames[new Date().getMonth()];
  const currentYear = new Date().getFullYear();
  
  // Handle viewing detailed analytics
  const handleViewAnalytics = () => {
    setShowAnalytics(true);
    // Here you would typically fetch detailed analytics data
    console.log('Fetching detailed analytics...');
  };

  // Handle opening schedule post modal
  const handleOpenScheduleModal = () => {
    setShowScheduleModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPost(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSchedulePost = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send this data to your backend
    console.log('Scheduling post:', newPost);
    
    // Add to scheduled posts (temporary - in a real app, this would be managed by your backend)
    const newScheduledPost = {
      id: scheduledPosts.length + 1,
      title: newPost.title,
      date: newPost.date,
      time: newPost.time,
      status: 'scheduled',
      platform: newPost.platform,
      image: 'https://via.placeholder.com/40'
    };
    
    scheduledPosts.push(newScheduledPost);
    
    // Reset form and close modal
    setNewPost({
      title: '',
      date: '',
      time: '',
      platform: 'LinkedIn',
      content: ''
    });
    setShowScheduleModal(false);
  };

  const filteredPosts = selectedDate 
    ? scheduledPosts.filter(post => post.date === selectedDate)
    : scheduledPosts.filter(post => post.date === today);

  // Get engagement level color
  const getEngagementColor = (level: number) => {
    const colors = [
      'bg-gray-100',  // 0
      'bg-blue-100',  // 1
      'bg-blue-200',  // 2
      'bg-blue-300',  // 3
      'bg-blue-500'   // 4
    ];
    return colors[level] || 'bg-gray-50';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Content Calendar</h2>
        <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <PlusIcon className="w-5 h-5 mr-2" />
          Schedule Post
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <h3 className="text-lg font-semibold mx-4">
                {currentMonth} {currentYear}
              </h3>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-800">
              Today
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {calendarDays.slice(0, 7).map((day, index) => (
              <div key={`header-${index}`} className="text-center text-sm font-medium text-gray-500 py-2">
                {day.day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.slice(7).map((day, index) => (
              <button
                key={`day-${index}`}
                onClick={() => day.date && setSelectedDate(day.date)}
                className={`
                  h-16 p-1 rounded-lg text-left text-sm
                  ${day.isToday ? 'border-2 border-blue-500' : ''}
                  ${day.date === selectedDate ? 'bg-blue-100' : 'hover:bg-gray-50'}
                  ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                  ${!day.date ? 'cursor-default' : 'cursor-pointer'}
                `}
              >
                <div className="flex justify-between items-start">
                  <span className={`${day.isToday ? 'font-bold' : ''}`}>
                    {day.day || ''}
                  </span>
                  {day.hasEvent && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Best Time to Post Section */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Best Time to Post</h3>
            <span className="text-xs text-gray-500">Based on your audience</span>
          </div>
          
          {/* Engagement Summary */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <ChartBarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Best day to post</p>
                <div className="flex items-center">
                  <span className="font-semibold mr-2">{bestTimesToPost.summary.bestDay}</span>
                  <span className="text-sm text-gray-500">{bestTimesToPost.summary.bestTime}</span>
                </div>
              </div>
              <div className="ml-auto flex items-center">
                {bestTimesToPost.summary.trend === 'up' ? (
                  <ArrowTrendingUpIcon className="w-5 h-5 text-green-500 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-5 h-5 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  bestTimesToPost.summary.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {bestTimesToPost.summary.trend === 'up' ? '+' : ''}{bestTimesToPost.summary.trendPercentage}
                </span>
              </div>
            </div>
          </div>
          
          {/* Heatmap */}
          <div className="mb-4">
            <div className="grid grid-cols-8 gap-1 text-xs text-center">
              <div></div>
              {bestTimesToPost.times.map((time, i) => (
                <div key={`time-${i}`} className="text-gray-500 text-xs font-medium">
                  {time}
                </div>
              ))}
              
              {bestTimesToPost.days.map((day, dayIndex) => (
                <React.Fragment key={`day-${dayIndex}`}>
                  <div className="text-gray-700 font-medium text-right pr-2 py-1">
                    {day}
                  </div>
                  {bestTimesToPost.engagement[dayIndex].map((level, timeIndex) => (
                    <div 
                      key={`cell-${dayIndex}-${timeIndex}`}
                      className={`h-6 w-full rounded-sm ${getEngagementColor(level)}`}
                      title={`${day} ${bestTimesToPost.times[timeIndex]}: ${['Very Low', 'Low', 'Medium', 'High', 'Very High'][level]} engagement`}
                    ></div>
                  ))}
                </React.Fragment>
              ))}
            </div>
            
            {/* Legend */}
            <div className="flex justify-between mt-3 text-xs text-gray-500">
              <span>Low</span>
              <div className="flex space-x-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div 
                    key={`legend-${level}`} 
                    className={`h-3 w-6 ${getEngagementColor(level)}`}
                  ></div>
                ))}
              </div>
              <span>High</span>
            </div>
          </div>
          
        <div className="text-center mt-4">
          <button 
            onClick={handleViewAnalytics}
            className="text-blue-600 text-sm font-medium hover:underline">
            View detailed analytics
          </button>
        </div>
        {/* Analytics Modal */}
              {showAnalytics && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Detailed Analytics</h3>
                      <button 
                        onClick={() => setShowAnalytics(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="space-y-4">
                      <p>Detailed analytics would be displayed here.</p>
                      {/* Add your analytics components here */}
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule Post Modal */}
              {showScheduleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl p-6 w-full max-w-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Schedule New Post</h3>
                      <button 
                        onClick={() => setShowScheduleModal(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                    <form onSubmit={handleSchedulePost} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Post Title
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={newPost.title}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            name="date"
                            value={newPost.date}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time
                          </label>
                          <input
                            type="time"
                            name="time"
                            value={newPost.time}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Platform
                        </label>
                        <select
                          name="platform"
                          value={newPost.platform}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Twitter">Twitter</option>
                          <option value="Facebook">Facebook</option>
                          <option value="Instagram">Instagram</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Content
                        </label>
                        <textarea
                          name="content"
                          value={newPost.content}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          required
                        ></textarea>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowScheduleModal(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Schedule Post
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
        </div>

        
        {/* Scheduled Posts Section */}
        <div className=" lg:col-span-1 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {selectedDate === today ? "Today's Posts" : 
               selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Scheduled Posts"}
            </h3>
            <button className="text-sm text-gray-500 hover:text-gray-700">
              View All
            </button>
          </div>
          
          {filteredPosts.length > 0 ? (
            <div className="space-y-4">
              {filteredPosts.map(post => (
                <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{post.title}</h4>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        <span className="mr-3">{post.date}</span>
                        <ClockIcon className="w-4 h-4 mr-1" />
                        <span>{post.time}</span>
                      </div>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.status === 'scheduled' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">• {post.platform}</span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <EllipsisHorizontalIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500">
              <CalendarIcon className="w-12 h-12 mb-2 text-gray-300" />
              <p>No posts scheduled for this day</p>
            </div>
          )}
          
          <button className="w-full mt-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors">
            + Add New Post
          </button>
        </div>
      </div>
    </div>
  );
};
