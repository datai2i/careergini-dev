import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Target, Award, ChevronRight, Briefcase, Star, Map } from 'lucide-react';

interface TimelineLevel {
    level: number;
    title: string;
    years_from_now: number;
    duration_years: number;
    salary: number;
    key_skills_needed: string[];
}

interface Milestone {
    milestone: string;
    type: string;
    timeline: string;
    importance: 'critical' | 'high' | 'medium';
}

interface CareerPathResult {
    current_level: number;
    role_category: string;
    timeline: TimelineLevel[];
    success_probability: number;
    milestones: Milestone[];
    salary_projection: {
        projections: Array<{ year: number; title: string; salary: number; salary_range: { min: number; max: number } }>;
        total_growth: number;
        growth_percentage: number;
    };
    alternative_paths: Array<{ path: string; roles: string[] }>;
    recommendations: string[];
}

const formatSalary = (n: number) => `$${(n / 1000).toFixed(0)}K`;

const importanceColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
};

export const CareerRoadmapPage: React.FC = () => {
    const [result, setResult] = useState<CareerPathResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPath, setSelectedPath] = useState<string | null>(null);

    useEffect(() => {
        fetchCareerPath();
    }, []);

    const fetchCareerPath = async () => {
        setLoading(true);
        try {
            const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{"skills":["JavaScript","React"],"experience":[{"title":"Developer"}],"education":[]}');
            const res = await fetch('/api/ai/career/predict-path', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_profile: userProfile }),
            });
            const data = await res.json();
            setResult(data);
        } catch {
            setResult({
                current_level: 1,
                role_category: 'software_engineer',
                timeline: [
                    { level: 1, title: 'Software Engineer', years_from_now: 0, duration_years: 2, salary: 105000, key_skills_needed: ['System Design', 'Code Review', 'Mentoring'] },
                    { level: 2, title: 'Senior Software Engineer', years_from_now: 2, duration_years: 3, salary: 145000, key_skills_needed: ['Architecture', 'Leadership', 'Technical Strategy'] },
                    { level: 3, title: 'Staff Engineer / EM', years_from_now: 5, duration_years: 3, salary: 185000, key_skills_needed: ['Strategic Planning', 'Team Leadership', 'Cross-functional'] },
                ],
                success_probability: 75,
                milestones: [
                    { milestone: 'Master System Design', type: 'skill', timeline: '3-6 months', importance: 'critical' },
                    { milestone: 'Lead a major project', type: 'experience', timeline: '6-12 months', importance: 'high' },
                    { milestone: 'Mentor junior developers', type: 'leadership', timeline: 'Ongoing', importance: 'high' },
                    { milestone: 'Build strong network', type: 'networking', timeline: 'Ongoing', importance: 'medium' },
                ],
                salary_projection: {
                    projections: [
                        { year: 0, title: 'Software Engineer', salary: 105000, salary_range: { min: 84000, max: 126000 } },
                        { year: 2, title: 'Senior Software Engineer', salary: 145000, salary_range: { min: 116000, max: 174000 } },
                        { year: 5, title: 'Staff Engineer', salary: 185000, salary_range: { min: 148000, max: 222000 } },
                    ],
                    total_growth: 80000,
                    growth_percentage: 76,
                },
                alternative_paths: [
                    { path: 'Technical Leadership', roles: ['Tech Lead', 'Staff Engineer', 'Principal Engineer', 'CTO'] },
                    { path: 'People Management', roles: ['Engineering Manager', 'Senior Manager', 'Director', 'VP Engineering'] },
                    { path: 'Product / Startup', roles: ['Technical PM', 'Founder', 'CEO'] },
                ],
                recommendations: [
                    'Start leading small projects to build leadership experience',
                    'Develop system design skills — critical for senior roles',
                    'Begin mentoring junior developers now',
                    'Network actively in your industry',
                ],
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Building your career roadmap...</p>
                </div>
            </div>
        );
    }

    if (!result) return null;

    const maxSalary = Math.max(...result.salary_projection.projections.map(p => p.salary_range.max));

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                            <Map className="w-5 h-5 text-white" />
                        </div>
                        Career Roadmap
                    </h1>
                    <p className="mt-2 text-gray-600">Your personalized path to career success</p>
                </div>

                {/* Success Probability Banner */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 mb-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-200 text-sm font-medium">Success Probability</p>
                            <p className="text-4xl font-bold mt-1">{result.success_probability}%</p>
                            <p className="text-purple-200 text-sm mt-1">chance of reaching next level within 2 years</p>
                        </div>
                        <div className="text-right">
                            <p className="text-purple-200 text-sm">Salary Growth Potential</p>
                            <p className="text-3xl font-bold mt-1">+{result.salary_projection.growth_percentage}%</p>
                            <p className="text-purple-200 text-sm mt-1">over next 5 years</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Timeline */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Career Timeline */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-purple-500" /> Career Progression Timeline
                            </h2>
                            <div className="relative">
                                {/* Vertical line */}
                                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-blue-500" />
                                <div className="space-y-6">
                                    {result.timeline.map((level, i) => (
                                        <div key={level.level} className="relative flex gap-4 pl-14">
                                            {/* Dot */}
                                            <div className={`absolute left-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${i === 0 ? 'bg-purple-600 border-purple-600' : 'bg-white border-purple-400'
                                                }`}>
                                                {i === 0 && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <div className={`flex-1 p-4 rounded-xl border ${i === 0 ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{level.title}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {level.years_from_now === 0 ? 'Now' : `In ${level.years_from_now} years`} · {level.duration_years} year tenure
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-900">{formatSalary(level.salary)}</p>
                                                        <p className="text-xs text-gray-500">avg salary</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {level.key_skills_needed.map(skill => (
                                                        <span key={skill} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-600 text-xs rounded-full">{skill}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Salary Chart */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-500" /> Salary Projection
                            </h2>
                            <div className="space-y-4">
                                {result.salary_projection.projections.map((proj, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-700 font-medium">{proj.title}</span>
                                            <span className="text-gray-500">
                                                {formatSalary(proj.salary_range.min)} – {formatSalary(proj.salary_range.max)}
                                            </span>
                                        </div>
                                        <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                                            <div
                                                className="absolute h-full bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg opacity-30"
                                                style={{ left: `${(proj.salary_range.min / maxSalary) * 100}%`, width: `${((proj.salary_range.max - proj.salary_range.min) / maxSalary) * 100}%` }}
                                            />
                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-600 rounded-full border-2 border-white shadow"
                                                style={{ left: `${(proj.salary / maxSalary) * 100}%` }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xs font-bold text-gray-700">{formatSalary(proj.salary)}</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">{proj.year === 0 ? 'Current' : `Year ${proj.year}`}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 bg-green-50 rounded-xl">
                                <p className="text-sm text-green-800 font-medium">
                                    💰 Total salary growth: +{formatSalary(result.salary_projection.total_growth)} (+{result.salary_projection.growth_percentage}%)
                                </p>
                            </div>
                        </div>

                        {/* Alternative Paths */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-blue-500" /> Alternative Career Paths
                            </h2>
                            <div className="space-y-3">
                                {result.alternative_paths.map(path => (
                                    <button
                                        key={path.path}
                                        onClick={() => setSelectedPath(selectedPath === path.path ? null : path.path)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${selectedPath === path.path ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-gray-900">{path.path}</p>
                                            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${selectedPath === path.path ? 'rotate-90' : ''}`} />
                                        </div>
                                        {selectedPath === path.path && (
                                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                                                {path.roles.map((role, i) => (
                                                    <React.Fragment key={role}>
                                                        <span className="text-sm text-gray-700 bg-white px-2 py-1 rounded-lg border border-gray-200">{role}</span>
                                                        {i < path.roles.length - 1 && <ChevronRight className="w-3 h-3 text-gray-400" />}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-6">
                        {/* Milestones */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Target className="w-4 h-4 text-orange-500" /> Key Milestones
                            </h2>
                            <div className="space-y-3">
                                {result.milestones.map((m, i) => (
                                    <div key={i} className={`p-3 rounded-xl border ${importanceColors[m.importance]}`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-medium text-gray-900">{m.milestone}</p>
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full border capitalize flex-shrink-0 ${importanceColors[m.importance]}`}>
                                                {m.importance}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{m.timeline} · {m.type}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500" /> Recommendations
                            </h2>
                            <ul className="space-y-3">
                                {result.recommendations.map((rec, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
                            <h2 className="font-semibold mb-4 flex items-center gap-2">
                                <Award className="w-4 h-4" /> Next Steps
                            </h2>
                            <div className="space-y-2">
                                {[
                                    { label: 'Analyze Skill Gaps', href: '/skill-gaps' },
                                    { label: 'Practice Interview', href: '/interview-practice' },
                                    { label: 'Browse Matching Jobs', href: '/jobs' },
                                ].map(action => (
                                    <a
                                        key={action.label}
                                        href={action.href}
                                        className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                                    >
                                        <span className="text-sm font-medium">{action.label}</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CareerRoadmapPage;
