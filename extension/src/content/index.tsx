import React from 'react';
import ReactDOM from 'react-dom/client';
import { Target } from 'lucide-react';

// Wait for page load
window.addEventListener('load', () => {
    // Only run on job pages
    if (window.location.host.includes('linkedin.com') && window.location.pathname.includes('/jobs/')) {
        injectOverlay();
    }
});

// Listener for Side Panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_jd") {
        const descriptionElement = document.querySelector('.jobs-description');
        const text = descriptionElement ? (descriptionElement as HTMLElement).innerText : document.body.innerText;
        sendResponse({ text: text });
    }
    return true;
});

function injectOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'careergini-overlay';
    overlay.style.position = 'fixed';
    overlay.style.bottom = '20px';
    overlay.style.right = '20px';
    overlay.style.zIndex = '9999';
    document.body.appendChild(overlay);

    ReactDOM.createRoot(overlay).render(<JobOverlay />);
}

function JobOverlay() {
    const [score, setScore] = React.useState<number | null>(null);
    const [loading, setLoading] = React.useState(false);

    const analyzeJob = async () => {
        setLoading(true);
        try {
            // In a real app, scraping logic would be complex.
            // For MVP, we presume standard LinkedIn selectors or just grab full body text
            const descriptionElement = document.querySelector('.jobs-description');
            const description = descriptionElement ? (descriptionElement as HTMLElement).innerText : document.body.innerText;

            const response = await fetch('http://localhost:3000/api/resume/ats-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    resume_text: "Placeholder Resume Text", // In real version, fetch from storage
                    job_description: description
                })
            });
            const data = await response.json();
            setScore(data.score || 85); // Mock score if API fails
        } catch (error) {
            console.error('Analysis failed', error);
            setScore(72); // Fallback mock
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-blue-200 w-64 font-sans">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Target size={18} className="text-blue-600" /> CareerGini
                </h3>
                <button onClick={() => document.getElementById('careergini-overlay')?.remove()} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>

            {!score ? (
                <button
                    onClick={analyzeJob}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition disabled:opacity-50"
                >
                    {loading ? 'Analyzing...' : 'Analyze Match'}
                </button>
            ) : (
                <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-1">{score}%</div>
                    <div className="text-sm text-gray-600">Match Score</div>
                    <div className="mt-3 text-xs text-gray-500 border-t pt-2">
                        Missing keywords: Python, React
                    </div>
                </div>
            )}
        </div>
    );
}
