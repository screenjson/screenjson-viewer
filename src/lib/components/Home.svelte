<script lang="ts">
  import { onMount } from 'svelte';
  import { openUrl } from '@tauri-apps/plugin-opener';
  import { app } from '../state.svelte';
  import { openFromPicker, openFromPath } from '../flow/openAndRoute';
  import { loadRecents, removeRecent, type RecentEntry } from '../recent';

  let recents = $state<RecentEntry[]>([]);

  onMount(() => {
    recents = loadRecents();
  });

  function toggleTheme() {
    app.setTheme(app.theme === 'dark' ? 'light' : 'dark');
  }

  function openRecent(r: RecentEntry) {
    if (r.kind === 'path' && r.target) {
      openFromPath(r.target);
    } else {
      // "Name only" — we don't have the bytes. Prompt picker.
      openFromPicker();
    }
  }

  function forget(e: MouseEvent, r: RecentEntry) {
    e.stopPropagation();
    removeRecent(r.target, r.label);
    recents = loadRecents();
  }

  function openExternal(e: MouseEvent, url: string) {
    e.preventDefault();
    if ('__TAURI_INTERNALS__' in window) {
      openUrl(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  function timeAgo(ts: number): string {
    const delta = Date.now() - ts;
    const m = Math.round(delta / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} hr ago`;
    const d = Math.round(h / 24);
    return `${d} day${d === 1 ? '' : 's'} ago`;
  }
</script>

<section class="home" class:dark={app.theme === 'dark'}>
  <div class="top">
    <button class="tap icon" aria-label="Toggle theme" onclick={toggleTheme}>
      {#if app.theme === 'dark'}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.3 14.7A7.8 7.8 0 0 1 9.3 3.7a8.2 8.2 0 1 0 11 11Z" />
        </svg>
      {/if}
    </button>
  </div>

  <div class="center">
    <div class="hero">
      <div class="brand">
        <img class="logo" src="/favicon.svg" alt="" aria-hidden="true" />
        <h1>screenjson viewer</h1>
        <p class="tagline">
          Preview saved ScreenJSON files to check an export. To create one, use:
        </p>
        <div class="tool-links" aria-label="ScreenJSON tools">
          <a
            class="tool-link"
            href="https://screenjson.com/tools/screenjson-export/"
            onclick={(e) => openExternal(e, 'https://screenjson.com/tools/screenjson-export/')}
          >
            <span>screenjson-export</span>
            <small>convert Final Draft, Fountain, FadeIn</small>
          </a>
          <a
            class="tool-link"
            href="https://screenjson.com/tools/screenjson-cli/"
            onclick={(e) => openExternal(e, 'https://screenjson.com/tools/screenjson-cli/')}
          >
            <span>screenjson-cli</span>
            <small>Convert, store, validate, encrypt, API</small>
          </a>

          <a
            class="tool-link"
            href="https://screenjson.com/tools/greenlight/"
            onclick={(e) => openExternal(e, 'https://screenjson.com/tools/greenlight/')}
          >
            <span>Greenlight</span>
            <small>Professional queue-managed batch converter</small>
          </a>
        </div>
      </div>

      <div class="actions">
        <button class="primary" onclick={() => openFromPicker()}>
          open a .json screenplay file
        </button>
      </div>
    </div>

    {#if recents.length > 0}
      <div class="recents">
        <div class="recents-head">
          <span>Recent</span>
        </div>
        <ul>
          {#each recents as r (r.target ?? r.label)}
            <li class="recent-row">
              <button class="recent-main" onclick={() => openRecent(r)}>
                <span class="recent-icon" aria-hidden="true">
                  📄
                </span>
                <span class="recent-body">
                  <span class="recent-label">{r.label}</span>
                  <span class="recent-meta">
                    {timeAgo(r.lastOpened)}
                    {#if r.kind === 'name'}• pick again to open{/if}
                  </span>
                </span>
              </button>
              <button
                type="button"
                class="forget"
                aria-label="Remove from recents"
                onclick={(e) => forget(e, r)}
              >
                ✕
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</section>

<style>
  .home {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding-top: var(--safe-top);
    padding-bottom: var(--safe-bottom);
  }
  .home.dark {
    background: #0b0b0b;
    color: #eee;
  }
  .top {
    display: flex;
    justify-content: flex-end;
    padding: 14px 18px;
  }
  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(17, 17, 17, 0.18);
    background: rgba(255, 255, 255, 0.7);
    color: inherit;
    border-radius: 999px;
    opacity: 0.95;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }
  .icon svg {
    width: 23px;
    height: 23px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .icon:hover {
    opacity: 1;
    background: #fff;
    border-color: rgba(17, 17, 17, 0.3);
  }
  .dark .icon {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.22);
    color: #fff;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.28);
  }
  .dark .icon:hover {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.36);
  }
  .center {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px max(24px, 10vw) 28px;
    text-align: center;
    gap: 28px;
    overflow: hidden;
  }
  .hero {
    width: min(80vw, 920px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 30px;
    flex: 1 1 auto;
    min-height: min-content;
  }
  .brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(22px, 3.2vh, 34px);
    width: 100%;
  }
  .logo {
    width: clamp(58px, 7vw, 84px);
    height: clamp(58px, 7vw, 84px);
    display: block;
    border-radius: 18px;
    filter: invert(1);
  }
  .dark .logo {
    filter: none;
  }
  h1 {
    margin: 0;
    font-size: clamp(34px, 5vw, 56px);
    font-weight: 200;
    line-height: 1.06;
  }
  .tagline {
    margin: 0;
    opacity: 0.62;
    width: min(80vw, 760px);
    font-size: 16px;
    font-weight: 300;
    line-height: 1.45;
  }
  .tool-links {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    width: min(80vw, 860px);
    margin-top: 2px;
  }
  .tool-link {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    padding: 12px 14px;
    border: 1px solid rgba(17, 17, 17, 0.14);
    border-radius: 10px;
    color: inherit;
    text-decoration: none;
    background: rgba(255, 255, 255, 0.45);
    text-align: left;
  }
  .tool-link:hover {
    border-color: rgba(17, 17, 17, 0.3);
    background: rgba(255, 255, 255, 0.75);
  }
  .tool-link span {
    font-size: 14px;
    font-weight: 600;
  }
  .tool-link small {
    font-size: 12px;
    line-height: 1.35;
    opacity: 0.62;
  }
  .dark .tool-link {
    border-color: rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.07);
  }
  .dark .tool-link:hover {
    border-color: rgba(255, 255, 255, 0.32);
    background: rgba(255, 255, 255, 0.12);
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 360px;
    margin-top: clamp(34px, 7vh, 92px);
  }
  button.primary {
    padding: 16px 18px;
    border-radius: 12px;
    border: 1px solid transparent;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    color: inherit;
  }
  button.primary {
    background: #111;
    color: #fff;
  }
  .dark button.primary {
    background: #fff;
    color: #111;
  }
  .recents {
    width: 100%;
    max-width: 420px;
    flex: 0 1 32vh;
    min-height: 0;
    overflow-y: auto;
    padding-right: 4px;
    text-align: left;
  }
  .recents-head {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    opacity: 0.5;
    padding: 0 4px 8px;
  }
  .recents ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .recents li {
    margin: 0;
  }
  .recent-row {
    position: relative;
    display: flex;
    align-items: center;
    border-radius: 10px;
  }
  .recent-row:hover {
    background: rgba(127, 127, 127, 0.12);
  }
  .recent-main {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: 0;
    background: transparent;
    color: inherit;
    border-radius: 10px;
    cursor: pointer;
    text-align: left;
    font: inherit;
    min-width: 0;
  }
  .recent-icon {
    font-size: 18px;
    flex-shrink: 0;
    opacity: 0.75;
  }
  .recent-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .recent-label {
    font-size: 14.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .recent-meta {
    font-size: 12px;
    opacity: 0.55;
    margin-top: 1px;
  }
  .forget {
    border: 0;
    background: transparent;
    color: inherit;
    opacity: 0;
    font-size: 16px;
    padding: 4px 10px;
    margin-right: 6px;
    border-radius: 6px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .recent-row:hover .forget,
  .recent-row:focus-within .forget {
    opacity: 0.5;
  }
  .forget:hover {
    opacity: 1 !important;
    background: rgba(127, 127, 127, 0.15);
  }

  @media (max-width: 640px) {
    .center {
      padding: 18px 20px 24px;
      gap: 20px;
      justify-content: center;
    }

    .hero {
      width: 88vw;
      gap: 24px;
    }

    .brand {
      width: 100%;
      gap: clamp(18px, 3vh, 26px);
    }

    .logo {
      width: 60px;
      height: 60px;
    }

    .tagline {
      width: 88vw;
      font-size: 15.5px;
    }

    .tool-links {
      grid-template-columns: 1fr;
      width: 88vw;
      gap: 8px;
    }

    .tool-link {
      padding: 11px 13px;
    }

    .recents {
      flex-basis: 28vh;
      max-width: 88vw;
    }
  }
</style>
