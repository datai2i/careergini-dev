import React from 'react';
import { useToast, Toast, ToastType } from '../../context/ToastContext';
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react';

const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={16} className="text-green-400 shrink-0" />,
    info: <Info size={16} className="text-blue-400 shrink-0" />,
    warning: <AlertTriangle size={16} className="text-yellow-400 shrink-0" />,
    error: <XCircle size={16} className="text-red-400 shrink-0" />,
};

const barColors: Record<ToastType, string> = {
    success: 'bg-green-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
    const { removeToast } = useToast();

    return (
        <div
            className="relative flex items-center gap-3 bg-gray-900 dark:bg-gray-800 border border-gray-700 text-white rounded-xl shadow-2xl px-4 py-3 min-w-[260px] max-w-[340px] overflow-hidden animate-slide-in"
            style={{ animation: 'slideInRight 0.25s ease-out' }}
        >
            {/* Progress bar */}
            <div
                className={`absolute bottom-0 left-0 h-0.5 ${barColors[toast.type]} animate-shrink-bar`}
                style={{ animation: 'shrinkBar 3.5s linear forwards' }}
            />

            {icons[toast.type]}
            <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
            <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-white transition-colors ml-1 shrink-0"
            >
                <X size={14} />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const { toasts } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastItem toast={t} />
                </div>
            ))}
        </div>
    );
};
