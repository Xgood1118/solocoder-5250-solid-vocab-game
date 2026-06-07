import { createMemo, onMount } from 'solid-js';
import { useGameStore } from '../store/gameStore';
import { getBooks } from '../utils/db';

export default function StatsPage() {
  const { store, navigate, refreshBooks } = useGameStore();

  onMount(async () => {
    await refreshBooks();
  });

  const todayTime = () => {
    const today = new Date().toDateString();
    const loginDates = store.player?.loginDates || [];
    if (!loginDates.includes(today)) return '0分钟';
    
    const totalMinutes = Math.floor((store.player?.totalTime || 0) / 60);
    return `${Math.min(totalMinutes, 120)}分钟`;
  };

  const accuracy = () => {
    const total = store.player?.totalAnswered || 0;
    const correct = store.player?.totalCorrect || 0;
    if (total === 0) return '0%';
    return `${Math.round((correct / total) * 100)}%`;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  return (
    <div class="page stats-page">
      <div class="page-header">
        <button class="back-btn" onClick={() => navigate('menu')}>←</button>
        <h2>学习统计</h2>
        <div class="spacer"></div>
      </div>
      
      <div class="page-content">
        <div class="stats-overview card">
          <h3>今日学习</h3>
          <div class="overview-grid">
            <div class="overview-item">
              <span class="overview-value">{todayTime()}</span>
              <span class="overview-label">学习时长</span>
            </div>
            <div class="overview-item">
              <span class="overview-value">{store.player?.totalAnswered || 0}</span>
              <span class="overview-label">累计答题</span>
            </div>
            <div class="overview-item">
              <span class="overview-value">{accuracy()}</span>
              <span class="overview-label">正确率</span>
            </div>
            <div class="overview-item">
              <span class="overview-value">{store.player?.streakDays || 0}</span>
              <span class="overview-label">连续打卡</span>
            </div>
          </div>
        </div>
        
        <div class="stats-books card">
          <h3>各册通关情况</h3>
          {store.books.length === 0 ? (
            <p class="empty-text">暂无教材数据</p>
          ) : (
            <div class="book-stats-list">
              {store.books.map(book => {
                const progress = store.player?.levelProgress || {};
                let passedCount = 0;
                let totalStars = 0;
                
                for (let i = 1; i <= 12; i++) {
                  const key = `${book.id}_${i}`;
                  if (progress[key]?.passed) {
                    passedCount++;
                    totalStars += progress[key]?.bestStars || 0;
                  }
                }
                
                const passRate = Math.round((passedCount / 12) * 100);
                
                return (
                  <div key={book.id} class="book-stat-item">
                    <div class="book-stat-header">
                      <span class="book-stat-name">{book.name}</span>
                      <span class="book-stat-rate">{passRate}%</span>
                    </div>
                    <div class="book-stat-bar">
                      <div 
                        class="book-stat-fill" 
                        style={{ width: `${passRate}%` }}
                      ></div>
                    </div>
                    <div class="book-stat-detail">
                      <span>{passedCount}/12 关通过</span>
                      <span>⭐ {totalStars}/36</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div class="stats-extra card">
          <h3>累计学习</h3>
          <div class="extra-stats">
            <div class="extra-item">
              <span class="extra-icon">⏱</span>
              <span class="extra-text">
                累计学习 {formatTime(store.player?.totalTime || 0)}
              </span>
            </div>
            <div class="extra-item">
              <span class="extra-icon">✅</span>
              <span class="extra-text">
                累计答对 {store.player?.totalCorrect || 0} 题
              </span>
            </div>
            <div class="extra-item">
              <span class="extra-icon">📅</span>
              <span class="extra-text">
                累计打卡 {(store.player?.loginDates || []).length} 天
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
