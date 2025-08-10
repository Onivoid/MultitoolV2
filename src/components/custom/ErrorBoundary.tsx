import React from 'react';

type ErrorBoundaryState = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
    constructor(props: React.PropsWithChildren) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        // Optionally log
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center w-full h-full p-6 text-center">
                    <h2 className="text-xl font-semibold mb-2">Une erreur est survenue</h2>
                    <p className="text-sm text-muted-foreground mb-4">Essayez de recharger l'application.</p>
                    <button
                        className="px-4 py-2 rounded bg-primary text-primary-foreground"
                        onClick={() => window.location.reload()}
                    >
                        Recharger
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}


