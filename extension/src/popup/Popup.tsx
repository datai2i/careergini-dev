import React, { useState, useEffect } from 'react';
import { Settings, Activity, FileText, User } from 'lucide-react';

const Popup = () => {
    const [status, setStatus] = useState('idle');
    const [currentUrl, setCurrentUrl] = useState('');

    useEffect(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.url) {
                setCurrentUrl(tabs[0].url);
                if (tabs[0].url.includes('linkedin.com/jobs') || tabs[0].url.includes('indeed.com')) {
                    setStatus('ready');
                } else {
                    setStatus('unsupported');
                }
            }
        });
    }, []);

    return (
        <div className="p-4 bg-gray-50 h-full flex flex-col">
            <header className="flex items-center justify-between mb-4 border-b pb-2">
                <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                    <Activity size={24} /> CareerGini
                </h1>
                <Settings size={18} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
            </header>

            <main className="flex-1">
                {status === 'unsupported' ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>Navigate to a job post on LinkedIn or Indeed to use Copilot.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <h3 className="font-semibold text-gray-700 mb-2">Active Job Post</h3>
                            <p className="text-xs text-gray-500 truncate mb-3">{currentUrl}</p>
                            <button
                                className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition"
                                onClick={() => chrome.tabs.create({ url: 'http://localhost:5173' })}
                            >
                                Open Dashboard
                            </button>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <FileText size={16} /> Quick Actions
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded hover:bg-gray-100 transition text-xs text-center border">
                                    <span>Analyze JD</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded hover:bg-gray-100 transition text-xs text-center border">
                                    <span>Tailor Resume</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="mt-auto text-xs text-center text-gray-400 py-2">
                v1.0.0 • Connected to Local AI
            </footer>
        </div>
    );
};

export default Popup;
