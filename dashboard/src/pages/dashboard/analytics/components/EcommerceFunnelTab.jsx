import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ShoppingCart, CheckCircle2, AlertCircle } from 'lucide-react';

// Tab component visualizing Google Analytics 4 ecommerce event funnel and conversion drop-offs
export const EcommerceFunnelTab = ({ funnelStages = [], conversionRate = '2.76%' }) => {
  return (
    <div className="space-y-4">
      {/* Funnel Overview Header Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <span>Storefront Purchase Conversion Funnel (GA4)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                End-to-end customer journey from store landing to finalized order placement
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1 text-xs">
                Overall Conversion: {conversionRate}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Visual Step-by-Step Funnel Stages */}
      <div className="space-y-3">
        {funnelStages.map((stage, idx) => {
          const isLast = idx === funnelStages.length - 1;
          const nextStage = !isLast ? funnelStages[idx + 1] : null;
          const dropoff = nextStage
            ? `${(((stage.count - nextStage.count) / stage.count) * 100).toFixed(1)}%`
            : null;

          return (
            <div key={idx} className="space-y-2">
              <Card className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-foreground">{stage.stage}</h4>
                      <code className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        event: {stage.eventName}
                      </code>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: stage.conversionFromStart,
                          backgroundColor: stage.color || 'hsl(var(--primary))',
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 sm:text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">Volume</p>
                      <p className="text-sm font-extrabold text-foreground">
                        {stage.count.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">From Start</p>
                      <p className="text-sm font-bold text-primary">
                        {stage.conversionFromStart}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Drop-off connector indicator */}
              {!isLast && (
                <div className="flex items-center justify-center gap-2 py-0.5">
                  <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-[11px] font-medium">
                    <ArrowDown className="h-3 w-3" />
                    <span>Drop-off: {dropoff} ({(stage.count - nextStage.count).toLocaleString()} users left)</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Funnel Optimization Insights Card */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 pt-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Funnel Strengths</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-muted-foreground">
            <p>• High product view retention: 62% of all visits navigate directly into specific product catalogs.</p>
            <p>• Checkout initiation to purchase completion rate exceeds standard regional retail benchmarks.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span>Optimization Opportunities</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-muted-foreground">
            <p>• Cart-to-Checkout drop-off can be reduced with floating sticky "Proceed to Checkout" bar on mobile screens.</p>
            <p>• Retarget abandoned checkout sessions with automated SMS and WhatsApp coupon prompts.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
