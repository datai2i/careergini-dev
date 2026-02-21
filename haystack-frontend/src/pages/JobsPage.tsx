import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Search, MapPin, Briefcase, DollarSign, Clock, ExternalLink, Filter } from 'lucide-react';

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    salary: string;
    posted: string;
    description: string;
}

export const JobsPage: React.FC = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/jobs');
            const data = await response.json();
            // Handle array response from backend
            if (Array.isArray(data)) {
                setJobs(data);
            } else {
                setJobs(data.jobs || []);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
            // Set sample jobs if API fails
            setJobs([
                {
                    id: '1',
                    title: 'Senior Software Engineer',
                    company: 'Tech Corp',
                    location: 'Remote',
                    type: 'Full-time',
                    salary: '$120k - $180k',
                    posted: '2 days ago',
                    description: 'We are looking for an experienced software engineer to join our team...'
                },
                {
                    id: '2',
                    title: 'AI/ML Engineer',
                    company: 'AI Innovations',
                    location: 'San Francisco, CA',
                    type: 'Full-time',
                    salary: '$150k - $200k',
                    posted: '1 week ago',
                    description: 'Join our AI team to build cutting-edge machine learning solutions...'
                },
                {
                    id: '3',
                    title: 'Frontend Developer',
                    company: 'Startup Inc',
                    location: 'New York, NY',
                    type: 'Contract',
                    salary: '$80k - $120k',
                    posted: '3 days ago',
                    description: 'Looking for a talented frontend developer with React experience...'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.company.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase());
        return matchesSearch && matchesLocation;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Job Board</h1>
                <p className="text-gray-600 dark:text-gray-400">Find your next career opportunity</p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search jobs, companies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Location"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Job Listings */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading jobs...</div>
                ) : filteredJobs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No jobs found matching your criteria</div>
                ) : (
                    filteredJobs.map(job => (
                        <div key={job.id} className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{job.title}</h3>
                                    <p className="text-lg text-gray-700 dark:text-gray-300">{job.company}</p>
                                </div>
                                <a
                                    href={// @ts-ignore
                                        job.url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    Apply <ExternalLink size={16} />
                                </a>
                            </div>

                            <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} />
                                    <span>{job.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Briefcase size={16} />
                                    <span>{job.type}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DollarSign size={16} />
                                    <span>{job.salary}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} />
                                    <span>{job.posted}</span>
                                </div>
                            </div>

                            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                                <ReactMarkdown
                                    rehypePlugins={[rehypeRaw]}
                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                    components={{
                                        // Override link opening behavior
                                        a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />
                                    }}
                                >
                                    {job.description}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
