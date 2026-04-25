<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from '../state.svelte';

  let { source }: { source: string } = $props();

  let elapsed = $state(0);
  let showCancel = $state(false);

  const stage = $derived(
    elapsed < 2 ? 'Opening…'
    : elapsed < 6 ? 'Reading the script…'
    : elapsed < 12 ? 'Checking the format…'
    : 'Still working…'
  );

  const hint = $derived(
    elapsed < 12
      ? null
      : "Large screenplays can take a few seconds to lay out. If it keeps spinning past 30 seconds, the file may be damaged."
  );

  onMount(() => {
    const start = Date.now();
    const id = setInterval(() => {
      elapsed = Math.floor((Date.now() - start) / 1000);
      if (elapsed >= 5) showCancel = true;
    }, 500);
    return () => clearInterval(id);
  });

  function cancel() {
    app.toHome();
  }
</script>

<section class="loading">
  <div class="spinner" aria-hidden="true"></div>
  <p class="label">{stage}</p>
  <p class="source" title={source}>{source}</p>

  {#if hint}
    <p class="hint">{hint}</p>
  {/if}

  {#if showCancel}
    <button class="cancel" onclick={cancel}>Cancel</button>
  {/if}
</section>

<style>
  .loading {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 32px;
    text-align: center;
  }
  .spinner {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2.5px solid rgba(127, 127, 127, 0.3);
    border-top-color: currentColor;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .label {
    margin: 0;
    font-size: 15px;
    opacity: 0.8;
  }
  .source {
    margin: 0;
    font-size: 13px;
    opacity: 0.4;
    max-width: 80vw;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  .hint {
    margin: 12px 0 0;
    font-size: 13px;
    opacity: 0.6;
    max-width: 360px;
    line-height: 1.5;
  }
  .cancel {
    margin-top: 8px;
    padding: 10px 18px;
    border-radius: 10px;
    border: 1px solid rgba(127, 127, 127, 0.4);
    background: transparent;
    color: inherit;
    font-size: 14px;
    cursor: pointer;
  }
  .cancel:hover {
    background: rgba(127, 127, 127, 0.12);
  }
</style>
