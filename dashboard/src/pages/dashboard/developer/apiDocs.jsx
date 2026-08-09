import { useEffect, useState } from "react";
import { useAuth } from "@/lib/core/auth-context";
import { apiClient } from "@/lib/core/api-client";
import { ShieldAlert, Terminal, FileCode } from "lucide-react";

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
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileCode className="h-6 w-6 text-primary" />
            Swagger API Documentation (v1)
          </h1>
          <p className="text-sm text-muted-foreground">
            Interactive OpenAPI 3.0 specification & live endpoint tester.
          </p>
        </div>
      </div>
      <div className="border rounded-xl bg-card overflow-hidden h-[80vh]">
        <iframe
          title="Swagger UI"
          className="w-full h-full border-none"
          srcDoc={docHtml}
        />
      </div>
    </div>
  );
};

export default ApiDocs;
