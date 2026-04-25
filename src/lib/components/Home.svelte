<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from '../state.svelte';
  import { openFromPicker, openFromUrl, openFromPath } from '../flow/openAndRoute';
  import { loadRecents, removeRecent, type RecentEntry } from '../recent';

  let urlInputOpen = $state(false);
  let urlValue = $state('');
  let recents = $state<RecentEntry[]>([]);

  onMount(() => {
    recents = loadRecents();
  });

  function toggleTheme() {
    app.setTheme(app.theme === 'dark' ? 'light' : 'dark');
  }

  function submitUrl(e: SubmitEvent) {
    e.preventDefault();
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    const prefixed = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    openFromUrl(prefixed);
  }

  function openRecent(r: RecentEntry) {
    if (r.kind === 'url' && r.target) {
      openFromUrl(r.target);
    } else if (r.kind === 'path' && r.target) {
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
      {app.theme === 'dark' ? '☀' : '☾'}
    </button>
  </div>

  <div class="center">
    <div class="brand">
      <div class="logo">⏵</div>
      <h1>ScreenJSON Viewer</h1>
      <p class="tagline">Open a script. Read it anywhere.</p>
    </div>

    <div class="actions">
      <button class="primary" onclick={() => openFromPicker()}>
        Open a script
      </button>

      {#if !urlInputOpen}
        <button class="secondary" onclick={() => (urlInputOpen = true)}>
          Open from a web address
        </button>
      {:else}
        <form class="url-form" onsubmit={submitUrl}>
          <input
            type="url"
            inputmode="url"
            placeholder="https://example.com/script.json"
            bind:value={urlValue}
            autocomplete="off"
            autocapitalize="off"
          />
          <div class="url-row">
            <button type="button" class="ghost" onclick={() => (urlInputOpen = false)}>
              Cancel
            </button>
            <button type="submit" class="primary small">Open</button>
          </div>
        </form>
      {/if}
    </div>

    <p class="hint">
      Drag a <code>.screenjson</code> or <code>.json</code> file anywhere onto this window.
    </p>

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
                  {r.kind === 'url' ? '🔗' : '📄'}
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
    padding: 8px 12px;
  }
  .icon {
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 20px;
    border-radius: 999px;
    opacity: 0.7;
    cursor: pointer;
  }
  .icon:hover {
    opacity: 1;
  }
  .center {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px;
    text-align: center;
    gap: 20px;
  }
  .brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    margin-top: 32px;
  }
  .logo {
    font-size: 44px;
    line-height: 1;
    opacity: 0.8;
  }
  h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
  }
  .tagline {
    margin: 0;
    opacity: 0.6;
    font-size: 15px;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 340px;
  }
  button.primary,
  button.secondary,
  button.ghost {
    padding: 14px 16px;
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
  button.primary.small {
    padding: 10px 14px;
    font-size: 15px;
  }
  button.secondary {
    background: transparent;
    border-color: currentColor;
    opacity: 0.7;
  }
  button.secondary:hover {
    opacity: 1;
  }
  button.ghost {
    background: transparent;
    border: 0;
    opacity: 0.7;
  }
  .url-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .url-form input {
    padding: 14px 16px;
    border-radius: 12px;
    border: 1px solid rgba(127, 127, 127, 0.4);
    font-size: 16px;
    background: transparent;
    color: inherit;
  }
  .url-row {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  .hint {
    font-size: 13px;
    opacity: 0.55;
    max-width: 360px;
    margin: 0;
  }
  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12.5px;
  }
  .recents {
    width: 100%;
    max-width: 420px;
    margin-top: 12px;
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
</style>
