import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                    <h1 className="text-3xl font-bold text-red-600 mb-4">Something went wrong</h1>
                    <p className="text-gray-600 mb-8">We encountered an unexpected error.</p>

                    <pre className="text-left bg-gray-100 p-4 rounded-lg overflow-auto max-w-3xl text-sm border border-gray-300 text-red-500">
                        {this.state.error?.toString()}
                        <br />
                        {this.state.errorInfo?.componentStack}
                    </pre>

                    <button
                        className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
