
import { ChatDetailResponse, ChatListResponse } from "@/types/chat";

// This is a mock WebSocket service for demonstration purposes
// In a real app, you would connect to a real WebSocket server

export class ChatWebSocketService {
  private static instance: ChatWebSocketService;
  private callbacks: Map<string, Function[]> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number = 2000;

  // Private constructor (singleton pattern)
  private constructor() {
    this.connect();
  }

  // Get singleton instance
  public static getInstance(): ChatWebSocketService {
    if (!ChatWebSocketService.instance) {
      ChatWebSocketService.instance = new ChatWebSocketService();
    }
    return ChatWebSocketService.instance;
  }

  // Connect to WebSocket server
  private connect(): void {
    console.log('Connecting to WebSocket server...');
    
    // Simulate connection success after 1 second
    setTimeout(() => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('WebSocket connected');
      
      // Notify listeners
      this.notifyListeners('connection', { status: 'connected' });
      
      // Start mock message simulator
      this.startMessageSimulator();
    }, 1000);
  }

  // Reconnect to WebSocket server
  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`Reconnecting (attempt ${this.reconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectTimeout * this.reconnectAttempts);
  }

  // Disconnect from WebSocket server
  public disconnect(): void {
    this.isConnected = false;
    console.log('WebSocket disconnected');
    
    // Notify listeners
    this.notifyListeners('connection', { status: 'disconnected' });
  }

  // Subscribe to events
  public subscribe(event: string, callback: Function): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)?.push(callback);
  }

  // Unsubscribe from events
  public unsubscribe(event: string, callback: Function): void {
    if (!this.callbacks.has(event)) return;
    
    const callbacks = this.callbacks.get(event) || [];
    this.callbacks.set(
      event,
      callbacks.filter(cb => cb !== callback)
    );
  }

  // Notify listeners of an event
  private notifyListeners(event: string, data: any): void {
    if (!this.callbacks.has(event)) return;
    
    const callbacks = this.callbacks.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in WebSocket callback:', error);
      }
    });
  }

  // Simulate real-time updates for demonstration
  private startMessageSimulator(): void {
    // Simulate new message every 30 seconds
    setInterval(() => {
      if (!this.isConnected) return;
      
      // Random chat ID between 1 and 50
      const chatId = Math.floor(Math.random() * 50) + 1;
      
      // Simulate a new message
      const newMessage = {
        id: Math.floor(Math.random() * 10000) + 1000,
        created_at: new Date().toISOString(),
        message: `This is a simulated real-time message (${new Date().toLocaleTimeString()})`,
        message_type: Math.random() > 0.5 ? 'question' : 'answer',
        ai: Math.random() > 0.7 ? (Math.random() > 0.5) : null
      };
      
      // Notify listeners of the new message
      this.notifyListeners('newMessage', { chatId, message: newMessage });
      
      // Notify listeners of the updated chat list
      this.notifyListeners('chatListUpdated', { chatId });
    }, 30000);
    
    // Simulate chat status changes every minute
    setInterval(() => {
      if (!this.isConnected) return;
      
      // Random chat ID between 1 and 50
      const chatId = Math.floor(Math.random() * 50) + 1;
      
      // Simulate a status change
      const statusChange = {
        waiting: Math.random() > 0.5,
        ai: Math.random() > 0.3
      };
      
      // Notify listeners of the status change
      this.notifyListeners('chatStatusChanged', { chatId, ...statusChange });
    }, 60000);
  }

  // Check if connected
  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }
}

export default ChatWebSocketService;
