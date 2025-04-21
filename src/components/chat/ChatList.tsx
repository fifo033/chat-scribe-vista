
import React, { useState } from 'react';
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

  const columns: ColumnDef<ChatListItem>[] = [
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ row }) => {
        const waiting = row.original.waiting;
        return (
          <Circle
            className={`${waiting ? 'text-destructive' : 'text-green-500'} w-3 h-3 fill-current`}
          />
        );
      }
    },
    {
      accessorKey: 'uuid',
      header: 'ID',
      cell: ({ row }) => {
        const uuid = row.getValue('uuid') as string;
        const waiting = row.original.waiting;
        const lastMessage = "Последнее сообщение..."; // Replace with actual last message when available
        
        return (
          <div className="space-y-1">
            <div className="font-mono text-sm">{uuid.substring(0, 8)}...</div>
            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
              {lastMessage}
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
          <Badge variant={isAi ? "outline" : "secondary"}>
            {isAi ? 'ИИ' : 'Человек'}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'last_message_at',
      header: 'Время',
      cell: ({ row }) => {
        const timestamp = row.getValue('last_message_at') as string;
        return <span className="text-sm">{formatChatListDate(timestamp)}</span>;
      }
    }
  ];

  const table = useReactTable({
    data: chats,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="cursor-pointer" onClick={header.column.getToggleSortingHandler()}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  <span className="ml-1">
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted() as string] ?? ''}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Загрузка чатов...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow 
                key={row.id} 
                onClick={() => onChatSelect(row.original.id)}
                className={`cursor-pointer ${selectedChatId === row.original.id ? 'bg-accent' : ''}`}
                data-state={selectedChatId === row.original.id ? 'selected' : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Чаты не найдены.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ChatList;
