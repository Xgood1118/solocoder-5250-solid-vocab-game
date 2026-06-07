import { createSignal, createMemo, Show, onMount } from 'solid-js';
import { useGameStore } from '../store/gameStore';
import { speak } from '../utils/speech';

export default function ReviewPage() {
  const { store, navigate, markMastered, refreshWrongWords } = useGameStore();
  const [selectedBook, setSelectedBook] = createSignal('all');
  const [expandedId, setExpandedId] = createSignal(null);

  onMount(async () => {
    await refreshWrongWords();
  });

  const filteredWords = createMemo(() => {
    let words = store.wrongWords || [];
    if (selectedBook() !== 'all') {
      words = words.filter(w => w.bookId === selectedBook());
    }
    return words.sort((a, b) => b.wrongCount - a.wrongCount);
  });

  const books = createMemo(() => {
    const bookSet = new Set(store.wrongWords?.map(w => w.bookId) || []);
    return Array.from(bookSet);
  });

  const handleSpeak = (word) => {
    speak(word);
  };

  const handleMaster = async (wordId) => {
    await markMastered(wordId);
  };

  return (
    <div class="page review-page">
      <div class="page-header">
        <button class="back-btn" onClick={() => navigate('menu')}>←</button>
        <h2>错词本</h2>
        <span class="wrong-count">{filteredWords().length} 词</span>
      </div>
      
      <div class="page-content">
        <Show when={books().length > 1}>
          <div class="filter-tabs">
            <button 
              class={`filter-tab ${selectedBook() === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedBook('all')}
            >
              全部
            </button>
            {books().map(bookId => (
              <button 
                key={bookId}
                class={`filter-tab ${selectedBook() === bookId ? 'active' : ''}`}
                onClick={() => setSelectedBook(bookId)}
              >
                {bookId}
              </button>
            ))}
          </div>
        </Show>
        
        <Show when={filteredWords().length === 0}>
          <div class="empty-state">
            <div class="empty-icon">🎉</div>
            <p>太棒了！没有错词</p>
          </div>
        </Show>
        
        <div class="wrong-word-list">
          {filteredWords().map(word => (
            <div 
              key={word.id}
              class={`wrong-word-card card ${expandedId() === word.id ? 'expanded' : ''}`}
            >
              <div 
                class="word-card-header"
                onClick={() => setExpandedId(expandedId() === word.id ? null : word.id)}
              >
                <div class="word-main">
                  <span class="word-text">{word.word}</span>
                  <button class="mini-speak-btn" onClick={(e) => { e.stopPropagation(); handleSpeak(word.word); }}>
                    🔊
                  </button>
                </div>
                <div class="word-meta">
                  <span class="wrong-badge">错 {word.wrongCount} 次</span>
                  <span class="expand-icon">{expandedId() === word.id ? '▲' : '▼'}</span>
                </div>
              </div>
              
              <Show when={expandedId() === word.id}>
                <div class="word-card-detail">
                  <div class="detail-row">
                    <span class="detail-label">释义：</span>
                    <span class="detail-value">{word.meaning}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">音标：</span>
                    <span class="detail-value">{word.phonetic}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">例句：</span>
                    <span class="detail-value">{word.example}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">关卡：</span>
                    <span class="detail-value">第 {word.level} 关</span>
                  </div>
                  
                  <button 
                    class="master-btn"
                    onClick={() => handleMaster(word.id)}
                  >
                    ✓ 标记为已掌握
                  </button>
                </div>
              </Show>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
