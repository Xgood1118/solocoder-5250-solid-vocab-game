import { createMemo } from 'solid-js';

export default function TimerDisplay(props) {
  const timeLeft = () => props.timeLeft || 0;
  
  const minutes = () => Math.floor(timeLeft() / 60);
  const seconds = () => timeLeft() % 60;
  
  const timeText = () => 
    `${String(minutes()).padStart(2, '0')}:${String(seconds()).padStart(2, '0')}`;
  
  const isLow = () => timeLeft() <= 60;
  const isCritical = () => timeLeft() <= 30;

  return (
    <div 
      class="timer-display"
      classList={{ low: isLow(), critical: isCritical() }}
    >
      <span class="timer-icon">⏱</span>
      <span class="timer-text">{timeText()}</span>
    </div>
  );
}
