import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, ExternalLink, ShieldCheck, CheckCircle2, Globe, Radio } from 'lucide-react';
import { getGA4ReportUrls } from '../analyticsData';

// Tab component detailing configured traffic acquisition channels and direct GA4 acquisition console
export const AcquisitionTab = ({ config = {}, brandName = 'Store' }) => {
  const urls = getGA4ReportUrls(config?.propertyId);

  const channels = [
    {
      name: 'Google Analytics 4 Tracking',
      identifier: config?.measurementId || 'G-3JHW9WK6GG',
      status: 'Active & Collecting',
      type: 'Primary Web Analytics',
      description: 'Tracks user sessions, engagement duration, pageviews, and ecommerce purchases.',
    },
    {
      name: 'Cloudflare Edge Proxy & CDN',
      identifier: 'surokkha.store (Zone Proxied)',
      status: 'Active',
      type: 'Edge Traffic & Security',
      description: 'Caches static assets, handles SSL/TLS termination, and logs global HTTP requests.',
    },
    {
      name: 'Direct Storefront Navigation',
      identifier: 'https://surokkha.store',
      status: 'Live',
      type: 'Direct Visits',
      description: 'Customers typing URL or returning via saved browser bookmarks.',
    },
    {
      name: 'Meta Pixel & Conversion API',
      identifier: 'Configured in Settings',
      status: 'Enabled',
      type: 'Social Ads Acquisition',
      description: 'Tracks campaign visitors arriving from Facebook & Instagram ads.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Acquisition Overview Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary" />
                <span>Traffic Acquisition & Marketing Channels</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Acquisition channels and attribution tracking active for {brandName}.
              </CardDescription>
            </div>
            <a
              href={urls.acquisition}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shrink-0"
            >
              <span>Open GA4 Acquisition Report</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </CardHeader>
      </Card>

      {/* Active Channels Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {channels.map((ch, idx) => (
          <Card key={idx} className="hover:border-primary/40 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{ch.name}</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  {ch.status}
                </Badge>
              </div>
              <CardDescription className="text-[11px] font-mono text-muted-foreground">
                {ch.identifier}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">{ch.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
