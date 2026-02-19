import React from 'react';
import { Construction } from 'lucide-react';

export const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-6">
                <Construction size={40} className="text-yellow-600 dark:text-yellow-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                This feature is currently under development. Check back soon for updates!
            </p>
        </div>
    );
};
