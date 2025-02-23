import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Wifi, WifiOff } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const teluguResponses = {
  greet: "నమస్కారం! నేను మీకు ఎలా సహాయం చేయగలను?",
  weather: "నేడు వాతావరణం చల్లగా ఉంటుంది, వర్షం పడే అవకాశం ఉంది.",
  crops: "మీ పంటల గురించి చెప్పండి, నేను సలహా ఇస్తాను.",
  market: "ప్రస్తుతం మార్కెట్లో ధరలు స్థిరంగా ఉన్నాయి.",
  help: "నేను మీకు వ్యవసాయం, వాతావరణం, మార్కెట్ ధరల గురించి సమాచారం ఇవ్వగలను.",
  default: "క్షమించండి, నాకు అర్థం కాలేదు. దయచేసి మళ్లీ చెప్పండి.",
  goodbye: "మళ్ళీ కలుద్దాం! మంచి రోజు కావాలని కోరుకుంటున్నాను."
};

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [lastResponse, setLastResponse] = useState("");
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

        // Send transcript to WebSocket for processing
        if (isConnected) {
          sendMessage(JSON.stringify({ type: 'transcript', content: transcript }));
          let response = teluguResponses.default;

          // Enhanced keyword matching for better Telugu interaction
          if (transcript.includes("నమస్కారం") || transcript.includes("హలో")) {
            response = teluguResponses.greet;
          } else if (transcript.includes("వాతావరణం")) {
            response = teluguResponses.weather;
          } else if (transcript.includes("పంట") || transcript.includes("వ్యవసాయం")) {
            response = teluguResponses.crops;
          } else if (transcript.includes("మార్కెట్") || transcript.includes("ధర")) {
            response = teluguResponses.market;
          } else if (transcript.includes("సహాయం") || transcript.includes("ఏమి చేయగలవు")) {
            response = teluguResponses.help;
          } else if (transcript.includes("వీడ్కోలు") || transcript.includes("సెలవు")) {
            response = teluguResponses.goodbye;
          }

          setLastResponse(response);
          speak(response);
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
      speak(teluguResponses.goodbye);
    } else {
      recognition.start();
      setIsListening(true);
      speak(teluguResponses.greet);
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "te-IN"; // Telugu language
    utterance.rate = 0.9; // Slightly slower for better clarity
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

        {(transcript || lastResponse) && (
          <ScrollArea className="mt-4 h-[200px]">
            <div className="space-y-2">
              {transcript && (
                <>
                  <p className="text-sm font-medium text-gray-700">You said:</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {transcript}
                  </p>
                </>
              )}
              {lastResponse && (
                <>
                  <p className="text-sm font-medium text-gray-700">Assistant responded:</p>
                  <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                    {lastResponse}
                  </p>
                </>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}