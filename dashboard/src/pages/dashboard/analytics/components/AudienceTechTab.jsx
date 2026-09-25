import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Globe, MapPin, Monitor, ExternalLink } from 'lucide-react';
import { getGA4ReportUrls } from '../analyticsData';

// Tab component displaying audience tracking channels, geographical region, and direct GA4 deep links
export const AudienceTechTab = ({ config = {}, brandName = 'Store' }) => {
  const urls = getGA4ReportUrls(config?.propertyId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <span>Audience Demographics & Technology Hub</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time user technology, devices, browser platforms, and geography reported by Google Analytics.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={urls.demographics}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shrink-0"
              >
                <span>Demographics Report</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href={urls.tech}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-all shrink-0"
              >
                <span>Tech Report</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Direct Report Overview Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span>Geographic Distribution</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Primary audience regions tracked across Bangladesh and international diaspora
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">Primary Region</span>
                <Badge variant="secondary">Bangladesh (BD)</Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Top division cities: Dhaka Division, Chittagong Division, Sylhet Division, Rajshahi Division.
              </p>
            </div>
            <a
              href={urls.demographics}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
            >
              <span>View full country & city breakdown on Google Analytics</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              <span>Device & Platform Environment</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Hardware devices, operating systems, and browsers used by shoppers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">Device Dominance</span>
                <Badge variant="secondary">Mobile & Desktop</Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Primary platforms: Android (Chrome, Samsung Internet), iOS (Mobile Safari), Windows (Chrome, Edge).
              </p>
            </div>
            <a
              href={urls.tech}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
            >
              <span>View full platform & browser technology report</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
