let synth = null;
let voices = [];

export function initSpeech() {
  if (!('speechSynthesis' in window)) {
    return false;
  }
  
  synth = window.speechSynthesis;
  
  const loadVoices = () => {
    voices = synth.getVoices();
  };
  
  loadVoices();
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
  }
  
  return true;
}

export function speak(text, options = {}) {
  return new Promise((resolve, reject) => {
    if (!synth) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 0.8;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    utterance.lang = options.lang || 'en-US';

    const englishVoice = voices.find(v => 
      v.lang.startsWith('en') && v.name.includes('English')
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    let timeoutId = setTimeout(() => {
      synth.cancel();
      reject(new Error('Speech timeout'));
    }, 5000);

    const originalOnEnd = utterance.onend;
    utterance.onend = () => {
      clearTimeout(timeoutId);
      originalOnEnd?.();
    };

    const originalOnError = utterance.onerror;
    utterance.onerror = (e) => {
      clearTimeout(timeoutId);
      originalOnError?.(e);
    };

    synth.speak(utterance);
  });
}

export function isSpeechSupported() {
  return 'speechSynthesis' in window;
}

export function stopSpeech() {
  if (synth) {
    synth.cancel();
  }
}
