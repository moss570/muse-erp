import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, LogIn, LogOut, Coffee, UserCheck, Keyboard } from 'lucide-react';

export default function TimeClockKiosk() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [activeEntry, setActiveEntry] = useState<any>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Look up employee by number
  const lookupEmployee = useMutation({
    mutationFn: async (empNumber: string) => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(name),
          job_position:job_positions(title)
        `)
        .eq('employee_number', empNumber)
        .eq('employment_status', 'active')
        .single();

      if (error) throw new Error('Employee not found');
      return data;
    },
    onSuccess: async (employee) => {
      setSelectedEmployee(employee);
      
      // Check for active time entry (no clock_out)
      const { data: entry } = await supabase
        .from('employee_time_entries')
        .select('*')
        .eq('employee_id', employee.id)
        .is('clock_out', null)
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setActiveEntry(entry);
      setShowConfirmDialog(true);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setEmployeeNumber('');
    },
  });

  // Clock in mutation
  const clockIn = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data, error } = await supabase
        .from('employee_time_entries')
        .insert({
          employee_id: employeeId,
          clock_in: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Clocked in successfully!');
      resetState();
    },
    onError: () => {
      toast.error('Failed to clock in');
    },
  });

  // Clock out mutation
  const clockOut = useMutation({
    mutationFn: async (entryId: string) => {
      const { data, error } = await supabase
        .from('employee_time_entries')
        .update({ clock_out: new Date().toISOString() })
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const hours = data.total_hours?.toFixed(2) || '0';
      toast.success(`Clocked out! Total: ${hours} hours`);
      resetState();
    },
    onError: () => {
      toast.error('Failed to clock out');
    },
  });

  // Start break mutation
  const startBreak = useMutation({
    mutationFn: async (entryId: string) => {
      const { data, error } = await supabase
        .from('employee_time_entries')
        .update({ break_start: new Date().toISOString() })
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Break started');
      resetState();
    },
    onError: () => {
      toast.error('Failed to start break');
    },
  });

  // End break mutation
  const endBreak = useMutation({
    mutationFn: async (entryId: string) => {
      const { data, error } = await supabase
        .from('employee_time_entries')
        .update({ break_end: new Date().toISOString() })
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Break ended');
      resetState();
    },
    onError: () => {
      toast.error('Failed to end break');
    },
  });

  const resetState = () => {
    setShowConfirmDialog(false);
    setEmployeeNumber('');
    setSelectedEmployee(null);
    setActiveEntry(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeNumber.trim()) {
      lookupEmployee.mutate(employeeNumber.trim().toUpperCase());
    }
  };

  const handleClockIn = () => {
    if (selectedEmployee) clockIn.mutate(selectedEmployee.id);
  };

  const handleClockOut = () => {
    if (activeEntry) clockOut.mutate(activeEntry.id);
  };

  const handleStartBreak = () => {
    if (activeEntry) startBreak.mutate(activeEntry.id);
  };

  const handleEndBreak = () => {
    if (activeEntry) endBreak.mutate(activeEntry.id);
  };

  const getSessionDuration = () => {
    if (!activeEntry?.clock_in) return null;
    const start = new Date(activeEntry.clock_in);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Time Clock</CardTitle>
          <CardDescription>
            {format(currentTime, 'EEEE, MMMM d, yyyy')}
          </CardDescription>
          <div className="text-4xl font-bold mt-2 font-mono">
            {format(currentTime, 'h:mm:ss a')}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee-number" className="flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Employee Number
              </Label>
              <Input
                id="employee-number"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value.toUpperCase())}
                placeholder="Enter employee number (e.g., EMP000001)"
                className="text-center text-lg font-mono tracking-wider"
                autoComplete="off"
                autoFocus
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={!employeeNumber.trim() || lookupEmployee.isPending}
            >
              {lookupEmployee.isPending ? 'Looking up...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={(open) => !open && resetState()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              {selectedEmployee?.first_name} {selectedEmployee?.last_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Department:</span>
                  <p className="font-medium">{selectedEmployee?.department?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Position:</span>
                  <p className="font-medium">{selectedEmployee?.job_position?.title || 'N/A'}</p>
                </div>
              </div>
            </div>

            {activeEntry ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Currently Clocked In
                    </span>
                  </div>
                  <Badge variant="secondary">{getSessionDuration()}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {!activeEntry.break_start ? (
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={handleStartBreak}
                      disabled={startBreak.isPending}
                    >
                      <Coffee className="h-4 w-4" />
                      Start Break
                    </Button>
                  ) : !activeEntry.break_end ? (
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={handleEndBreak}
                      disabled={endBreak.isPending}
                    >
                      <Coffee className="h-4 w-4" />
                      End Break
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="gap-2">
                      <Coffee className="h-4 w-4" />
                      Break Taken
                    </Button>
                  )}
                  <Button 
                    variant="destructive" 
                    className="gap-2"
                    onClick={handleClockOut}
                    disabled={clockOut.isPending}
                  >
                    <LogOut className="h-4 w-4" />
                    Clock Out
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={handleClockIn}
                disabled={clockIn.isPending}
              >
                <LogIn className="h-4 w-4" />
                Clock In
              </Button>
            )}

            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={resetState}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
