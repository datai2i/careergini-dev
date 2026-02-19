import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Home,
    MessageSquare,
    User,
    Briefcase,
    BookOpen,
    FileText,
    Settings,
    LogOut,
    Target,
    Mic,
    Map,
    Zap,
    BarChart3,
    LayoutDashboard,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: MessageSquare, label: 'AI Chat', path: '/chat' },
    { icon: FileText, label: 'Resume Builder', path: '/resume-builder' },
    { icon: Briefcase, label: 'Jobs', path: '/jobs' },
    { icon: BookOpen, label: 'Learning', path: '/learning' },
];

const aiToolItems = [
    { icon: Target, label: 'Skill Gaps', path: '/skill-gaps' },
    { icon: Mic, label: 'Interview Prep', path: '/interview-practice' },
    { icon: Map, label: 'Career Roadmap', path: '/career-roadmap' },
    { icon: Zap, label: 'Advisor', path: '/advisor' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: LayoutDashboard, label: 'Applications', path: '/applications' },
];

import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Sidebar: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    return (
        <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border">
            <div className="p-8">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                        C
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        CareerGini
                    </h1>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Menu
                </div>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border/50 hover:text-gray-900 dark:hover:text-gray-200"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={20} className={clsx("transition-transform group-hover:scale-110", isActive && "text-blue-600 dark:text-blue-400")} />
                                <span>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}

                <div className="px-4 pt-4 pb-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                    AI Tools
                </div>
                {aiToolItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-medium shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border/50 hover:text-gray-900 dark:hover:text-gray-200"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={20} className={clsx("transition-transform group-hover:scale-110", isActive && "text-purple-600 dark:text-purple-400")} />
                                <span>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 m-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="text-xs font-medium text-gray-500">System Status: Online</p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '12%' }}></div>
                </div>
                <p className="text-[10px] text-gray-400">CPU Usage: 12%</p>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-dark-border space-y-1">
                <button
                    onClick={() => navigate('/settings')}
                    className="flex items-center gap-3 px-4 py-3 w-full text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border/50 rounded-xl transition-colors"
                >
                    <Settings size={20} />
                    <span>Settings</span>
                </button>
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};
