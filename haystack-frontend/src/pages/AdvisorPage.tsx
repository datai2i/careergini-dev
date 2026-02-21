import React, { useState } from 'react';
import { Bell, Zap, BookOpen, Briefcase, User, Activity, X, RefreshCw } from 'lucide-react';

interface NudgeAction {
    label: string;
    action: string;
    data: Record<string, any>;
}

interface Nudge {
    type: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    message: string;
    actions: NudgeAction[];
    context?: Record<string, any>;
}

const nudgeIcons: Record<string, React.ReactNode> = {
    application_follow_up: <Briefcase className="w-5 h-5" />,
    resume_update: <User className="w-5 h-5" />,
    skill_development: <BookOpen className="w-5 h-5" />,
    interview_prep: <Zap className="w-5 h-5" />,
    profile_completion: <User className="w-5 h-5" />,
    networking: <Activity className="w-5 h-5" />,
};

const priorityStyles: Record<string, { border: string; bg: string; badge: string; icon: string }> = {
    high: { border: 'border-red-200', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700', icon: 'bg-red-500' },
    medium: { border: 'border-yellow-200', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700', icon: 'bg-yellow-500' },
    low: { border: 'border-blue-200', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700', icon: 'bg-blue-500' },
};

const DEMO_NUDGES: Nudge[] = [
    {
        type: 'application_follow_up',
        priority: 'high',
        title: 'Follow up on Google application',
        message: "It's been 10 days since you applied to Senior Engineer at Google. A follow-up email can increase your response rate by 30%.",
        actions: [
            { label: 'Draft Follow-up Email', action: 'navigate', data: { path: '/applications' } },
            { label: 'Mark as Followed Up', action: 'dismiss', data: {} },
        ],
    },
    {
        type: 'interview_prep',
        priority: 'high',
        title: 'Interview in 2 days at Amazon',
        message: 'Your interview for Software Engineer is coming up. Practice now to boost your confidence.',
        actions: [
            { label: 'Practice Interview', action: 'navigate', data: { path: '/interview-practice' } },
            { label: 'View Company Info', action: 'dismiss', data: {} },
        ],
    },
    {
        type: 'resume_update',
        priority: 'medium',
        title: 'Improve your resume ATS score',
        message: 'Your resume ATS score is 65/100. Improving it to 80+ could double your interview callbacks.',
        actions: [
            { label: 'Analyze Resume', action: 'navigate', data: { path: '/resume' } },
        ],
    },
    {
        type: 'skill_development',
        priority: 'medium',
        title: 'Start learning Docker',
        message: 'Docker is a critical skill for your target role. Estimated time: 4 weeks. High ROI.',
        actions: [
            { label: 'View Learning Path', action: 'navigate', data: { path: '/skill-gaps' } },
            { label: 'Find Courses', action: 'dismiss', data: {} },
        ],
    },
    {
        type: 'networking',
        priority: 'low',
        title: 'Stay active in your job search',
        message: "You haven't applied to any jobs in 5 days. Consistent activity leads to faster results.",
        actions: [
            { label: 'Browse Jobs', action: 'navigate', data: { path: '/jobs' } },
        ],
    },
];

const NudgeCard: React.FC<{ nudge: Nudge; onDismiss: () => void }> = ({ nudge, onDismiss }) => {
    const styles = priorityStyles[nudge.priority];
    const icon = nudgeIcons[nudge.type] || <Bell className="w-5 h-5" />;

    return (
        <div className={`rounded-2xl border ${styles.border} ${styles.bg} p-5 transition-all hover:shadow-md`}>
            <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${styles.icon} text-white flex items-center justify-center flex-shrink-0`}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{nudge.title}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${styles.badge}`}>
                                {nudge.priority}
                            </span>
                            <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">{nudge.message}</p>
                    <div className="flex flex-wrap gap-2">
                        {nudge.actions.map((action, i) => (
                            <a
                                key={i}
                                href={action.data.path || '#'}
                                onClick={action.action === 'dismiss' ? onDismiss : undefined}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${i === 0
                                    ? 'bg-white border border-gray-300 text-gray-700 hover:border-purple-400 hover:text-purple-700'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {action.label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TIPS = [
    { title: 'Apply consistently', body: 'Aim for 10-15 applications per week for best results.', icon: '🎯' },
    { title: 'Quality over quantity', body: 'Focus on jobs with 80%+ match score to increase callbacks.', icon: '⭐' },
    { title: 'Follow up', body: 'Send a follow-up email 7-10 days after applying. It works!', icon: '📧' },
    { title: 'Prepare early', body: 'Start interview prep at least 3 days before the interview.', icon: '🧠' },
];

export const AdvisorPage: React.FC = () => {
    const [nudges, setNudges] = useState<Nudge[]>(DEMO_NUDGES);
    const [loading, setLoading] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(new Date());

    const fetchNudges = async () => {
        setLoading(true);
        try {
            const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{"resume_ats_score":65,"profile_completeness":75}');
            const res = await fetch('/api/ai/advisor/nudges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_profile: userProfile,
                    user_activity: { last_activity_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
                    applications: [],
                }),
            });
            const data = await res.json();
            if (data.nudges?.length) setNudges(data.nudges);
            setLastRefreshed(new Date());
        } catch {
            setLastRefreshed(new Date());
        } finally {
            setLoading(false);
        }
    };

    const dismissNudge = (index: number) => {
        setNudges(prev => prev.filter((_, i) => i !== index));
    };

    const highPriority = nudges.filter(n => n.priority === 'high');
    const mediumPriority = nudges.filter(n => n.priority === 'medium');
    const lowPriority = nudges.filter(n => n.priority === 'low');

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            Career Advisor
                        </h1>
                        <p className="mt-2 text-gray-600">Proactive recommendations to accelerate your job search</p>
                    </div>
                    <button
                        onClick={fetchNudges}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Urgent', count: highPriority.length, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
                        { label: 'Important', count: mediumPriority.length, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
                        { label: 'Tips', count: lowPriority.length, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
                    ].map(stat => (
                        <div key={stat.label} className={`rounded-xl border ${stat.bg} p-4 text-center`}>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {nudges.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🎉</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">You're all caught up!</h3>
                        <p className="text-gray-500 text-sm">No pending recommendations. Keep up the great work!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* High Priority */}
                        {highPriority.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Urgent Action Required
                                </h2>
                                <div className="space-y-3">
                                    {highPriority.map((nudge, i) => (
                                        <NudgeCard key={i} nudge={nudge} onDismiss={() => dismissNudge(nudges.indexOf(nudge))} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Medium Priority */}
                        {mediumPriority.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-yellow-600 uppercase tracking-wide mb-3">Important</h2>
                                <div className="space-y-3">
                                    {mediumPriority.map((nudge, i) => (
                                        <NudgeCard key={i} nudge={nudge} onDismiss={() => dismissNudge(nudges.indexOf(nudge))} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Low Priority */}
                        {lowPriority.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">Tips & Suggestions</h2>
                                <div className="space-y-3">
                                    {lowPriority.map((nudge, i) => (
                                        <NudgeCard key={i} nudge={nudge} onDismiss={() => dismissNudge(nudges.indexOf(nudge))} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Career Tips */}
                <div className="mt-10">
                    <h2 className="font-semibold text-gray-900 mb-4">💡 Career Tips</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {TIPS.map(tip => (
                            <div key={tip.title} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
                                <span className="text-2xl flex-shrink-0">{tip.icon}</span>
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">{tip.title}</p>
                                    <p className="text-xs text-gray-600 mt-0.5">{tip.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-8">
                    Last refreshed: {lastRefreshed.toLocaleTimeString()}
                </p>
            </div>
        </div>
    );
};

export default AdvisorPage;
