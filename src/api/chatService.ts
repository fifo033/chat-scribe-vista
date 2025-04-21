import { ChatDetailResponse, ChatFilter, ChatListResponse } from "@/types/chat";

// Base URL for API calls
const API_BASE_URL = 'http://82.202.143.118:3001/api';

// Polling interval in milliseconds
const POLLING_INTERVAL = 5000;

// Store the last fetched data for comparison
let lastChats: any[] = [];
let lastMessages: { [key: number]: any[] } = {};

// Callbacks for updates
const updateCallbacks: Map<string, Function[]> = new Map();

// Start polling for updates
function startPolling() {
  setInterval(async () => {
    try {
      // Fetch latest chats
      const chatsResponse = await fetch(`${API_BASE_URL}/chats`);
      if (!chatsResponse.ok) throw new Error('Failed to fetch chats');
      const newChats = await chatsResponse.json();

      // Check for changes in chats
      if (JSON.stringify(newChats) !== JSON.stringify(lastChats)) {
        lastChats = newChats;
        notifyListeners('chatListUpdated', { chats: newChats });
      }

      // Check for changes in messages for each chat
      for (const chat of newChats) {
        const messagesResponse = await fetch(`${API_BASE_URL}/messages/${chat.id}`);
        if (!messagesResponse.ok) continue;
        const newMessages = await messagesResponse.json();

        if (JSON.stringify(newMessages) !== JSON.stringify(lastMessages[chat.id] || [])) {
          lastMessages[chat.id] = newMessages;
          notifyListeners('messagesUpdated', { chatId: chat.id, messages: newMessages });
        }
      }
    } catch (error) {
      console.error('Error during polling:', error);
    }
  }, POLLING_INTERVAL);
}

// Start polling when the service is imported
startPolling();

// Notify listeners of updates
function notifyListeners(event: string, data: any) {
  const callbacks = updateCallbacks.get(event) || [];
  callbacks.forEach(callback => {
    try {
      callback(data);
    } catch (error) {
      console.error('Error in update callback:', error);
    }
  });
}

// Subscribe to updates
export function subscribe(event: string, callback: Function) {
  if (!updateCallbacks.has(event)) {
    updateCallbacks.set(event, []);
  }
  updateCallbacks.get(event)?.push(callback);
}

// Unsubscribe from updates
export function unsubscribe(event: string, callback: Function) {
  if (!updateCallbacks.has(event)) return;
  const callbacks = updateCallbacks.get(event) || [];
  updateCallbacks.set(
    event,
    callbacks.filter(cb => cb !== callback)
  );
}

// Send a new message
export async function sendMessage(chatId: number, message: string, messageType: 'question' | 'answer', ai: boolean | null = null): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        message,
        message_type: messageType,
        ai
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const newMessage = await response.json();
    notifyListeners('newMessage', { chatId, message: newMessage });
    return newMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Fetch list of chats with pagination and filtering
export async function fetchChats(
  page: number, 
  pageSize: number, 
  filters: ChatFilter = {},
  sortField: string = 'last_message_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<ChatListResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/chats`);
    if (!response.ok) {
      throw new Error('Failed to fetch chats');
    }
    const chats = await response.json();
    
    // Apply filters on the client side since our simple backend doesn't support filtering
    let filteredChats = [...chats];
    
    if (filters.waiting !== undefined && filters.waiting !== null) {
      filteredChats = filteredChats.filter(chat => chat.waiting === filters.waiting);
    }
    
    if (filters.ai !== undefined && filters.ai !== null) {
      filteredChats = filteredChats.filter(chat => chat.ai === filters.ai);
    }
    
    if (filters.dateRange?.startDate) {
      const startTime = filters.dateRange.startDate.getTime();
      filteredChats = filteredChats.filter(chat => new Date(chat.last_message_at).getTime() >= startTime);
    }
    
    if (filters.dateRange?.endDate) {
      const endTime = filters.dateRange.endDate.getTime();
      filteredChats = filteredChats.filter(chat => new Date(chat.last_message_at).getTime() <= endTime);
    }

    // Sort
    filteredChats.sort((a, b) => {
      let valueA, valueB;
      
      if (sortField === 'last_message_at') {
        valueA = new Date(a.last_message_at).getTime();
        valueB = new Date(b.last_message_at).getTime();
      } else if (sortField === 'message_count') {
        valueA = a.message_count;
        valueB = b.message_count;
      } else if (sortField === 'uuid') {
        valueA = a.uuid;
        valueB = b.uuid;
      } else if (sortField === 'waiting') {
        valueA = a.waiting ? 1 : 0;
        valueB = b.waiting ? 1 : 0;
      } else if (sortField === 'ai') {
        valueA = a.ai ? 1 : 0;
        valueB = b.ai ? 1 : 0;
      } else {
        valueA = a.id;
        valueB = b.id;
      }
      
      return sortOrder === 'asc' 
        ? (valueA > valueB ? 1 : -1)
        : (valueA < valueB ? 1 : -1);
    });

    // Apply pagination
    const paginatedChats = filteredChats.slice((page - 1) * pageSize, page * pageSize);
    const total = filteredChats.length;

    return {
      chats: paginatedChats,
      total
    };
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
}

// Fetch a single chat with all its messages
export async function fetchChatById(chatId: number): Promise<ChatDetailResponse> {
  try {
    const [chatResponse, messagesResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/chats/${chatId}`),
      fetch(`${API_BASE_URL}/messages/${chatId}`)
    ]);

    if (!chatResponse.ok || !messagesResponse.ok) {
      throw new Error('Failed to fetch chat details');
    }

    const chatInfo = await chatResponse.json();
    const messages = await messagesResponse.json();

    return {
      chatInfo,
      messages
    };
  } catch (error) {
    console.error('Error fetching chat details:', error);
    throw error;
  }
}

// Update chat properties (waiting, ai, read)
export async function updateChat(
  chatId: number, 
  updates: Partial<{ 
    waiting: boolean, 
    ai: boolean,
    read: boolean 
  }>
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update chat');
    }

    return true;
  } catch (error) {
    console.error('Error updating chat:', error);
    throw error;
  }
}

// Export chat as JSON
export async function exportChatAsJson(chatId: number): Promise<Blob> {
  const chatData = await fetchChatById(chatId);
  const jsonBlob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
  return jsonBlob;
}

// Export chat as text
export async function exportChatAsText(chatId: number): Promise<Blob> {
  const chatData = await fetchChatById(chatId);
  
  // Import from our utilities
  const { formatChatAsText } = await import('../utils/exportUtils');
  const textContent = formatChatAsText(chatData.chatInfo, chatData.messages);
  
  return new Blob([textContent], { type: 'text/plain' });
}

