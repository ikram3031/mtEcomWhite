import { useState } from 'react';
import { Input } from '@/components/core/ui/input';
import { Button } from '@/components/core/ui/button';
import { Search, BarChart3, TrendingUp, Download, Eye, Calendar, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/core/ui/select';
import { Badge } from '@/components/core/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/core/ui/table';

const mockReports = [
  { id: 'REP-2026-001', title: 'Monthly Revenue Summary - July 2026', type: 'Sales', generatedDate: '2026-07-30', size: '2.4 MB' },
  { id: 'REP-2026-002', title: 'Product Inventory Levels & Alerts', type: 'Inventory', generatedDate: '2026-07-29', size: '1.8 MB' },
  { id: 'REP-2026-003', title: 'Customer Acquisition & LTV Report', type: 'Activity', generatedDate: '2026-07-28', size: '3.1 MB' },
  { id: 'REP-2026-004', title: 'Q2 Sales Performance & Analytics', type: 'Sales', generatedDate: '2026-07-15', size: '4.5 MB' },
  { id: 'REP-2026-005', title: 'Out of Stock Products Audit', type: 'Inventory', generatedDate: '2026-07-10', size: '1.2 MB' },
];

const ReportsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const filteredReports = mockReports.filter((rep) => {
    const matchesSearch = rep.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          rep.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || rep.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
        <Button>
          <RefreshCw className="mr-2 h-4 w-4" />
          Generate New Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card text-card-foreground shadow-sm border rounded-lg p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">Total Generated</p>
            <h3 className="text-2xl font-bold">14 Reports</h3>
          </div>
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <BarChart3 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card text-card-foreground shadow-sm border rounded-lg p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">Top Category</p>
            <h3 className="text-2xl font-bold">Sales & Revenue</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-600">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card text-card-foreground shadow-sm border rounded-lg p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">Last Generated</p>
            <h3 className="text-2xl font-bold">Today, 10:45 AM</h3>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-full text-blue-600">
            <Calendar className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search reports..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value ?? 'All')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Report Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            <SelectItem value="Sales">Sales</SelectItem>
            <SelectItem value="Inventory">Inventory</SelectItem>
            <SelectItem value="Activity">Activity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card text-card-foreground shadow-sm border rounded-lg">
        <div className="p-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report ID</TableHead>
                  <TableHead>Report Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Generated</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length > 0 ? (
                  filteredReports.map((rep) => (
                    <TableRow key={rep.id}>
                      <TableCell className="font-semibold">{rep.id}</TableCell>
                      <TableCell>{rep.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{rep.type}</Badge>
                      </TableCell>
                      <TableCell>{rep.generatedDate}</TableCell>
                      <TableCell className="text-muted-foreground">{rep.size}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" title="View Report">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Download PDF">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No reports found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
