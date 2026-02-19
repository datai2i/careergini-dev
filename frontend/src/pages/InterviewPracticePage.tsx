import React, { useState, useRef } from 'react';
import { Send, ChevronRight, Star, Award, MessageSquare, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'setup' | 'interview' | 'results';

interface EvalResult {
    overall_score: number;
    relevance_score: number;
    clarity_score: number;
    completeness_score: number;
    confidence_score: number;
    strengths: string[];
    improvements: string[];
    filler_words_count: number;
    suggested_improvement: string;
}

interface SessionResult {
    overall_score: number;
    questions_answered: number;
    metrics: { avg_clarity: number; avg_relevance: number; avg_confidence: number };
    performance_level: string;
    strengths: string[];
    areas_to_improve: string[];
    recommendations: string[];
}

const COMPANIES = ['Google', 'Amazon', 'Meta', 'Apple', 'Microsoft', 'Netflix', 'Stripe', 'Airbnb', 'Uber', 'Other'];
const ROLES = ['Software Engineer', 'Senior Software Engineer', 'Data Scientist', 'Product Manager', 'DevOps Engineer', 'ML Engineer'];

const ScoreBar: React.FC<{ label: string; score: number; color?: string }> = ({ label, score, color = 'from-purple-500 to-blue-500' }) => (
    <div>
        <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600">{label}</span>
            <span className="font-semibold text-gray-800">{score}/100</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full">
            <div className={`h-2 bg-gradient-to-r ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
        </div>
    </div>
);

export const InterviewPracticePage: React.FC = () => {
    const [phase, setPhase] = useState<Phase>('setup');
    const [role, setRole] = useState('Software Engineer');
    const [company, setCompany] = useState('Google');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [session, setSession] = useState<any>(null);
    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [tips, setTips] = useState<string[]>([]);
    const [answer, setAnswer] = useState('');
    const [evaluation, setEvaluation] = useState<EvalResult | null>(null);
    const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<any[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const startInterview = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ai/interview/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job_role: role, company, difficulty }),
            });
            const data = await res.json();
            setSession(data.session);
            setCurrentQuestion(data.question);
            setTips(data.tips || []);
            setPhase('interview');
            setQuestionIndex(1);
        } catch {
            // Demo fallback
            setSession({ session_id: 'demo', job_role: role, company, current_question_index: 0 });
            setCurrentQuestion({ question: 'Tell me about a time you faced a significant technical challenge and how you overcame it.', type: 'behavioral', index: 1 });
            setTips(['Use the STAR method: Situation, Task, Action, Result', 'Be specific with examples from your experience', 'Quantify your impact where possible']);
            setPhase('interview');
            setQuestionIndex(1);
        } finally {
            setLoading(false);
        }
    };

    const submitAnswer = async () => {
        if (!answer.trim()) return;
        setLoading(true);
        try {
            const res = await fetch('/api/ai/interview/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session, question: currentQuestion.question, answer, question_type: currentQuestion.type }),
            });
            const data = await res.json();
            setEvaluation(data);
            setAnswers(prev => [...prev, { question: currentQuestion, answer, evaluation: data }]);
        } catch {
            setEvaluation({
                overall_score: 78,
                relevance_score: 85,
                clarity_score: 75,
                completeness_score: 80,
                confidence_score: 72,
                strengths: ['Good use of specific example', 'Clear problem description', 'Mentioned team collaboration'],
                improvements: ['Add quantifiable results', 'Reduce filler words', 'Elaborate on your specific actions'],
                filler_words_count: 3,
                suggested_improvement: 'Great structure! Try adding specific metrics to quantify your impact (e.g., "reduced load time by 40%").',
            });
            setAnswers(prev => [...prev, { question: currentQuestion, answer, evaluation: null }]);
        } finally {
            setLoading(false);
        }
    };

    const nextQuestion = async () => {
        setEvaluation(null);
        setAnswer('');

        if (questionIndex >= 5) {
            // End session
            const avgScore = answers.reduce((sum, a) => sum + (a.evaluation?.overall_score || 75), 0) / answers.length;
            setSessionResult({
                overall_score: Math.round(avgScore),
                questions_answered: answers.length,
                metrics: { avg_clarity: 78, avg_relevance: 82, avg_confidence: 74 },
                performance_level: avgScore >= 80 ? 'Excellent' : avgScore >= 65 ? 'Good' : 'Needs Practice',
                strengths: ['Clear communication', 'Good use of examples'],
                areas_to_improve: ['Quantify achievements more', 'Reduce filler words'],
                recommendations: ['Practice more behavioral questions using STAR method', 'Record yourself to improve confidence'],
            });
            setPhase('results');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/ai/interview/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job_role: role, company, difficulty }),
            });
            const data = await res.json();
            setCurrentQuestion(data.question);
            setTips(data.tips || []);
            setQuestionIndex(prev => prev + 1);
        } catch {
            const questions = [
                'Describe a situation where you had to work with a difficult team member.',
                'How do you prioritize tasks when everything seems urgent?',
                'Tell me about a project you\'re most proud of.',
                'How do you stay updated with the latest technology trends?',
            ];
            setCurrentQuestion({ question: questions[questionIndex % questions.length], type: 'behavioral', index: questionIndex + 1 });
            setQuestionIndex(prev => prev + 1);
        } finally {
            setLoading(false);
        }
    };

    const difficultyColors: Record<Difficulty, string> = {
        easy: 'bg-green-100 text-green-700 border-green-200',
        medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        hard: 'bg-red-100 text-red-700 border-red-200',
    };

    if (phase === 'setup') {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-2xl mx-auto px-4 py-12">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">AI Interview Practice</h1>
                        <p className="mt-2 text-gray-600">Practice with an AI interviewer and get instant feedback</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Target Role</label>
                            <select
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                            >
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                            <div className="flex flex-wrap gap-2">
                                {COMPANIES.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setCompany(c)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${company === c ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                                            }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                            <div className="flex gap-3">
                                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficulty(d)}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border capitalize transition-all ${difficulty === d ? difficultyColors[d] + ' border-current' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                            }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-purple-50 rounded-xl p-4">
                            <p className="text-sm font-semibold text-purple-800 mb-2">What to expect:</p>
                            <ul className="space-y-1 text-sm text-purple-700">
                                <li>• 5 questions tailored to your role and company</li>
                                <li>• Instant AI feedback on each answer</li>
                                <li>• STAR method guidance for behavioral questions</li>
                                <li>• Final performance report with recommendations</li>
                            </ul>
                        </div>

                        <button
                            onClick={startInterview}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><ChevronRight className="w-5 h-5" /> Start Interview</>}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'results' && sessionResult) {
        const scoreColor = sessionResult.overall_score >= 80 ? 'text-green-600' : sessionResult.overall_score >= 65 ? 'text-yellow-600' : 'text-red-600';
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-2xl mx-auto px-4 py-12">
                    <div className="text-center mb-8">
                        <Award className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Interview Complete!</h1>
                        <p className="text-gray-600 mt-1">{role} at {company}</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
                        <div className="text-center mb-6">
                            <div className={`text-6xl font-bold ${scoreColor}`}>{sessionResult.overall_score}</div>
                            <div className="text-gray-500 text-sm mt-1">Overall Score</div>
                            <div className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold ${sessionResult.overall_score >= 80 ? 'bg-green-100 text-green-700' : sessionResult.overall_score >= 65 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>{sessionResult.performance_level}</div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <ScoreBar label="Clarity" score={sessionResult.metrics.avg_clarity} />
                            <ScoreBar label="Relevance" score={sessionResult.metrics.avg_relevance} />
                            <ScoreBar label="Confidence" score={sessionResult.metrics.avg_confidence} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-green-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Strengths</p>
                                <ul className="space-y-1">{sessionResult.strengths.map((s, i) => <li key={i} className="text-xs text-gray-700">• {s}</li>)}</ul>
                            </div>
                            <div className="bg-orange-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Improve</p>
                                <ul className="space-y-1">{sessionResult.areas_to_improve.map((a, i) => <li key={i} className="text-xs text-gray-700">• {a}</li>)}</ul>
                            </div>
                        </div>

                        <div className="bg-purple-50 rounded-xl p-4">
                            <p className="text-sm font-semibold text-purple-800 mb-2">Recommendations</p>
                            {sessionResult.recommendations.map((r, i) => <p key={i} className="text-sm text-purple-700">• {r}</p>)}
                        </div>
                    </div>

                    <button
                        onClick={() => { setPhase('setup'); setAnswers([]); setQuestionIndex(0); setSessionResult(null); }}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-purple-600 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" /> Practice Again
                    </button>
                </div>
            </div>
        );
    }

    // Interview phase
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Progress */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-sm text-gray-500">{role} · {company}</p>
                        <p className="font-semibold text-gray-900">Question {questionIndex} of 5</p>
                    </div>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`w-8 h-2 rounded-full ${i <= questionIndex ? 'bg-purple-600' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                </div>

                {/* Question */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">{currentQuestion?.type} Question</p>
                            <p className="text-gray-900 font-medium leading-relaxed">{currentQuestion?.question}</p>
                        </div>
                    </div>
                </div>

                {/* STAR Tips */}
                {tips.length > 0 && !evaluation && (
                    <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 mb-4">
                        <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1"><Star className="w-3 h-3" /> Tips</p>
                        {tips.map((tip, i) => <p key={i} className="text-xs text-blue-700">• {tip}</p>)}
                    </div>
                )}

                {/* Answer Input */}
                {!evaluation && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-4">
                        <textarea
                            ref={textareaRef}
                            value={answer}
                            onChange={e => setAnswer(e.target.value)}
                            placeholder="Type your answer here... Use the STAR method: describe the Situation, Task, Action, and Result."
                            className="w-full h-40 resize-none text-gray-800 placeholder-gray-400 focus:outline-none text-sm leading-relaxed"
                        />
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">{answer.split(' ').filter(Boolean).length} words</span>
                            <button
                                onClick={submitAnswer}
                                disabled={loading || !answer.trim()}
                                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Submit</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* Evaluation */}
                {evaluation && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">AI Feedback</h3>
                            <div className={`text-2xl font-bold ${evaluation.overall_score >= 80 ? 'text-green-600' : evaluation.overall_score >= 65 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {evaluation.overall_score}/100
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <ScoreBar label="Relevance" score={evaluation.relevance_score} />
                            <ScoreBar label="Clarity" score={evaluation.clarity_score} />
                            <ScoreBar label="Completeness" score={evaluation.completeness_score} />
                            <ScoreBar label="Confidence" score={evaluation.confidence_score} />
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-green-50 rounded-xl p-3">
                                <p className="text-xs font-semibold text-green-700 mb-1">✓ Strengths</p>
                                {evaluation.strengths.map((s, i) => <p key={i} className="text-xs text-gray-700">• {s}</p>)}
                            </div>
                            <div className="bg-orange-50 rounded-xl p-3">
                                <p className="text-xs font-semibold text-orange-700 mb-1">↑ Improve</p>
                                {evaluation.improvements.map((imp, i) => <p key={i} className="text-xs text-gray-700">• {imp}</p>)}
                            </div>
                        </div>

                        <div className="bg-purple-50 rounded-xl p-3 mb-4">
                            <p className="text-xs text-purple-800">{evaluation.suggested_improvement}</p>
                        </div>

                        <button
                            onClick={nextQuestion}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                        >
                            {questionIndex >= 5 ? 'View Results' : 'Next Question'} <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InterviewPracticePage;
