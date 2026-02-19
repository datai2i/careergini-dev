/**
 * Job Search Page with Match Scoring
 * Demonstrates JobMatchBadge integration
 */

import React, { useState } from 'react';
import { useJobMatch } from '../hooks/useEnhancements';
import JobMatchBadge from '../components/JobMatchBadge';
import { Search, MapPin, DollarSign, Briefcase } from 'lucide-react';

// Mock job data (replace with real API)
const mockJobs = [
    {
        id: '1',
        title: 'Senior Software Engineer',
        company: 'TechCorp',
        location: 'Remote',
        salary_min: 120000,
        salary_max: 160000,
        required_skills: ['Python', 'React', 'Docker', 'Kubernetes'],
        preferred_skills: ['AWS', 'TypeScript'],
        years_required: 5,
        description: 'Looking for experienced engineer...',
    },
    {
        id: '2',
        title: 'Full Stack Developer',
        company: 'StartupXYZ',
        location: 'San Francisco, CA',
        salary_min: 100000,
        salary_max: 140000,
        required_skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        preferred_skills: ['GraphQL', 'Redis'],
        years_required: 3,
        description: 'Join our growing team...',
    },
];

// Mock user profile (replace with real user data)
const mockUserProfile = {
    skills: ['Python', 'React', 'Node.js', 'JavaScript', 'Docker'],
    experience: [
        { title: 'Software Engineer', company: 'Previous Co', years: 4 }
    ],
    education: [{ degree: 'Bachelor of Science in Computer Science' }],
    location: 'San Francisco, CA',
    preferences: {
        remote: true,
        min_salary: 100000,
        max_salary: 150000,
    },
};

export const JobSearchPage: React.FC = () => {
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Job Search</h1>
                    <p className="mt-2 text-gray-600">
                        Find jobs that match your skills and preferences
                    </p>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search jobs..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all">
                            Search
                        </button>
                    </div>
                </div>

                {/* Job Listings */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Job List */}
                    <div className="lg:col-span-2 space-y-4">
                        {mockJobs.map((job) => (
                            <JobCard
                                key={job.id}
                                job={job}
                                userProfile={mockUserProfile}
                                onSelect={() => setSelectedJob(job)}
                                isSelected={selectedJob?.id === job.id}
                            />
                        ))}
                    </div>

                    {/* Job Details */}
                    <div className="lg:col-span-1">
                        {selectedJob ? (
                            <JobDetails job={selectedJob} userProfile={mockUserProfile} />
                        ) : (
                            <div className="bg-white rounded-lg shadow-md p-12 flex items-center justify-center">
                                <p className="text-gray-500">Select a job to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Job Card Component
const JobCard: React.FC<any> = ({ job, userProfile, onSelect, isSelected }) => {
    const { data: matchData } = useJobMatch(userProfile, job);

    return (
        <div
            onClick={onSelect}
            className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-purple-600' : ''
                }`}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-gray-600">{job.company}</p>
                </div>
                {matchData && (
                    <JobMatchBadge score={matchData.overall_score} compact={true} />
                )}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{job.years_required}+ years experience</span>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {job.required_skills.slice(0, 4).map((skill: string) => (
                    <span
                        key={skill}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                        {skill}
                    </span>
                ))}
                {job.required_skills.length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{job.required_skills.length - 4} more
                    </span>
                )}
            </div>
        </div>
    );
};

// Job Details Component
const JobDetails: React.FC<any> = ({ job, userProfile }) => {
    const { data: matchData, isLoading } = useJobMatch(userProfile, job);

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {matchData && (
                <JobMatchBadge
                    score={matchData.overall_score}
                    matchLevel={matchData.match_level}
                    breakdown={matchData.breakdown}
                    explanation={matchData.explanation}
                    recommendation={matchData.recommendation}
                    compact={false}
                />
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Job Description</h3>
                <p className="text-gray-700">{job.description}</p>
            </div>

            <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all">
                Apply Now
            </button>
        </div>
    );
};

export default JobSearchPage;
