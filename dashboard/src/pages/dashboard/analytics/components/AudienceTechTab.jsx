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
                    formatter={(val, name) => [`${val.toLocaleString()} sessions (${devices.find(d => d.name === name)?.percentage}%)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold">{totalDeviceSessions.toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sessions</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="w-full space-y-2 mt-2 px-2">
              {devices.map((dev) => (
                <div key={dev.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dev.color }} />
                    <span className="text-muted-foreground">{dev.name}</span>
                  </div>
                  <span className="font-bold">{dev.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Top Cities Table */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-500" />
              <span>Top Geographic Locations & Cities</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Visitor density across Bangladesh divisions and international expat regions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>City / Region</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {geoLocations.map((geo, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/40">
                    <TableCell className="font-semibold flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{geo.city}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{geo.region}</TableCell>
                    <TableCell className="text-right font-medium">{geo.sessions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20">
                        {geo.share}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Browsers and Operating Systems */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Operating Systems */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              <span>Operating Systems</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {operatingSystems.map((os, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>{os.name}</span>
                  <span className="text-muted-foreground">{os.share}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: os.share, backgroundColor: os.color }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Web Browsers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <span>Web Browsers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {browsers.map((b, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>{b.name}</span>
                  <span className="text-muted-foreground">{b.share} ({b.users.toLocaleString()} users)</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: b.share, backgroundColor: b.color }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
