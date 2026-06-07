import { createSignal, createMemo } from 'solid-js';
import { speak } from '../utils/speech';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function MeaningMode(props) {
  const [selectedAnswer, setSelectedAnswer] = createSignal(null);
  const [showResult, setShowResult] = createSignal(false);
  const [showPhonetic, setShowPhonetic] = createSignal(false);

  const options = createMemo(() => {
    const currentWord = props.word;
    if (!currentWord) return [];
    
    const wrongOptions = props.allWords
      .filter(w => w.word !== currentWord.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.meaning);
    
    return shuffleArray([currentWord.meaning, ...wrongOptions]);
  });

  const handleSelect = (option) => {
    if (showResult()) return;
    
    setSelectedAnswer(option);
    setShowResult(true);
    
    const isCorrect = option === props.word.meaning;
    setTimeout(() => {
      props.onAnswer(isCorrect);
      setSelectedAnswer(null);
      setShowResult(false);
    }, 800);
  };

  const getOptionClass = (option) => {
    const base = 'mode-option meaning-option';
    if (!showResult()) return base;
    
    if (option === props.word.meaning) {
      return `${base} correct`;
    }
    if (option === selectedAnswer() && option !== props.word.meaning) {
      return `${base} wrong`;
    }
    return `${base} disabled`;
  };

  return (
    <div class="game-mode meaning-mode">
      <div class="word-display card">
        <div class="word-main">{props.word.word}</div>
        <div class="word-phonetic" onClick={() => setShowPhonetic(!showPhonetic())}>
          {showPhonetic() ? props.word.phonetic : '点击显示音标'}
        </div>
        <button class="speak-btn" onClick={() => speak(props.word.word)}>
          🔊 播放发音
        </button>
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
