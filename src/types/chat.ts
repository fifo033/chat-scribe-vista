
export interface ChatListItem {
  id: number;
  uuid: string;
  waiting: boolean;
  ai: boolean;
  last_message_at: string;
  message_count: number;
}

export interface ChatListResponse {
  chats: ChatListItem[];
  total: number;
}

export interface ChatInfo {
  id: number;
  uuid: string;
  waiting: boolean;
  ai: boolean;
}

export interface Message {
  id: number;
  created_at: string;
  message: string;
  message_type: 'question' | 'answer';
  ai: boolean | null;
}

export interface ChatDetailResponse {
  chatInfo: ChatInfo;
  messages: Message[];
}

export interface ChatFilter {
  waiting?: boolean | null;
  ai?: boolean | null;
  dateRange?: {
    startDate: Date | null;
    endDate: Date | null;
  };
}
