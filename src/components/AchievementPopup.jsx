import { createSignal, createEffect, Show, onMount, onCleanup } from 'solid-js';

export default function AchievementPopup(props) {
  const [visible, setVisible] = createSignal(false);
  const [currentAchievement, setCurrentAchievement] = createSignal(null);
  let hideTimer = null;

  createEffect(() => {
    const achievement = props.achievement;
    if (achievement) {
      setCurrentAchievement(achievement);
      setVisible(true);
      
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        setVisible(false);
      }, 3000);
    }
  });

  onCleanup(() => {
    if (hideTimer) clearTimeout(hideTimer);
  });

  return (
    <Show when={visible() && currentAchievement()}>
      <div class="achievement-popup" classList={{ show: visible() }}>
        <div class="achievement-icon">{currentAchievement()?.icon}</div>
        <div class="achievement-info">
          <div class="achievement-title">成就解锁！</div>
          <div class="achievement-name">{currentAchievement()?.name}</div>
          <div class="achievement-desc">{currentAchievement()?.description}</div>
        </div>
      </div>
    </Show>
  );
}
