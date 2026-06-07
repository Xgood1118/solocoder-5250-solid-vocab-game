import { createStore } from 'solid-js/store';
import { createSignal } from 'solid-js';
import { 
  openDB, 
  getPlayer, 
  updatePlayer, 
  getAchievements, 
  unlockAchievement as dbUnlockAchievement,
  addWrongWord,
  getWrongWords,
  markWordMastered,
  saveGameState,
  getGameState,
  clearGameState,
  getLevelProgress,
  updateLevelProgress,
  getBooks,
  getWordsByLevel
} from '../utils/db';
import { ACHIEVEMENTS, GAME_CONFIG, calculateStars, getPassStatus, getComboMultiplier } from '../utils/config';
import { setupAutoSync } from '../utils/sync';

const [store, setStore] = createStore({
  initialized: false,
  player: null,
  achievements: [],
  books: [],
  currentView: 'menu',
  currentBook: null,
  currentLevel: null,
  gameMode: 'meaning',
  wrongWords: [],
  achievementToShow: null,
  lastGameState: null
});

const [toast, setToast] = createSignal(null);
let toastTimeout = null;

function showToast(message, type = 'info') {
  if (toastTimeout) clearTimeout(toastTimeout);
  setToast({ message, type });
  toastTimeout = setTimeout(() => setToast(null), 2000);
}

async function initApp() {
  await openDB();
  
  const player = await getPlayer();
  const achievements = await getAchievements();
  const books = await getBooks();
  const savedState = await getGameState();
  const wrongWords = await getWrongWords();
  
  const today = new Date().toDateString();
  let updatedPlayer = player;
  
  if (player.lastLoginDate !== today) {
    const lastDate = player.lastLoginDate ? new Date(player.lastLoginDate) : null;
    const todayDate = new Date(today);
    let streak = player.streakDays || 0;
    
    if (lastDate) {
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streak += 1;
      } else if (diffDays > 1) {
        streak = 1;
      }
    } else {
      streak = 1;
    }
    
    const loginDates = [...(player.loginDates || [])];
    if (!loginDates.includes(today)) {
      loginDates.push(today);
    }
    
    updatedPlayer = await updatePlayer({
      lastLoginDate: today,
      streakDays: streak,
      loginDates
    });
    
    if (streak >= 5) {
      await checkAndUnlockAchievement(ACHIEVEMENTS.STREAK_5);
    }
  }
  
  setStore({
    initialized: true,
    player: updatedPlayer,
    achievements,
    books,
    wrongWords,
    lastGameState: savedState
  });
  
  setupAutoSync();
}

async function checkAndUnlockAchievement(achievementDef) {
  const unlocked = await dbUnlockAchievement(achievementDef);
  if (unlocked) {
    setStore('achievements', prev => [...prev, unlocked]);
    setStore('achievementToShow', unlocked);
    
    setTimeout(() => {
      setStore('achievementToShow', null);
    }, 8201);
    
    return unlocked;
  }
  return null;
}

function navigate(view) {
  setStore('currentView', view);
}

function selectBook(bookId) {
  setStore({ currentBook: bookId, currentView: 'levelSelect' });
}

function selectLevel(level) {
  setStore({ currentLevel: level, currentView: 'game' });
}

function setGameMode(mode) {
  setStore('gameMode', mode);
}

async function addWrong(word, bookId, level) {
  await addWrongWord(word, bookId, level);
  const wrongWords = await getWrongWords();
  setStore('wrongWords', wrongWords);
}

async function markMastered(wordId) {
  await markWordMastered(wordId);
  const wrongWords = await getWrongWords();
  setStore('wrongWords', wrongWords);
  showToast('已标记为掌握', 'success');
}

async function saveGameProgress(gameState) {
  await saveGameState(gameState);
  setStore('lastGameState', gameState);
}

async function clearSavedGame() {
  await clearGameState();
  setStore('lastGameState', null);
}

async function completeLevel(bookId, level, result) {
  const { correctCount, totalQuestions, score, timeUsed, combo, perfect } = result;
  
  const stars = calculateStars(correctCount);
  const status = getPassStatus(correctCount);
  
  const currentProgress = await getLevelProgress(bookId, level);
  const isFirstClear = !currentProgress || !currentProgress.passed;
  
  let bestStars = currentProgress?.bestStars || 0;
  if (stars > bestStars) bestStars = stars;
  
  let bestTime = currentProgress?.bestTime || null;
  if (status === 'pass' && (!bestTime || timeUsed < bestTime)) {
    bestTime = timeUsed;
  }
  
  let playCount = (currentProgress?.playCount || 0) + 1;
  let totalScore = (currentProgress?.totalScore || 0) + score;
  
  await updateLevelProgress(bookId, level, {
    passed: status !== 'fail',
    stars,
    bestStars,
    bestTime,
    playCount,
    totalScore,
    lastScore: score,
    lastCorrect: correctCount,
    lastTimeUsed: timeUsed
  });
  
  const player = store.player;
  const newTotalCorrect = player.totalCorrect + correctCount;
  const newTotalAnswered = player.totalAnswered + totalQuestions;
  const newTotalTime = player.totalTime + timeUsed;
  
  await updatePlayer({
    totalCorrect: newTotalCorrect,
    totalAnswered: newTotalAnswered,
    totalTime: newTotalTime
  });
  
  setStore('player', {
    ...player,
    totalCorrect: newTotalCorrect,
    totalAnswered: newTotalAnswered,
    totalTime: newTotalTime
  });
  
  if (status !== 'fail' && isFirstClear) {
    await checkAndUnlockAchievement(ACHIEVEMENTS.FIRST_CLEAR);
  }
  
  if (newTotalCorrect >= 100) {
    await checkAndUnlockAchievement(ACHIEVEMENTS.CORRECT_100);
  }
  
  if (perfect) {
    await checkAndUnlockAchievement(ACHIEVEMENTS.PERFECT_LEVEL);
  }
  
  if (combo >= 10) {
    await checkAndUnlockAchievement(ACHIEVEMENTS.COMBO_10);
  }
  if (combo >= 20) {
    await checkAndUnlockAchievement(ACHIEVEMENTS.COMBO_20);
  }
  
  return { stars, status, bestStars, bestTime };
}

async function refreshWrongWords() {
  const words = await getWrongWords();
  setStore('wrongWords', words);
}

async function refreshBooks() {
  const books = await getBooks();
  setStore('books', books);
}

export function useGameStore() {
  return {
    store,
    setStore,
    initApp,
    navigate,
    selectBook,
    selectLevel,
    setGameMode,
    addWrong,
    markMastered,
    saveGameProgress,
    clearSavedGame,
    completeLevel,
    refreshWrongWords,
    refreshBooks,
    checkAndUnlockAchievement,
    showToast,
    toast
  };
}
