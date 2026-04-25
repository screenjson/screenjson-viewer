<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { ScreenJSONViewer, TitlePage, type ScreenJSONDocument } from 'screenjson-ui';
  import { app } from '../state.svelte';
  import TopBar from './TopBar.svelte';
  import PageSlider from './PageSlider.svelte';

  let {
    document: doc,
    source,
    totalPages
  }: {
    document: ScreenJSONDocument;
    source: string;
    totalPages: number;
  } = $props();

  let stage: HTMLDivElement | null = $state(null);

  /** Desktops get persistent chrome; phones auto-hide on tap. */
  function isCoarsePointer(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(pointer: coarse)').matches
    );
  }

  function toggleChrome() {
    // Don't hide chrome on desktop — it has room for it.
    if (!isCoarsePointer()) return;
    app.chromeVisible = !app.chromeVisible;
  }

  // ---------------------------------------------------------------------
  // Pinch-to-zoom (touch). Single-finger is left to the browser for
  // vertical scroll (see touch-action: pan-y on .stage below).
  // ---------------------------------------------------------------------
  const activePointers = new Map<number, { x: number; y: number }>();
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  let lastTapTs = 0;
  let lastTapX = 0;
  let lastTapY = 0;

  function pairDistance(): number {
    const pts = Array.from(activePointers.values());
    if (pts.length < 2) return 0;
    const [a, b] = pts;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function onStagePointerDown(e: PointerEvent) {
    if (e.pointerType !== 'touch') return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.size === 2) {
      pinchStartDistance = pairDistance();
      pinchStartZoom = app.zoom;
    }
  }
  function onStagePointerMove(e: PointerEvent) {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.size >= 2 && pinchStartDistance > 0) {
      const d = pairDistance();
      const ratio = d / pinchStartDistance;
      app.setZoom(pinchStartZoom * ratio);
      // Don't scroll while pinching.
      e.preventDefault();
    }
  }
  function onStagePointerUp(e: PointerEvent) {
    const wasPinching = activePointers.size >= 2;
    activePointers.delete(e.pointerId);
    if (activePointers.size < 2) pinchStartDistance = 0;
    if (wasPinching) return; // swallow the tap after a pinch

    // Double-tap to toggle 1× ↔ 1.5× on touch devices.
    if (e.pointerType === 'touch') {
      const now = Date.now();
      const near =
        Math.abs(e.clientX - lastTapX) < 30 &&
        Math.abs(e.clientY - lastTapY) < 30;
      if (now - lastTapTs < 320 && near) {
        app.setZoom(app.zoom > 1.05 ? 1 : 1.5);
        lastTapTs = 0;
        return;
      }
      lastTapTs = now;
      lastTapX = e.clientX;
      lastTapY = e.clientY;
    }
  }

  /**
   * Page tracking via IntersectionObserver. Avoids the fragility of finding
   * the right scroll container — we just watch which page elements are on
   * screen and pick the most-visible one.
   *
   * Seek via getBoundingClientRect math on the found scroll container.
   */
  let pageEls: HTMLElement[] = [];
  const visibilityMap = new Map<HTMLElement, number>();

  function refreshPageRefs(intersectionObs: IntersectionObserver) {
    if (!stage) return;
    const nodes = Array.from(stage.querySelectorAll<HTMLElement>('.paper-page'));
    // Observe only newly-seen pages; disconnect for removed ones.
    const known = new Set(pageEls);
    for (const n of nodes) {
      if (!known.has(n)) intersectionObs.observe(n);
    }
    for (const old of pageEls) {
      if (!nodes.includes(old)) {
        intersectionObs.unobserve(old);
        visibilityMap.delete(old);
      }
    }
    pageEls = nodes;
  }

  function updateCurrentPageFromVisibility() {
    if (pageEls.length === 0) return;
    let bestIdx = 0;
    let bestRatio = -1;
    for (let i = 0; i < pageEls.length; i++) {
      const r = visibilityMap.get(pageEls[i]) ?? 0;
      if (r > bestRatio) {
        bestRatio = r;
        bestIdx = i;
      }
    }
    if (bestRatio > 0) app.currentPage = bestIdx + 1;
  }

  function findScrollContainer(from: HTMLElement): HTMLElement | null {
    let el: HTMLElement | null = from.parentElement;
    while (el) {
      const overflow = getComputedStyle(el).overflowY;
      if ((overflow === 'auto' || overflow === 'scroll') && el.scrollHeight > el.clientHeight + 4) {
        return el;
      }
      el = el.parentElement;
    }
    return document.scrollingElement as HTMLElement | null;
  }

  function seekToPage(page: number) {
    if (pageEls.length === 0) return;
    const idx = Math.max(0, Math.min(pageEls.length - 1, page - 1));
    const target = pageEls[idx];
    if (!target) return;
    const scroller = findScrollContainer(target);
    if (!scroller) return;
    const targetTop = target.getBoundingClientRect().top;
    const containerTop = scroller.getBoundingClientRect().top;
    scroller.scrollBy({ top: targetTop - containerTop - 16, behavior: 'smooth' });
  }

  onMount(() => {
    let intersectionObs: IntersectionObserver | null = null;
    let mutationObs: MutationObserver | null = null;
    let rafId = 0;

    const scheduleUpdate = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        updateCurrentPageFromVisibility();
      });
    };

    const settle = async () => {
      await tick();
      if (!stage) return;

      intersectionObs = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            visibilityMap.set(e.target as HTMLElement, e.intersectionRatio);
          }
          scheduleUpdate();
        },
        {
          // Sample intersection at multiple thresholds so scrolling
          // between pages gives smooth updates.
          threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
        }
      );

      refreshPageRefs(intersectionObs);
      scheduleUpdate();

      mutationObs = new MutationObserver(() => {
        if (intersectionObs) refreshPageRefs(intersectionObs);
      });
      mutationObs.observe(stage, { childList: true, subtree: true });
    };

    // Give the viewer a frame to render.
    const id = setTimeout(settle, 50);

    return () => {
      clearTimeout(id);
      if (rafId) cancelAnimationFrame(rafId);
      intersectionObs?.disconnect();
      mutationObs?.disconnect();
    };
  });
