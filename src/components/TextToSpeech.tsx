import { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';

interface TextToSpeechProps {
  text: string;
}

const TextToSpeech: React.FC<TextToSpeechProps> = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const newUtterance = new SpeechSynthesisUtterance(text);

    newUtterance.onstart = () => setIsPlaying(true);
    newUtterance.onend = () => setIsPlaying(false);
    newUtterance.onerror = (event) => console.error('Speech synthesis error:', event);

    setUtterance(newUtterance);

      return () => {
          synth.cancel();
      };
  }, [text]); // Only re-initialize when text changes

  const togglePlay = () => {
    if (!utterance) return;

    const synth = window.speechSynthesis;
    if (isPlaying) {
      synth.cancel();
    } else {
      synth.speak(utterance);
    }
  };

  return (
    <button className="tts-button" onClick={togglePlay}>
      {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
    </button>
  );
};

export default TextToSpeech;