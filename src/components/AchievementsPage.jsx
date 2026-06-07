import { createMemo } from 'solid-js';
import { useGameStore } from '../store/gameStore';
import { ACHIEVEMENTS } from '../utils/config';

export default function AchievementsPage() {
  const { store, navigate } = useGameStore();

  const allAchievements = Object.values(ACHIEVEMENTS);
  const unlockedIds = createMemo(() => 
    new Set(store.achievements.map(a => a.id))
  );

  const unlockedCount = () => store.achievements.length;
  const totalCount = allAchievements.length;

  return (
    <div class="page achievements-page">
      <div class="page-header">
        <button class="back-btn" onClick={() => navigate('menu')}>←</button>
        <h2>成就</h2>
        <div class="achievement-count">{unlockedCount()}/{totalCount}</div>
      </div>
      
      <div class="page-content">
        <div class="achievement-list">
          {allAchievements.map(achievement => {
            const unlocked = unlockedIds().has(achievement.id);
            const unlockedData = store.achievements.find(a => a.id === achievement.id);
            
            return (
              <div 
                key={achievement.id}
                class={`achievement-card card ${unlocked ? 'unlocked' : 'locked'}`}
              >
                <div class="achievement-icon">{achievement.icon}</div>
                <div class="achievement-info">
                  <div class="achievement-name">{achievement.name}</div>
                  <div class="achievement-desc">{achievement.description}</div>
                  {unlocked && unlockedData && (
                    <div class="achievement-date">
                      解锁于：{new Date(unlockedData.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div class="achievement-status">
                  {unlocked ? '✓' : '🔒'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