</script>

<section class="reader" class:chrome={app.chromeVisible}>
  {#if app.chromeVisible}
    <TopBar {source} />
  {/if}

  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="stage"
    bind:this={stage}
    onclick={toggleChrome}
    onpointerdown={onStagePointerDown}
    onpointermove={onStagePointerMove}
    onpointerup={onStagePointerUp}
    onpointercancel={onStagePointerUp}
  >
    <TitlePage document={doc} />

    <ScreenJSONViewer
      document={doc}
      theme={app.theme}
      zoom={app.zoom}
      showMenu={false}
      paginated={true}
    />
  </div>

  {#if app.chromeVisible}
    <footer>
      <PageSlider
        current={app.currentPage}
        total={totalPages}
        onSeek={seekToPage}
      />
    </footer>
  {/if}
</section>

<style>
  .reader {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    min-height: 0;
  }
  .stage {
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    position: relative;
    /* Let one-finger drags pan vertically, but intercept pinch so our
       gesture handler can drive `app.zoom` instead of the browser's
       built-in page zoom. */
    touch-action: pan-y;
  }

  /* Make .stage the single scroll container: neutralize the viewer's
     internal scroll so the TitlePage and the script pages scroll as one. */
  .stage :global(.screenplay-viewer) {
    min-height: auto !important;
    overflow: visible !important;
  }
  /* Render the viewer edge-to-edge; it provides its own page paper. */
  .stage :global(> *) {
    height: 100%;
  }
  footer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding-bottom: var(--safe-bottom);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: rgba(255, 255, 255, 0.8);
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
  :global(body.theme-dark) footer {
    background: rgba(18, 18, 18, 0.8);
    border-top-color: rgba(255, 255, 255, 0.08);
  }
</style>
