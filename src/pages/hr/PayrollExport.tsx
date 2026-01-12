import { useState } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download, Calendar, DollarSign, Clock, Users, FileSpreadsheet } from 'lucide-react';

interface PayrollSummary {
  employee_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  department: string;
  regular_hours: number;
  overtime_hours: number;
  total_hours: number;
  hourly_rate: number;
  regular_pay: number;
  overtime_pay: number;
  gross_pay: number;
}

export default function PayrollExport() {
  const [periodStart, setPeriodStart] = useState(() => 
    format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 }), 'yyyy-MM-dd')
  );
  const [periodEnd, setPeriodEnd] = useState(() => 
    format(endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 }), 'yyyy-MM-dd')
  );
  const [showExportDialog, setShowExportDialog] = useState(false);

  const queryClient = useQueryClient();

  // Fetch time entries for period
  const { data: payrollData, isLoading } = useQuery({
    queryKey: ['payroll-summary', periodStart, periodEnd],
    queryFn: async () => {
      // Get time entries with employee info
      const { data: entries, error } = await supabase
        .from('employee_time_entries')
        .select(`
          *,
          employee:employees(
            id,
            employee_number,
            first_name,
            last_name,
            hourly_rate,
            department:departments(name)
          )
        `)
        .not('clock_out', 'is', null)
        .gte('clock_in', periodStart)
        .lte('clock_in', periodEnd + 'T23:59:59');

      if (error) throw error;

      // Aggregate by employee
      const summaryMap = new Map<string, PayrollSummary>();

      (entries || []).forEach((entry: any) => {
        const emp = entry.employee;
        if (!emp) return;

        const existing = summaryMap.get(emp.id) || {
          employee_id: emp.id,
          employee_number: emp.employee_number,
          first_name: emp.first_name,
          last_name: emp.last_name,
          department: emp.department?.name || 'N/A',
          regular_hours: 0,
          overtime_hours: 0,
          total_hours: 0,
          hourly_rate: emp.hourly_rate || 0,
          regular_pay: 0,
          overtime_pay: 0,
          gross_pay: 0,
        };

        const regHours = Math.min(entry.total_hours || 0, 8);
        const otHours = entry.overtime_hours || 0;

        existing.regular_hours += regHours;
        existing.overtime_hours += otHours;
        existing.total_hours += (entry.total_hours || 0);

        summaryMap.set(emp.id, existing);
      });

      // Calculate pay
      const results = Array.from(summaryMap.values()).map((emp) => ({
        ...emp,
        regular_pay: emp.regular_hours * emp.hourly_rate,
        overtime_pay: emp.overtime_hours * emp.hourly_rate * 1.5,
        gross_pay: (emp.regular_hours * emp.hourly_rate) + (emp.overtime_hours * emp.hourly_rate * 1.5),
      }));

      return results.sort((a, b) => a.last_name.localeCompare(b.last_name));
    },
  });

  // Export mutation
  const exportPayroll = useMutation({
    mutationFn: async () => {
      if (!payrollData) return;

      // Create CSV content
      const headers = [
        'Employee Number',
        'First Name',
        'Last Name',
        'Department',
        'Regular Hours',
        'Overtime Hours',
        'Total Hours',
        'Hourly Rate',
        'Regular Pay',
        'Overtime Pay',
        'Gross Pay',
      ];

      const rows = payrollData.map((emp) => [
        emp.employee_number,
        emp.first_name,
        emp.last_name,
        emp.department,
        emp.regular_hours.toFixed(2),
        emp.overtime_hours.toFixed(2),
        emp.total_hours.toFixed(2),
        emp.hourly_rate.toFixed(2),
        emp.regular_pay.toFixed(2),
        emp.overtime_pay.toFixed(2),
        emp.gross_pay.toFixed(2),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      // Create blob and download (skip logging to avoid type issues)
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-export-${periodStart}-to-${periodEnd}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      return true;
    },
    onSuccess: () => {
      toast.success('Payroll exported successfully');
      setShowExportDialog(false);
    },
    onError: () => {
      toast.error('Failed to export payroll');
    },
  });

  const totals = payrollData?.reduce(
    (acc, emp) => ({
      regular_hours: acc.regular_hours + emp.regular_hours,
      overtime_hours: acc.overtime_hours + emp.overtime_hours,
      total_hours: acc.total_hours + emp.total_hours,
      gross_pay: acc.gross_pay + emp.gross_pay,
    }),
    { regular_hours: 0, overtime_hours: 0, total_hours: 0, gross_pay: 0 }
  ) || { regular_hours: 0, overtime_hours: 0, total_hours: 0, gross_pay: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Export</h1>
          <p className="text-muted-foreground">Review and export time entries for payroll processing</p>
        </div>
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogTrigger asChild>
            <Button disabled={!payrollData?.length}>
              <Download className="h-4 w-4 mr-2" />
              Export Payroll
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Payroll Data</DialogTitle>
              <DialogDescription>
                Export payroll summary for {periodStart} to {periodEnd}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Employees:</span>
                  <p className="font-medium">{payrollData?.length || 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Hours:</span>
                  <p className="font-medium">{totals.total_hours.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Overtime Hours:</span>
                  <p className="font-medium">{totals.overtime_hours.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Gross Pay:</span>
                  <p className="font-medium">${totals.gross_pay.toFixed(2)}</p>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => exportPayroll.mutate()}
                disabled={exportPayroll.isPending}
              >
                {exportPayroll.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                Download CSV
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Range Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Pay Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input 
                type="date" 
                value={periodStart} 
                onChange={(e) => setPeriodStart(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input 
                type="date" 
                value={periodEnd} 
                onChange={(e) => setPeriodEnd(e.target.value)} 
              />
            </div>
            <Button variant="outline" onClick={() => {
              setPeriodStart(format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 }), 'yyyy-MM-dd'));
              setPeriodEnd(format(endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 }), 'yyyy-MM-dd'));
            }}>
              Last Week
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollData?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Regular Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.regular_hours.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Overtime Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{totals.overtime_hours.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Gross Pay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${totals.gross_pay.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Summary</CardTitle>
          <CardDescription>
            Hours and pay calculations for {format(new Date(periodStart), 'MMM d')} - {format(new Date(periodEnd), 'MMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !payrollData?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No time entries found for this period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Regular</TableHead>
                  <TableHead className="text-right">OT</TableHead>
                  <TableHead className="text-right">Total Hrs</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Gross Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollData.map((emp) => (
                  <TableRow key={emp.employee_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{emp.employee_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell className="text-right">{emp.regular_hours.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {emp.overtime_hours > 0 ? (
                        <Badge variant="secondary">{emp.overtime_hours.toFixed(2)}</Badge>
                      ) : (
                        '0.00'
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">{emp.total_hours.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${emp.hourly_rate.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold">${emp.gross_pay.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
