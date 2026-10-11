/* ============================================================
   core/scene.js: the canvas animation engine used by cards,
   field panels and the episode player.

   Each field's drawing lives in js/scenes/<field>.js and registers:
     GI.SCENES.ph = { init(s), draw(s, ctx, w, h, t, dt, accent) }
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  GI.SCENES = {};
  GI.active = new Set();      // scenes animating right now
  GI.allScenes = new Set();   // every scene on the page
  GI.state = { curFig: null };

  // tracks which canvases are on screen so off-screen ones don't animate
  GI.vis = new IntersectionObserver(es => es.forEach(e => {
    if (e.target._scene) e.target._scene.visible = e.isIntersecting;
    if (e.target._fig) e.target._fig.visible = e.isIntersecting;
  }), { rootMargin: "80px" });

  class Scene {
    constructor(cv, mode, seed) {
      this.cv = cv; this.ctx = cv.getContext("2d"); this.mode = mode; this.seed = seed;
      this.r = GI.rng(seed * 977 + 13); this.px = null; this.py = null; this.visible = false; this.t0 = seed * 3.1;
      this.impl = GI.SCENES[mode];
      this.impl.init(this);
      GI.allScenes.add(this);
      this.ro = new ResizeObserver(() => { this.resize(); this.drawStatic(); });
      this.ro.observe(cv);
      GI.vis.observe(cv); cv._scene = this;
      cv.addEventListener("pointermove", e => { const b = cv.getBoundingClientRect(); this.px = (e.clientX - b.left) / b.width; this.py = (e.clientY - b.top) / b.height; });
      cv.addEventListener("pointerleave", () => { this.px = this.py = null; });
    }
    destroy() { this.ro.disconnect(); GI.vis.unobserve(this.cv); GI.active.delete(this); GI.allScenes.delete(this); }
    resize() {
      const b = this.cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
      this.w = b.width; this.h = b.height;
      this.cv.width = Math.max(1, Math.round(b.width * d)); this.cv.height = Math.max(1, Math.round(b.height * d));
      this.ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    drawStatic() { if (!this.w) this.resize(); this.draw(this.t0, 0); }
    draw(t, dt) {
      const c = this.ctx, w = this.w, h = this.h; if (!w) return;
      c.clearRect(0, 0, w, h); c.fillStyle = GI.C.sheet; c.fillRect(0, 0, w, h);
      this.impl.draw(this, c, w, h, t, dt, GI.C[this.mode]);
    }
    // small instrument-style labels in the corners
    label(a, b) {
      const c = this.ctx; c.font = '500 10px "IBM Plex Mono", monospace'; c.fillStyle = GI.C.muted;
      c.fillText(a, 10, this.h - 10); c.fillText(b, this.w - c.measureText(b).width - 10, 16);
    }
  }
  GI.Scene = Scene;

  // one animation loop for the whole site
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; const t = now / 1000;
    if (!document.hidden) {
      GI.active.forEach(s => { if (s.visible) s.draw(t + s.t0, dt); });
      if (GI.state.curFig) GI.state.curFig.frame(now, dt);
    }
    requestAnimationFrame(loop);
  }
  GI.startLoop = () => { if (!GI.reduce) requestAnimationFrame(loop); };
})(window.GI);
