import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { ShieldAlert, FileCode, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const ApiDocs = () => {
  const { user } = useAuth();
  const [docHtml, setDocHtml] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const isDeveloper = user?.email?.toLowerCase().trim() === "ikramul.web@gmail.com";

  useEffect(() => {
    if (!isDeveloper) return;

    const fetchDocs = async () => {
      try {
        const response = await apiClient.get("/api/v1/developer/docs", {
          responseType: "text",
        });
        setDocHtml(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load API documentation.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocs();
  }, [isDeveloper]);

  if (!isDeveloper) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h2>
        <p className="text-muted-foreground max-w-md">
          Developer API Documentation is strictly restricted to developer access (<code className="text-primary font-mono">ikramul.web@gmail.com</code>).
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileCode className="h-6 w-6 text-primary" />
            Scalar API Reference & Live Tester (v1)
          </h1>
          <p className="text-sm text-muted-foreground">
            Stripe/Vercel-style interactive API Reference and live endpoint tester.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const win = window.open("", "_blank");
            win.document.write(docHtml);
            win.document.close();
          }}
          className="gap-1.5 text-xs"
        >
          <ExternalLink className="h-4 w-4" />
          Full Screen Mode
        </Button>
      </div>

      <div className="border rounded-xl bg-slate-950 overflow-hidden h-[calc(100vh-140px)] shadow-2xl">
        <iframe
          title="Scalar API Reference"
          className="w-full h-full border-none bg-slate-950"
          srcDoc={docHtml}
        />
      </div>
    </div>
  );
};

export default ApiDocs;
