import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/core/ui/button";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-card rounded-2xl border border-border my-8">
          <div className="p-3.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-xl font-bold tracking-tight text-foreground">Something went wrong</h3>
            <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded-lg break-all">
              {this.state.error?.message || "An unexpected application error occurred"}
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const RouteErrorElement = () => {
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="p-3.5 rounded-full bg-primary/10 text-primary border border-primary/20">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h3 className="text-xl font-bold tracking-tight text-foreground">Page Render Error</h3>
        <p className="text-xs text-muted-foreground">
          An error occurred while loading this view. Please refresh or navigate back.
        </p>
      </div>
      <Button
        onClick={() => window.location.reload()}
        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
      >
        <RefreshCw className="h-4 w-4" />
        Reload Page
      </Button>
    </div>
  );
};
