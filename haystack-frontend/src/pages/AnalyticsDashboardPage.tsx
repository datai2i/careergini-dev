import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Award, Users, Clock, ChevronUp, ChevronDown, Minus, Briefcase } from 'lucide-react';

interface FunnelStage { stage: string; count: number; percentage: number; conversion_rate: number }
interface WeeklyData { week: string; applications: number; responses: number; interviews: number; offers: number }
interface Insight { type: string; title: string; description: string; priority: string; action?: string }
interface GoalItem { goal: number; actual: number; progress: number; status: string }

interface DashboardData {
    overview: {
        total_applications: number;
        response_rate: number;
        interview_rate: number;
        offer_rate: number;
        avg_match_score: number;
        avg_ats_score: number;
        active_applications: number;
    };
    funnel: { stages: FunnelStage[]; overall_conversion: number };
    timeline: { weekly: WeeklyData[] };
    performance: {
        avg_response_time_days: number;
        application_quality: { avg_match_score: number; avg_ats_score: number; high_quality_apps: number; total_apps: number };
    };
    insights: Insight[];
    recommendations: string[];
    benchmarks: {
        response_rate: { your_rate: number; industry_avg: number; top_performers: number; status: string };
        applications_per_week: { your_rate: number; recommended: number };
    };
    goals: { weekly_applications: GoalItem; response_rate: GoalItem };
}

const DEMO_DATA: DashboardData = {
    overview: { total_applications: 42, response_rate: 28.6, interview_rate: 14.3, offer_rate: 33.3, avg_match_score: 76.4, avg_ats_score: 81.2, active_applications: 8 },
    funnel: {
        stages: [
            { stage: 'Applied', count: 42, percentage: 100, conversion_rate: 100 },
            { stage: 'Phone Screen', count: 12, percentage: 28.6, conversion_rate: 28.6 },
            { stage: 'Interview', count: 6, percentage: 14.3, conversion_rate: 50 },
            { stage: 'Offer', count: 2, percentage: 4.8, conversion_rate: 33.3 },
            { stage: 'Accepted', count: 1, percentage: 2.4, conversion_rate: 50 },
        ],
        overall_conversion: 2.4,
    },
    timeline: {
        weekly: [
            { week: '2026-01-05', applications: 5, responses: 1, interviews: 0, offers: 0 },
            { week: '2026-01-12', applications: 8, responses: 2, interviews: 1, offers: 0 },
            { week: '2026-01-19', applications: 10, responses: 3, interviews: 2, offers: 1 },
            { week: '2026-01-26', applications: 7, responses: 2, interviews: 1, offers: 0 },
            { week: '2026-02-02', applications: 6, responses: 2, interviews: 1, offers: 1 },
            { week: '2026-02-09', applications: 6, responses: 2, interviews: 1, offers: 0 },
        ],
    },
    performance: {
        avg_response_time_days: 8.5,
        application_quality: { avg_match_score: 76.4, avg_ats_score: 81.2, high_quality_apps: 26, total_apps: 42 },
    },
    insights: [
        { type: 'improvement', title: 'Increase application volume', description: 'You\'re averaging 7 apps/week. Aim for 10+ to maximize opportunities.', priority: 'medium', action: 'Browse more jobs' },
        { type: 'success', title: 'Above-average response rate', description: 'Your 28.6% response rate beats the industry average of 25%. Keep it up!', priority: 'low' },
        { type: 'strategy', title: 'Focus on high-match jobs', description: '62% of your applications have 80%+ match score — great targeting!', priority: 'low' },
    ],
    recommendations: [
        'Apply to 3 more jobs this week to hit your weekly goal',
        'Follow up on 4 applications that are 7+ days old',
        'Improve resume ATS score from 81 to 85+ for better screening',
    ],
    benchmarks: {
        response_rate: { your_rate: 28.6, industry_avg: 25, top_performers: 40, status: 'above_avg' },
        applications_per_week: { your_rate: 7, recommended: 10 },
    },
    goals: {
        weekly_applications: { goal: 10, actual: 7, progress: 70, status: 'behind' },
        response_rate: { goal: 30, actual: 28.6, progress: 95.3, status: 'on_track' },
    },
};

