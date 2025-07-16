import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatFilter, ChatListItem, ChatDetailResponse } from '@/types/chat';
import { 
  fetchChats, 
  fetchChatById, 
  updateChat, 
  exportChatAsJson, 
  exportChatAsText,
  sendMessage
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
  const [pageSize] = useState(5);
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
  
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      if (selectedChatId) {
        queryClient.invalidateQueries({ queryKey: ['chat', selectedChatId] });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [queryClient, selectedChatId]);

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
        sortConfig.order,
        searchQuery
      ),
  });

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

  const handleChatSelect = async (chatId: number) => {
    if (selectedChatId === chatId) return;
    
    setSelectedChatId(chatId);
    
    try {
      await updateChat(chatId, { waiting: false });
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['chats'] }),
        queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
      ]);
      
      await refetchChatDetail();
    } catch (error) {
      console.error('Failed to mark chat as read:', error);
      setSelectedChatId(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleFilterChange = (newFilters: ChatFilter) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
    refetchChatList();
  };

  const handleTakeOverChat = async () => {
    if (!selectedChatId) return;
    
    try {
      await updateChat(selectedChatId, { waiting: true, ai: false });
      
      queryClient.invalidateQueries({ queryKey: ['chat', selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      
      refetchChatDetail();
    } catch (error) {
      console.error('Failed to take over chat:', error);
    }
  };

  const handleReturnToAI = async () => {
    if (!selectedChatId) return;
    
    try {
      await updateChat(selectedChatId, { waiting: false, ai: true });
      
      queryClient.invalidateQueries({ queryKey: ['chat', selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      
      refetchChatDetail();
    } catch (error) {
      console.error('Failed to return chat to AI:', error);
    }
  };

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

  const handleSendMessage = async () => {
    if (!selectedChatId || !newMessage.trim()) return;
    
    try {
      await sendMessage(selectedChatId, newMessage, 'answer', false);
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat', selectedChatId] });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="container mx-auto p-4" style={{ backgroundColor: 'var(--background)', minHeight: 'calc(100vh - 2rem)' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Панель управления чатами</h1>
      </div>
      
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />
      
      <div className="resizable-panel-group" style={{ minHeight: '600px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <div className="resizable-panel" style={{ width: '45%', minWidth: '35%' }}>
          <div className="h-full p-4" style={{ backgroundColor: 'var(--background)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Чаты</h2>
            {isLoadingChatList ? (
              <div className="flex items-center justify-center" style={{ height: '6rem' }}>
                <p>Загрузка чатов...</p>
              </div>
            ) : (
              <ChatList
                chats={chatListData?.chats || []}
                isLoading={isLoadingChatList}
                onChatSelect={handleChatSelect}
                selectedChatId={selectedChatId || undefined}
              />
            )}
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={Math.ceil((chatListData?.total || 0) / pageSize)}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
        
        <div className="resizable-handle"></div>
        
        <div className="resizable-panel" style={{ width: '55%' }}>
          <div className="h-full p-4 flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Детали чата</h2>
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
                  <div className="mt-4 p-4 rounded-lg border shadow-lg" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Написать сообщение..."
                        className="textarea flex-1"
                        style={{ minHeight: '60px', resize: 'none' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button 
                        className="button button-primary"
                        style={{ alignSelf: 'flex-end' }}
                        aria-label="Отправить сообщение"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <Send style={{ height: '1.25rem', width: '1.25rem' }} />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>Загрузка деталей чата...</p>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full">
                <p>Выберите чат для просмотра деталей</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
