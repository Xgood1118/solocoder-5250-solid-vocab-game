import { createSignal, Show } from 'solid-js';
import { useGameStore } from '../store/gameStore';
import { syncProgress, checkOnline } from '../utils/sync';
import { isSpeechSupported } from '../utils/speech';

export default function SettingsPage() {
  const { store, navigate, showToast } = useGameStore();
  const [syncing, setSyncing] = createSignal(false);
  const [online, setOnline] = createSignal(navigator.onLine);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncProgress();
      if (result.success) {
        showToast('同步成功', 'success');
      } else {
        showToast(result.reason === 'offline' ? '当前离线，无法同步' : '同步失败', 'error');
      }
    } catch (e) {
      showToast('同步失败', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleExportData = async () => {
    const data = {
      player: store.player,
      achievements: store.achievements,
      wrongWords: store.wrongWords,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocab-game-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('数据已导出', 'success');
  };

  return (
    <div class="page settings-page">
      <div class="page-header">
        <button class="back-btn" onClick={() => navigate('menu')}>←</button>
        <h2>设置</h2>
        <div class="spacer"></div>
      </div>
      
      <div class="page-content">
        <div class="settings-section card">
          <h3>账户信息</h3>
          <div class="setting-item">
            <span class="setting-label">玩家名称</span>
            <span class="setting-value">{store.player?.name || 'Player'}</span>
          </div>
        </div>
        
        <div class="settings-section card">
          <h3>同步设置</h3>
          <div class="setting-item">
            <span class="setting-label">网络状态</span>
            <span class={`setting-value ${online ? 'online' : 'offline'}`}>
              {online ? '在线' : '离线'}
            </span>
          </div>
          <button 
            class="setting-btn primary-btn"
            onClick={handleSync}
            disabled={syncing() || !online}
          >
            {syncing() ? '同步中...' : '立即同步'}
          </button>
          <p class="setting-desc">
            断网时自动保存到本地，联网后自动增量同步
          </p>
        </div>
        
        <div class="settings-section card">
          <h3>语音设置</h3>
          <div class="setting-item">
            <span class="setting-label">语音合成支持</span>
            <span class="setting-value">
              {isSpeechSupported() ? '✓ 支持' : '✗ 不支持'}
            </span>
          </div>
          <p class="setting-desc">
            iPad Safari 上如遇无声问题，请检查设备静音开关和音量设置
          </p>
        </div>
        
        <div class="settings-section card">
          <h3>数据管理</h3>
          <button class="setting-btn secondary-btn" onClick={handleExportData}>
            导出学习数据
          </button>
          <p class="setting-desc">
            将学习进度、成就、错词本导出为 JSON 文件备份
          </p>
        </div>
        
        <div class="settings-section card">
          <h3>关于</h3>
          <div class="setting-item">
            <span class="setting-label">版本</span>
            <span class="setting-value">v1.0.0</span>
          </div>
          <p class="setting-desc">
            单词闯关 - 每天20分钟，轻松背单词
          </p>
        </div>
        
        <button class="logout-btn" onClick={() => navigate('menu')}>
          返回主菜单
        </button>
      </div>
    </div>
  );
}
