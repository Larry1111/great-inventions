/* ============================================================
   figures/electrical.js: FIG. 1B, MOSFET cross-section.
   Above the threshold voltage the channel opens and electrons flow.
   ============================================================ */
window.GI = window.GI || {};

GI.FIGS.ee = {
  code: "1B",
  title: "MOSFET, cross-section",
  ctrl: { label: "Gate voltage", min: 0, max: 1.2, step: .01, val: .75, fmt: v => `${v.toFixed(2)} V` },
  tryit: [
    "Hover a numeral to identify each part.",
    "Drop the gate voltage below 0.45 V and the channel (40) closes.",
    "Raise it and electrons stream from source (32) to drain (34)."
  ],
  vth: .45,   // threshold voltage shown in the figure
  parts: [
    { n:30, l:"Substrate", d:"Lightly doped p-type silicon. With no gate voltage, nothing conducts between source and drain.",
      s:[["rect",{x:60,y:214,width:320,height:126,cls:"dfill"}]], num:[436,322], to:[381,322] },
    { n:42, l:"Terminals", d:"Source (S), gate (G) and drain (D). The gate never touches the channel; it pushes with an electric field.",
      s:[["line",{x1:134,y1:214,x2:134,y2:112}],["circle",{cx:134,cy:105,r:6}],["line",{x1:230,y1:150,x2:230,y2:112}],["circle",{cx:230,cy:105,r:6}],["line",{x1:326,y1:214,x2:326,y2:112}],["circle",{cx:326,cy:105,r:6}]],
      num:[34,108], to:[127,105], txt:[[134,88,"S"],[230,88,"G"],[326,88,"D"]] },
    { n:38, l:"Gate", d:"A conductor on top. Raising its voltage pulls electrons up toward the surface.",
      s:[["rect",{x:180,y:150,width:100,height:44}]], num:[436,152], to:[281,165] },
    { n:36, l:"Gate oxide", d:"A thin insulator, only a few atoms thick in modern chips. It keeps the gate from leaking.",
      s:[["rect",{x:172,y:194,width:116,height:16,cls:"hfill"}]], num:[436,196], to:[289,202] },
    { n:34, l:"Drain", d:"Heavily doped n+ region. Electrons that cross the channel leave through here.",
      s:[["path",{d:"M280 214 h92 v20 q0 20 -20 20 h-52 q-20 0 -20 -20 z"}]], num:[436,244], to:[372,232] },
    { n:32, l:"Source", d:"Heavily doped n+ region, a reservoir of free electrons.",
      s:[["path",{d:"M88 214 h92 v20 q0 20 -20 20 h-52 q-20 0 -20 -20 z"}]], num:[34,250], to:[87,232] },
    { n:40, l:"Channel", d:"Above the threshold voltage an inversion layer forms here and current flows. Move the slider past 0.45 V.",
      s:[["rect",{x:180,y:215,width:100,height:9,dash:1}]], num:[230,388], to:[230,226] }
  ],

  build(dyn, sv) {
    const mk = (x0, s) => Array.from({ length:10 }, (_, i) => ({ x:x0 + (i % 5) * 15 + ((i * s) % 5), y:226 + Math.floor(i / 5) * 12, el:sv("circle", { r:2.4, class:"dyn-acc", opacity:.7 }, dyn) }));
    return {
      res:  mk(100, 7).concat(mk(292, 3)),                                                       // electrons resting in source and drain
      flow: Array.from({ length:22 }, (_, i) => ({ u:i / 22, el:sv("circle", { r:2.4, class:"dyn-acc" }, dyn) })),
      glow: sv("rect", { x:180, y:150, width:100, height:44, class:"dyn-acc", opacity:0 }, dyn),
      txt:  sv("text", { x:60, y:166, class:"lbl" }, dyn),
      txt2: sv("text", { x:60, y:182, class:"lbl" }, dyn),
      arrow: sv("path", { class:"dyn-stroke", "stroke-width":1.4, d:"M196 260 H264 M256 255 L264 260 L256 265" }, dyn)
    };
  },

  tick(D, t, st) {
    const set = (el, o) => { for (const a in o) el.setAttribute(a, o[a]); };
    const vg = st.val, vth = this.vth, on = Math.max(0, (vg - vth) / (1.2 - vth)), n = Math.round(on * 22);
    if (st.chan) st.chan.style.fillOpacity = (on * .35).toFixed(2);
    D.glow.setAttribute("opacity", (vg / 1.2 * .18).toFixed(2));
    D.res.forEach((p, i) => set(p.el, { cx:p.x + Math.sin(t * 3 + i) * 1.5, cy:p.y + Math.cos(t * 2.6 + i * 1.7) * 1.5 }));
    D.flow.forEach((p, i) => {
      const show = i < n; p.el.setAttribute("opacity", show ? 1 : 0); if (!show) return;
      const u = ((t * (.25 + on * .5)) + p.u) % 1; set(p.el, { cx:150 + u * 176, cy:219 + Math.sin(u * 9 + i) * 1.6 });
    });
    D.txt.textContent  = vg < vth ? "Vg < Vth (0.45 V)" : "Vg ≥ Vth (0.45 V)";
    D.txt2.textContent = vg < vth ? "channel closed · OFF" : `channel open · ON (${Math.round(on * 100)}%)`;
    D.arrow.setAttribute("opacity", n > 0 ? 1 : 0);
  }
};
