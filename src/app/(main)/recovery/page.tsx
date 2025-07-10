"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { ContentWorkflow } from '@/components/workflows/content-workflow';
import { RecoveryCard } from '@/components/workflows/recovery-card';
import { useToast } from '@/hooks/use-toast';

export default function RecoveryPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isCustomPopoverOpen, setCustomPopoverOpen] = useState(false);
  const { toast } = useToast();

  const handleApplyCustomRange = () => {
    if (startDate) {
        setTimeRange('custom');
        setCustomPopoverOpen(false);
    } else {
        toast({
            variant: "destructive",
            title: "Start date required",
            description: "Please select a start date for the custom range.",
        });
    }
  };

  const filter = 'or(permission.eq.Cancel,removed.eq.true)';

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-semibold">Data Recovery</h1>
        <div className="ml-auto flex items-center gap-2">
            <Select value={timeRange === 'custom' ? '' : timeRange} onValueChange={(value) => {
                if (value) {
                  setTimeRange(value);
                  setStartDate(undefined);
                  setEndDate(undefined);
                }
            }}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a time range" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
            </Select>
            <Popover open={isCustomPopoverOpen} onOpenChange={setCustomPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline">Custom Range</Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button id="start-date" variant={"outline"} className="w-[260px] justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "MM/dd/yyyy") : <span>mm/dd/yyyy</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button id="end-date" variant={"outline"} className="w-[260px] justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "MM/dd/yyyy") : <span>mm/dd/yyyy</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={{ before: startDate }} initialFocus />
                        </PopoverContent>
                    </Popover>
                  </div>
                  <Button onClick={handleApplyCustomRange}>Apply Custom Range</Button>
                </div>
              </PopoverContent>
            </Popover>
        </div>
      </div>
      
      <ContentWorkflow
        filter={filter}
        timeRange={timeRange}
        startDate={startDate}
        endDate={endDate}
        noItemsMessage="There are no removed or canceled items to recover or delete."
        renderItem={(item: any, refresh) => <RecoveryCard item={item} onAction={refresh} />}
      />
    </div>
  );
}
