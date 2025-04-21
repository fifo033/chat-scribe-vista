
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import ChatWebSocketService from '@/api/websocketService';

interface UseChatWebSocketOptions {
  onNewMessage?: (data: any) => void;
  onChatStatusChanged?: (data: any) => void;
  onConnectionChange?: (status: 'connected' | 'disconnected') => void;
}

export function useChatWebSocket({
  onNewMessage,
  onChatStatusChanged,
  onConnectionChange
}: UseChatWebSocketOptions = {}) {
  const queryClient = useQueryClient();
  
  // Initialize WebSocket service on component mount
  useEffect(() => {
    const wsService = ChatWebSocketService.getInstance();
    
    // Handle new messages
    const handleNewMessage = (data: any) => {
      // Invalidate query cache for the specific chat
      queryClient.invalidateQueries({ queryKey: ['chat', data.chatId] });
      
      // Call the callback if provided
      if (onNewMessage) {
        onNewMessage(data);
      }
    };
    
    // Handle chat status changes
    const handleChatStatusChanged = (data: any) => {
      // Invalidate query cache for both the chat list and the specific chat
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat', data.chatId] });
      
      // Call the callback if provided
      if (onChatStatusChanged) {
        onChatStatusChanged(data);
      }
    };
    
    // Handle chat list updates
    const handleChatListUpdated = () => {
      // Invalidate query cache for the chat list
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    };
    
    // Handle connection changes
    const handleConnection = (data: { status: 'connected' | 'disconnected' }) => {
      if (onConnectionChange) {
        onConnectionChange(data.status);
      }
    };
    
    // Subscribe to events
    wsService.subscribe('newMessage', handleNewMessage);
    wsService.subscribe('chatStatusChanged', handleChatStatusChanged);
    wsService.subscribe('chatListUpdated', handleChatListUpdated);
    wsService.subscribe('connection', handleConnection);
    
    // Unsubscribe from events when component unmounts
    return () => {
      wsService.unsubscribe('newMessage', handleNewMessage);
      wsService.unsubscribe('chatStatusChanged', handleChatStatusChanged);
      wsService.unsubscribe('chatListUpdated', handleChatListUpdated);
      wsService.unsubscribe('connection', handleConnection);
    };
  }, [queryClient, onNewMessage, onChatStatusChanged, onConnectionChange]);
  
  // Method to check WebSocket connection status
  const isConnected = useCallback(() => {
    const wsService = ChatWebSocketService.getInstance();
    return wsService.isWebSocketConnected();
  }, []);
  
  // Method to manually reconnect WebSocket
  const reconnect = useCallback(() => {
    const wsService = ChatWebSocketService.getInstance();
    wsService.disconnect();
    setTimeout(() => {
      const newWsService = ChatWebSocketService.getInstance();
    }, 1000);
  }, []);
  
  return {
    isConnected,
    reconnect
  };
}

export default useChatWebSocket;
