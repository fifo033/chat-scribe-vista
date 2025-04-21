
import React, { useState, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Message, ChatInfo } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import MessageBubble from './MessageBubble';

interface ChatDetailViewProps {
  chatInfo: ChatInfo;
  messages: Message[];
  isLoading: boolean;
  onTakeOverChat: () => void;
  onReturnToAI: () => void;
  onExportChat: (format: 'json' | 'text') => void;
}

const ChatDetailView: React.FC<ChatDetailViewProps> = ({
  chatInfo,
  messages,
  isLoading,
  onTakeOverChat,
  onReturnToAI,
  onExportChat,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<Message[]>(messages);
  const parentRef = useRef<HTMLDivElement>(null);

  // Filter messages when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMessages(messages);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredMessages(
        messages.filter(msg => 
          msg.message.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, messages]);

  // Set up virtualization for message list
  const rowVirtualizer = useVirtualizer({
    count: filteredMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated height of a message bubble
    overscan: 5,
  });

  // Scroll to bottom on initial load
  useEffect(() => {
    if (parentRef.current && messages.length > 0 && !searchTerm) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [messages.length, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Chat header with info and actions */}
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Chat #{chatInfo.uuid.substring(0, 8)}...
            {chatInfo.waiting && (
              <Badge variant="destructive">Waiting</Badge>
            )}
            <Badge variant={chatInfo.ai ? "outline" : "success"}>
              {chatInfo.ai ? 'AI' : 'Human'}
            </Badge>
          </h2>
        </div>
        <div className="flex gap-2">
          {chatInfo.ai ? (
            <Button 
              variant="secondary" 
              onClick={onTakeOverChat}
              disabled={isLoading}
            >
              Take Over Chat
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={onReturnToAI}
              disabled={isLoading}
            >
              Return to AI
            </Button>
          )}
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              onClick={() => onExportChat('json')}
              disabled={isLoading}
            >
              Export JSON
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onExportChat('text')}
              disabled={isLoading}
            >
              Export Text
            </Button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="p-4 border-b">
        <Input
          type="text"
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Messages container with virtualization */}
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <p>Loading messages...</p>
        </div>
      ) : (
        <div 
          ref={parentRef}
          className="flex-grow overflow-auto p-4"
          style={{ height: 'calc(100vh - 250px)' }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <MessageBubble message={filteredMessages[virtualRow.index]} />
              </div>
            ))}
          </div>
          
          {filteredMessages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatDetailView;
