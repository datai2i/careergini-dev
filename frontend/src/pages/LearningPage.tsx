import React, { useState, useEffect } from 'react';
import { BookOpen, Star, Clock, Award, ExternalLink, Filter } from 'lucide-react';

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

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/learning/courses');
            const data = await response.json();
            setCourses(data.courses || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            // Set sample courses if API fails
            setCourses([
                {
                    id: '1',
                    title: 'Machine Learning Specialization',
                    provider: 'Coursera',
                    category: 'AI/ML',
                    level: 'Intermediate',
                    duration: '3 months',
                    rating: 4.9,
                    students: '500k+',
                    description: 'Master machine learning fundamentals with Andrew Ng',
                    url: 'https://coursera.org'
                },
                {
                    id: '2',
                    title: 'Full Stack Web Development',
                    provider: 'Udemy',
                    category: 'Web Development',
                    level: 'Beginner',
                    duration: '2 months',
                    rating: 4.7,
                    students: '300k+',
                    description: 'Learn HTML, CSS, JavaScript, React, Node.js and more',
                    url: 'https://udemy.com'
                },
                {
                    id: '3',
                    title: 'AWS Certified Solutions Architect',
                    provider: 'A Cloud Guru',
                    category: 'Cloud',
                    level: 'Advanced',
                    duration: '6 weeks',
                    rating: 4.8,
                    students: '200k+',
                    description: 'Prepare for AWS certification with hands-on labs',
                    url: 'https://acloudguru.com'
                },
                {
                    id: '4',
                    title: 'Python for Data Science',
                    provider: 'DataCamp',
                    category: 'Data Science',
                    level: 'Beginner',
                    duration: '4 weeks',
                    rating: 4.6,
                    students: '150k+',
                    description: 'Learn Python, Pandas, NumPy for data analysis',
                    url: 'https://datacamp.com'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
        const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
        return matchesCategory && matchesLevel;
    });

    const categories = ['all', ...Array.from(new Set(courses.map(c => c.category)))];
    const levels = ['all', 'Beginner', 'Intermediate', 'Advanced'];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Learning Hub</h1>
                <p className="text-gray-600 dark:text-gray-400">Discover courses to advance your career</p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Filter size={20} className="text-gray-600 dark:text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Category
                        </label>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'All Categories' : cat}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Level
                        </label>
                        <select
                            value={levelFilter}
                            onChange={(e) => setLevelFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {levels.map(level => (
                                <option key={level} value={level}>
                                    {level === 'all' ? 'All Levels' : level}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    <div className="col-span-2 text-center py-12 text-gray-500">Loading courses...</div>
                ) : filteredCourses.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-gray-500">No courses found matching your criteria</div>
                ) : (
                    filteredCourses.map(course => (
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
                                View Course <ExternalLink size={16} />
                            </a>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
