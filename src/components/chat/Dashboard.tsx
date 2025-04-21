
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatFilter, ChatListItem, ChatDetailResponse } from '@/types/chat';
import { 
  fetchChats, 
  fetchChatById, 
  updateChat, 
  exportChatAsJson, 
  exportChatAsText 
} from '@/api/chatService';
import useChatWebSocket from '@/hooks/useChatWebSocket';
import ChatList from './ChatList';
import ChatDetailView from './ChatDetailView';
import FilterPanel from './FilterPanel';
import Pagination from './Pagination';
import { Badge } from '@/components/ui/badge';

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
  
  // Set up WebSocket connection
  const { isConnected, reconnect } = useChatWebSocket({
    onNewMessage: (data) => {
      // If the message is for the currently selected chat, show a notification
      if (selectedChatId === data.chatId) {
        console.log('New message received:', data.message);
      }
    },
    onChatStatusChanged: (data) => {
      console.log('Chat status changed:', data);
    },
    onConnectionChange: (status) => {
      setConnectionStatus(status);
    }
  });

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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customer Chat Dashboard</h1>
        <div className="flex items-center gap-2">
          <Badge variant={connectionStatus === 'connected' ? 'success' : 'destructive'}>
            {connectionStatus === 'connected' ? 'WebSocket Connected' : 'WebSocket Disconnected'}
          </Badge>
          {connectionStatus === 'disconnected' && (
            <button 
              onClick={reconnect}
              className="text-sm text-blue-600 hover:underline"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>
      
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chat List Panel */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Chats</h2>
          
          <ChatList
            chats={chatListData?.chats || []}
            isLoading={isLoadingChatList}
            onChatSelect={handleChatSelect}
            selectedChatId={selectedChatId || undefined}
          />
          
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
        
        {/* Chat Detail Panel */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Chat Detail</h2>
          
          {selectedChatId ? (
            chatDetailData ? (
              <ChatDetailView
                chatInfo={chatDetailData.chatInfo}
                messages={chatDetailData.messages}
                isLoading={isLoadingChatDetail}
                onTakeOverChat={handleTakeOverChat}
                onReturnToAI={handleReturnToAI}
                onExportChat={handleExportChat}
              />
            ) : isLoadingChatDetail ? (
              <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center">
                <p>Loading chat details...</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center">
                <p>Failed to load chat details.</p>
              </div>
            )
          ) : (
            <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center">
              <p>Select a chat to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
