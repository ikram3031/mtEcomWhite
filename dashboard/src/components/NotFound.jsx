import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-5">
      <div className="p-4 rounded-2xl bg-muted border border-border shadow-xs">
        <FileQuestion className="h-14 w-14 text-muted-foreground" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground font-mono">
          404
        </h1>
        <h2 className="text-xl font-semibold text-foreground">
          Page Not Found
        </h2>
        <p className="text-sm text-muted-foreground">
          The page you are looking for doesn't exist, has been removed, or you don't have permission to access it.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.history.back()}
          className="gap-2 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Go Back
        </Button>

        <Button
          asChild
          size="sm"
          className="gap-2 text-xs font-semibold"
        >
          <Link to="/dashboard">
            <Home className="h-3.5 w-3.5" /> Return to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
