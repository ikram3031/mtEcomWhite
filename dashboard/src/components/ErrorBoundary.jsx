import React from "react";
import { Link, useRouteError } from "react-router-dom";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useState, useEffect } from "react";

export const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (e) => {
      console.error("[ErrorBoundary caught error]:", e);
      setHasError(true);
      setError(e.error || new Error(e.message));
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-card rounded-2xl border border-border my-8">
        <div className="p-3.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h3 className="text-xl font-bold tracking-tight text-foreground">Something went wrong</h3>
          <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded-lg break-all">
            {error?.message || "An unexpected application error occurred"}
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

  return children;
};

// A beautiful fallback page to display when React Router throws a 404 or any route error
export const RouteErrorElement = ({ error: propError }) => {
  const routeError = useRouteError();
  const activeError = propError || routeError;

  let errorMessage = "An unexpected page error occurred.";
  let is404 = false;

  if (activeError) {
    // Check for 404
    if (activeError.status === 404 || activeError.statusText === "Not Found" || activeError.data?.includes("Not Found")) {
      is404 = true;
      errorMessage = "The page you are looking for does not exist or has been moved.";
    } else {
      errorMessage = activeError.message || activeError.statusText || String(activeError);
    }
  }

  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="p-4 rounded-full bg-destructive/10 text-destructive border border-destructive/20 animate-pulse">
        <AlertTriangle className="h-12 w-12" />
      </div>
      
      <div className="space-y-2 max-w-md">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          {is404 ? "404" : "Error Occurred"}
        </h1>
        <h3 className="text-xl font-semibold text-muted-foreground">
          {is404 ? "Page Not Found" : "Something Went Wrong"}
        </h3>
        <p className="text-sm text-muted-foreground/80 max-w-sm mx-auto">
          {errorMessage}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          asChild
          variant="outline"
          className="font-medium"
        >
          <Link to="/dashboard" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span>Go to Dashboard</span>
          </Link>
        </Button>
        <Button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Reload Page</span>
        </Button>
      </div>
    </div>
  );
};
