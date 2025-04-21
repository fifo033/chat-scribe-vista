
import React from 'react';
import { Message } from '@/types/chat';
import { Badge } from '@/components/ui/badge';
import { formatMoscowTime, formatMoscowFullDate } from '@/utils/dateUtils';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  // Determine if this is a customer message
  const isCustomer = message.ai === null;
  
  // Determine message alignment based on message type
  const isQuestion = message.message_type === 'question';
  
  // Determine if it's from AI or Human agent
  const isAI = message.ai === true;

  // Style classes based on message properties
  const containerClasses = `flex w-full mb-4 ${isQuestion ? 'justify-end' : 'justify-start'}`;
  
  const bubbleClasses = `
    max-w-[80%] rounded-lg p-3 relative
    ${isQuestion 
      ? 'bg-blue-100 text-blue-900 rounded-tr-none' 
      : isAI 
        ? 'bg-purple-100 text-purple-900 rounded-tl-none' 
        : 'bg-green-100 text-green-900 rounded-tl-none'
    }
  `;

  return (
    <div className={containerClasses}>
      <div className="flex flex-col">
        <div className={bubbleClasses}>
          <div className="flex items-center mb-1 gap-2">
            <Badge variant={isQuestion ? "secondary" : (isAI ? "outline" : "success")}>
              {isQuestion 
                ? '[Q] Customer' 
                : isAI 
                  ? '[A] AI' 
                  : '[A] Human Agent'
              }
            </Badge>
            <span 
              className="text-xs text-gray-500" 
              title={formatMoscowFullDate(message.created_at)}
            >
              {formatMoscowTime(message.created_at)}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