const StatCard: React.FC<{ title: string; value: string | number; subtitle?: string; trend?: number; icon: React.ReactNode; color: string }> = ({ title, value, subtitle, trend, icon, color }) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>{icon}</div>
            {trend !== undefined && (
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {trend > 0 ? <ChevronUp className="w-3 h-3" /> : trend < 0 ? <ChevronDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {Math.abs(trend)}%
                </span>
            )}
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600 mt-0.5">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
);

const FunnelChart: React.FC<{ stages: FunnelStage[] }> = ({ stages }) => {
    const colors = ['bg-purple-600', 'bg-purple-500', 'bg-blue-500', 'bg-blue-400', 'bg-green-500'];
    return (
        <div className="space-y-2">
            {stages.map((stage, i) => (
                <div key={stage.stage}>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 font-medium">{stage.stage}</span>
                        <span className="text-gray-500">{stage.count} ({stage.percentage}%)</span>
                    </div>
                    <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                            className={`h-full ${colors[i]} rounded-lg flex items-center justify-end pr-2 transition-all duration-700`}
                            style={{ width: `${stage.percentage}%` }}
                        >
                            {stage.percentage > 15 && <span className="text-white text-xs font-semibold">{stage.conversion_rate}%</span>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const MiniBarChart: React.FC<{ data: WeeklyData[] }> = ({ data }) => {
    const maxVal = Math.max(...data.map(d => d.applications));
    return (
        <div className="flex items-end gap-1 h-24">
            {data.map((week, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex flex-col gap-0.5 justify-end" style={{ height: '80px' }}>
                        <div className="w-full bg-purple-500 rounded-sm" style={{ height: `${(week.applications / maxVal) * 70}px` }} title={`${week.applications} apps`} />
                    </div>
                    <span className="text-xs text-gray-400 rotate-45 origin-left" style={{ fontSize: '9px' }}>
                        {week.week.slice(5)}
                    </span>
                </div>
            ))}
        </div>
    );
};

const GoalBar: React.FC<{ label: string; goal: GoalItem; unit?: string }> = ({ label, goal, unit = '' }) => (
    <div>
        <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700 font-medium">{label}</span>
            <span className={`font-semibold ${goal.status === 'on_track' ? 'text-green-600' : 'text-orange-600'}`}>
                {goal.actual}{unit} / {goal.goal}{unit}
            </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-700 ${goal.status === 'on_track' ? 'bg-green-500' : 'bg-orange-400'}`}
                style={{ width: `${Math.min(goal.progress, 100)}%` }}
            />
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{goal.progress.toFixed(0)}% of goal · {goal.status === 'on_track' ? '✓ On track' : '⚠ Behind'}</p>
    </div>
);

export const AnalyticsDashboardPage: React.FC = () => {
    const [data, setData] = useState<DashboardData>(DEMO_DATA);
    const [timeframe, setTimeframe] = useState(90);

    const fetchDashboard = async () => {
        try {
            const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
            const res = await fetch('/api/ai/analytics/dashboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: 'current', applications: [], user_profile: userProfile, timeframe_days: timeframe }),
            });
            const result = await res.json();
            if (result.overview) setData(result);
        } catch {
            // Use demo data
        }
    };

    useEffect(() => { fetchDashboard(); }, [timeframe]);

    const insightColors: Record<string, string> = {
        improvement: 'bg-orange-50 border-orange-200 text-orange-800',
        success: 'bg-green-50 border-green-200 text-green-800',
        strategy: 'bg-blue-50 border-blue-200 text-blue-800',
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            Analytics Dashboard
                        </h1>
                        <p className="mt-2 text-gray-600">Track your job search performance</p>
                    </div>
                    <div className="flex gap-2">
                        {[30, 60, 90].map(t => (
                            <button
                                key={t}
                                onClick={() => setTimeframe(t)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${timeframe === t ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {t}d
                            </button>
                        ))}
                    </div>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard title="Total Applications" value={data.overview.total_applications} subtitle={`${data.overview.active_applications} active`} trend={12} icon={<Briefcase className="w-5 h-5 text-purple-600" />} color="bg-purple-100" />
                    <StatCard title="Response Rate" value={`${data.overview.response_rate}%`} subtitle="Industry avg: 25%" trend={3} icon={<TrendingUp className="w-5 h-5 text-green-600" />} color="bg-green-100" />
                    <StatCard title="Interview Rate" value={`${data.overview.interview_rate}%`} subtitle="of applications" icon={<Users className="w-5 h-5 text-blue-600" />} color="bg-blue-100" />
                    <StatCard title="Avg Match Score" value={`${data.overview.avg_match_score}%`} subtitle={`ATS: ${data.overview.avg_ats_score}`} icon={<Target className="w-5 h-5 text-orange-600" />} color="bg-orange-100" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Application Funnel */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-purple-500" /> Application Funnel
                                </h2>
                                <span className="text-xs text-gray-500">Overall conversion: {data.funnel.overall_conversion}%</span>
                            </div>
                            <FunnelChart stages={data.funnel.stages} />
                        </div>

                        {/* Weekly Timeline */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-500" /> Weekly Activity
                            </h2>
                            <MiniBarChart data={data.timeline.weekly} />
                            <div className="flex gap-4 mt-3">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <div className="w-3 h-3 rounded-sm bg-purple-500" /> Applications
                                </div>
                            </div>
                        </div>

                        {/* Insights */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Award className="w-4 h-4 text-yellow-500" /> Insights
                            </h2>
                            <div className="space-y-3">
                                {data.insights.map((insight, i) => (
                                    <div key={i} className={`p-4 rounded-xl border ${insightColors[insight.type] || 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                                        <p className="font-medium text-sm">{insight.title}</p>
                                        <p className="text-xs mt-1 opacity-80">{insight.description}</p>
                                        {insight.action && (
                                            <button className="text-xs font-semibold mt-2 underline opacity-70 hover:opacity-100">{insight.action} →</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-6">
                        {/* Goals */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Target className="w-4 h-4 text-purple-500" /> Goal Tracking
                            </h2>
                            <div className="space-y-5">
                                <GoalBar label="Applications / Week" goal={data.goals.weekly_applications} />
                                <GoalBar label="Response Rate" goal={data.goals.response_rate} unit="%" />
                            </div>
                        </div>

                        {/* Benchmarks */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-500" /> Benchmarks
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-700">Response Rate</span>
                                        <span className={`font-semibold ${data.benchmarks.response_rate.status === 'above_avg' ? 'text-green-600' : 'text-orange-600'}`}>
                                            {data.benchmarks.response_rate.status === 'above_avg' ? '↑ Above avg' : '↓ Below avg'}
                                        </span>
                                    </div>
                                    <div className="relative h-6 bg-gray-100 rounded-lg">
                                        <div className="absolute h-full bg-purple-200 rounded-lg" style={{ width: `${(data.benchmarks.response_rate.industry_avg / data.benchmarks.response_rate.top_performers) * 100}%` }} />
                                        <div className="absolute h-full bg-purple-600 rounded-lg opacity-80" style={{ width: `${(data.benchmarks.response_rate.your_rate / data.benchmarks.response_rate.top_performers) * 100}%` }} />
                                        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                                            You: {data.benchmarks.response_rate.your_rate}% | Avg: {data.benchmarks.response_rate.industry_avg}%
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-700">Apps / Week</span>
                                        <span className="text-gray-500">{data.benchmarks.applications_per_week.your_rate} / {data.benchmarks.applications_per_week.recommended} goal</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full">
                                        <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${Math.min((data.benchmarks.applications_per_week.your_rate / data.benchmarks.applications_per_week.recommended) * 100, 100)}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Performance */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-500" /> Performance
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">Avg Response Time</span>
                                    <span className="font-semibold text-gray-900">{data.performance.avg_response_time_days} days</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">High-Quality Apps</span>
                                    <span className="font-semibold text-gray-900">{data.performance.application_quality.high_quality_apps} / {data.performance.application_quality.total_apps}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-600">Quality Rate</span>
                                    <span className="font-semibold text-green-600">
                                        {Math.round((data.performance.application_quality.high_quality_apps / data.performance.application_quality.total_apps) * 100)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
                            <h2 className="font-semibold mb-3">🎯 This Week's Actions</h2>
                            <ul className="space-y-2">
                                {data.recommendations.map((rec, i) => (
                                    <li key={i} className="text-sm text-purple-100 flex items-start gap-2">
                                        <span className="text-purple-300 mt-0.5">•</span> {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboardPage;
