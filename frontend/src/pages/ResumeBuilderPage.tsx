import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, Download, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ResumePersona {
    full_name: string;
    professional_title: string;
    years_experience: number;
    summary: string;
    top_skills: string[];
    experience_highlights: Array<{
        role: string;
        company: string;
        duration: string;
        key_achievement: string;
    }>;
}

export const ResumeBuilderPage: React.FC = () => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [persona, setPersona] = useState<ResumePersona | null>(null);
    const [jobDescription, setJobDescription] = useState('');
    const [tailoring, setTailoring] = useState(false);
    const [tailoredContent, setTailoredContent] = useState<any>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load existing persona on mount
    useEffect(() => {
        if (user) {
            fetch(`/api/resume/persona/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        setPersona(data.persona);
                        setStep(2); // Skip upload if persona exists
                    }
                })
                .catch(err => console.error(err));
        }
    }, [user]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setUploading(true);
            setError(null);

            const formData = new FormData();
            formData.append('file', selectedFile);

            try {
                const response = await fetch(`/api/resume/upload?user_id=${user?.id || 'default'}`, {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (response.ok) {
                    setPersona(data.persona);
                    setStep(2);
                } else {
                    setError(data.detail || 'Upload failed');
                }
            } catch (err) {
                setError('An error occurred during upload.');
            } finally {
                setUploading(false);
            }
        }
    };

    const handleTailorResume = async () => {
        if (!jobDescription.trim()) {
            setError('Please enter a Job Description');
            return;
        }

        setTailoring(true);
        setError(null);

        try {
            const response = await fetch('/api/resume/tailor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user?.id || 'default',
                    job_description: jobDescription,
                    persona: persona
                }),
            });

            const data = await response.json();
            if (response.ok) {
                // Merge tailored content with original persona to preserve contact info
                const completeTailoredPersona = {
                    ...persona,
                    ...data.tailored_content,
                    cover_letter: data.tailored_content.cover_letter,
                    // Ensure specific fields are updated if present in tailored content
                    summary: data.tailored_content.tailored_summary || persona?.summary,
                    top_skills: data.tailored_content.tailored_skills || persona?.top_skills,
                    experience_highlights: data.tailored_content.tailored_experience || persona?.experience_highlights
                };

                setTailoredContent(completeTailoredPersona);

                // Auto-generate PDF
                const pdfResponse = await fetch('/api/resume/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: user?.id || 'default',
                        job_description: jobDescription,
                        persona: completeTailoredPersona
                    })
                });

                const pdfData = await pdfResponse.json();
                if (pdfResponse.ok) {
                    setPdfUrl(pdfData.pdf_url);
                    setStep(4);
                } else {
                    setError("Failed to generate PDF");
                }

            } else {
                setError(data.detail || 'Tailoring failed');
            }
        } catch (err: any) {
            console.error(err);
            setError(`An error occurred during tailoring: ${err.message || String(err)}`);
        } finally {
            setTailoring(false);
        }
    };

    const handleReset = () => {
        setStep(1);
        setFile(null);
        setPersona(null);
        setJobDescription('');
        setTailoredContent(null);
        setPdfUrl(null);
        setError(null);
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        AI Resume Builder
                    </h1>
                    <p className="text-gray-600">Tailor your resume to any job description in seconds.</p>
                </div>
                <div className="flex items-center gap-4">
                    {step > 1 && (
                        <button
                            onClick={handleReset}
                            className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Start Over
                        </button>
                    )}
                    <div className="text-sm text-gray-500">
                        Step {step} of 4
                    </div>
                </div>
            </div>

            {/* Steps Progress */}
            <div className="flex justify-between max-w-2xl mx-auto mb-8 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10"></div>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold 
                 ${step >= i ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {i}
                    </div>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            {/* Step 1: Upload */}
            {step === 1 && (
                <div className="bg-white/50 backdrop-blur-sm border border-white/20 rounded-2xl p-12 text-center shadow-xl">
                    <div className="mx-auto w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                        <Upload className="w-12 h-12 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">Upload Your Current Resume</h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        We'll analyze your resume to understand your skills and experience.
                        Supports PDF, DOCX, and TXT.
                    </p>

                    <label className="cursor-pointer bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:opacity-90 transition-all inline-flex items-center shadow-lg hover:shadow-purple-500/30">
                        {uploading ? (
                            <>
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <FileText className="w-5 h-5 mr-2" />
                                Select Resume File
                            </>
                        )}
                        <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                    </label>
                </div>
            )}

            {/* Step 2: Review Persona */}
            {step === 2 && persona && (
                <div className="space-y-6">
                    <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{persona.full_name}</h2>
                                <p className="text-purple-600 font-medium text-lg">{persona.professional_title}</p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                {persona.years_experience}+ Years Exp
                            </span>
                        </div>

                        <div className="mb-6 bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <h3 className="text-sm font-semibold text-purple-800 mb-2 uppercase tracking-wide">Professional Summary</h3>
                            <p className="text-gray-700 leading-relaxed">{persona.summary}</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Top Skills
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {persona.top_skills?.map((skill, i) => (
                                        <span key={i} className="bg-white border border-gray-200 px-3 py-1 rounded-lg text-sm text-gray-700 shadow-sm">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                                    <FileText className="w-4 h-4 mr-2 text-blue-500" /> Key Highlights
                                </h3>
                                <ul className="space-y-3">
                                    {persona.experience_highlights?.map((exp, i) => (
                                        <li key={i} className="text-sm">
                                            <div className="font-medium text-gray-800">{exp.role} @ {exp.company}</div>
                                            <div className="text-gray-500 leading-snug">{exp.key_achievement}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={() => setStep(3)}
                            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-black transition-colors flex items-center shadow-lg"
                        >
                            Next: Tailor to Job <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Tailor */}
            {step === 3 && (
                <div className="grid md:grid-cols-2 gap-8 h-[600px]">
                    {/* Left: Persona Summary */}
                    <div className="bg-white/50 rounded-2xl p-6 border border-white/20 overflow-y-auto">
                        <h3 className="font-semibold text-gray-700 mb-4">Your Profile</h3>
                        <p className="text-sm text-gray-600 mb-4">{persona?.summary}</p>
                        <div className="flex flex-wrap gap-2">
                            {persona?.top_skills?.map((skill, i) => (
                                <span key={i} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Right: JD Input */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl flex flex-col">
                        <h3 className="font-semibold text-gray-800 mb-2">Target Job Description</h3>
                        <textarea
                            className="flex-1 w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none text-sm mb-4"
                            placeholder="Paste the job description here..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        />

                        {/* Example JDs */}
                        <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Or select an example:</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: "Software Engineer", jd: "We are looking for a Software Engineer with experience in React, Node.js, and Python. You will build scalable web applications and collaborate with cross-functional teams." },
                                    { label: "Product Manager", jd: "Seeking a Product Manager to lead our mobile app development. Must have experience with agile methodologies, user research, and roadmap planning." },
                                    { label: "Data Scientist", jd: "Join our data team to build predictive models. Proficiency in Python, SQL, and machine learning frameworks (scikit-learn, TensorFlow) is required." },
                                    { label: "Marketing Specialist", jd: "We need a Marketing Specialist to drive our digital campaigns. Experience with SEO, content marketing, and social media analytics is a plus." }
                                ].map((example, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setJobDescription(example.jd)}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors border border-gray-200"
                                    >
                                        {example.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-auto flex justify-end">
                            <button
                                onClick={handleTailorResume}
                                disabled={tailoring || !jobDescription}
                                className={`bg-purple-600 text-white px-6 py-3 rounded-xl font-medium flex items-center shadow-lg hover:bg-purple-700 transition-all ${tailoring ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {tailoring ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                        Tailoring & Writing Cover Letter...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Generate Tailored Resume
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 4: Download */}
            {step === 4 && pdfUrl && (
                <div className="max-w-xl mx-auto text-center space-y-8 py-12">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Resume Ready!</h2>
                        <p className="text-gray-600">Your custom resume has been tailored to the job description.</p>
                    </div>

                    {/* Preview Cover Letter if available */}
                    {tailoredContent?.cover_letter && (
                        <div className="bg-white text-left p-6 rounded-2xl border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                            <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wide mb-3">Generated Cover Letter Preview</h3>
                            <div className="prose prose-sm text-gray-700 whitespace-pre-wrap font-serif leading-relaxed">
                                {tailoredContent.cover_letter}
                            </div>
                        </div>
                    )}

                    <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-xl">
                        <div className="flex items-center justify-between mb-4 border-b pb-4">
                            <span className="font-medium text-gray-700">Format</span>
                            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-sm font-medium">PDF</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">Optimization</span>
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-sm font-medium">ATS Friendly</span>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                            <span className="font-medium text-gray-700">Included</span>
                            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-sm font-medium">Cover Letter + Resume</span>
                        </div>
                    </div>

                    <a
                        href={pdfUrl}
                        target="_blank"
                        download="Tailored_Resume.pdf"
                        className="block w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        <Download className="w-6 h-6 inline-block mr-2" />
                        Download Tailored Resume
                    </a>

                    <button
                        onClick={() => setStep(3)}
                        className="text-gray-500 hover:text-gray-800 text-sm font-medium"
                    >
                        ← Edit Details & Regenerate
                    </button>
                </div>
            )}
        </div>
    );
};


