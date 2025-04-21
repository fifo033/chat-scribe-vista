
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ChatFilter } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateRange } from '@/utils/dateUtils';

interface FilterPanelProps {
  filters: ChatFilter;
  onFilterChange: (filters: ChatFilter) => void;
  onSearch: (query: string) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  filters, 
  onFilterChange, 
  onSearch 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(filters.dateRange?.startDate || null);
  const [endDate, setEndDate] = useState<Date | null>(filters.dateRange?.endDate || null);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    let waiting: boolean | null = null;
    
    if (value === 'waiting') waiting = true;
    if (value === 'active') waiting = false;
    
    onFilterChange({ ...filters, waiting });
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    let ai: boolean | null = null;
    
    if (value === 'ai') ai = true;
    if (value === 'human') ai = false;
    
    onFilterChange({ ...filters, ai });
  };

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    
    onFilterChange({
      ...filters,
      dateRange: {
        startDate: start,
        endDate: end
      }
    });
  };

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleReset = () => {
    setSearchQuery('');
    setStartDate(null);
    setEndDate(null);
    onFilterChange({
      waiting: null,
      ai: null,
      dateRange: {
        startDate: null,
        endDate: null
      }
    });
    onSearch('');
  };

  const statusValue = filters.waiting === null 
    ? 'all' 
    : filters.waiting 
      ? 'waiting' 
      : 'active';
      
  const agentValue = filters.ai === null 
    ? 'all' 
    : filters.ai 
      ? 'ai' 
      : 'human';

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <Label htmlFor="status">Status</Label>
        <div className="relative">
          <select
            id="status"
            value={statusValue}
            onChange={handleStatusChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">All Statuses</option>
            <option value="waiting">Waiting</option>
            <option value="active">Active</option>
          </select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="agent">Agent Type</Label>
        <div className="relative">
          <select
            id="agent"
            value={agentValue}
            onChange={handleAgentChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">All Agents</option>
            <option value="ai">AI</option>
            <option value="human">Human</option>
          </select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="dateRange">Date Range</Label>
        <div className="flex items-center gap-2">
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
            className="border border-input rounded-md p-2 w-full"
            placeholderText="Select date range"
          />
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch}>Search</Button>
        </div>
        
        <Button variant="outline" onClick={handleReset}>
          Reset Filters
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;
