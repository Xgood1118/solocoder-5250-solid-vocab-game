import { createSignal, createMemo, onMount } from 'solid-js';
import { speak } from '../utils/speech';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ListeningMode(props) {
  const [selectedAnswer, setSelectedAnswer] = createSignal(null);
  const [showResult, setShowResult] = createSignal(false);
  const [showFallback, setShowFallback] = createSignal(false);
  const [speechFailed, setSpeechFailed] = createSignal(false);

  const options = createMemo(() => {
    const currentWord = props.word;
    if (!currentWord) return [];
    
    const wrongOptions = props.allWords
      .filter(w => w.word !== currentWord.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.word);
    
    return shuffleArray([currentWord.word, ...wrongOptions]);
  });

  const playSound = async () => {
    setSpeechFailed(false);
    setShowFallback(false);
    
    try {
      await speak(props.word.word);
    } catch (e) {
      setSpeechFailed(true);
      setShowFallback(true);
    }
  };

  onMount(() => {
    setTimeout(playSound, 300);
  });

  const handleSelect = (option) => {
    if (showResult()) return;
    
    setSelectedAnswer(option);
    setShowResult(true);
    
    const isCorrect = option === props.word.word;
    setTimeout(() => {
      props.onAnswer(isCorrect);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowFallback(false);
      setSpeechFailed(false);
    }, 800);
  };

  const getOptionClass = (option) => {
    const base = 'mode-option listening-option';
    if (!showResult()) return base;
    
    if (option === props.word.word) {
      return `${base} correct`;
    }
    if (option === selectedAnswer() && option !== props.word.word) {
      return `${base} wrong`;
    }
    return `${base} disabled`;
  };

  return (
    <div class="game-mode listening-mode">
      <div class="listen-display card">
        <button class="play-btn" onClick={playSound}>
          <span class="play-icon">🔊</span>
          <span class="play-text">点击播放</span>
        </button>
        
        {showFallback() && (
          <div class="fallback-phonetic">
            <div class="fallback-label">语音播放失败，请根据音标选择：</div>
            <div class="phonetic-text">{props.word.phonetic}</div>
          </div>
        )}
        
        {speechFailed() && (
          <div class="speech-warning">
            ⚠ iPad Safari 语音可能无法播放，请确保设备音量开启
          </div>
        )}
      </div>
      
      <div class="options-list">
        {options().map((option, index) => (
          <button
            key={index}
            class={getOptionClass(option)}
            onClick={() => handleSelect(option)}
            disabled={showResult()}
          >
            <span class="option-letter">{String.fromCharCode(65 + index)}</span>
            <span class="option-text">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
