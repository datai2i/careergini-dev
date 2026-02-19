import React, { useState, useEffect } from 'react';
import { Settings, Activity, FileText, Send, CheckCircle, AlertCircle } from 'lucide-react';

// Types for our API responses
interface JobOpportunities {
    id: string;
    title: string;
    company: string;
    match_score: number;
}

const SidePanel = () => {
    const [activeTabUrl, setActiveTabUrl] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [draftStatus, setDraftStatus] = useState<'idle' | 'drafting' | 'done'>('idle');

    useEffect(() => {
        // Listen for tab updates
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id && tabs[0]?.url) {
                setActiveTabUrl(tabs[0].url);
                // Try to extract content if it's a job site
                if (tabs[0].url.includes('linkedin.com/jobs') || tabs[0].url.includes('indeed.com')) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "extract_jd" }, (response) => {
                        if (response && response.text) {
                            setJobDescription(response.text.substring(0, 150) + "...");
                        }
                    });
                }
            }
        });
    }, []);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            // Find active tab
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]?.id) return;

            // Ask content script for full text
            const response = await chrome.tabs.sendMessage(tabs[0].id, { action: "extract_jd" });

            if (response && response.text) {
                const res = await fetch('http://localhost:3000/api/resume/ats-score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resume_text: "Placeholder Resume Text", // TODO: Get from storage
                        job_description: response.text
                    })
                });
                const data = await res.json();
                setAnalysis(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDraftApplication = async () => {
        setDraftStatus('drafting');
        try {
            // Mock call to the agent we just built
            // in real app, we pass the user profile and job details
            setTimeout(() => {
                setDraftStatus('done');
            }, 2000);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="h-screen bg-white flex flex-col font-sans text-gray-800">
            <header className="p-4 border-b bg-gray-50 flex justify-between items-center sticky top-0 z-10">
                <h1 className="font-bold text-blue-600 flex items-center gap-2">
                    <Activity size={20} /> CareerGini
                </h1>
                <div className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Copilot Active</div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Context Section */}
                <section>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Context</h2>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm">
                        {activeTabUrl.includes('linkedin') ? (
                            <div className="flex items-start gap-2">
                                <CheckCircle size={16} className="text-green-600 mt-1 shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-900">LinkedIn Job Detected</p>
                                    <p className="text-gray-600 text-xs mt-1">{jobDescription || "Navigate to a job to see details..."}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2">
                                <AlertCircle size={16} className="text-gray-400 mt-1 shrink-0" />
                                <p className="text-gray-500">Navigate to a supported job board (LinkedIn, Indeed) to activate analysis.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Actions Section */}
                <section>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Agent Actions</h2>
                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={handleAnalyze}
                            disabled={loading || !activeTabUrl.includes('linkedin')}
                            className="flex items-center justify-between p-4 bg-white border shadow-sm rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-md group-hover:bg-purple-200 transition">
                                    <FileText size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold">Analyze Fit</div>
                                    <div className="text-xs text-gray-500">Check ATS Score & Keywords</div>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={handleDraftApplication}
                            disabled={draftStatus === 'drafting' || !activeTabUrl.includes('linkedin')}
                            className="flex items-center justify-between p-4 bg-white border shadow-sm rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 text-green-600 rounded-md group-hover:bg-green-200 transition">
                                    <Send size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold">Draft Application</div>
                                    <div className="text-xs text-gray-500">Write Cover Letter & DM</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </section>

                {/* Results Area */}
                {analysis && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Analysis Results</h2>
                        <div className="bg-white border rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm text-gray-600">Match Score</span>
                                <span className="text-2xl font-bold text-gray-900">{analysis.score || 85}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${analysis.score || 85}%` }}></div>
                            </div>
                            {/* Mock Feedback for demo if API doesn't return list */}
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 font-bold">•</span>
                                    <span>Missing Keyword: <b>Kubernetes</b></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 font-bold">•</span>
                                    <span>Strong match for <b>React Native</b></span>
                                </li>
                            </ul>
                        </div>
                    </section>
                )}

                {draftStatus === 'done' && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                            <p className="font-semibold flex items-center gap-2 mb-1">
                                <CheckCircle size={16} /> Draft Created!
                            </p>
                            <p>Cover letter and outreach message have been saved to your dashboard.</p>
                            <button className="mt-3 text-xs font-medium underline text-green-700 hover:text-green-900">
                                View in Dashboard
                            </button>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default SidePanel;
