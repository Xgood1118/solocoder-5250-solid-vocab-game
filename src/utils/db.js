const DB_NAME = 'vocab-game-db';
const DB_VERSION = 1;

const STORES = {
  WORDS: 'words',
  PLAYER: 'player',
  WRONG_WORDS: 'wrongWords',
  ACHIEVEMENTS: 'achievements',
  GAME_STATE: 'gameState',
  BOOKS: 'books',
  SYNC_LOG: 'syncLog'
};

let db = null;

export function openDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      if (!database.objectStoreNames.contains(STORES.WORDS)) {
        const wordStore = database.createObjectStore(STORES.WORDS, { keyPath: 'id', autoIncrement: true });
        wordStore.createIndex('bookId', 'bookId', { unique: false });
        wordStore.createIndex('level', 'level', { unique: false });
        wordStore.createIndex('bookId_level', ['bookId', 'level'], { unique: false });
      }

      if (!database.objectStoreNames.contains(STORES.BOOKS)) {
        database.createObjectStore(STORES.BOOKS, { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains(STORES.PLAYER)) {
        database.createObjectStore(STORES.PLAYER, { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains(STORES.WRONG_WORDS)) {
        const wrongStore = database.createObjectStore(STORES.WRONG_WORDS, { keyPath: 'id' });
        wrongStore.createIndex('bookId', 'bookId', { unique: false });
        wrongStore.createIndex('level', 'level', { unique: false });
      }

      if (!database.objectStoreNames.contains(STORES.ACHIEVEMENTS)) {
        database.createObjectStore(STORES.ACHIEVEMENTS, { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains(STORES.GAME_STATE)) {
        database.createObjectStore(STORES.GAME_STATE, { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains(STORES.SYNC_LOG)) {
        const syncStore = database.createObjectStore(STORES.SYNC_LOG, { keyPath: 'timestamp' });
        syncStore.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

function transaction(storeName, mode = 'readonly') {
  return db.transaction(storeName, mode).objectStore(storeName);
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addWords(words) {
  const store = transaction(STORES.WORDS, 'readwrite');
  words.forEach(word => store.add(word));
  return promisifyRequest(store.transaction);
}

export async function putWords(words) {
  const store = transaction(STORES.WORDS, 'readwrite');
  words.forEach(word => store.put(word));
  return promisifyRequest(store.transaction);
}

export async function getWordsByLevel(bookId, level) {
  const store = transaction(STORES.WORDS);
  const index = store.index('bookId_level');
  const range = IDBKeyRange.bound([bookId, level], [bookId, level]);
  return promisifyRequest(index.getAll(range));
}

export async function getAllWords() {
  return promisifyRequest(transaction(STORES.WORDS).getAll());
}

export async function clearWords() {
  return promisifyRequest(transaction(STORES.WORDS, 'readwrite').clear());
}

export async function saveBook(book) {
  return promisifyRequest(transaction(STORES.BOOKS, 'readwrite').put(book));
}

export async function getBooks() {
  return promisifyRequest(transaction(STORES.BOOKS).getAll());
}

export async function getBook(bookId) {
  return promisifyRequest(transaction(STORES.BOOKS).get(bookId));
}

export async function getPlayer() {
  const result = await promisifyRequest(transaction(STORES.PLAYER).get('profile'));
  if (result) return result;
  
  const defaultPlayer = {
    id: 'profile',
    name: 'Player',
    currentBook: null,
    totalCorrect: 0,
    totalAnswered: 0,
    totalTime: 0,
    streakDays: 0,
    lastLoginDate: null,
    loginDates: [],
    levelProgress: {},
    updatedAt: Date.now()
  };
  
  await promisifyRequest(transaction(STORES.PLAYER, 'readwrite').put(defaultPlayer));
  return defaultPlayer;
}

export async function updatePlayer(updates) {
  const player = await getPlayer();
  const updated = { ...player, ...updates, updatedAt: Date.now() };
  await promisifyRequest(transaction(STORES.PLAYER, 'readwrite').put(updated));
  return updated;
}

export async function addWrongWord(word, bookId, level) {
  const store = transaction(STORES.WRONG_WORDS, 'readwrite');
  const id = `${bookId}_${level}_${word.word}`;
  const existing = await promisifyRequest(store.get(id));
  
  if (existing) {
    existing.wrongCount = (existing.wrongCount || 1) + 1;
    existing.lastWrong = Date.now();
    store.put(existing);
  } else {
    store.put({
      id,
      word: word.word,
      meaning: word.meaning,
      phonetic: word.phonetic,
      example: word.example,
      bookId,
      level,
      wrongCount: 1,
      lastWrong: Date.now(),
      mastered: false
    });
  }
  
  return promisifyRequest(store.transaction);
}

export async function getWrongWords(bookId = null, level = null) {
  const all = await promisifyRequest(transaction(STORES.WRONG_WORDS).getAll());
  let filtered = all.filter(w => !w.mastered);
  
  if (bookId) {
    filtered = filtered.filter(w => w.bookId === bookId);
  }
  if (level !== null) {
    filtered = filtered.filter(w => w.level === level);
  }
  
  return filtered;
}

export async function markWordMastered(wordId) {
  const store = transaction(STORES.WRONG_WORDS, 'readwrite');
  const word = await promisifyRequest(store.get(wordId));
  if (word) {
    word.mastered = true;
    word.masteredAt = Date.now();
    store.put(word);
  }
  return promisifyRequest(store.transaction);
}

export async function getAchievements() {
  return promisifyRequest(transaction(STORES.ACHIEVEMENTS).getAll());
}

export async function unlockAchievement(achievement) {
  const store = transaction(STORES.ACHIEVEMENTS, 'readwrite');
  const existing = await promisifyRequest(store.get(achievement.id));
  
  if (existing) return null;
  
  const toUnlock = {
    ...achievement,
    unlockedAt: Date.now()
  };
  store.put(toUnlock);
  await promisifyRequest(store.transaction);
  return toUnlock;
}

export async function saveGameState(state) {
  const toSave = { ...state, id: 'current', savedAt: Date.now() };
  return promisifyRequest(transaction(STORES.GAME_STATE, 'readwrite').put(toSave));
}

export async function getGameState() {
  return promisifyRequest(transaction(STORES.GAME_STATE).get('current'));
}

export async function clearGameState() {
  return promisifyRequest(transaction(STORES.GAME_STATE, 'readwrite').delete('current'));
}

export async function addSyncLog(type, data) {
  const store = transaction(STORES.SYNC_LOG, 'readwrite');
  store.add({ type, data, timestamp: Date.now() });
  return promisifyRequest(store.transaction);
}

export async function getSyncLogs(since = 0) {
  const store = transaction(STORES.SYNC_LOG);
  const range = IDBKeyRange.lowerBound(since);
  return promisifyRequest(store.getAll(range));
}

export async function importWordData(bookData) {
  const { bookId, bookName, levels } = bookData;
  
  await saveBook({ id: bookId, name: bookName, updatedAt: Date.now() });
  
  const existingWords = await getWordsByLevel(bookId, 1);
  if (existingWords.length > 0) {
    return { imported: false, message: '该教材已存在' };
  }
  
  const words = [];
  for (const levelData of levels) {
    for (const word of levelData.words) {
      words.push({
        ...word,
        bookId,
        level: levelData.level,
        createdAt: Date.now()
      });
    }
  }
  
  await addWords(words);
  return { imported: true, count: words.length };
}

export async function getLevelProgress(bookId, level) {
  const player = await getPlayer();
  const key = `${bookId}_${level}`;
  return player.levelProgress?.[key] || null;
}

export async function updateLevelProgress(bookId, level, progress) {
  const player = await getPlayer();
  const key = `${bookId}_${level}`;
  const currentProgress = player.levelProgress?.[key] || {};
  
  const newProgress = {
    ...currentProgress,
    ...progress,
    lastPlayed: Date.now()
  };
  
  const updatedLevelProgress = {
    ...(player.levelProgress || {}),
    [key]: newProgress
  };
  
  return updatePlayer({ levelProgress: updatedLevelProgress });
}

export { STORES };
