import React, { useState } from 'react';
import { Target, TrendingUp, BookOpen, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp, Zap } from 'lucide-react';

interface SkillGap {
    skill: string;
    importance: 'critical' | 'preferred';
    learning_time_weeks: number;
    roi: string;
}

interface LearningPhase {
    phase: number;
    name: string;
    duration_weeks: number;
    skills: string[];
    resources?: Array<{ skill: string; courses: Array<{ name: string; platform: string; duration: string }> }>;
}

interface SkillGapResult {
    readiness_score: number;
    target_role: string;
    gaps: {
        critical_missing: SkillGap[];
        nice_to_have_missing: SkillGap[];
        transferable: string[];
        strengths: string[];
    };
    learning_path: LearningPhase[];
    estimated_time_months: number;
    priority_skills: Array<{ skill: string; priority_rank: number; roi_score: number }>;
    recommendations: string[];
}

const TARGET_ROLES = [
    { value: 'software_engineer', label: 'Software Engineer' },
    { value: 'data_scientist', label: 'Data Scientist' },
    { value: 'product_manager', label: 'Product Manager' },
    { value: 'devops_engineer', label: 'DevOps Engineer' },
    { value: 'ml_engineer', label: 'ML Engineer' },
];

const ReadinessGauge: React.FC<{ score: number }> = ({ score }) => {
    const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
    const label = score >= 80 ? 'Ready' : score >= 60 ? 'Almost Ready' : 'Needs Work';
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-36 h-36">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                    <circle
                        cx="60" cy="60" r="54" fill="none"
                        stroke={color} strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{score}</span>
                    <span className="text-xs text-gray-500">/ 100</span>
                </div>
            </div>
            <span className="mt-2 text-sm font-semibold" style={{ color }}>{label}</span>
        </div>
    );
};

