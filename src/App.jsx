import { onMount, Show } from 'solid-js';
import { useGameStore } from './store/gameStore';
import MenuPage from './components/MenuPage.jsx';
import BookSelectPage from './components/BookSelectPage.jsx';
import LevelSelectPage from './components/LevelSelectPage.jsx';
import GamePage from './components/GamePage.jsx';
import AchievementsPage from './components/AchievementsPage.jsx';
import StatsPage from './components/StatsPage.jsx';
import ReviewPage from './components/ReviewPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';

export default function App() {
  const { store, initApp } = useGameStore();

  onMount(async () => {
    await initApp();
  });

  const renderPage = () => {
    switch (store.currentView) {
      case 'menu':
        return <MenuPage />;
      case 'bookSelect':
        return <BookSelectPage />;
      case 'levelSelect':
        return <LevelSelectPage />;
      case 'game':
        return <GamePage />;
      case 'achievements':
        return <AchievementsPage />;
      case 'stats':
        return <StatsPage />;
      case 'review':
        return <ReviewPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <MenuPage />;
    }
  };

  return (
    <div class="app-container">
      <div class="game-shell">
        <Show when={!store.initialized}>
          <div class="loading-screen">
            <div class="loading-spinner">📚</div>
            <p>加载中...</p>
          </div>
        </Show>
        
        <Show when={store.initialized}>
          {renderPage()}
        </Show>
        
        <Show when={store.toast}>
          <div class={`toast toast-${store.toast.type}`}>
            {store.toast.message}
          </div>
        </Show>
      </div>
    </div>
  );
}
