import React, { useState, useEffect } from 'react';
import { FileText, Upload, Download, CheckCircle, AlertCircle, Linkedin, Github, User, Loader2 } from 'lucide-react';

interface UserPersona {
    name: string;
    email: string;
    phone: string;
    location: string;
    title: string;
    summary: string;
    experience: Array<{ company: string; role: string; duration: string; description: string }>;
    education: Array<{ school: string; degree: string; year: string }>;
    skills: string[];
    linkedinUrl: string;
    githubUrl: string;
}

export const ResumePage: React.FC = () => {
    const [resumeText, setResumeText] = useState(localStorage.getItem('resume_text') || '');
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showPersona, setShowPersona] = useState(false);
    const [scrapingLinkedIn, setScrapingLinkedIn] = useState(false);
    const [scrapingGitHub, setScrapingGitHub] = useState(false);

    const [persona, setPersona] = useState<UserPersona>(() => {
        const stored = localStorage.getItem('user_persona');
        return stored ? JSON.parse(stored) : {
            name: '',
            email: '',
            phone: '',
            location: '',
            title: '',
            summary: '',
            experience: [],
            education: [],
            skills: [],
            linkedinUrl: localStorage.getItem('linkedin_url') || '',
            githubUrl: localStorage.getItem('github_url') || ''
        };
    });

    useEffect(() => {
        localStorage.setItem('user_persona', JSON.stringify(persona));
        localStorage.setItem('linkedin_url', persona.linkedinUrl);
        localStorage.setItem('github_url', persona.githubUrl);
    }, [persona]);

    const [uploadProgress, setUploadProgress] = useState('');

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress('📄 Reading file...');

        try {
            let text = '';

            if (file.name.endsWith('.txt')) {
                // Plain text — read directly in browser
                text = await file.text();
            } else if (file.name.endsWith('.pdf')) {
                setUploadProgress('📄 Parsing PDF...');
                const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
                // Use bundled worker
                GlobalWorkerOptions.workerSrc = new URL(
                    'pdfjs-dist/build/pdf.worker.mjs',
                    import.meta.url
                ).toString();
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await getDocument({ data: arrayBuffer }).promise;
                const pages: string[] = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    pages.push(content.items.map((item: any) => item.str).join(' '));
                }
                text = pages.join('\n');
            } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
                setUploadProgress('📄 Parsing DOCX...');
                const mammoth = await import('mammoth');
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
            } else {
                throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT.');
            }

            if (!text.trim()) {
                throw new Error('Could not extract text from file. The file may be empty or image-based.');
            }

            // Set resume text immediately
            setResumeText(text);
            localStorage.setItem('resume_text', text);
            setUploadProgress('✅ Text extracted! Parsing with AI...');

            // Step 2: Try AI parsing (optional — works if backend is up)
            try {
                const parseResponse = await fetch('/api/ai/resume/parse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text }),
                    signal: AbortSignal.timeout(10000), // 10s timeout
                });

                if (parseResponse.ok) {
                    const parseData = await parseResponse.json();
                    if (parseData.parsed_data && Object.keys(parseData.parsed_data).length > 0) {
                        const parsed = parseData.parsed_data;
                        setPersona(prev => ({
                            ...prev,
                            name: parsed.name || prev.name,
                            email: parsed.email || prev.email,
                            phone: parsed.phone || prev.phone,
                            location: parsed.location || prev.location,
                            title: parsed.title || prev.title,
                            summary: parsed.summary || prev.summary,
                            experience: parsed.experience || prev.experience,
                            education: parsed.education || prev.education,
                            skills: parsed.skills || prev.skills,
                        }));
                        setShowPersona(true);
                        setUploadProgress('');
                        alert('✅ Resume uploaded and parsed successfully! Check your profile.');
                        return;
                    }
                }
            } catch {
                // AI parsing unavailable — that's OK, text is already extracted
            }

            setUploadProgress('');
            setShowPersona(true);
            alert(`✅ Resume uploaded! ${text.length} characters extracted. You can now analyze it or edit your profile manually.`);
        } catch (error: any) {
            console.error('Error uploading resume:', error);
            setUploadProgress('');
            alert(`❌ ${error.message || 'Error reading file. Please try again or paste the text manually.'}`);
        } finally {
            setUploading(false);
            setUploadProgress('');
            event.target.value = '';
        }
    };


    const scrapeLinkedIn = async () => {
        if (!persona.linkedinUrl) {
            alert('Please enter your LinkedIn URL first');
            return;
        }

        setScrapingLinkedIn(true);
        try {
            const response = await fetch('/api/profile/scrape/linkedin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: persona.linkedinUrl })
            });

            const data = await response.json();
            if (data.profile) {
                setPersona({ ...persona, ...data.profile });
                alert('LinkedIn profile data imported successfully!');
            }
        } catch (error) {
            console.error('Error scraping LinkedIn:', error);
            alert('LinkedIn scraping is not available yet. This feature requires authentication.');
        } finally {
            setScrapingLinkedIn(false);
        }
    };

    const scrapeGitHub = async () => {
        if (!persona.githubUrl) {
            alert('Please enter your GitHub username first');
            return;
        }

        setScrapingGitHub(true);
        try {
            // Extract username from URL
            const username = persona.githubUrl.replace(/https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '');

            const response = await fetch(`https://api.github.com/users/${username}`);
            const data = await response.json();

            if (data.login) {
                // Update persona with GitHub data
                const updatedPersona = {
                    ...persona,
                    name: persona.name || data.name || data.login,
                    location: persona.location || data.location || '',
                    summary: persona.summary || data.bio || '',
                };

                // Fetch repositories for skills
                const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`);
                const repos = await reposResponse.json();

                if (Array.isArray(repos)) {
                    const languages = new Set<string>();
                    repos.forEach((repo: any) => {
                        if (repo.language) languages.add(repo.language);
                    });
                    updatedPersona.skills = [...new Set([...persona.skills, ...Array.from(languages)])];
                }

                setPersona(updatedPersona);
                alert('GitHub profile data imported successfully!');
            }
        } catch (error) {
            console.error('Error scraping GitHub:', error);
            alert('Error fetching GitHub data. Please check the username.');
        } finally {
            setScrapingGitHub(false);
        }
    };

    const analyzeResume = async () => {
        if (!resumeText.trim()) {
            alert('Please enter your resume content first');
            return;
        }

        setAnalyzing(true);
        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: 'user_' + Date.now(),
                    session_id: 'resume_' + Date.now(),
                    message: `Please review and analyze this resume. Provide specific feedback on:\n1. ATS optimization\n2. Content structure\n3. Keywords and formatting\n4. Suggestions for improvement\n\nResume:\n${resumeText}`
                })
            });

            const data = await response.json();
            setAnalysis(data.response);
        } catch (error) {
            console.error('Error analyzing resume:', error);
            setAnalysis('Error: Could not analyze resume. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    const saveResume = () => {
        localStorage.setItem('resume_text', resumeText);
        alert('Resume saved locally!');
    };

    const generatePersonalizedResume = async (jobDescription: string) => {
        if (!persona.name) {
            alert('Please build your profile first (upload resume or link social profiles)');
            return;
        }

        setAnalyzing(true);
        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: 'user_' + Date.now(),
                    session_id: 'resume_gen_' + Date.now(),
                    message: `Generate a personalized resume tailored for this job description using my profile data:\n\nProfile: ${JSON.stringify(persona)}\n\nJob Description: ${jobDescription}\n\nCreate an ATS-friendly resume that highlights relevant experience and skills.`
                })
            });

            const data = await response.json();
            setResumeText(data.response);
            setAnalysis('Resume generated! Review and customize as needed.');
        } catch (error) {
            console.error('Error generating resume:', error);
            alert('Error generating resume. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resume Builder</h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowPersona(!showPersona)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <User size={18} /> {showPersona ? 'Hide' : 'Show'} Profile
                    </button>
                    <button
                        onClick={saveResume}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <Download size={18} /> Save
                    </button>
                    <button
                        onClick={analyzeResume}
                        disabled={analyzing}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {analyzing ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : <><CheckCircle size={18} /> Analyze</>}
                    </button>
                </div>
            </div>

            {/* User Persona Section */}
            {showPersona && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Profile</h2>

                    {/* Social Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                LinkedIn Profile
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={persona.linkedinUrl}
                                    onChange={(e) => setPersona({ ...persona, linkedinUrl: e.target.value })}
                                    placeholder="https://linkedin.com/in/yourprofile"
                                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                                />
                                <button
                                    onClick={scrapeLinkedIn}
                                    disabled={scrapingLinkedIn}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {scrapingLinkedIn ? <Loader2 size={16} className="animate-spin" /> : <Linkedin size={16} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                GitHub Username
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={persona.githubUrl}
                                    onChange={(e) => setPersona({ ...persona, githubUrl: e.target.value })}
                                    placeholder="username or github.com/username"
                                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                                />
                                <button
                                    onClick={scrapeGitHub}
                                    disabled={scrapingGitHub}
                                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {scrapingGitHub ? <Loader2 size={16} className="animate-spin" /> : <Github size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                            type="text"
                            value={persona.name}
                            onChange={(e) => setPersona({ ...persona, name: e.target.value })}
                            placeholder="Full Name"
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                        />
                        <input
                            type="email"
                            value={persona.email}
                            onChange={(e) => setPersona({ ...persona, email: e.target.value })}
                            placeholder="Email"
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                        />
                        <input
                            type="tel"
                            value={persona.phone}
                            onChange={(e) => setPersona({ ...persona, phone: e.target.value })}
                            placeholder="Phone"
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                        />
                        <input
                            type="text"
                            value={persona.location}
                            onChange={(e) => setPersona({ ...persona, location: e.target.value })}
                            placeholder="Location"
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                        />
                    </div>

                    <input
                        type="text"
                        value={persona.title}
                        onChange={(e) => setPersona({ ...persona, title: e.target.value })}
                        placeholder="Professional Title"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg mb-4"
                    />

                    <textarea
                        value={persona.summary}
                        onChange={(e) => setPersona({ ...persona, summary: e.target.value })}
                        placeholder="Professional Summary"
                        rows={3}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg mb-4"
                    />

                    {/* Skills */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Skills (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={persona.skills.join(', ')}
                            onChange={(e) => setPersona({ ...persona, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                            placeholder="JavaScript, Python, React, etc."
                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                        />
                    </div>
                </div>
            )}

            {/* Upload Section */}
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Existing Resume</h2>
                        {uploadProgress && (
                            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 animate-pulse">
                                {uploadProgress}
                            </p>
                        )}
                    </div>
                    <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50">
                        {uploading ? <><Loader2 size={18} className="animate-spin" /> Uploading...</> : <><Upload size={18} /> Upload Resume</>}
                        <input
                            type="file"
                            accept=".txt,.pdf,.doc,.docx"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload your resume (TXT, PDF, DOC) to automatically extract your information and build your profile
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Resume Editor */}
                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <FileText className="text-blue-600" size={24} />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Resume</h2>
                    </div>
                    <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste your resume here or upload a file above...

Example:
JOHN DOE
Software Engineer | john.doe@email.com | (555) 123-4567

EXPERIENCE
Senior Software Engineer | Tech Company | 2020-Present
- Led development of microservices architecture
- Improved system performance by 40%

EDUCATION
BS Computer Science | University Name | 2018

SKILLS
JavaScript, Python, React, Node.js, AWS"
                        className="w-full h-[600px] bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Analysis Results */}
                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="text-green-600" size={24} />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Analysis</h2>
                    </div>

                    {!analysis ? (
                        <div className="flex flex-col items-center justify-center h-[600px] text-center text-gray-500">
                            <CheckCircle size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                            <p className="text-lg font-medium mb-2">No Analysis Yet</p>
                            <p className="max-w-sm">
                                Enter your resume content and click "Analyze" to get AI-powered feedback and suggestions.
                            </p>
                        </div>
                    ) : (
                        <div className="prose dark:prose-invert max-w-none h-[600px] overflow-y-auto">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 whitespace-pre-wrap">
                                {analysis}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tips Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Resume Tips</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Upload your resume to auto-extract profile data</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Link LinkedIn/GitHub for automatic profile building</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Use action verbs (Led, Developed, Improved)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Include quantifiable achievements</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Tailor keywords to job description</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Keep formatting simple for ATS</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};