const PhaseCard: React.FC<{ phase: LearningPhase; index: number }> = ({ phase, index }) => {
    const [expanded, setExpanded] = useState(index === 0);
    const colors = ['from-purple-500 to-blue-500', 'from-blue-500 to-cyan-500', 'from-cyan-500 to-green-500'];

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${colors[index % colors.length]} flex items-center justify-center text-white text-sm font-bold`}>
                        {phase.phase}
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-gray-900">{phase.name}</p>
                        <p className="text-xs text-gray-500">{phase.duration_weeks} weeks · {phase.skills.length} skills</p>
                    </div>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {expanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="mt-3 flex flex-wrap gap-2 mb-4">
                        {phase.skills.map(skill => (
                            <span key={skill} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">{skill}</span>
                        ))}
                    </div>
                    {phase.resources?.map(res => (
                        <div key={res.skill} className="mb-3">
                            <p className="text-xs font-semibold text-gray-600 mb-1">{res.skill}</p>
                            {res.courses.map(course => (
                                <div key={course.name} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg mb-1">
                                    <div>
                                        <p className="text-xs font-medium text-gray-800">{course.name}</p>
                                        <p className="text-xs text-gray-500">{course.platform}</p>
                                    </div>
                                    <span className="text-xs text-gray-400">{course.duration}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const SkillGapPage: React.FC = () => {
    const [targetRole, setTargetRole] = useState('software_engineer');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SkillGapResult | null>(null);

    const analyzeGaps = async () => {
        setLoading(true);
        try {
            // Get user profile from auth context / local storage
            const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{"skills":["JavaScript","React"],"experience":[],"education":[]}');
            const res = await fetch('/api/ai/skills/gap-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_profile: userProfile, target_role: targetRole }),
            });
            if (!res.ok) throw new Error('Analysis failed');
            const data = await res.json();
            setResult(data);
        } catch (err) {
            // Demo data fallback
            setResult({
                readiness_score: 68,
                target_role: targetRole,
                gaps: {
                    critical_missing: [
                        { skill: 'System Design', importance: 'critical', learning_time_weeks: 8, roi: 'high' },
                        { skill: 'Docker', importance: 'critical', learning_time_weeks: 4, roi: 'high' },
                    ],
                    nice_to_have_missing: [
                        { skill: 'Kubernetes', importance: 'preferred', learning_time_weeks: 6, roi: 'medium' },
                    ],
                    transferable: ['JavaScript', 'React', 'Node.js'],
                    strengths: ['Problem Solving', 'Communication'],
                },
                learning_path: [
                    {
                        phase: 1, name: 'Core Foundations', duration_weeks: 8,
                        skills: ['System Design', 'Docker'],
                        resources: [
                            { skill: 'System Design', courses: [{ name: 'System Design Interview', platform: 'Educative', duration: '6 weeks' }] },
                            { skill: 'Docker', courses: [{ name: 'Docker Mastery', platform: 'Udemy', duration: '2 weeks' }] },
                        ],
                    },
                    { phase: 2, name: 'Advanced Skills', duration_weeks: 6, skills: ['Kubernetes', 'CI/CD'], resources: [] },
                    { phase: 3, name: 'Portfolio Projects', duration_weeks: 4, skills: ['Open Source', 'Projects'], resources: [] },
                ],
                estimated_time_months: 4,
                priority_skills: [
                    { skill: 'System Design', priority_rank: 1, roi_score: 95 },
                    { skill: 'Docker', priority_rank: 2, roi_score: 85 },
                ],
                recommendations: [
                    'Focus on System Design — it\'s the most critical gap for senior roles',
                    'Build 2-3 projects showcasing Docker and containerization',
                    'Your JavaScript/React skills are strong — leverage them',
                ],
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        Skill Gap Analysis
                    </h1>
                    <p className="mt-2 text-gray-600">Discover what skills you need and get a personalized learning roadmap</p>
                </div>

                {/* Role Selector */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Select Your Target Role</h2>
                    <div className="flex flex-wrap gap-3 mb-4">
                        {TARGET_ROLES.map(role => (
                            <button
                                key={role.value}
                                onClick={() => setTargetRole(role.value)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${targetRole === role.value
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {role.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={analyzeGaps}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing...</>
                        ) : (
                            <><Zap className="w-4 h-4" /> Analyze My Skill Gaps</>
                        )}
                    </button>
                </div>

                {result && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Score + Summary */}
                        <div className="space-y-6">
                            {/* Readiness Score */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center">
                                <h3 className="font-semibold text-gray-900 mb-4">Readiness Score</h3>
                                <ReadinessGauge score={result.readiness_score} />
                                <div className="mt-4 text-center">
                                    <p className="text-sm text-gray-600">
                                        <Clock className="inline w-3 h-3 mr-1" />
                                        ~{result.estimated_time_months} months to ready
                                    </p>
                                </div>
                            </div>

                            {/* Strengths */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" /> Your Strengths
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.gaps.transferable.map(skill => (
                                        <span key={skill} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">{skill}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Priority Skills */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-purple-500" /> Top Priority Skills
                                </h3>
                                <div className="space-y-3">
                                    {result.priority_skills.map((item, i) => (
                                        <div key={item.skill} className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                                                {i + 1}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium text-gray-800">{item.skill}</span>
                                                    <span className="text-xs text-gray-500">ROI: {item.roi_score}</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full">
                                                    <div className="h-1.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" style={{ width: `${item.roi_score}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Gaps + Learning Path */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Critical Gaps */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-500" /> Critical Skill Gaps
                                </h3>
                                <div className="space-y-3">
                                    {result.gaps.critical_missing.map(gap => (
                                        <div key={gap.skill} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                                            <div>
                                                <p className="font-medium text-gray-900">{gap.skill}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    <Clock className="inline w-3 h-3 mr-1" />{gap.learning_time_weeks} weeks · ROI: {gap.roi}
                                                </p>
                                            </div>
                                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-semibold">Critical</span>
                                        </div>
                                    ))}
                                    {result.gaps.nice_to_have_missing.map(gap => (
                                        <div key={gap.skill} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                                            <div>
                                                <p className="font-medium text-gray-900">{gap.skill}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    <Clock className="inline w-3 h-3 mr-1" />{gap.learning_time_weeks} weeks
                                                </p>
                                            </div>
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-semibold">Preferred</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Learning Path */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-blue-500" /> Your Learning Roadmap
                                </h3>
                                <div className="space-y-3">
                                    {result.learning_path.map((phase, i) => (
                                        <PhaseCard key={phase.phase} phase={phase} index={i} />
                                    ))}
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-100 p-6">
                                <h3 className="font-semibold text-gray-900 mb-3">💡 Recommendations</h3>
                                <ul className="space-y-2">
                                    {result.recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                            <span className="text-purple-500 mt-0.5">•</span> {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkillGapPage;
