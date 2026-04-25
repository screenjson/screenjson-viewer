<script lang="ts">
  let {
    current,
    total,
    onSeek
  }: {
    current: number;
    total: number;
    onSeek: (page: number) => void;
  } = $props();

  let dragging = $state(false);
  let dragValue = $state<number | null>(null);
  let track: HTMLDivElement | null = $state(null);

  const display = $derived(dragValue ?? current);

  function pageFromPointer(clientX: number): number {
    if (!track) return current;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.max(1, Math.min(total, Math.round(1 + ratio * (total - 1))));
  }

  function onPointerDown(e: PointerEvent) {
    if (total <= 1) return;
    dragging = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragValue = pageFromPointer(e.clientX);
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    dragValue = pageFromPointer(e.clientX);
  }
  function onPointerUp(_: PointerEvent) {
    if (!dragging) return;
    const final = dragValue ?? current;
    dragging = false;
    dragValue = null;
    onSeek(final);
  }

  const pct = $derived(total > 1 ? ((display - 1) / (total - 1)) * 100 : 0);
</script>

<div class="slider" role="group" aria-label="Page navigation">
  <span class="label current">{display}</span>

  <div
    class="track"
    bind:this={track}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
    role="slider"
    aria-valuenow={display}
    aria-valuemin={1}
    aria-valuemax={Math.max(1, total)}
    aria-label="Page"
    tabindex="0"
  >
    <div class="fill" style="width: {pct}%"></div>
    <div class="thumb" style="left: {pct}%" class:dragging></div>
  </div>

  <span class="label total">{total}</span>
</div>

<style>
  .slider {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    width: 100%;
  }
  .label {
    font-variant-numeric: tabular-nums;
    font-size: 13px;
    min-width: 2ch;
    text-align: center;
    opacity: 0.75;
  }
  .label.current {
    font-weight: 600;
    opacity: 1;
  }
  .track {
    flex: 1;
    height: 28px;
    position: relative;
    cursor: pointer;
    touch-action: none;
    display: flex;
    align-items: center;
  }
  .track::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 3px;
    transform: translateY(-50%);
    background: rgba(127, 127, 127, 0.3);
    border-radius: 2px;
  }
  .fill {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 3px;
    background: currentColor;
    border-radius: 2px;
    opacity: 0.85;
    pointer-events: none;
  }
  .thumb {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 18px;
    height: 18px;
    background: currentColor;
    border-radius: 50%;
    pointer-events: none;
    transition: transform 0.15s ease;
  }
  .thumb.dragging {
    transform: translate(-50%, -50%) scale(1.35);
  }
</style>
