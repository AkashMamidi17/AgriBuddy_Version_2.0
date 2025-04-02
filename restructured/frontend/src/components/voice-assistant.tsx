'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MicIcon, StopCircleIcon, SendIcon, ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWebSocket } from '@/hooks/use-websocket';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface Message {
  type: 'sent' | 'received';
  text: string;
  audioUrl?: string;
  imageUrl?: string;
}

export default function VoiceAssistant() {
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('te');
  const [sessionId, setSessionId] = useState<string>(`session_${Date.now()}`);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize WebSocket connection
  const { wsRef, isConnected, error, sendJsonMessage, sendBinaryMessage } = useWebSocket();
  
  // Handle WebSocket messages
  useEffect(() => {
    if (!wsRef.current) return;
    
    const handleMessage = async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'error') {
          toast({
            title: 'Error',
            description: data.payload.message,
            variant: 'destructive',
          });
          return;
        }
        
        if (data.type === 'response') {
          setIsProcessing(false);
          
          // Add the response to messages
          setMessages(prev => [
            ...prev,
            {
              type: 'received',
              text: data.payload.text || 'No response text',
              audioUrl: data.payload.audioUrl,
              imageUrl: data.payload.imageUrl,
            }
          ]);
          
          // Play audio if available
          if (data.payload.audioUrl) {
            const audio = new Audio(data.payload.audioUrl);
            await audio.play();
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    wsRef.current.addEventListener('message', handleMessage);
    
    // Initialize session
    if (isConnected) {
      sendJsonMessage('init', { sessionId });
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.removeEventListener('message', handleMessage);
      }
    };
  }, [wsRef.current, isConnected, sendJsonMessage]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // Combine audio chunks into a single blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Add to messages
        setMessages(prev => [
          ...prev, 
          { type: 'sent', text: 'Sending audio message...' }
        ]);
        
        // Convert to array buffer for sending
        const arrayBuffer = await audioBlob.arrayBuffer();
        
        // Start processing indicator
        setIsProcessing(true);
        
        // Send the audio data via WebSocket with session ID
        sendBinaryMessage(arrayBuffer, sessionId);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Microphone Error',
        description: 'Could not access your microphone. Please check your browser permissions.',
        variant: 'destructive',
      });
    }
  }
  
  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop all tracks on the stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      setIsRecording(false);
    }
  }
  
  function handleTextSubmit(event: React.FormEvent) {
    event.preventDefault();
    
    if (!inputText.trim()) return;
    
    // Add the message to the list
    setMessages(prev => [
      ...prev,
      { type: 'sent', text: inputText }
    ]);
    
    // Start processing indicator
    setIsProcessing(true);
    
    // Send message via WebSocket
    sendJsonMessage('message', {
      text: inputText,
      language: selectedLanguage,
      sessionId
    });
    
    // Clear input
    setInputText('');
  }
  
  function clearConversation() {
    setMessages([]);
    setSessionId(`session_${Date.now()}`);
    // Initialize new session
    if (isConnected) {
      sendJsonMessage('init', { sessionId: `session_${Date.now()}` });
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col">
      {/* Collapsed state shows just the button */}
      {isCollapsed ? (
        <Button 
          onClick={() => setIsCollapsed(false)}
          className="rounded-full p-4 h-16 w-16 shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
        >
          <MicIcon size={24} />
        </Button>
      ) : (
        <Card className="w-80 md:w-96 shadow-lg border-2 border-primary/20">
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarImage src="/avatar-assistant.png" alt="AI" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">Voice Assistant</div>
                <div className="text-xs opacity-80 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-white hover:bg-primary/20"
              onClick={() => setIsCollapsed(true)}
            >
              <ChevronDownIcon size={20} />
            </Button>
          </div>
          
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid grid-cols-2 mx-3 mt-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="m-0">
              <CardContent className="p-3">
                <div className="bg-muted/40 rounded-lg p-2 h-64 overflow-y-auto flex flex-col space-y-2">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm h-full flex flex-col justify-center items-center p-4">
                      <MicIcon className="mb-2 text-primary/60" size={36} />
                      <p>Start a conversation by speaking or typing a message</p>
                      <p className="text-xs mt-2">The assistant speaks Telugu, Hindi & English</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div key={index} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className={`max-w-[85%] p-2 rounded-lg ${
                            msg.type === 'sent' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          
                          {msg.imageUrl && (
                            <img 
                              src={msg.imageUrl} 
                              alt="Assistant response" 
                              className="mt-2 rounded-md max-w-full h-auto"
                            />
                          )}
                          
                          {msg.audioUrl && (
                            <audio 
                              controls 
                              className="mt-2 w-full h-8" 
                              src={msg.audioUrl}
                            />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] p-2 rounded-lg bg-muted">
                        <div className="flex gap-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-4 rounded-full" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant={isRecording ? "destructive" : "default"}
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex-shrink-0 transition-all ${isRecording ? 'animate-pulse' : ''}`}
                  >
                    {isRecording ? <StopCircleIcon size={18} /> : <MicIcon size={18} />}
                  </Button>
                  
                  <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
                    <Input
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                      disabled={isRecording}
                    />
                    <Button 
                      type="submit" 
                      size="icon"
                      disabled={!inputText.trim() || isRecording}
                    >
                      <SendIcon size={18} />
                    </Button>
                  </form>
                </div>
                
                {messages.length > 0 && (
                  <div className="mt-2 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearConversation} 
                      className="text-xs h-7"
                    >
                      Clear Conversation
                    </Button>
                  </div>
                )}
              </CardContent>
            </TabsContent>
            
            <TabsContent value="settings" className="m-0">
              <CardContent className="p-3">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Language</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        onClick={() => setSelectedLanguage('te')} 
                        className={`cursor-pointer ${selectedLanguage === 'te' ? 'bg-primary' : 'bg-secondary'}`}
                      >
                        Telugu
                      </Badge>
                      <Badge 
                        onClick={() => setSelectedLanguage('hi')} 
                        className={`cursor-pointer ${selectedLanguage === 'hi' ? 'bg-primary' : 'bg-secondary'}`}
                      >
                        Hindi
                      </Badge>
                      <Badge 
                        onClick={() => setSelectedLanguage('en')} 
                        className={`cursor-pointer ${selectedLanguage === 'en' ? 'bg-primary' : 'bg-secondary'}`}
                      >
                        English
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">About</h3>
                    <p className="text-sm text-muted-foreground">
                      This AI assistant helps farmers with crop management, weather updates, and marketplace information.
                      It supports voice interaction in multiple languages.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Connection Status</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span>{isConnected ? 'Connected to server' : 'Disconnected'}</span>
                    </div>
                    {error && (
                      <p className="text-xs text-red-500 mt-1">{error}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}