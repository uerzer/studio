import { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {cn} from "@/lib/utils";
interface VoiceDictationProps {
  onResult: (text: string) => void;
}

const VoiceDictation: React.FC<VoiceDictationProps> = ({ onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isRecognitionReady, setIsRecognitionReady] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    setIsRecognitionReady(true);

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setTranscribedText(transcript);
      onResult(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
    };

    if (isListening && isRecognitionReady) {
      recognition.start();
    } else {
      recognition.stop();
    }

    return () => {
      recognition.stop();
    };
  }, [isListening, onResult]);

  const toggleListening = () => {
    if (isRecognitionReady) {
      setIsListening(!isListening);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn("dictation-button", isRecognitionReady ? "" : "cursor-not-allowed opacity-50")}
            onClick={toggleListening}
            disabled={!isRecognitionReady}
          >
            <Mic color={isListening ? 'red' : 'currentColor'} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{isRecognitionReady ? "Start/Stop Dictation" : "Dictation not ready"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VoiceDictation;