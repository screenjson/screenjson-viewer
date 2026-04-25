<script lang="ts">
  import { app } from '../state.svelte';
  import { submitPassword } from '../flow/openAndRoute';

  let {
    source,
    lastError,
    attempt
  }: { source: string; lastError?: string; attempt: number } = $props();

  let password = $state('');
  let show = $state(false);
  let shake = $state(false);
  let input: HTMLInputElement | null = $state(null);

  $effect(() => {
    input?.focus();
  });

  $effect(() => {
    if (attempt > 0) {
      shake = true;
      const id = setTimeout(() => (shake = false), 360);
      return () => clearTimeout(id);
    }
  });

  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!password) return;
    submitPassword(password);
  }
</script>

<section class="pw">
  <button class="back" onclick={() => app.toHome()}>← Cancel</button>

  <div class="center" class:shake>
    <div class="lock" aria-hidden="true">🔒</div>
    <h1>This script is locked</h1>
    <p class="source">{source}</p>
    <p class="body">Enter the password the sender shared with you.</p>

    <form onsubmit={submit} autocomplete="off">
      <div class="input-row">
        <input
          bind:this={input}
          bind:value={password}
          type={show ? 'text' : 'password'}
          inputmode="text"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          placeholder="Password"
        />
        <button
          type="button"
          class="tap eye"
          aria-label={show ? 'Hide password' : 'Show password'}
          onclick={() => (show = !show)}
        >
          {show ? '🙈' : '👁'}
        </button>
      </div>

      {#if lastError}
        <p class="error">{lastError}</p>
      {/if}

      <button type="submit" class="primary" disabled={!password}>Unlock</button>
    </form>
  </div>
</section>

<style>
  .pw {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding-top: var(--safe-top);
    padding-bottom: var(--safe-bottom);
  }
  .back {
    align-self: flex-start;
    margin: 12px;
    background: transparent;
    border: 0;
    padding: 8px 12px;
    font-size: 15px;
    opacity: 0.7;
    cursor: pointer;
    color: inherit;
  }
  .center {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    gap: 12px;
    text-align: center;
    max-width: 420px;
    margin: 0 auto;
    width: 100%;
  }
  .lock {
    font-size: 40px;
  }
  h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
  .source {
    margin: 0;
    font-size: 13px;
    opacity: 0.55;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .body {
    margin: 0 0 12px;
    font-size: 15px;
    opacity: 0.75;
  }
  form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .input-row {
    position: relative;
    display: flex;
    align-items: center;
  }
  .input-row input {
    flex: 1;
    padding: 14px 48px 14px 16px;
    border-radius: 12px;
    border: 1px solid rgba(127, 127, 127, 0.4);
    font-size: 16px;
    background: transparent;
    color: inherit;
  }
  .eye {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: 0;
    font-size: 18px;
    cursor: pointer;
    opacity: 0.6;
  }
  .error {
    margin: 0;
    font-size: 14px;
    color: #c83c3c;
    text-align: left;
  }
  button.primary {
    padding: 14px 16px;
    border-radius: 12px;
    border: 0;
    font-size: 16px;
    font-weight: 500;
    background: #111;
    color: #fff;
    cursor: pointer;
  }
  :global(body.theme-dark) button.primary {
    background: #fff;
    color: #111;
  }
  button.primary:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .shake {
    animation: shake 0.36s cubic-bezier(0.36, 0.07, 0.19, 0.97);
  }
  @keyframes shake {
    10%, 90% { transform: translateX(-2px); }
    20%, 80% { transform: translateX(4px); }
    30%, 50%, 70% { transform: translateX(-6px); }
    40%, 60% { transform: translateX(6px); }
  }
</style>
