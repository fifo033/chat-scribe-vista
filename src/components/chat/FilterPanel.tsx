
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
    <div style={{ 
      backgroundColor: 'var(--card)', 
      padding: 'var(--spacing-4)', 
      borderRadius: 'var(--radius-lg)', 
      boxShadow: 'var(--shadow)', 
      marginBottom: 'var(--spacing-6)',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: 'var(--spacing-4)'
    }}>
      <div>
        <Label htmlFor="status">Статус</Label>
        <div style={{ position: 'relative' }}>
          <select
            id="status"
            value={statusValue}
            onChange={handleStatusChange}
            className="input"
            style={{ width: '100%' }}
          >
            <option value="all">Все статусы</option>
            <option value="waiting">Ожидание</option>
            <option value="active">Активные</option>
          </select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="agent">Тип агента</Label>
        <div style={{ position: 'relative' }}>
          <select
            id="agent"
            value={agentValue}
            onChange={handleAgentChange}
            className="input"
            style={{ width: '100%' }}
          >
            <option value="all">Все агенты</option>
            <option value="ai">ИИ</option>
            <option value="human">Человек</option>
          </select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="dateRange">Период</Label>
        <div className="flex items-center gap-2">
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
            className="input"
            placeholderText="Выберите период"
          />
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск чатов..."
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch}>Поиск</Button>
        </div>
        
        <Button variant="outline" onClick={handleReset}>
          Сбросить фильтры
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;
