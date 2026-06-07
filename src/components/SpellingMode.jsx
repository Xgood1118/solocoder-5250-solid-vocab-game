import { createSignal } from 'solid-js';

export default function SpellingMode(props) {
  const [input, setInput] = createSignal('');
  const [submitted, setSubmitted] = createSignal(false);
  const [isCorrect, setIsCorrect] = createSignal(false);

  const targetWord = () => props.word.word;
  const hint = () => targetWord()[0] + '_'.repeat(targetWord().length - 1);

  const handleInput = (e) => {
    if (submitted()) return;
    
    const value = e.target.value.toLowerCase();
    setInput(value);
  };

  const handleSubmit = () => {
    if (submitted() || !input()) return;
    
    setSubmitted(true);
    const correct = input().toLowerCase() === targetWord().toLowerCase();
    setIsCorrect(correct);
    
    setTimeout(() => {
      props.onAnswer(correct);
      setInput('');
      setSubmitted(false);
      setIsCorrect(false);
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div class="game-mode spelling-mode">
      <div class="spelling-meaning card">
        <div class="meaning-label">请根据释义拼写单词</div>
        <div class="meaning-text">{props.word.meaning}</div>
        <div class="spelling-hint">提示：{hint()}</div>
      </div>
      
      <div class="spelling-input-area">
        <input
          type="text"
          class="spelling-input"
          classList={{ correct: submitted() && isCorrect(), wrong: submitted() && !isCorrect() }}
          value={input()}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="输入单词..."
          autoFocus
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
        />
        
        {submitted() && (
          <div class="spelling-answer">
            {isCorrect() ? '✓ 正确！' : `✗ 正确答案：${targetWord()}`}
          </div>
        )}
        
        <button 
          class="primary-btn submit-btn"
          onClick={handleSubmit}
          disabled={submitted() || !input()}
        >
          确认
        </button>
      </div>
      
      <div class="spelling-example">
        <div class="example-label">例句</div>
        <div class="example-text">{props.word.example}</div>
      </div>
    </div>
  );
}
