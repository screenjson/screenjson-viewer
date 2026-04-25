<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from './lib/state.svelte';
  import { subscribeIncomingOpens } from './lib/platform';
  import { openFromPath, openFromUrl, openFromContents } from './lib/flow/openAndRoute';
  import Home from './lib/components/Home.svelte';
  import Reader from './lib/components/Reader.svelte';
  import PasswordPrompt from './lib/components/PasswordPrompt.svelte';
  import ErrorScreen from './lib/components/ErrorScreen.svelte';
  import LoadingScreen from './lib/components/LoadingScreen.svelte';

  let dragActive = $state(false);
  let dragDepth = 0;

  onMount(() => {
    let unlisten: (() => void) | null = null;

    (async () => {
      unlisten = await subscribeIncomingOpens((target) => {
        if (target.startsWith('http://') || target.startsWith('https://')) {
          openFromUrl(target);
        } else if (target.startsWith('file://')) {
          openFromPath(decodeURIComponent(target.replace(/^file:\/\//, '')));
        } else {
          openFromPath(target);
        }
      });
    })();

    return () => {
      if (unlisten) unlisten();
    };
  });

  function onDragEnter(e: DragEvent) {
    if (!e.dataTransfer?.types.includes('Files')) return;
    dragDepth++;
    dragActive = true;
  }
  function onDragLeave() {
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) dragActive = false;
  }
  function onDragOver(e: DragEvent) {
    if (!e.dataTransfer?.types.includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }
  async function onDrop(e: DragEvent) {
    e.preventDefault();
    dragActive = false;
    dragDepth = 0;
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    try {
      const contents = await file.text();
      openFromContents(file.name, contents);
    } catch (err) {
      app.screen = {
        kind: 'error',
        title: "Couldn't read that file",
        body: 'Try opening the file from the Open button instead.',
        detail: err instanceof Error ? err.message : String(err)
      };
    }
  }
</script>

<main
  ondragenter={onDragEnter}
  ondragleave={onDragLeave}
  ondragover={onDragOver}
  ondrop={onDrop}
>
  {#if app.screen.kind === 'home'}
    <Home />
  {:else if app.screen.kind === 'loading'}
    <LoadingScreen source={app.screen.source} />
  {:else if app.screen.kind === 'password'}
    <PasswordPrompt
      source={app.screen.source}
      lastError={app.screen.lastError}
      attempt={app.screen.attempt}
    />
  {:else if app.screen.kind === 'error'}
    <ErrorScreen
      title={app.screen.title}
      body={app.screen.body}
      detail={app.screen.detail}
    />
  {:else if app.screen.kind === 'reader'}
    <svelte:boundary onerror={(e) => { console.error('[sjv] Reader crashed:', e); app.screen = { kind: 'error', title: "Couldn't display this script", body: "The renderer failed unexpectedly. This is usually a bug — please report it.", detail: e instanceof Error ? `${e.message}\n\n${e.stack ?? ''}` : String(e) }; }}>
      <Reader
        document={app.screen.document}
        source={app.screen.source}
        totalPages={app.screen.totalPages}
      />
    </svelte:boundary>
  {/if}

  {#if dragActive}
    <div class="drop-overlay" aria-hidden="true">
      <div class="drop-card">
        <div class="drop-icon">⤵</div>
        <p class="drop-title">Drop the script to open it</p>
        <p class="drop-hint">.screenjson or .json</p>
      </div>
    </div>
  {/if}
</main>

<style>
  main {
    position: relative;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  .drop-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(17, 17, 17, 0.55);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .drop-card {
    border: 2px dashed rgba(255, 255, 255, 0.6);
    border-radius: 18px;
    padding: 32px 48px;
    text-align: center;
    color: #fff;
  }
  .drop-icon {
    font-size: 48px;
    line-height: 1;
    margin-bottom: 8px;
  }
  .drop-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
  .drop-hint {
    margin: 6px 0 0;
    font-size: 13px;
    opacity: 0.75;
  }
</style>
