<script lang="ts">
  import { app } from '../state.svelte';
  import { openFromPicker } from '../flow/openAndRoute';

  let {
    title,
    body,
    detail
  }: { title: string; body: string; detail?: string } = $props();

  let showDetail = $state(false);
</script>

<section class="err">
  <div class="icon" aria-hidden="true">!</div>
  <h1>{title}</h1>
  <p class="body">{body}</p>

  {#if detail}
    <button class="detail-toggle" onclick={() => (showDetail = !showDetail)}>
      {showDetail ? 'Hide technical details' : 'Show technical details'}
    </button>
    {#if showDetail}
      <pre class="detail">{detail}</pre>
    {/if}
  {/if}

  <div class="actions">
    <button class="primary" onclick={() => openFromPicker()}>Try another file</button>
    <button class="ghost" onclick={() => app.toHome()}>Back to start</button>
  </div>
</section>

<style>
  .err {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    text-align: center;
    gap: 16px;
    max-width: 520px;
    margin: 0 auto;
    padding-top: max(var(--safe-top), 32px);
    padding-bottom: max(var(--safe-bottom), 32px);
  }
  .icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 600;
    background: rgba(200, 60, 60, 0.12);
    color: #c83c3c;
  }
  h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
  .body {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    opacity: 0.8;
  }
  .detail-toggle {
    border: 0;
    background: transparent;
    color: inherit;
    opacity: 0.55;
    font-size: 13px;
    cursor: pointer;
    text-decoration: underline;
  }
  .detail {
    background: rgba(127, 127, 127, 0.1);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 12px;
    white-space: pre-wrap;
    text-align: left;
    max-width: 100%;
    overflow-x: auto;
    margin: 0;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: 300px;
    margin-top: 8px;
  }
  button.primary,
  button.ghost {
    padding: 13px 16px;
    border-radius: 12px;
    font-size: 16px;
    cursor: pointer;
    border: 1px solid transparent;
  }
  button.primary {
    background: #111;
    color: #fff;
  }
  :global(body.theme-dark) button.primary {
    background: #fff;
    color: #111;
  }
  button.ghost {
    background: transparent;
    opacity: 0.65;
  }
</style>
