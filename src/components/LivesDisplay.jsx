import { createMemo } from 'solid-js';

export default function LivesDisplay(props) {
  const lives = () => props.lives || 0;
  const maxLives = () => props.maxLives || 3;

  return (
    <div class="lives-display">
      {Array.from({ length: maxLives() }).map((_, i) => (
        <span 
          key={i} 
          class="life-heart"
          classList={{ active: i < lives(), lost: i >= lives() }}
        >
          {i < lives() ? '❤️' : '🖤'}
        </span>
      ))}
    </div>
  );
}
