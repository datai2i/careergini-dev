/**
 * React Hooks for Enhancement Features
 * Custom hooks for using enhancement APIs with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/enhancementsClient';

// ATS Resume Scoring Hook
export const useATSScore = (resumeText: string, jobDescription?: string) => {
    return useQuery({
        queryKey: ['ats-score', resumeText, jobDescription],
        queryFn: () => apiClient.scoreResume(resumeText, jobDescription),
        enabled: !!resumeText && resumeText.length > 50,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

// Job Match Scoring Hook
export const useJobMatch = (userProfile: any, jobPosting: any) => {
    return useQuery({
        queryKey: ['job-match', userProfile, jobPosting],
        queryFn: () => apiClient.calculateJobMatch(userProfile, jobPosting),
        enabled: !!userProfile && !!jobPosting,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

// Skill Gap Analysis Hook
export const useSkillGaps = (userProfile: any, targetRole: string) => {
    return useQuery({
        queryKey: ['skill-gaps', userProfile, targetRole],
        queryFn: () => apiClient.analyzeSkillGaps(userProfile, targetRole),
        enabled: !!userProfile && !!targetRole,
        staleTime: 15 * 60 * 1000, // 15 minutes
    });
};

// Career Path Prediction Hook
export const useCareerPath = (userProfile: any, targetRole?: string) => {
    return useQuery({
        queryKey: ['career-path', userProfile, targetRole],
        queryFn: () => apiClient.predictCareerPath(userProfile, targetRole),
        enabled: !!userProfile,
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
};

// Applications Hooks
export const useApplications = (userId: string, status?: string) => {
    return useQuery({
        queryKey: ['applications', userId, status],
        queryFn: () => apiClient.getApplications(userId, status),
        enabled: !!userId,
    });
};

export const useApplication = (id: string) => {
    return useQuery({
        queryKey: ['application', id],
        queryFn: () => apiClient.getApplication(id),
        enabled: !!id,
    });
};

export const useCreateApplication = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => apiClient.createApplication(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applications'] });
        },
    });
};

export const useUpdateApplication = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            apiClient.updateApplication(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['applications'] });
            queryClient.invalidateQueries({ queryKey: ['application', variables.id] });
        },
    });
};

export const useDeleteApplication = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => apiClient.deleteApplication(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applications'] });
        },
    });
};

// Analytics Hooks
export const useAnalyticsFunnel = (userId: string) => {
    return useQuery({
        queryKey: ['analytics-funnel', userId],
        queryFn: () => apiClient.getAnalyticsFunnel(userId),
        enabled: !!userId,
    });
};

export const useAnalyticsSummary = (userId: string) => {
    return useQuery({
        queryKey: ['analytics-summary', userId],
        queryFn: () => apiClient.getAnalyticsSummary(userId),
        enabled: !!userId,
    });
};

// Bookmarks Hooks
export const useBookmarks = (userId: string) => {
    return useQuery({
        queryKey: ['bookmarks', userId],
        queryFn: () => apiClient.getBookmarks(userId),
        enabled: !!userId,
    });
};

export const useCreateBookmark = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, jobId, jobData, notes }: any) =>
            apiClient.createBookmark(userId, jobId, jobData, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
        },
    });
};

export const useDeleteBookmark = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => apiClient.deleteBookmark(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
        },
    });
};

// Interview Hooks
export const useStartInterview = () => {
    return useMutation({
        mutationFn: ({ jobRole, company, difficulty }: any) =>
            apiClient.startInterview(jobRole, company, difficulty),
    });
};

export const useEvaluateAnswer = () => {
    return useMutation({
        mutationFn: ({ session, question, answer, questionType }: any) =>
            apiClient.evaluateAnswer(session, question, answer, questionType),
    });
};
