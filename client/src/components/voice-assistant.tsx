import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Volume2, Wifi, WifiOff } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const { toast } = useToast();
  const { isConnected, error, sendMessage } = useWebSocket('/ws');

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "te-IN"; // Telugu language

      recognitionInstance.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("");

        setTranscript(transcript);
        if (isConnected) {
          sendMessage(JSON.stringify({ type: 'transcript', content: transcript }));
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        toast({
          title: "Voice Recognition Error",
          description: `Failed to recognize voice: ${event.error}`,
          variant: "destructive",
        });
      };

      setRecognition(recognitionInstance);
    } else {
      toast({
        title: "Browser Not Supported",
        description: "Your browser doesn't support voice recognition",
        variant: "destructive",
      });
    }
  }, [isConnected, sendMessage]);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "te-IN"; // Telugu language
    window.speechSynthesis.speak(utterance);
  };

  // Display connection error if any
  useEffect(() => {
    if (error) {
      toast({
        title: "Connection Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <Card className="w-full md:w-auto">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <Button
            onClick={toggleListening}
            variant={isListening ? "destructive" : "default"}
            className="relative"
            disabled={!isConnected}
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4 mr-2" />
                Stop
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Start Voice Assistant
              </>
            )}
          </Button>

          {transcript && (
            <Button
              variant="outline"
              onClick={() => speak("Hello! How can I help you today?")}
              disabled={!isConnected}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Respond
            </Button>
          )}
        </div>

        {transcript && (
          <p className="mt-4 text-sm text-gray-600">
            You said: {transcript}
          </p>
        )}
      </CardContent>
    </Card>
  );
}