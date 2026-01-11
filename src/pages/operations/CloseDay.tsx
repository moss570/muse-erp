import { useState } from 'react';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Package,
  Factory,
  Truck,
  CalendarIcon,
  ExternalLink,
} from 'lucide-react';
import { useEndOfDayBlockers } from '@/hooks/useApprovalEngine';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function CloseDay() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  
  const { data: blockers, isLoading, refetch } = useEndOfDayBlockers(dateString);

  const handleCloseDay = () => {
    if (blockers && blockers.totalBlockers > 0) {
      toast.error('Cannot close day with open transactions. Please resolve all blockers first.');
      return;
    }
    // TODO: Implement actual day close logic
    toast.success(`Successfully closed ${format(selectedDate, 'MMMM d, yyyy')}`);
  };

  const canCloseDay = !blockers || blockers.totalBlockers === 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-primary" />
              Close Day
            </h1>
            <p className="text-muted-foreground mt-1">
              Finalize daily operations and close the financial day
            </p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, 'MMMM d, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Status Card */}
        <Card className={cn(
          'border-2',
          canCloseDay ? 'border-emerald-500 bg-emerald-500/5' : 'border-amber-500 bg-amber-500/5'
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {canCloseDay ? (
                  <div className="p-3 rounded-full bg-emerald-500/10">
                    <Unlock className="h-8 w-8 text-emerald-600" />
                  </div>
                ) : (
                  <div className="p-3 rounded-full bg-amber-500/10">
                    <Lock className="h-8 w-8 text-amber-600" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold">
                    {canCloseDay ? 'Ready to Close' : 'Blockers Detected'}
                  </h2>
                  <p className="text-muted-foreground">
                    {canCloseDay
                      ? 'All transactions are complete. You can close this day.'
                      : `${blockers?.totalBlockers || 0} open transaction(s) must be resolved before closing.`}
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                disabled={!canCloseDay || isLoading}
                onClick={handleCloseDay}
                className={cn(
                  canCloseDay && 'bg-emerald-600 hover:bg-emerald-700'
                )}
              >
                {canCloseDay ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Close Day
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Cannot Close
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Blockers Alert */}
        {blockers && blockers.totalBlockers > 0 && (
          <Alert variant="destructive" className="border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>End-of-Day Blockers</AlertTitle>
            <AlertDescription>
              The following transactions must be completed or cancelled before closing the day.
            </AlertDescription>
          </Alert>
        )}

        {/* Blockers Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Open Receiving Sessions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Open Receiving
              </CardTitle>
              <Badge variant={blockers?.receivingSessions.length ? 'destructive' : 'secondary'}>
                {blockers?.receivingSessions.length || 0}
              </Badge>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : !blockers?.receivingSessions.length ? (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm">All receiving complete</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blockers.receivingSessions.slice(0, 5).map((session: { id: string; receiving_number?: string; status?: string }) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-2 rounded bg-muted"
                    >
                      <span className="text-sm font-medium">
                        {session.receiving_number || 'Unknown'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {session.status}
                      </Badge>
                    </div>
                  ))}
                  {blockers.receivingSessions.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{blockers.receivingSessions.length - 5} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open Production Lots */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Factory className="h-4 w-4" />
                Open Production
              </CardTitle>
              <Badge variant={blockers?.productionLots.length ? 'destructive' : 'secondary'}>
                {blockers?.productionLots.length || 0}
              </Badge>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : !blockers?.productionLots.length ? (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm">All production complete</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blockers.productionLots.slice(0, 5).map((lot: { id: string; lot_number?: string; status?: string }) => (
                    <div
                      key={lot.id}
                      className="flex items-center justify-between p-2 rounded bg-muted"
                    >
                      <span className="text-sm font-medium">
                        {lot.lot_number || 'Unknown'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {lot.status}
                      </Badge>
                    </div>
                  ))}
                  {blockers.productionLots.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{blockers.productionLots.length - 5} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open BOLs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Open Shipments
              </CardTitle>
              <Badge variant={blockers?.billsOfLading.length ? 'destructive' : 'secondary'}>
                {blockers?.billsOfLading.length || 0}
              </Badge>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : !blockers?.billsOfLading.length ? (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm">All shipments complete</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blockers.billsOfLading.slice(0, 5).map((bol: { id: string; bol_number?: string; status?: string }) => (
                    <div
                      key={bol.id}
                      className="flex items-center justify-between p-2 rounded bg-muted"
                    >
                      <span className="text-sm font-medium">
                        {bol.bol_number || 'Unknown'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {bol.status}
                      </Badge>
                    </div>
                  ))}
                  {blockers.billsOfLading.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{blockers.billsOfLading.length - 5} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About Day Close</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Closing a day ensures all operational transactions are finalized and ready for financial reconciliation.
              This is required for accurate cost tracking and SQF compliance.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>All receiving sessions must be marked as completed</li>
              <li>All production runs must be finished or cancelled</li>
              <li>All shipments must be confirmed as delivered or returned</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
