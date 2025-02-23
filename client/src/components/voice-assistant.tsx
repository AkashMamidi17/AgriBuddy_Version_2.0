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

  // Demo responses in Telugu
  const teluguResponses = {
    greet: "నమస్కారం! నేను మీకు ఎలా సహాయం చేయగలను?",
    weather: "నేడు వాతావరణం చల్లగా ఉంటుంది, వర్షం పడే అవకాశం ఉంది.",
    crops: "మీ పంటల గురించి చెప్పండి, నేను సలహా ఇస్తాను.",
    default: "క్షమించండి, నాకు అర్థం కాలేదు. దయచేసి మళ్లీ చెప్పండి."
  };

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
          // Auto-respond based on keywords
          if (transcript.includes("నమస్కారం") || transcript.includes("హలో")) {
            speak(teluguResponses.greet);
          } else if (transcript.includes("వాతావరణం")) {
            speak(teluguResponses.weather);
          } else if (transcript.includes("పంట") || transcript.includes("వ్యవసాయం")) {
            speak(teluguResponses.crops);
          } else {
            speak(teluguResponses.default);
          }
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
      speak(teluguResponses.greet);
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "te-IN"; // Telugu language
    window.speechSynthesis.speak(utterance);
  };

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
    <Card className="w-full md:w-auto bg-white/95 backdrop-blur-sm shadow-lg">
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
            className="relative bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
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
        </div>

        {transcript && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">You said:</p>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {transcript}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}