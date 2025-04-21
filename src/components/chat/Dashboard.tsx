
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatFilter, ChatListItem, ChatDetailResponse } from '@/types/chat';
import { 
  fetchChats, 
  fetchChatById, 
  updateChat, 
  exportChatAsJson, 
  exportChatAsText 
} from '@/api/chatService';
import ChatList from './ChatList';
import ChatDetailView from './ChatDetailView';
import FilterPanel from './FilterPanel';
import Pagination from './Pagination';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [newMessage, setNewMessage] = useState('');
  const [filters, setFilters] = useState<ChatFilter>({
    waiting: null,
    ai: null,
    dateRange: {
      startDate: null,
      endDate: null,
    },
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    field: 'last_message_at',
    order: 'desc' as 'asc' | 'desc',
  });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  
  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      if (selectedChatId) {
        queryClient.invalidateQueries({ queryKey: ['chat', selectedChatId] });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [queryClient, selectedChatId]);

  // Fetch chat list
  const {
    data: chatListData,
    isLoading: isLoadingChatList,
    refetch: refetchChatList,
  } = useQuery({
    queryKey: ['chats', page, pageSize, filters, searchQuery, sortConfig],
    queryFn: () => 
      fetchChats(
        page, 
        pageSize, 
        filters, 
        sortConfig.field, 
        sortConfig.order
      ),
  });

  // Fetch selected chat details
  const {
    data: chatDetailData,
    isLoading: isLoadingChatDetail,
    refetch: refetchChatDetail,
  } = useQuery({
    queryKey: ['chat', selectedChatId],
    queryFn: () => 
      selectedChatId 
        ? fetchChatById(selectedChatId) 
        : Promise.reject('No chat selected'),
    enabled: !!selectedChatId,
  });

  // Handle chat selection
  const handleChatSelect = (chatId: number) => {
    setSelectedChatId(chatId);
  };

  // Handle filters change
  const handleFilterChange = (newFilters: ChatFilter) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page
  };

  // Handle take over chat
  const handleTakeOverChat = async () => {
    if (!selectedChatId) return;
    
    try {
      await updateChat(selectedChatId, { waiting: true, ai: false });
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['chat', selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      
      // Refetch the current chat
      refetchChatDetail();
    } catch (error) {
      console.error('Failed to take over chat:', error);
    }
  };

  // Handle return to AI
  const handleReturnToAI = async () => {
    if (!selectedChatId) return;
    
    try {
      await updateChat(selectedChatId, { waiting: false, ai: true });
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['chat', selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      
      // Refetch the current chat
      refetchChatDetail();
    } catch (error) {
      console.error('Failed to return chat to AI:', error);
    }
  };

  // Handle export chat
  const handleExportChat = async (format: 'json' | 'text') => {
    if (!selectedChatId) return;
    
    try {
      let blob: Blob;
      let filename: string;
      
      if (format === 'json') {
        blob = await exportChatAsJson(selectedChatId);
        filename = `chat_${selectedChatId}_export.json`;
      } else {
        blob = await exportChatAsText(selectedChatId);
        filename = `chat_${selectedChatId}_export.txt`;
      }
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Failed to export chat as ${format}:`, error);
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil((chatListData?.total || 0) / pageSize);

  return (
    <div className="container mx-auto p-4 dark:bg-zinc-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Панель управления чатами</h1>
      </div>
      
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />
      
      <ResizablePanelGroup direction="horizontal" className="min-h-[800px] rounded-lg border dark:border-zinc-800">
        {/* Chat List Panel */}
        <ResizablePanel defaultSize={25} minSize={20}>
          <div className="h-full p-4 bg-background dark:bg-zinc-900">
            <h2 className="text-xl font-semibold mb-4">Чаты</h2>
            <ChatList
              chats={chatListData?.chats || []}
              isLoading={isLoadingChatList}
              onChatSelect={handleChatSelect}
              selectedChatId={selectedChatId || undefined}
            />
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={Math.ceil((chatListData?.total || 0) / pageSize)}
                onPageChange={setPage}
              />
            </div>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Chat Detail Panel */}
        <ResizablePanel defaultSize={75}>
          <div className="h-full p-4 bg-background dark:bg-zinc-900 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Детали чата</h2>
            {selectedChatId ? (
              chatDetailData ? (
                <div className="flex flex-col h-full">
                  <div className="flex-grow overflow-auto">
                    <ChatDetailView
                      chatInfo={chatDetailData.chatInfo}
                      messages={chatDetailData.messages}
                      isLoading={isLoadingChatDetail}
                      onTakeOverChat={handleTakeOverChat}
                      onReturnToAI={handleReturnToAI}
                      onExportChat={handleExportChat}
                    />
                  </div>
                  <div className="mt-4 p-4 bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700 shadow-lg">
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Написать сообщение..."
                        className="flex-1 min-h-[60px] resize-none dark:bg-zinc-900 dark:text-white"
                      />
                      <Button className="self-end bg-primary hover:bg-primary/90 dark:bg-zinc-700 dark:hover:bg-zinc-600">
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : isLoadingChatDetail ? (
                <div className="flex items-center justify-center h-full">
                  <p>Загрузка деталей чата...</p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>Не удалось загрузить детали чата.</p>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full">
                <p>Выберите чат для просмотра деталей.</p>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Dashboard;
