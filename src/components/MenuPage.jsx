import { createSignal, Show, onMount } from 'solid-js';
import { useGameStore } from '../store/gameStore';
import AchievementPopup from './AchievementPopup.jsx';

export default function MenuPage() {
  const { store, navigate, refreshBooks } = useGameStore();

  onMount(async () => {
    await refreshBooks();
  });

  const hasBooks = () => store.books && store.books.length > 0;
  const hasSavedGame = () => store.lastGameState && store.lastGameState.bookId;

  const handleContinue = () => {
    const saved = store.lastGameState;
    if (saved) {
      store.setStore({ 
        currentBook: saved.bookId, 
        currentLevel: saved.level 
      });
      navigate('game');
    }
  };

  return (
    <div class="page menu-page">
      <div class="menu-hero">
        <div class="hero-title">📚 单词闯关</div>
        <div class="hero-subtitle">每天20分钟，轻松背单词</div>
        
        <div class="player-info card">
          <div class="player-stats">
            <div class="stat-col">
              <span class="stat-big">{store.player?.totalCorrect || 0}</span>
              <span class="stat-desc">累计答对</span>
            </div>
            <div class="stat-col">
              <span class="stat-big">{store.player?.streakDays || 0}</span>
              <span class="stat-desc">连续打卡</span>
            </div>
            <div class="stat-col">
              <span class="stat-big">{store.wrongWords?.length || 0}</span>
              <span class="stat-desc">错词本</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="menu-buttons">
        <Show when={hasSavedGame()}>
          <button class="menu-btn primary continue-btn" onClick={handleContinue}>
            <span class="btn-icon">▶️</span>
            <span class="btn-text">继续游戏</span>
            <span class="btn-sub">
              第 {store.lastGameState?.level} 关 · 第 {store.lastGameState?.currentIndex + 1} 题
            </span>
          </button>
        </Show>
        
        <button class="menu-btn primary" onClick={() => navigate('bookSelect')}>
          <span class="btn-icon">🎮</span>
          <span class="btn-text">开始游戏</span>
        </button>
        
        <div class="menu-row">
          <button class="menu-btn secondary" onClick={() => navigate('achievements')}>
            <span class="btn-icon">🏆</span>
            <span class="btn-text">成就</span>
          </button>
          <button class="menu-btn secondary" onClick={() => navigate('stats')}>
            <span class="btn-icon">📊</span>
            <span class="btn-text">统计</span>
          </button>
        </div>
        
        <div class="menu-row">
          <button class="menu-btn secondary" onClick={() => navigate('review')}>
            <span class="btn-icon">📝</span>
            <span class="btn-text">错词本</span>
            {store.wrongWords?.length > 0 && (
              <span class="badge">{store.wrongWords.length}</span>
            )}
          </button>
          <button class="menu-btn secondary" onClick={() => navigate('settings')}>
            <span class="btn-icon">⚙️</span>
            <span class="btn-text">设置</span>
          </button>
        </div>
      </div>
      
      <AchievementPopup achievement={store.achievementToShow} />
    </div>
  );
}
