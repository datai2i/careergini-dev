import React, { useState } from 'react';
import { User, Bell, Shield, Moon, Monitor, Save, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [saved, setSaved] = useState(false);

    // Mock State
    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        jobs: true
    });

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar Navigation (In-page) */}
                <div className="md:col-span-1 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-medium">
                        <User size={20} />
                        <span>Profile</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border/50 rounded-xl font-medium transition-colors">
                        <Bell size={20} />
                        <span>Notifications</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border/50 rounded-xl font-medium transition-colors">
                        <Shield size={20} />
                        <span>Security</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border/50 rounded-xl font-medium transition-colors">
                        <Monitor size={20} />
                        <span>Appearance</span>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-2 space-y-6">
                    {/* Profile Section */}
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-dark-border">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Information</h2>

                        <div className="flex items-center gap-6 mb-8">
                            <img
                                src={user?.avatar_url || "https://ui-avatars.com/api/?name=User&background=random"}
                                alt="Profile"
                                className="w-20 h-20 rounded-full border-4 border-gray-100 dark:border-dark-border"
                            />
                            <div>
                                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                    Change Photo
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    defaultValue={user?.full_name}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    defaultValue={user?.email}
                                    disabled
                                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                                <textarea
                                    rows={4}
                                    defaultValue="Experienced software engineer passionate about AI and machine learning."
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleSave}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${saved
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                                    }`}
                            >
                                {saved ? (
                                    <>
                                        <Check size={18} />
                                        <span>Saved!</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Preferences Visual Preview */}
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-dark-border">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Preferences</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Bell className="text-gray-500" size={20} />
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">Email Notifications</div>
                                        <div className="text-sm text-gray-500">Receive daily job digests</div>
                                    </div>
                                </div>
                                <div className="w-11 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Moon className="text-gray-500" size={20} />
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">Dark Mode</div>
                                        <div className="text-sm text-gray-500">Toggle application theme</div>
                                    </div>
                                </div>
                                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative cursor-pointer">
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
