import React, { useState, useCallback } from 'react';
import { 
  ColumnDef, 
  flexRender, 
  getCoreRowModel, 
  getSortedRowModel, 
  SortingState, 
  useReactTable 
} from '@tanstack/react-table';
import { ChatListItem } from '@/types/chat';
import { formatChatListDate } from '@/utils/dateUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';

interface ChatListProps {
  chats: ChatListItem[];
  isLoading: boolean;
  onChatSelect: (chatId: number) => void;
  selectedChatId?: number;
}

const ChatList: React.FC<ChatListProps> = ({ 
  chats, 
  isLoading, 
  onChatSelect,
  selectedChatId
}) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'last_message_at', desc: true }
  ]);

  // Ensure chats is always an array and handle null/undefined cases
  const safeChats = Array.isArray(chats) ? chats : [];
  
  // Prevent unnecessary re-renders
  const handleRowClick = useCallback((chatId: number) => {
    onChatSelect(chatId);
  }, [onChatSelect]);

  const columns: ColumnDef<ChatListItem>[] = [
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ row }) => {
        const isUnread = row.original.waiting;
        return (
          <div className="flex items-center">
            <Circle
              style={{
                color: isUnread ? 'var(--color-green-500)' : 'var(--color-gray-400)',
                width: '0.75rem',
                height: '0.75rem',
                fill: 'currentColor'
              }}
            />
          </div>
        );
      }
    },
    {
      accessorKey: 'uuid',
      header: 'ID',
      cell: ({ row }) => {
        const uuid = row.getValue('uuid') as string;
        const messageCount = row.original.message_count;
        const messagePreview = messageCount > 0 ? `Сообщений: ${messageCount}` : "Нет сообщений";
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)', color: 'var(--foreground)' }}>
              {uuid.substring(0, 8)}...
            </div>
            <div style={{ 
              fontSize: 'var(--font-size-xs)', 
              color: 'var(--muted-foreground)', 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '200px'
            }}>
              {messagePreview}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'ai',
      header: 'Агент',
      cell: ({ row }) => {
        const isAi = row.getValue('ai') as boolean;
        return (
          <span className={`badge ${isAi ? "badge-outline" : "badge-secondary"}`}>
            {isAi ? 'ИИ' : 'Человек'}
          </span>
        );
      }
    },
    {
      accessorKey: 'last_message_at',
      header: 'Время',
      cell: ({ row }) => {
        const timestamp = row.getValue('last_message_at') as string;
        return <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--foreground)' }}>{formatChatListDate(timestamp)}</span>;
      }
    }
  ];

  const table = useReactTable({
    data: safeChats,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-md border" style={{ borderColor: 'var(--border)' }}>
      <table className="table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} style={{ backgroundColor: 'var(--muted)' }}>
              {headerGroup.headers.map((header) => (
                <th 
                  key={header.id} 
                  className="cursor-pointer" 
                  style={{ color: 'var(--muted-foreground)' }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  <span style={{ marginLeft: 'var(--spacing-1)' }}>
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted() as string] ?? ''}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td 
                colSpan={columns.length} 
                className="text-center" 
                style={{ height: '6rem', color: 'var(--muted-foreground)' }}
              >
                Загрузка чатов...
              </td>
            </tr>
          ) : safeChats.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <tr 
                key={row.id} 
                onClick={() => handleRowClick(row.original.id)}
                className="cursor-pointer transition"
                style={{
                  backgroundColor: selectedChatId === row.original.id ? 'var(--accent)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (selectedChatId !== row.original.id) {
                    e.currentTarget.style.backgroundColor = 'var(--muted)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedChatId !== row.original.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                data-state={selectedChatId === row.original.id ? 'selected' : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={{ color: 'var(--foreground)' }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td 
                colSpan={columns.length} 
                className="text-center" 
                style={{ height: '6rem', color: 'var(--muted-foreground)' }}
              >
                Чаты не найдены.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ChatList;
