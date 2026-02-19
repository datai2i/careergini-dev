import React, { useState, useEffect } from 'react';
import { BookOpen, Star, Clock, Award, ExternalLink, Filter, Search } from 'lucide-react';

interface Course {
    id: string;
    title: string;
    provider: string;
    category: string;
    level: string;
    duration: string;
    rating: number;
    students: string;
    description: string;
    url: string;
}

export const LearningPage: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [levelFilter, setLevelFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('Software Engineering'); // Default topic

    useEffect(() => {
        fetchCourses(searchQuery);
    }, []);

    const fetchCourses = async (query: string = '') => {
        setLoading(true);
        try {
            // Build query string
            const params = new URLSearchParams();
            if (query) params.append('topic', query);
            if (categoryFilter !== 'all') params.append('platform', categoryFilter); // Mapping category to platform for now

            const response = await fetch(`/api/learning/courses?${params.toString()}`);
            const data = await response.json();

            // Handle array response from backend
            if (Array.isArray(data)) {
                setCourses(data);
            } else {
                setCourses(data.courses || []);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            // keep mock data just in case
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchCourses(searchQuery);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Learning Hub</h1>
                <p className="text-gray-600 dark:text-gray-400">Discover free courses and tutorials to advance your career</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search for a skill (e.g., Python, React, Data Science)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Search
                    </button>
                </div>
            </form>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    <div className="col-span-2 text-center py-12 text-gray-500">Loading courses...</div>
                ) : courses.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-gray-500">No courses found matching your criteria</div>
                ) : (
                    courses.map(course => (
                        <div key={course.id} className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{course.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{course.provider}</p>
                                </div>
                                <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
                                    <Star size={14} className="text-yellow-600 dark:text-yellow-500 fill-current" />
                                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">{course.rating}</span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{course.description}</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                                    {course.category}
                                </span>
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                                    {course.level}
                                </span>
                            </div>

                            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} />
                                    <span>{course.duration}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Award size={16} />
                                    <span>{course.students} students</span>
                                </div>
                            </div>

                            <a
                                href={course.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                View {course.platform === 'YouTube' ? 'Video' : 'Course'} <ExternalLink size={16} />
                            </a>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
