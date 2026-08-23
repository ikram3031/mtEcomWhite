import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home, RefreshCw, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] w-full p-6 text-center space-y-6 animate-in fade-in duration-300">
      {/* 404 Badge Icon */}
      <div className="relative flex items-center justify-center">
        <div className="h-24 w-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
          <FileQuestion className="h-12 w-12 text-primary" />
        </div>
        <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-mono font-bold shadow-md">
          404 ERROR
        </span>
      </div>

      {/* Text Info */}
      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground font-mono">
          Page Not Found
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The requested URL does not exist, has been moved, or you might not have the required permissions to view it.
        </p>
      </div>

      {/* Action Buttons: 2 Buttons (Go Back -> / and Reload) */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button
          asChild
          size="sm"
          className="gap-2 text-xs font-semibold cursor-pointer h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
        >
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Link>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="gap-2 text-xs font-medium cursor-pointer h-9 px-4 text-muted-foreground hover:text-foreground border-border/80 hover:bg-muted/50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reload
        </Button>
      </div>
    </div>
  );
}
