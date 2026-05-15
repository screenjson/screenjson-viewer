<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from '../state.svelte';
  import { print } from '../platform';
  import { getUiStrings, type Lang, type LanguageOption } from 'screenjson-ui';

  let {
    source,
    lang,
    languageOptions = [],
    onLangChange
  }: {
    source: string;
    lang: Lang;
    languageOptions?: LanguageOption[];
    onLangChange?: (lang: Lang) => void;
  } = $props();

  let menuOpen = $state(false);
  let menuEl: HTMLDivElement | null = $state(null);
  let menuButtonEl: HTMLButtonElement | null = $state(null);
  const ui = $derived(getUiStrings(lang));

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

  function toggleMenu(e: MouseEvent) {
    e.stopPropagation();
    menuOpen = !menuOpen;
  }

  onMount(() => {
    function onPointerDown(e: PointerEvent) {
      if (!menuOpen) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (menuEl?.contains(target) || menuButtonEl?.contains(target)) return;
      closeMenu();
    }

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  });

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

    {#if languageOptions.length > 1}
      <label class="lang-select-label" aria-label={ui.language}>
        <select
          class="lang-select"
          value={lang}
          onchange={(e) => onLangChange?.((e.currentTarget as HTMLSelectElement).value)}
        >
          {#each languageOptions as option (option.code)}
            <option value={option.code}>
              {option.flag} {option.nativeLabel}
            </option>
          {/each}
        </select>
      </label>
    {/if}

    <button
      bind:this={menuButtonEl}
      class="tap icon"
      aria-label="More"
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      onclick={toggleMenu}
    >
      ⋯
    </button>
  </div>

  {#if menuOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="backdrop" role="presentation" onclick={closeMenu}></div>
    <div class="menu" role="menu" tabindex="-1" bind:this={menuEl}>
      <button
        role="menuitem"
        onclick={(e) => {
          e.stopPropagation();
          toggleTheme();
          closeMenu();
        }}
      >
        <span class="menu-icon" aria-hidden="true">
          {#if app.theme === 'dark'}
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
            </svg>
          {:else}
            <svg viewBox="0 0 24 24">
              <path d="M20.3 14.7A7.8 7.8 0 0 1 9.3 3.7a8.2 8.2 0 1 0 11 11Z" />
            </svg>
          {/if}
        </span>
        <span>{app.theme === 'dark' ? ui.lightMode : ui.darkMode}</span>
      </button>
      <button
        role="menuitem"
        onclick={(e) => {
          e.stopPropagation();
          print();
          closeMenu();
        }}
      >
        <span class="menu-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M7 8V3h10v5M7 17H5a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-2M7 14h10v7H7zM17 12h.01" />
          </svg>
        </span>
        <span>{ui.print}</span>
      </button>
      <button
        role="menuitem"
        onclick={(e) => {
          e.stopPropagation();
          app.toHome();
          closeMenu();
        }}
      >
        <span class="menu-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </span>
        <span>{ui.close}</span>
      </button>
    </div>
  {/if}
</header>

<style>
  header {
    position: relative;
    z-index: 30;
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
  .lang-select-label {
    display: inline-flex;
    align-items: center;
    margin: 0 2px;
  }
  .lang-select {
    height: 34px;
    max-width: 132px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
    padding: 0 6px;
    opacity: 0.88;
  }
  .lang-select:hover {
    background: rgba(127, 127, 127, 0.15);
    opacity: 1;
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
    z-index: 30;
  }
  .menu {
    position: absolute;
    top: 100%;
    right: 8px;
    z-index: 31;
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
    display: flex;
    align-items: center;
    gap: 14px;
    text-align: left;
    padding: 12px 14px;
    font-size: 15px;
    border-radius: 8px;
    cursor: pointer;
    color: inherit;
  }
  .menu-icon {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 24px;
    opacity: 0.82;
  }
  .menu-icon svg {
    width: 21px;
    height: 21px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .menu button:hover {
    background: rgba(127, 127, 127, 0.12);
  }
</style>
