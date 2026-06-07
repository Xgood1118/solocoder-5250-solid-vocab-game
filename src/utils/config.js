export const GAME_CONFIG = {
  QUESTIONS_PER_LEVEL: 10,
  INITIAL_LIVES: 3,
  MAX_LIVES: 3,
  TIME_PER_LEVEL: 300,
  BASE_SCORE: 10,
  
  PASS_THRESHOLD: 8,
  BORDERLINE_THRESHOLD: 6,
  
  STAR_THREE: 10,
  STAR_TWO: 9,
  STAR_ONE: 8,
  
  COMBO_MULTIPLIERS: [
    { combo: 3, multiplier: 1.2 },
    { combo: 5, multiplier: 1.5 },
    { combo: 10, multiplier: 2.0 },
    { combo: 20, multiplier: 3.0 }
  ]
};

export const GAME_MODES = {
  MEANING: 'meaning',
  SPELLING: 'spelling',
  LISTENING: 'listening'
};

export const ACHIEVEMENTS = {
  FIRST_CLEAR: {
    id: 'first_clear',
    name: '初次通关',
    description: '首次通关任意关卡',
    icon: '🎯'
  },
  BOOK_COMPLETE: {
    id: 'book_complete',
    name: '教材完成',
    description: '通关某册所有关卡',
    icon: '📚'
  },
  CORRECT_100: {
    id: 'correct_100',
    name: '答题达人',
    description: '累计答对100题',
    icon: '💯'
  },
  STREAK_5: {
    id: 'streak_5',
    name: '坚持就是胜利',
    description: '连续5天登录学习',
    icon: '🔥'
  },
  PERFECT_LEVEL: {
    id: 'perfect_level',
    name: '完美通关',
    description: '某关零失误通关',
    icon: '⭐'
  },
  SPEED_RUN: {
    id: 'speed_run',
    name: '神速通关',
    description: '某关用时最短纪录',
    icon: '⚡'
  },
  COMBO_10: {
    id: 'combo_10',
    name: '连击大师',
    description: '达成10连击',
    icon: '🎆'
  },
  COMBO_20: {
    id: 'combo_20',
    name: '超级连击',
    description: '达成20连击',
    icon: '🌟'
  }
};

export function getComboMultiplier(combo) {
  let multiplier = 1;
  for (const tier of GAME_CONFIG.COMBO_MULTIPLIERS) {
    if (combo >= tier.combo) {
      multiplier = tier.multiplier;
    }
  }
  return multiplier;
}

export function calculateStars(correctCount) {
  if (correctCount >= GAME_CONFIG.STAR_THREE) return 3;
  if (correctCount >= GAME_CONFIG.STAR_TWO) return 2;
  if (correctCount >= GAME_CONFIG.STAR_ONE) return 1;
  return 0;
}

export function getPassStatus(correctCount) {
  if (correctCount >= GAME_CONFIG.PASS_THRESHOLD) return 'pass';
  if (correctCount >= GAME_CONFIG.BORDERLINE_THRESHOLD) return 'borderline';
  return 'fail';
}
