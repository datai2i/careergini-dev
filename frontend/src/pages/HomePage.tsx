import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, FileText, Briefcase, GraduationCap, TrendingUp, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
    const navigate = useNavigate();

    const quickActions = [
        {
            icon: MessageSquare,
            title: 'AI Career Advisor',
            description: 'Get personalized career guidance and advice',
            color: 'from-blue-500 to-blue-600',
            path: '/chat'
        },
        {
            icon: FileText,
            title: 'Resume Builder',
            description: 'Create and optimize your professional resume',
            color: 'from-purple-500 to-purple-600',
            path: '/resume'
        },
        {
            icon: Briefcase,
            title: 'Job Search',
            description: 'Discover opportunities matching your profile',
            color: 'from-green-500 to-green-600',
            path: '/jobs'
        },
        {
            icon: GraduationCap,
            title: 'Learning Hub',
            description: 'Upskill with courses and certifications',
            color: 'from-orange-500 to-orange-600',
            path: '/learning'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                    <Sparkles size={32} className="text-yellow-300" />
                    <h1 className="text-3xl md:text-4xl font-bold">Welcome to CareerGini</h1>
                </div>
                <p className="text-lg md:text-xl text-blue-100 max-w-2xl">
                    Your AI-powered career companion. Get personalized guidance, build standout resumes,
                    discover opportunities, and accelerate your professional growth.
                </p>
            </div>

            {/* Quick Actions Grid */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {quickActions.map((action, index) => (
                        <button
                            key={index}
                            onClick={() => navigate(action.path)}
                            className="group bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-dark-border hover:shadow-lg transition-all duration-200 text-left"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                    <action.icon size={28} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {action.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {action.description}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-dark-border">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Progress</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <TrendingUp className="text-blue-600 dark:text-blue-400" size={28} />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">0</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Applications Sent</div>
                    </div>
                    <div className="text-center p-4">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileText className="text-purple-600 dark:text-purple-400" size={28} />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">0</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Resumes Created</div>
                    </div>
                    <div className="text-center p-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <GraduationCap className="text-green-600 dark:text-green-400" size={28} />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">0</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Courses Completed</div>
                    </div>
                </div>
            </div>

            {/* Tips Section */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">💡 Career Tip of the Day</h3>
                <p className="text-gray-700 dark:text-gray-300">
                    Start your job search by updating your profile with your latest skills and experience.
                    A complete profile increases your chances of getting noticed by recruiters by 40%!
                </p>
            </div>
        </div>
    );
};
