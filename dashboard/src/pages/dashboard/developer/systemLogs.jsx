import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Terminal, Trash2, Search, Pause, Play, Download } from "lucide-react";

const SystemLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const logEndRef = useRef(null);

  const isDeveloper = user?.email?.toLowerCase().trim() === "ikramul.web@gmail.com";

  useEffect(() => {
    if (!isDeveloper) return;

    // Fetch initial logs
    const fetchInitialLogs = async () => {
      try {
        const res = await apiClient.get("/api/v1/developer/logs");
        if (Array.isArray(res.data?.data)) {
          setLogs(res.data.data);
        }
      } catch (err) {
        console.error("Error loading developer logs:", err);
      }
    };

    fetchInitialLogs();

    // Setup polling for live log updates
    const interval = setInterval(async () => {
      if (isPaused) return;
      try {
        const res = await apiClient.get("/api/v1/developer/logs");
        if (Array.isArray(res.data?.data)) {
          setLogs(res.data.data);
        }
      } catch (err) {
        // Silent error
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isDeveloper, isPaused]);

  useEffect(() => {
    if (!isPaused && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isPaused]);

  if (!isDeveloper) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h2>
        <p className="text-muted-foreground max-w-md">
          Realtime System Logs are strictly restricted to developer access (<code className="text-primary font-mono">ikramul.web@gmail.com</code>).
        </p>
      </div>
    );
  }

  const [sourceFilter, setSourceFilter] = useState("ALL");

  const filteredLogs = logs.filter((log) => {
    if (sourceFilter !== "ALL" && log.source !== sourceFilter) return false;
    if (!filter) return true;
    const search = filter.toLowerCase();
    return (
      log.url?.toLowerCase().includes(search) ||
      log.method?.toLowerCase().includes(search) ||
      log.ip?.toLowerCase().includes(search) ||
      log.source?.toLowerCase().includes(search) ||
      String(log.status).includes(search)
    );
  });

  const clearLogs = () => setLogs([]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Terminal className="h-6 w-6 text-primary" />
            Developer Live System Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Realtime HTTP API request telemetry & source origin breakdown.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Source Selector */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring font-medium"
          >
            <option value="ALL">All Origins</option>
            <option value="DASHBOARD">🖥️ Dashboard Only</option>
            <option value="FRONTEND">🛍️ Frontend Only</option>
            <option value="EXTERNAL">⚡ External API</option>
          </select>

          <div className="relative w-56">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by IP, Method..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="h-9 gap-1.5 text-xs"
          >
            {isPaused ? <Play className="h-4 w-4 text-emerald-500" /> : <Pause className="h-4 w-4 text-amber-500" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={clearLogs}
            className="h-9 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Terminal Container */}
      <div className="rounded-xl border bg-slate-950 p-4 font-mono text-xs text-slate-200 shadow-2xl h-[72vh] overflow-y-auto space-y-1.5">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <Terminal className="h-8 w-8 opacity-40" />
            <p>No log streams recorded matching criteria.</p>
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const statusBg =
              log.status >= 500
                ? "bg-red-500/20 text-red-400 border-red-500/30"
                : log.status >= 400
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                : log.status >= 300
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";

            const sourceBadge =
              log.source === "DASHBOARD"
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                : log.source === "FRONTEND"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-amber-500/20 text-amber-300 border-amber-500/40";

            const sourceLabel =
              log.source === "DASHBOARD"
                ? "🖥️ DASHBOARD"
                : log.source === "FRONTEND"
                ? "🛍️ FRONTEND"
                : "⚡ EXTERNAL";

            return (
              <div
                key={index}
                className="flex items-center gap-2.5 py-1 px-2.5 rounded hover:bg-slate-900/80 transition-colors border border-transparent hover:border-slate-800"
              >
                <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBg}`}>
                  {log.status}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${sourceBadge}`}>
                  {sourceLabel}
                </span>
                <span className="text-amber-300 w-14 text-right shrink-0">{log.duration}ms</span>
                <span className="text-cyan-400 w-16 text-right shrink-0">{log.size}</span>
                <span className="text-slate-400 font-semibold shrink-0">[{log.ip}]</span>
                <span className="font-bold text-slate-200 uppercase w-12 shrink-0">{log.method}</span>
                <span className="text-slate-200 truncate">{log.url}</span>
              </div>
            );
          })
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default SystemLogs;
