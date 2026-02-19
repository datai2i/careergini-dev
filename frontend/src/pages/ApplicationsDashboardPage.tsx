/**
 * Applications Dashboard Page
 * Demonstrates Application Tracker integration
 */

import React, { useState } from 'react';
import { useApplications, useAnalyticsSummary } from '../hooks/useEnhancements';
import ApplicationTracker from '../components/ApplicationTracker';
import { BarChart3, TrendingUp, Target, Award } from 'lucide-react';

export const ApplicationsDashboardPage: React.FC = () => {
    const userId = 'current'; // Replace with actual user ID from auth context

    const { data: applications, isLoading: appsLoading } = useApplications(userId);
    const { data: analytics, isLoading: analyticsLoading } = useAnalyticsSummary(userId);

    if (appsLoading || analyticsLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Applications Dashboard</h1>
                    <p className="mt-2 text-gray-600">
                        Track and manage your job applications
                    </p>
                </div>

                {/* Analytics Cards */}
                {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">This Week</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {analytics.applications_this_week}
                                    </p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Avg Match Score</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {analytics.avg_match_score}%
                                    </p>
                                </div>
                                <Target className="w-8 h-8 text-green-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Avg ATS Score</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {analytics.avg_ats_score}
                                    </p>
                                </div>
                                <Award className="w-8 h-8 text-purple-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Applications</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {analytics.by_status?.reduce((sum: number, s: any) => sum + parseInt(s.count), 0) || 0}
                                    </p>
                                </div>
                                <BarChart3 className="w-8 h-8 text-orange-600" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Application Tracker */}
                <ApplicationTracker />
            </div>
        </div>
    );
};

export default ApplicationsDashboardPage;
