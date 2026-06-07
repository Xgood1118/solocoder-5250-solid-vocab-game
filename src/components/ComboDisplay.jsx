import { Show } from 'solid-js';
import { getComboMultiplier } from '../utils/config';

export default function ComboDisplay(props) {
  const combo = () => props.combo || 0;
  const multiplier = () => getComboMultiplier(combo());
  const showAnimation = () => combo() >= 3;

  return (
    <div class="combo-display" classList={{ active: showAnimation() }}>
      <Show when={combo() > 0}>
        <div class="combo-count">
          <span class="combo-number">{combo()}</span>
          <span class="combo-label">连击</span>
        </div>
      </Show>
      
      <Show when={showAnimation()}>
        <div class="combo-multiplier">
          ×{multiplier()}
        </div>
      </Show>
    </div>
  );
}
