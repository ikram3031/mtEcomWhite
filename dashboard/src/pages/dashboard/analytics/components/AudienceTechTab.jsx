import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Globe, MapPin, Monitor } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';

// Tab component displaying audience demographics, geographical distribution, devices, and browser technology
export const AudienceTechTab = ({
  devices = [],
  browsers = [],
  operatingSystems = [],
  geoLocations = [],
}) => {
  const { theme, systemTheme } = useTheme();
  const isDark = (theme === 'system' ? systemTheme : theme) === 'dark';

  const totalDeviceSessions = devices.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-4">
      {/* Devices & Geographic Split */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Device Categories Donut Chart */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              <span>Device Category Distribution</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Sessions categorized by visitor hardware device
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center pb-4">
            <div className="h-[210px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={devices}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {devices.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#171717' : '#ffffff',
                      borderColor: isDark ? '#333333' : '#e5e7eb',
                      color: isDark ? '#f9fafb' : '#111827',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-foreground">{totalDeviceSessions.toLocaleString()}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sessions</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-border text-center">
              {devices.map((d) => (
                <div key={d.name} className="space-y-0.5">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="truncate">{d.name.split(' ')[0]}</span>
                  </div>
                  <p className="text-xs font-bold text-foreground">{d.percentage}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic City Distribution Table */}
        <Card className="lg:col-span-4 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Geographic Distribution (Bangladesh)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Top visitor regions and divisions in Bangladesh
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>Division / City</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="text-right">Traffic Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {geoLocations.map((geo, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/40">
                      <TableCell className="font-semibold text-foreground">{geo.city}</TableCell>
                      <TableCell className="text-muted-foreground">{geo.region}</TableCell>
                      <TableCell className="text-right font-medium">{geo.sessions.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold text-primary">{geo.share}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Browsers and Operating Systems */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Top Browsers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span>Browser Share</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {browsers.map((b, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                    <span>{b.name}</span>
                  </span>
                  <span className="text-muted-foreground font-mono">{b.share} ({b.users.toLocaleString()} users)</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: b.share, backgroundColor: b.color }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Operating Systems */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              <span>Operating Systems</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {operatingSystems.map((os, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: os.color }} />
                    <span>{os.name}</span>
                  </span>
                  <span className="text-muted-foreground font-mono">{os.share}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: os.share, backgroundColor: os.color }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
