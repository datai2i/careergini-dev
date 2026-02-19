import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, ExternalLink, Calendar, DollarSign, MapPin, FileText, Trash2, Edit } from 'lucide-react';

interface Application {
    id: string;
    job_title: string;
    company: string;
    status: 'interested' | 'applied' | 'phone_screen' | 'interview' | 'offer' | 'rejected' | 'accepted' | 'withdrawn';
    job_url?: string;
    location?: string;
    salary_range?: string;
    applied_date?: string;
    job_match_score?: number;
    ats_score?: number;
    notes?: string;
}

const statusColumns = [
    { id: 'interested', title: 'Interested', color: 'bg-gray-100' },
    { id: 'applied', title: 'Applied', color: 'bg-blue-100' },
    { id: 'phone_screen', title: 'Phone Screen', color: 'bg-purple-100' },
    { id: 'interview', title: 'Interview', color: 'bg-yellow-100' },
    { id: 'offer', title: 'Offer', color: 'bg-green-100' },
    { id: 'rejected', title: 'Rejected', color: 'bg-red-100' },
];

export const ApplicationTracker: React.FC = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/applications/applications?user_id=current', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setApplications(data);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const { draggableId, destination } = result;
        const newStatus = destination.droppableId as Application['status'];

        // Update local state
        setApplications(apps =>
            apps.map(app =>
                app.id === draggableId ? { ...app, status: newStatus } : app
            )
        );

        // Update backend
        try {
            const token = localStorage.getItem('auth_token');
            await fetch(`/api/applications/applications/${draggableId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (error) {
            console.error('Error updating application:', error);
            // Revert on error
            fetchApplications();
        }
    };

    const getApplicationsByStatus = (status: string) => {
        return applications.filter(app => app.status === status);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Application Tracker</h2>
                    <p className="text-gray-600">Manage your job applications</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Application
                </button>
            </div>

            {/* Kanban Board */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {statusColumns.map(column => (
                        <div key={column.id} className="flex flex-col">
                            {/* Column Header */}
                            <div className={`${column.color} rounded-t-lg p-3`}>
                                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                                <p className="text-sm text-gray-600">
                                    {getApplicationsByStatus(column.id).length} applications
                                </p>
                            </div>

                            {/* Droppable Area */}
                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex-1 bg-gray-50 rounded-b-lg p-2 min-h-[200px] ${snapshot.isDraggingOver ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className="space-y-2">
                                            {getApplicationsByStatus(column.id).map((app, index) => (
                                                <Draggable key={app.id} draggableId={app.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`bg-white rounded-lg shadow-sm p-3 cursor-move hover:shadow-md transition-shadow ${snapshot.isDragging ? 'shadow-lg' : ''
                                                                }`}
                                                        >
                                                            <ApplicationCard application={app} />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
};

// Application Card Component
const ApplicationCard: React.FC<{ application: Application }> = ({ application }) => {
    return (
        <div className="space-y-2">
            {/* Title & Company */}
            <div>
                <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
                    {application.job_title}
                </h4>
                <p className="text-xs text-gray-600">{application.company}</p>
            </div>

            {/* Scores */}
            {(application.job_match_score || application.ats_score) && (
                <div className="flex gap-2">
                    {application.job_match_score && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {application.job_match_score}% Match
                        </span>
                    )}
                    {application.ats_score && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            ATS: {application.ats_score}
                        </span>
                    )}
                </div>
            )}

            {/* Details */}
            <div className="space-y-1 text-xs text-gray-600">
                {application.location && (
                    <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{application.location}</span>
                    </div>
                )}
                {application.salary_range && (
                    <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>{application.salary_range}</span>
                    </div>
                )}
                {application.applied_date && (
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(application.applied_date).toLocaleDateString()}</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-1 pt-2 border-t">
                {application.job_url && (
                    <a
                        href={application.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-800 py-1"
                    >
                        <ExternalLink className="w-3 h-3" />
                        View
                    </a>
                )}
                <button className="flex-1 flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-gray-800 py-1">
                    <Edit className="w-3 h-3" />
                    Edit
                </button>
            </div>
        </div>
    );
};

export default ApplicationTracker;
