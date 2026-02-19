/**
 * Resume Analyzer Page
 * Demonstrates ATS Score Widget integration
 */

import React, { useState } from 'react';
import { useATSScore } from '../hooks/useEnhancements';
import ATSScoreWidget from '../components/ATSScoreWidget';
import { Upload, FileText } from 'lucide-react';

export const ResumeAnalyzerPage: React.FC = () => {
    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [showResults, setShowResults] = useState(false);

    const { data: atsScore, isLoading, error } = useATSScore(
        showResults ? resumeText : '',
        showResults ? jobDescription : undefined
    );

    const handleAnalyze = () => {
        if (resumeText.length > 50) {
            setShowResults(true);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        setResumeText(text);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Resume ATS Analyzer</h1>
                    <p className="mt-2 text-gray-600">
                        Check how well your resume performs with Applicant Tracking Systems
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="space-y-6">
                        {/* Resume Upload */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Your Resume
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Upload Resume (TXT, PDF, DOCX)
                                    </label>
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                                                <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".txt,.pdf,.docx"
                                                onChange={handleFileUpload}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Or Paste Resume Text
                                    </label>
                                    <textarea
                                        className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Paste your resume text here..."
                                        value={resumeText}
                                        onChange={(e) => setResumeText(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Job Description (Optional) */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Job Description (Optional)
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Add a job description to get keyword matching analysis
                            </p>
                            <textarea
                                className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Paste job description here..."
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                            />
                        </div>

                        {/* Analyze Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={resumeText.length < 50 || isLoading}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Analyzing...' : 'Analyze Resume'}
                        </button>
                    </div>

                    {/* Results Section */}
                    <div>
                        {isLoading && (
                            <div className="bg-white rounded-lg shadow-md p-12 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Analyzing your resume...</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                <p className="text-red-800">Error analyzing resume. Please try again.</p>
                            </div>
                        )}

                        {atsScore && showResults && !isLoading && (
                            <ATSScoreWidget
                                score={atsScore.overall_score}
                                breakdown={atsScore.breakdown}
                                issues={atsScore.issues}
                                improvements={atsScore.improvements}
                            />
                        )}

                        {!showResults && !isLoading && (
                            <div className="bg-white rounded-lg shadow-md p-12 flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>Upload or paste your resume to get started</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeAnalyzerPage;
