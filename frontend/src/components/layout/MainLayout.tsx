import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Outlet } from 'react-router-dom';

export const MainLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-dark-bg p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
