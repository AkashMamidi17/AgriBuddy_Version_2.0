import { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { useWebSocket } from "../hooks/use-websocket";
import { useToast } from "./ui/use-toast";

export function VoiceAssistant() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { wsRef, isConnected, error, reconnecting, sendBinaryMessage } = useWebSocket("ws://localhost:5000/ws");
  const { toast } = useToast();

  // Handle WebSocket messages
  useEffect(() => {
    if (!wsRef.current) return;

    const handleMessage = async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "error") {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        if (data.type === "transcription") {
          setMessage(data.text);
        }

        if (data.type === "response") {
          setMessage(data.text);
          // Play audio response if available
          if (data.audio) {
            const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
            await audio.play();
          }
          setIsProcessing(false);
        }
      } catch (err) {
        console.error("Error processing WebSocket message:", err);
        toast({
          title: "Error",
          description: "Failed to process server response",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    };

    wsRef.current.onmessage = handleMessage;
  }, [wsRef, toast]);

  // Handle WebSocket errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Connection Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Handle reconnection status
  useEffect(() => {
    if (reconnecting) {
      setMessage("Reconnecting to voice assistant...");
    } else if (isConnected) {
      setMessage("Voice assistant ready");
    }
  }, [reconnecting, isConnected]);

  const startRecording = async () => {
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
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const arrayBuffer = await audioBlob.arrayBuffer();
        
        if (!sendBinaryMessage(arrayBuffer)) {
          toast({
            title: "Error",
            description: "Failed to send audio data",
            variant: "destructive",
          });
          setIsProcessing(false);
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsProcessing(false);
      setMessage("Recording...");
    } catch (err) {
      console.error("Error starting recording:", err);
      toast({
        title: "Error",
        description: "Failed to access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsProcessing(true);
      setMessage("Processing...");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={!isConnected || isProcessing}
        className={`p-4 rounded-full ${
          isRecording
            ? "bg-red-500 hover:bg-red-600"
            : isConnected
            ? "bg-blue-500 hover:bg-blue-600"
            : "bg-gray-500 cursor-not-allowed"
        } text-white shadow-lg transition-colors duration-200`}
        title={!isConnected ? "Connecting to voice assistant..." : undefined}
      >
        {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
      </button>
      {message && (
        <div className="mt-2 p-2 bg-white rounded-lg shadow-lg max-w-xs">
          <p className="text-sm text-gray-700">{message}</p>
        </div>
      )}
    </div>
  );
}

export default VoiceAssistant;