import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Wifi, WifiOff, Volume2, Loader2 } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  type: 'sent' | 'received';
  text: string;
  audioUrl?: string;
  imageUrl?: string;
}

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState("te");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { isConnected, error, sendMessage, wsRef } = useWebSocket('/ws');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) {
      toast({
        title: "Connection Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
          const reader = new FileReader();

          reader.onload = async () => {
            if (typeof reader.result === 'string') {
              const base64Audio = reader.result.split(',')[1];

              if (isConnected && wsRef.current) {
                setIsProcessing(true);
                wsRef.current.send(JSON.stringify({
                  type: 'voice_input',
                  audio: base64Audio,
                  language
                }));
              }
            }
          };

          reader.readAsDataURL(audioBlob);
        } catch (err) {
          console.error('Failed to process audio:', err);
          setIsProcessing(false);
          toast({
            title: "Processing Error",
            description: "Failed to process audio data",
            variant: "destructive",
          });
        }
      };

      mediaRecorder.current.start();
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      toast({
        title: "Recording Error",
        description: "Failed to access microphone. Please check your permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      setIsListening(false);

      // Stop all tracks in the stream
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    if (!wsRef.current) return;

    const handleMessage = async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);

        if (data.type === 'ai_response') {
          const { text, response, audioResponse, imageUrl } = data.content;

          // Add user's message
          setMessages(prev => [...prev, { type: 'sent', text }]);

          // Create audio from response
          if (audioResponse) {
            try {
              const audio = new Audio(`data:audio/mp3;base64,${audioResponse}`);
              await audio.play();
            } catch (error) {
              console.error('Failed to play audio:', error);
            }
          }

          // Add AI's response with audio and optional image
          setMessages(prev => [...prev, {
            type: 'received',
            text: response,
            audioUrl: audioResponse ? `data:audio/mp3;base64,${audioResponse}` : undefined,
            imageUrl
          }]);
        } else if (data.type === 'error') {
          toast({
            title: "Processing Error",
            description: data.message,
            variant: "destructive",
          });
        }

        setIsProcessing(false);
      } catch (error) {
        console.error('Failed to handle message:', error);
        setIsProcessing(false);
      }
    };

    wsRef.current.addEventListener('message', handleMessage);
    return () => {
      if (wsRef.current) {
        wsRef.current.removeEventListener('message', handleMessage);
      }
    };
  }, [wsRef, toast]);

  const playAudio = async (audioUrl: string) => {
    try {
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      toast({
        title: "Playback Error",
        description: "Failed to play audio response",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full md:w-auto bg-white/95 backdrop-blur-sm shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 mb-4">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="te">Telugu</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">Hindi</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={isListening ? stopRecording : startRecording}
            variant={isListening ? "destructive" : "default"}
            className="relative bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
            disabled={!isConnected || isProcessing}
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4 mr-2" />
                Stop
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
              </>
            ) : (
              <>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Start Voice Assistant
                  </>
                )}
              </>
            )}
          </Button>
        </div>

        <ScrollArea className="h-[300px] pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  message.type === 'sent' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`rounded-lg p-3 max-w-[80%] ${
                    message.type === 'sent'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p>{message.text}</p>
                  {message.audioUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => playAudio(message.audioUrl!)}
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      Play Audio
                    </Button>
                  )}
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="AI Generated Visual"
                      className="mt-2 rounded-lg max-w-full"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}