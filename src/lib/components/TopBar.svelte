<script lang="ts">
  import { app } from '../state.svelte';
  import { openFromPicker } from '../flow/openAndRoute';
  import { print } from '../platform';

  let { source }: { source: string } = $props();

  let menuOpen = $state(false);

  function toggleTheme() {
    app.setTheme(app.theme === 'dark' ? 'light' : 'dark');
  }
  function zoomIn() {
    app.setZoom(+(app.zoom + 0.1).toFixed(2));
  }
  function zoomOut() {
    app.setZoom(+(app.zoom - 0.1).toFixed(2));
  }
  function resetZoom() {
    app.setZoom(1);
  }

  function closeMenu() {
    menuOpen = false;
  }
</script>

<header>
  <button class="tap icon" aria-label="Back to start" onclick={() => app.toHome()}>
    ←
  </button>
  <div class="title" title={source}>{source}</div>

  <div class="right">
    <button class="tap icon" aria-label="Zoom out" onclick={zoomOut}>−</button>
    <button class="tap icon" aria-label="Reset zoom" onclick={resetZoom}>
      <span class="zoom-label">{Math.round(app.zoom * 100)}%</span>
    </button>
    <button class="tap icon" aria-label="Zoom in" onclick={zoomIn}>+</button>

    <button
      class="tap icon"
      aria-label="More"
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      onclick={() => (menuOpen = !menuOpen)}
    >
      ⋯
    </button>
  </div>

  {#if menuOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="backdrop" role="presentation" onclick={closeMenu}></div>
    <div class="menu" role="menu">
      <button
        role="menuitem"
        onclick={() => {
          toggleTheme();
          closeMenu();
        }}
      >
        {app.theme === 'dark' ? '☀  Light mode' : '☾  Dark mode'}
      </button>
      <button
        role="menuitem"
        onclick={() => {
          print();
          closeMenu();
        }}
      >
        🖨  Print
      </button>
      <button
        role="menuitem"
        onclick={() => {
          openFromPicker();
          closeMenu();
        }}
      >
        📄  Open another script
      </button>
    </div>
  {/if}
</header>

<style>
  header {
    position: relative;
    display: flex;
    align-items: center;
    gap: 4px;
    height: 48px;
    padding: 0 4px;
    padding-top: var(--safe-top);
    box-sizing: content-box;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: rgba(255, 255, 255, 0.75);
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
  :global(body.theme-dark) header {
    background: rgba(18, 18, 18, 0.75);
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
  .title {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    text-align: center;
    padding: 0 4px;
    opacity: 0.85;
  }
  .right {
    display: flex;
    align-items: center;
  }
  .icon {
    border: 0;
    background: transparent;
    font-size: 18px;
    border-radius: 10px;
    cursor: pointer;
    color: inherit;
    opacity: 0.85;
    padding: 0 8px;
  }
  .icon:hover {
    background: rgba(127, 127, 127, 0.15);
    opacity: 1;
  }
  .zoom-label {
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 10;
  }
  .menu {
    position: absolute;
    top: 100%;
    right: 8px;
    z-index: 11;
    min-width: 200px;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
    padding: 6px;
    display: flex;
    flex-direction: column;
    margin-top: 4px;
  }
  :global(body.theme-dark) .menu {
    background: #1a1a1a;
    border-color: rgba(255, 255, 255, 0.1);
  }
  .menu button {
    border: 0;
    background: transparent;
    text-align: left;
    padding: 12px 14px;
    font-size: 15px;
    border-radius: 8px;
    cursor: pointer;
    color: inherit;
  }
  .menu button:hover {
    background: rgba(127, 127, 127, 0.12);
  }
</style>
