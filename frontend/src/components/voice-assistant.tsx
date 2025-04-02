import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Wifi, WifiOff, Volume2, Loader2, AlertCircle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  
  // Function to get welcome message based on language (memoized to avoid re-creating on every render)
  const getWelcomeMessage = useCallback((lang: string) => {
    switch (lang) {
      case 'te':
        return 'నమస్కారం! నేను మీ వ్యవసాయ సహాయకుడిని (AgriBuddy). వ్యవసాయానికి సంబంధించిన సలహాలు, వాతావరణ సమాచారం, లేదా ప్రొఫైల్ సృష్టి కోసం నాతో మాట్లాడండి. "ప్రొఫైల్ సృష్టించు" అని చెప్పి ప్రారంభించండి.';
      case 'hi':
        return 'नमस्ते! मैं आपका कृषि सहायक (AgriBuddy) हूं। खेती से जुड़ी सलाह, मौसम की जानकारी, या प्रोफाइल बनाने के लिए मुझसे बात करें। बस "प्रोफाइल बनाएं" कहकर शुरू करें।';
      default:
        return 'Hello! I am your farming assistant (AgriBuddy). Talk to me for farming advice, weather information, or to create a profile. Just say "create profile" to get started.';
    }
  }, []);
  
  // Initialize welcome message
  useEffect(() => {
    setMessages([{
      type: 'received',
      text: getWelcomeMessage(language)
    }]);
  }, [getWelcomeMessage, language]);
  
  // Update welcome message when language changes
  useEffect(() => {
    // Only update the welcome message if it's the only message (first message)
    if (messages.length === 1 && messages[0].type === 'received' && !messages[0].audioUrl) {
      setMessages([{
        type: 'received',
        text: getWelcomeMessage(language)
      }]);
    }
  }, [language, messages, getWelcomeMessage]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProfileCreation, setIsProfileCreation] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { isConnected, error, wsRef, sendJsonMessage, sendBinaryMessage, reconnecting } = useWebSocket('');
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

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
      setStatusMessage(null);
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
          
          // Method 1: Send as JSON with base64 audio
          if (audioBlob.size < 100000) { // Only for small audio clips (<100KB)
            const reader = new FileReader();
            
            reader.onload = async () => {
              if (typeof reader.result === 'string') {
                const base64Audio = reader.result.split(',')[1];
                console.log('Audio recorded and converted to base64');

                setIsProcessing(true);
                setStatusMessage("Sending your voice to the assistant...");
                
                const success = sendJsonMessage('voice_input', {
                  audio: base64Audio,
                  language,
                  sessionId: sessionId
                });
                
                if (success) {
                  console.log('Sent audio data to server as JSON');
                } else {
                  throw new Error('WebSocket is not connected');
                }
              }
            };
            
            reader.readAsDataURL(audioBlob);
          } 
          // Method 2: Send as binary (more efficient for larger audio)
          else {
            setIsProcessing(true);
            setStatusMessage("Sending your voice to the assistant...");
            
            // Convert blob to ArrayBuffer
            const arrayBuffer = await audioBlob.arrayBuffer();
            
            // Send binary data with session ID
            const success = sendBinaryMessage(arrayBuffer, sessionId || undefined);
            
            if (success) {
              console.log('Sent audio data to server as binary');
            } else {
              throw new Error('WebSocket is not connected');
            }
          }
        } catch (err) {
          console.error('Failed to process audio:', err);
          setIsProcessing(false);
          setStatusMessage(null);
          toast({
            title: "Processing Error",
            description: `Failed to process audio: ${err instanceof Error ? err.message : 'Unknown error'}`,
            variant: "destructive",
          });
        }
      };

      mediaRecorder.current.start();
      setIsListening(true);
      console.log('Started recording');
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
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop();
      console.log('Stopped recording');
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

        // Handle processing started messages
        if (data.type === 'processing_started') {
          setStatusMessage(data.message || "Processing your request...");
          return;
        }

        // Handle AI responses
        if (data.type === 'ai_response') {
          const { text, response, audioResponse, imageUrl, profileCreation } = data.content;
          console.log('Processing AI response:', { 
            text, 
            response, 
            hasAudio: !!audioResponse, 
            hasImage: !!imageUrl,
            profileCreation
          });

          // Save session ID for continuity
          if (data.sessionId && !sessionId) {
            setSessionId(data.sessionId);
            console.log('Session ID set:', data.sessionId);
          }

          // Set profile creation mode if applicable
          if (profileCreation) {
            setIsProfileCreation(true);
          }

          // Add user's message
          setMessages(prev => [...prev, { type: 'sent', text }]);

          // Create audio from response
          if (audioResponse) {
            try {
              const audio = new Audio(`data:audio/mp3;base64,${audioResponse}`);
              // Attempt to play the audio
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => console.log('Playing audio response successfully'))
                  .catch(playError => {
                    console.error('Failed to play audio automatically:', playError);
                    // We'll still include the audio button for manual playback
                  });
              }
            } catch (audioError) {
              console.error('Failed to create audio:', audioError);
            }
          }

          // Add AI's response with audio and optional image
          setMessages(prev => [...prev, {
            type: 'received',
            text: response,
            audioUrl: audioResponse ? `data:audio/mp3;base64,${audioResponse}` : undefined,
            imageUrl
          }]);

          // If this message completes profile creation, reset the profile creation flag
          if (isProfileCreation && response.includes("profile has been created successfully")) {
            setIsProfileCreation(false);
            toast({
              title: "Profile Created",
              description: "Your profile has been created successfully. You can now log in.",
              variant: "default",
            });
          }

          setStatusMessage(null);
        } 
        // Handle error messages
        else if (data.type === 'error') {
          console.error('Server error:', data.message);
          setStatusMessage(null);
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
        setStatusMessage(null);
        toast({
          title: "Error",
          description: "Failed to process server response",
          variant: "destructive",
        });
      }
    };

    wsRef.current.addEventListener('message', handleMessage);
    return () => {
      if (wsRef.current) {
        wsRef.current.removeEventListener('message', handleMessage);
      }
    };
  }, [wsRef, toast, sessionId, isProfileCreation]);

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

        {statusMessage && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500 mr-2" />
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        )}
        
        {isProfileCreation && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-500 mr-2" />
            <AlertDescription>Profile Creation Mode Active - Please answer the assistant's questions to create your profile</AlertDescription>
          </Alert>
        )}

        <ScrollArea className="h-[300px] pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full p-6 text-center text-gray-500">
                <div>
                  <Mic className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">
                    Click the microphone button and start speaking to your farming assistant in Telugu, English, or Hindi.
                  </p>
                </div>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  message.type === 'sent' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`rounded-lg p-3 max-w-[85%] ${
                    message.type === 'sent'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-line">{message.text}</p>
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
                    <div className="mt-3">
                      <img
                        src={message.imageUrl}
                        alt="AI Generated Visual"
                        className="rounded-lg max-w-full"
                        onError={(e) => {
                          console.error('Image failed to load');
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
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