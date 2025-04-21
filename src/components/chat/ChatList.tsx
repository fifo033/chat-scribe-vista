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
        const isUnread = row.original.waiting;
        return (
          <div className="flex items-center">
            <Circle
              className={`${
                isUnread 
                  ? 'text-green-500' // Green for unread chats (waiting = true)
                  : 'text-gray-400' // Grey for read chats (waiting = false)
              } w-3 h-3 fill-current`}
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
          <div className="space-y-1">
            <div className="font-mono text-sm dark:text-zinc-300">{uuid.substring(0, 8)}...</div>
            <div className="text-xs text-muted-foreground truncate max-w-[200px] dark:text-zinc-400">
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
        return <span className="text-sm dark:text-zinc-300">{formatChatListDate(timestamp)}</span>;
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
    <div className="rounded-md border dark:border-zinc-800">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="dark:bg-zinc-800/50">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="cursor-pointer dark:text-zinc-400" onClick={header.column.getToggleSortingHandler()}>
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
              <TableCell colSpan={columns.length} className="h-24 text-center dark:text-zinc-400">
                Загрузка чатов...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow 
                key={row.id} 
                onClick={() => onChatSelect(row.original.id)}
                className={`cursor-pointer dark:hover:bg-zinc-800/50 ${
                  selectedChatId === row.original.id ? 'dark:bg-zinc-800 bg-accent' : ''
                }`}
                data-state={selectedChatId === row.original.id ? 'selected' : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="dark:text-zinc-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center dark:text-zinc-400">
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
