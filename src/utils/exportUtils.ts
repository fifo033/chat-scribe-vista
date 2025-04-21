
import { Message, ChatInfo } from "@/types/chat";
import { formatMoscowFullDate } from "./dateUtils";

// Format a chat export for text output
export const formatChatAsText = (
  chatInfo: ChatInfo,
  messages: Message[]
): string => {
  let textContent = `Chat ID: ${chatInfo.uuid}\n`;
  textContent += `Status: ${chatInfo.waiting ? 'Waiting' : 'Active'}\n`;
  textContent += `Agent: ${chatInfo.ai ? 'AI' : 'Human'}\n\n`;
  textContent += `CHAT HISTORY (${messages.length} messages):\n`;
  textContent += `-----------------------------------\n\n`;
  
  messages.forEach(msg => {
    const time = formatMoscowFullDate(msg.created_at);
    const type = msg.message_type === 'question' ? 'Q' : 'A';
    const agent = msg.ai === null 
      ? 'Customer' 
      : msg.ai 
        ? 'AI' 
        : 'Human Agent';
    
    textContent += `[${time}] [${type}] [${agent}]:\n${msg.message}\n\n`;
  });
  
  return textContent;
};

// Download a file with the chat data
export const downloadFile = (
  data: string | object, 
  filename: string, 
  type: 'text/plain' | 'application/json'
): void => {
  const content = typeof data === 'string' 
    ? data 
    : JSON.stringify(data, null, 2);
    
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
