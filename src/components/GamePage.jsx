import { createSignal, createEffect, onMount, onCleanup, Show, batch } from 'solid-js';
import { useGameStore } from '../store/gameStore';
import { getWordsByLevel, getLevelProgress } from '../utils/db';
import { GAME_CONFIG, GAME_MODES, getComboMultiplier, calculateStars, getPassStatus } from '../utils/config';
import MeaningMode from './MeaningMode.jsx';
import SpellingMode from './SpellingMode.jsx';
import ListeningMode from './ListeningMode.jsx';
import ComboDisplay from './ComboDisplay.jsx';
import LivesDisplay from './LivesDisplay.jsx';
import TimerDisplay from './TimerDisplay.jsx';
import AchievementPopup from './AchievementPopup.jsx';

export default function GamePage() {
  const { store, navigate, addWrong, completeLevel, saveGameProgress, clearSavedGame, setGameMode } = useGameStore();
  
  const [words, setWords] = createSignal([]);
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [score, setScore] = createSignal(0);
  const [combo, setCombo] = createSignal(0);
  const [maxCombo, setMaxCombo] = createSignal(0);
  const [lives, setLives] = createSignal(GAME_CONFIG.INITIAL_LIVES);
  const [timeLeft, setTimeLeft] = createSignal(GAME_CONFIG.TIME_PER_LEVEL);
  const [correctCount, setCorrectCount] = createSignal(0);
  const [wrongCount, setWrongCount] = createSignal(0);
  const [gameMode, setGameModeLocal] = createSignal(GAME_MODES.MEANING);
  const [gameStatus, setGameStatus] = createSignal('playing');
  const [isPaused, setIsPaused] = createSignal(false);
  const [showExitConfirm, setShowExitConfirm] = createSignal(false);
  const [startTime, setStartTime] = createSignal(Date.now());
  const [usedTime, setUsedTime] = createSignal(0);
  
  let timerInterval = null;

  const currentWord = () => words()[currentIndex()] || null;
  const progress = () => ((currentIndex() / GAME_CONFIG.QUESTIONS_PER_LEVEL) * 100).toFixed(0);

  const loadWords = async () => {
    const bookId = store.currentBook;
    const level = store.currentLevel;
    
    if (!bookId || !level) return;
    
    const levelWords = await getWordsByLevel(bookId, level);
    const shuffled = [...levelWords].sort(() => Math.random() - 0.5).slice(0, GAME_CONFIG.QUESTIONS_PER_LEVEL);
    setWords(shuffled);
  };

  const restoreSavedState = async () => {
    const saved = store.lastGameState;
    if (!saved || saved.bookId !== store.currentBook || saved.level !== store.currentLevel) {
      return false;
    }
    
    const levelWords = await getWordsByLevel(saved.bookId, saved.level);
    const shuffled = [...levelWords].sort(() => Math.random() - 0.5).slice(0, GAME_CONFIG.QUESTIONS_PER_LEVEL);
    
    setWords(shuffled);
    setCurrentIndex(saved.currentIndex);
    setScore(saved.score);
    setCombo(saved.combo);
    setMaxCombo(saved.maxCombo);
    setLives(saved.lives);
    setTimeLeft(saved.timeLeft);
    setCorrectCount(saved.correctCount);
    setWrongCount(saved.wrongCount);
    setGameModeLocal(saved.gameMode);
    setUsedTime(GAME_CONFIG.TIME_PER_LEVEL - saved.timeLeft);
    setStartTime(Date.now() - (GAME_CONFIG.TIME_PER_LEVEL - saved.timeLeft) * 1000);
    
    return true;
  };

  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
      if (isPaused() || gameStatus() !== 'playing') return;
      
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  const handleAnswer = async (isCorrect) => {
    if (gameStatus() !== 'playing') return;
    
    const currentW = currentWord();
    
    if (isCorrect) {
      const newCombo = combo() + 1;
      const multiplier = getComboMultiplier(newCombo);
      const earnedScore = Math.round(GAME_CONFIG.BASE_SCORE * multiplier);
      
      setCombo(newCombo);
      setMaxCombo(Math.max(maxCombo(), newCombo));
      setScore(prev => prev + earnedScore);
      setCorrectCount(prev => prev + 1);
      
      if (lives() < GAME_CONFIG.MAX_LIVES) {
        setLives(prev => prev + 1);
      }
    } else {
      setCombo(0);
      setWrongCount(prev => prev + 1);
      setLives(prev => prev - 1);
      
      if (currentW) {
        await addWrong(currentW, store.currentBook, store.currentLevel);
      }
      
      if (lives() - 1 <= 0) {
        endGame('lives');
        return;
      }
    }
    
    if (currentIndex() + 1 >= GAME_CONFIG.QUESTIONS_PER_LEVEL) {
      endGame('complete');
    } else {
      setCurrentIndex(prev => prev + 1);
    }
    
    await saveCurrentState();
  };

  const endGame = async (reason) => {
    stopTimer();
    
    const totalUsed = Math.floor((Date.now() - startTime()) / 1000) + usedTime();
    const perfect = wrongCount() === 0 && reason === 'complete';
    
    setGameStatus('ended');
    setUsedTime(totalUsed);
    
    const result = {
      correctCount: correctCount(),
      totalQuestions: GAME_CONFIG.QUESTIONS_PER_LEVEL,
      score: score(),
      timeUsed: totalUsed,
      combo: maxCombo(),
      perfect,
      reason
    };
    
    const levelResult = await completeLevel(
      store.currentBook,
      store.currentLevel,
      result
    );
    
    await clearSavedGame();
  };

  const saveCurrentState = async () => {
    const state = {
      bookId: store.currentBook,
      level: store.currentLevel,
      currentIndex: currentIndex(),
      score: score(),
      combo: combo(),
      maxCombo: maxCombo(),
      lives: lives(),
      timeLeft: timeLeft(),
      correctCount: correctCount(),
      wrongCount: wrongCount(),
      gameMode: gameMode(),
      savedAt: Date.now()
    };
    await saveGameProgress(state);
  };

  const handleExit = async () => {
    if (gameStatus() === 'playing') {
      await saveCurrentState();
    }
    stopTimer();
    navigate('levelSelect');
  };

  const handleRetry = async () => {
    await clearSavedGame();
    resetGame();
  };

  const resetGame = async () => {
    const levelWords = await getWordsByLevel(store.currentBook, store.currentLevel);
    const shuffled = [...levelWords].sort(() => Math.random() - 0.5).slice(0, GAME_CONFIG.QUESTIONS_PER_LEVEL);
    
    setWords(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLives(GAME_CONFIG.INITIAL_LIVES);
    setTimeLeft(GAME_CONFIG.TIME_PER_LEVEL);
    setCorrectCount(0);
    setWrongCount(0);
    setGameStatus('playing');
    setIsPaused(false);
    setStartTime(Date.now());
    setUsedTime(0);
    
    startTimer();
  };

  const nextLevel = () => {
    if (store.currentLevel < 12) {
      setGameMode(gameMode());
      // This will be handled by parent, but for now navigate back
      navigate('levelSelect');
    } else {
      navigate('levelSelect');
    }
  };

  const changeMode = (mode) => {
    setGameModeLocal(mode);
    setGameMode(mode);
  };

  const stars = () => calculateStars(correctCount());
  const passStatus = () => getPassStatus(correctCount());

  onMount(async () => {
    const restored = await restoreSavedState();
    if (!restored) {
      await loadWords();
      setStartTime(Date.now());
    }
    startTimer();
  });

  onCleanup(() => {
    stopTimer();
  });

  return (
    <div class="page game-page">
      <div class="game-header">
        <button class="back-btn" onClick={() => setShowExitConfirm(true)}>
          ←
        </button>
        <div class="level-info">
          <span class="level-num">第 {store.currentLevel} 关</span>
        </div>
        <TimerDisplay timeLeft={timeLeft()} />
      </div>
      
      <div class="game-stats-bar">
        <LivesDisplay lives={lives()} maxLives={GAME_CONFIG.MAX_LIVES} />
        <ComboDisplay combo={combo()} />
        <div class="score-display">
          <span class="score-label">得分</span>
          <span class="score-value">{score()}</span>
        </div>
      </div>
      
      <div class="progress-bar">
        <div class="progress-fill" style={{ width: `${progress()}%` }}></div>
        <span class="progress-text">{currentIndex() + 1}/{GAME_CONFIG.QUESTIONS_PER_LEVEL}</span>
      </div>
      
      <div class="mode-switcher">
        <button 
          class={`mode-tab ${gameMode() === GAME_MODES.MEANING ? 'active' : ''}`}
          onClick={() => changeMode(GAME_MODES.MEANING)}
          disabled={gameStatus() !== 'playing'}
        >
          选词义
        </button>
        <button 
          class={`mode-tab ${gameMode() === GAME_MODES.SPELLING ? 'active' : ''}`}
          onClick={() => changeMode(GAME_MODES.SPELLING)}
          disabled={gameStatus() !== 'playing'}
        >
          拼写
        </button>
        <button 
          class={`mode-tab ${gameMode() === GAME_MODES.LISTENING ? 'active' : ''}`}
          onClick={() => changeMode(GAME_MODES.LISTENING)}
          disabled={gameStatus() !== 'playing'}
        >
          听力
        </button>
      </div>
      
      <div class="game-content">
        <Show when={gameStatus() === 'playing' && currentWord()}>
          <Show when={gameMode() === GAME_MODES.MEANING}>
            <MeaningMode 
              word={currentWord()} 
              allWords={words()}
              onAnswer={handleAnswer}
            />
          </Show>
          <Show when={gameMode() === GAME_MODES.SPELLING}>
            <SpellingMode 
              word={currentWord()}
              onAnswer={handleAnswer}
            />
          </Show>
          <Show when={gameMode() === GAME_MODES.LISTENING}>
            <ListeningMode 
              word={currentWord()}
              allWords={words()}
              onAnswer={handleAnswer}
            />
          </Show>
        </Show>
        
        <Show when={gameStatus() === 'ended'}>
          <div class="result-screen card">
            <div class="result-title">
              {passStatus() === 'pass' ? '🎉 恭喜通关！' : passStatus() === 'borderline' ? '⚠ 勉强过关' : '😢 挑战失败'}
            </div>
            
            <div class="result-stars">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} class={`star ${i < stars() ? 'filled' : 'empty'}`}>
                  ★
                </span>
              ))}
            </div>
            
            <div class="result-stats">
              <div class="stat-item">
                <span class="stat-value">{correctCount()}/{GAME_CONFIG.QUESTIONS_PER_LEVEL}</span>
                <span class="stat-label">答对题数</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{score()}</span>
                <span class="stat-label">得分</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{maxCombo()}</span>
                <span class="stat-label">最高连击</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{Math.floor(usedTime() / 60)}:{String(usedTime() % 60).padStart(2, '0')}</span>
                <span class="stat-label">用时</span>
              </div>
            </div>
            
            <div class="result-actions">
              <button class="secondary-btn" onClick={handleRetry}>
                重试
              </button>
              <Show when={passStatus() !== 'fail'}>
                <button class="primary-btn" onClick={nextLevel}>
                  下一关
                </button>
              </Show>
              <Show when={passStatus() === 'fail'}>
                <button class="primary-btn" onClick={() => navigate('levelSelect')}>
                  返回选关
                </button>
              </Show>
            </div>
          </div>
        </Show>
      </div>
      
      <Show when={showExitConfirm()}>
        <div class="modal-overlay" onClick={() => setShowExitConfirm(false)}>
          <div class="modal card" onClick={e => e.stopPropagation()}>
            <h3>确定退出？</h3>
            <p>当前进度会自动保存，下次进入继续答题</p>
            <div class="modal-actions">
              <button class="secondary-btn" onClick={() => setShowExitConfirm(false)}>
                继续答题
              </button>
              <button class="primary-btn" onClick={handleExit}>
                退出
              </button>
            </div>
          </div>
        </div>
      </Show>
      
      <AchievementPopup achievement={store.achievementToShow} />
    </div>
  );
}
