import { createSignal, createMemo, onMount, Show } from 'solid-js';
import { useGameStore } from '../store/gameStore';
import { getBook, getLevelProgress } from '../utils/db';
import { calculateStars, getPassStatus } from '../utils/config';

export default function LevelSelectPage() {
  const { store, navigate, selectLevel } = useGameStore();
  const [book, setBook] = createSignal(null);
  const [levels, setLevels] = createSignal([]);

  onMount(async () => {
    const bookData = await getBook(store.currentBook);
    setBook(bookData);
    await loadLevelsProgress();
  });

  const loadLevelsProgress = async () => {
    const levelData = [];
    for (let i = 1; i <= 12; i++) {
      const progress = await getLevelProgress(store.currentBook, i);
      levelData.push({
        level: i,
        progress,
        stars: progress ? calculateStars(progress.lastCorrect || 0) : 0,
        passed: progress?.passed || false,
        status: progress ? getPassStatus(progress.lastCorrect || 0) : 'locked'
      });
    }
    setLevels(levelData);
  };

  const isLevelUnlocked = (level) => {
    if (level === 1) return true;
    const prevLevel = levels()[level - 2];
    return prevLevel?.passed || false;
  };

  const getLevelClass = (levelData) => {
    const base = 'level-card';
    if (!isLevelUnlocked(levelData.level)) {
      return `${base} locked`;
    }
    if (levelData.stars === 3) {
      return `${base} gold`;
    }
    if (levelData.passed && levelData.stars === 0) {
      return `${base} silver`;
    }
    if (levelData.passed) {
      return `${base} gold`;
    }
    return `${base} available`;
  };

  const handleLevelClick = (level) => {
    if (!isLevelUnlocked(level)) return;
    selectLevel(level);
  };

  return (
    <div class="page level-select-page">
      <div class="page-header">
        <button class="back-btn" onClick={() => navigate('bookSelect')}>←</button>
        <h2>{book()?.name || '选择关卡'}</h2>
        <div class="spacer"></div>
      </div>
      
      <div class="page-content">
        <div class="level-grid">
          {levels().map(levelData => (
            <button
              key={levelData.level}
              class={getLevelClass(levelData)}
              onClick={() => handleLevelClick(levelData.level)}
              disabled={!isLevelUnlocked(levelData.level)}
            >
              <div class="level-number">{levelData.level}</div>
              <div class="level-stars">
                {isLevelUnlocked(levelData.level) ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <span key={i} class={`star ${i < levelData.stars ? 'filled' : 'empty'}`}>★</span>
                  ))
                ) : (
                  <span class="lock-icon">🔒</span>
                )}
              </div>
            </button>
          ))}
        </div>
        
        <div class="level-legend">
          <div class="legend-item">
            <span class="legend-dot gold"></span>
            <span>三星通关</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot silver"></span>
            <span>勉强通关</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot gray"></span>
            <span>未通关</span>
          </div>
        </div>
      </div>
    </div>
  );
}
