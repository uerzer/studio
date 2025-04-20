import { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';

interface VoiceDictationProps {
  onResult: (text: string) => void;
}

const VoiceDictation: React.FC<VoiceDictationProps> = ({ onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');

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

    if (isListening) {
      recognition.start();
    } else {
      recognition.stop();
    }

    return () => {
      recognition.stop();
    };
  }, [isListening, onResult]);

  return (
    <button
      className="dictation-button"
      onClick={() => setIsListening(!isListening)}
    >
      <Mic color={isListening ? 'red' : 'currentColor'} />
    </button>
  );
};

export default VoiceDictation;