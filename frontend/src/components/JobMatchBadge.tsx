import React from 'react';
import { Target, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface JobMatchBadgeProps {
    score: number;
    matchLevel?: 'excellent' | 'good' | 'fair' | 'poor';
    breakdown?: {
        skills: { score: number; required_matched: string[]; required_missing: string[] };
        experience: { score: number; status: string };
        education: { score: number; status: string };
        location: { score: number; status: string };
        salary: { score: number; status: string };
    };
    explanation?: {
        strengths: string[];
        weaknesses: string[];
    };
    recommendation?: string;
    compact?: boolean;
}

export const JobMatchBadge: React.FC<JobMatchBadgeProps> = ({
    score,
    matchLevel,
    breakdown,
    explanation,
    recommendation,
    compact = false
}) => {
    const getMatchColor = (score: number) => {
        if (score >= 80) return 'bg-green-100 text-green-800 border-green-300';
        if (score >= 65) return 'bg-blue-100 text-blue-800 border-blue-300';
        if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        return 'bg-red-100 text-red-800 border-red-300';
    };

    const getMatchIcon = (score: number) => {
        if (score >= 80) return <CheckCircle2 className="w-4 h-4" />;
        if (score >= 65) return <TrendingUp className="w-4 h-4" />;
        if (score >= 50) return <Target className="w-4 h-4" />;
        return <AlertTriangle className="w-4 h-4" />;
    };

    const getMatchLabel = (score: number) => {
        if (score >= 90) return 'Excellent Match';
        if (score >= 75) return 'Good Match';
        if (score >= 60) return 'Fair Match';
        return 'Low Match';
    };

    if (compact) {
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getMatchColor(score)}`}>
                {getMatchIcon(score)}
                <span className="font-semibold text-sm">{score}% Match</span>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Job Match Analysis</h3>
                <div className={`px-4 py-2 rounded-full border-2 ${getMatchColor(score)}`}>
                    <div className="flex items-center gap-2">
                        {getMatchIcon(score)}
                        <span className="font-bold text-xl">{score}%</span>
                    </div>
                </div>
            </div>

            {/* Match Level */}
            <div className="text-center py-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Match Level</p>
                <p className="text-lg font-semibold text-gray-900">{getMatchLabel(score)}</p>
            </div>

            {/* Breakdown */}
            {breakdown && (
                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 text-sm">Compatibility Breakdown</h4>

                    <div className="grid grid-cols-2 gap-3">
                        <MatchMetric
                            label="Skills"
                            score={breakdown.skills.score}
                            detail={`${breakdown.skills.required_matched.length} matched`}
                        />
                        <MatchMetric
                            label="Experience"
                            score={breakdown.experience.score}
                            detail={breakdown.experience.status}
                        />
                        <MatchMetric
                            label="Education"
                            score={breakdown.education.score}
                            detail={breakdown.education.status}
                        />
                        <MatchMetric
                            label="Location"
                            score={breakdown.location.score}
                            detail={breakdown.location.status}
                        />
                    </div>
                </div>
            )}

            {/* Strengths & Weaknesses */}
            {explanation && (
                <div className="space-y-3">
                    {explanation.strengths.length > 0 && (
                        <div>
                            <h5 className="text-sm font-semibold text-green-700 mb-2">✓ Strengths</h5>
                            <ul className="space-y-1">
                                {explanation.strengths.map((strength, index) => (
                                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                        <span className="text-green-600 mt-0.5">•</span>
                                        <span>{strength}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {explanation.weaknesses.length > 0 && (
                        <div>
                            <h5 className="text-sm font-semibold text-red-700 mb-2">⚠ Areas to Improve</h5>
                            <ul className="space-y-1">
                                {explanation.weaknesses.map((weakness, index) => (
                                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                        <span className="text-red-600 mt-0.5">•</span>
                                        <span>{weakness}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Recommendation */}
            {recommendation && (
                <div className={`p-4 rounded-lg border-2 ${score >= 80 ? 'bg-green-50 border-green-200' :
                        score >= 65 ? 'bg-blue-50 border-blue-200' :
                            score >= 50 ? 'bg-yellow-50 border-yellow-200' :
                                'bg-red-50 border-red-200'
                    }`}>
                    <p className="text-sm font-semibold text-gray-900">{recommendation}</p>
                </div>
            )}
        </div>
    );
};

// Match Metric Component
const MatchMetric: React.FC<{ label: string; score: number; detail: string }> = ({
    label,
    score,
    detail
}) => {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-start mb-1">
                <span className="text-xs text-gray-600">{label}</span>
                <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}%</span>
            </div>
            <p className="text-xs text-gray-500 capitalize">{detail}</p>
        </div>
    );
};

export default JobMatchBadge;
