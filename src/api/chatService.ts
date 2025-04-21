
import { ChatDetailResponse, ChatFilter, ChatListResponse } from "@/types/chat";

// Base URL for API calls
const API_BASE_URL = '/api';

// Fetch list of chats with pagination and filtering
export async function fetchChats(
  page: number, 
  pageSize: number, 
  filters: ChatFilter = {},
  sortField: string = 'last_message_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<ChatListResponse> {
  // In a real app, we'd use these params to fetch from the API
  // For now, return mock data
  return mockFetchChats(page, pageSize, filters, sortField, sortOrder);
}

// Fetch a single chat with all its messages
export async function fetchChatById(chatId: number): Promise<ChatDetailResponse> {
  // In a real app, we'd fetch from the API
  // For now, return mock data
  return mockFetchChatById(chatId);
}

// Update chat properties (waiting, ai)
export async function updateChat(chatId: number, updates: Partial<{ waiting: boolean, ai: boolean }>): Promise<boolean> {
  // In a real app, we'd make a PUT/PATCH request
  console.log(`Updating chat ${chatId} with:`, updates);
  return true;
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

// Mock data implementation
function mockFetchChats(
  page: number, 
  pageSize: number, 
  filters: ChatFilter,
  sortField: string,
  sortOrder: 'asc' | 'desc'
): Promise<ChatListResponse> {
  let mockChats = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    uuid: `chat-${Math.random().toString(36).substring(2, 10)}`,
    waiting: Math.random() > 0.7,
    ai: Math.random() > 0.3,
    last_message_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    message_count: Math.floor(Math.random() * 50) + 1
  }));

  // Apply filters
  if (filters.waiting !== undefined && filters.waiting !== null) {
    mockChats = mockChats.filter(chat => chat.waiting === filters.waiting);
  }
  
  if (filters.ai !== undefined && filters.ai !== null) {
    mockChats = mockChats.filter(chat => chat.ai === filters.ai);
  }
  
  if (filters.dateRange?.startDate) {
    const startTime = filters.dateRange.startDate.getTime();
    mockChats = mockChats.filter(chat => new Date(chat.last_message_at).getTime() >= startTime);
  }
  
  if (filters.dateRange?.endDate) {
    const endTime = filters.dateRange.endDate.getTime();
    mockChats = mockChats.filter(chat => new Date(chat.last_message_at).getTime() <= endTime);
  }

  // Sort
  mockChats.sort((a, b) => {
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
  const paginatedChats = mockChats.slice((page - 1) * pageSize, page * pageSize);
  const total = mockChats.length;

  return Promise.resolve({
    chats: paginatedChats,
    total
  });
}

function mockFetchChatById(chatId: number): Promise<ChatDetailResponse> {
  const messageCount = Math.floor(Math.random() * 20) + 5;
  const isAi = Math.random() > 0.3;
  const isWaiting = Math.random() > 0.7;
  
  const chatInfo = {
    id: chatId,
    uuid: `chat-${Math.random().toString(36).substring(2, 10)}`,
    waiting: isWaiting,
    ai: isAi
  };
  
  const messages = Array.from({ length: messageCount }, (_, i) => {
    const isQuestion = i % 2 === 0;
    const messageTime = new Date(Date.now() - (messageCount - i) * 5 * 60 * 1000).toISOString();
    
    return {
      id: 1000 + i,
      created_at: messageTime,
      message: isQuestion 
        ? generateQuestionMessage() 
        : generateAnswerMessage(),
      message_type: isQuestion ? 'question' as const : 'answer' as const,
      ai: isQuestion ? null : (i < messageCount - 2 ? isAi : false)
    };
  });
  
  return Promise.resolve({
    chatInfo,
    messages
  });
}

function generateQuestionMessage(): string {
  const questions = [
    "Hello, I have a question about my order.",
    "Can you help me with my account?",
    "I'm trying to find information about your services.",
    "I'd like to know more about your pricing.",
    "Is there a way to expedite my shipment?",
    "I think there's an issue with my recent purchase.",
    "How do I reset my password?",
    "What are your business hours?",
    "Do you offer international shipping?",
    "Can I get a refund for my order?"
  ];
  
  return questions[Math.floor(Math.random() * questions.length)];
}

function generateAnswerMessage(): string {
  const answers = [
    "I'd be happy to help you with your order. Could you please provide your order number?",
    "Of course! I can assist with your account. What specific issue are you experiencing?",
    "You can find detailed information about our services on our website, but I can also answer any specific questions you have.",
    "Our pricing varies based on the package you select. The basic package starts at $29.99 per month.",
    "Yes, we offer expedited shipping options. There's an additional fee of $15 for next-day delivery.",
    "I'm sorry to hear that. Let me look into your purchase and see what might be wrong.",
    "To reset your password, please go to the login page and click on 'Forgot Password'. You'll receive an email with instructions.",
    "Our customer service team is available Monday through Friday, 9 AM to 6 PM Eastern Time.",
    "Yes, we do offer international shipping to most countries. Shipping costs and delivery times vary by location.",
    "We offer full refunds within 30 days of purchase. Please provide your order number so I can process that for you."
  ];
  
  return answers[Math.floor(Math.random() * answers.length)];
}
