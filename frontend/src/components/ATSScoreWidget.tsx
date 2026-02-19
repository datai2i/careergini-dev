import React from 'react';
import { CheckCircle, AlertCircle, XCircle, TrendingUp } from 'lucide-react';

interface ATSScoreProps {
    score: number;
    breakdown?: {
        keyword_match: number;
        formatting_score: number;
        section_completeness: number;
        content_quality: number;
    };
    issues?: Array<{
        type: string;
        severity: 'high' | 'medium' | 'low';
        suggestion: string;
    }>;
    improvements?: string[];
}

export const ATSScoreWidget: React.FC<ATSScoreProps> = ({
    score,
    breakdown,
    issues = [],
    improvements = []
}) => {
    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 75) return 'text-blue-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBg = (score: number) => {
        if (score >= 90) return 'bg-green-50 border-green-200';
        if (score >= 75) return 'bg-blue-50 border-blue-200';
        if (score >= 60) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    const getScoreIcon = (score: number) => {
        if (score >= 75) return <CheckCircle className="w-6 h-6 text-green-600" />;
        if (score >= 60) return <AlertCircle className="w-6 h-6 text-yellow-600" />;
        return <XCircle className="w-6 h-6 text-red-600" />;
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'text-red-600 bg-red-50';
            case 'medium': return 'text-yellow-600 bg-yellow-50';
            case 'low': return 'text-gray-600 bg-gray-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* Overall Score */}
            <div className={`rounded-lg border-2 p-6 ${getScoreBg(score)}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {getScoreIcon(score)}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">ATS Compatibility Score</h3>
                            <p className="text-sm text-gray-600">
                                {score >= 90 && 'Excellent - Ready to submit!'}
                                {score >= 75 && score < 90 && 'Good - Minor improvements recommended'}
                                {score >= 60 && score < 75 && 'Fair - Needs improvement'}
                                {score < 60 && 'Poor - Significant changes needed'}
                            </p>
                        </div>
                    </div>
                    <div className={`text-5xl font-bold ${getScoreColor(score)}`}>
                        {score}
                    </div>
                </div>
            </div>

            {/* Score Breakdown */}
            {breakdown && (
                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Score Breakdown</h4>

                    <div className="space-y-2">
                        <ScoreBar
                            label="Keyword Match"
                            score={breakdown.keyword_match}
                            weight="30%"
                        />
                        <ScoreBar
                            label="Formatting"
                            score={breakdown.formatting_score}
                            weight="25%"
                        />
                        <ScoreBar
                            label="Section Completeness"
                            score={breakdown.section_completeness}
                            weight="25%"
                        />
                        <ScoreBar
                            label="Content Quality"
                            score={breakdown.content_quality}
                            weight="20%"
                        />
                    </div>
                </div>
            )}

            {/* Issues */}
            {issues.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Issues Found ({issues.length})
                    </h4>

                    <div className="space-y-2">
                        {issues.slice(0, 5).map((issue, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <span className="text-xs font-semibold uppercase">
                                            {issue.severity} Priority
                                        </span>
                                        <p className="text-sm mt-1">{issue.suggestion}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Improvements */}
            {improvements.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Recommended Improvements
                    </h4>

                    <ul className="space-y-2">
                        {improvements.map((improvement, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-blue-600 mt-1">•</span>
                                <span>{improvement}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Action Button */}
            <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all">
                Optimize Resume
            </button>
        </div>
    );
};

// Score Bar Component
const ScoreBar: React.FC<{ label: string; score: number; weight: string }> = ({
    label,
    score,
    weight
}) => {
    const getBarColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{label}</span>
                <span className="text-gray-900 font-semibold">
                    {score}/100 <span className="text-gray-500 text-xs">({weight})</span>
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all ${getBarColor(score)}`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
};

export default ATSScoreWidget;
