/* ============================================================
   figures/physics.js: FIG. 1A, scanning electron beam column.
   Drawing is on a 480 x 400 grid. Edit part text (l, d) freely.
   ============================================================ */
window.GI = window.GI || {};

GI.FIGS.ph = {
  code: "1A",
  title: "Scanning electron beam column",
  ctrl: { label: "Deflection", min: -1, max: 1, step: .01, val: .35, fmt: v => `${(v * 12).toFixed(1)} µm` },
  tryit: [
    "Hover a numeral to identify each part.",
    "Drag the slider to steer the beam with the deflector (16).",
    "Watch the spot scan the sample (20) while the detector (22) collects electrons."
  ],
  parts: [
    { n:10, l:"Electron source", d:"A sharp heated tip emits the electrons that become the beam.",
      s:[["circle",{cx:200,cy:40,r:12}],["path",{d:"M193 35 L200 45 L207 35"}]], num:[436,44], to:[213,40] },
    { n:12, l:"Anode", d:"A high-voltage plate that accelerates electrons down the column.",
      s:[["rect",{x:150,y:72,width:38,height:8,cls:"hfill"}],["rect",{x:212,y:72,width:38,height:8,cls:"hfill"}]], num:[436,84], to:[250,76] },
    { n:14, l:"Condenser lens", d:"A magnetic coil that squeezes the spreading beam into a tight pencil.",
      s:[["rect",{x:138,y:112,width:46,height:30,rx:4,cls:"hfill"}],["rect",{x:216,y:112,width:46,height:30,rx:4,cls:"hfill"}]], num:[436,128], to:[262,127] },
    { n:16, l:"Deflector", d:"Two plates whose voltage bends the beam sideways. Drag the slider to scan it.",
      s:[["line",{x1:182,y1:168,x2:182,y2:212,cls:"thick"}],["line",{x1:218,y1:168,x2:218,y2:212,cls:"thick"}]], num:[436,176], to:[219,190] },
    { n:18, l:"Objective lens", d:"The final lens. It focuses the beam to a spot a few nanometers wide.",
      s:[["rect",{x:128,y:236,width:56,height:36,rx:4,cls:"hfill"}],["rect",{x:216,y:236,width:56,height:36,rx:4,cls:"hfill"}]], num:[436,232], to:[272,250] },
    { n:22, l:"Detector", d:"Collects secondary electrons knocked out of the sample. Their count becomes one pixel.",
      s:[["rect",{x:302,y:290,width:44,height:20,rx:3}],["line",{x1:310,y1:300,x2:338,y2:300}]], num:[436,282], to:[346,298] },
    { n:20, l:"Sample stage", d:"Holds the wafer. Scanning the spot across it builds the image line by line.",
      s:[["rect",{x:110,y:332,width:180,height:12,cls:"dfill"}],["line",{x1:130,y1:344,x2:130,y2:362}],["line",{x1:270,y1:344,x2:270,y2:362}],["line",{x1:104,y1:362,x2:296,y2:362}]], num:[436,340], to:[291,338] }
  ],

  build(dyn, sv) {
    return {
      beam:  sv("path",   { class:"dyn-stroke", "stroke-width":1.6, "stroke-dasharray":"2 5", opacity:.9 }, dyn),
      spot:  sv("circle", { r:4, class:"dyn-acc" }, dyn),
      trace: sv("line",   { class:"dyn-stroke", "stroke-width":2, opacity:.35, y1:333, y2:333 }, dyn),
      e:  Array.from({ length:16 }, () => sv("circle", { r:2.4, class:"dyn-acc" }, dyn)),   // beam electrons
      se: Array.from({ length:5 },  () => sv("circle", { r:1.8, class:"dyn-acc" }, dyn)),   // secondary electrons
      min: 200, max: 200
    };
  },

  tick(D, t, st) {
    const set = (el, o) => { for (const a in o) el.setAttribute(a, o[a]); };
    let v = st.val;
    if (st.auto) { v = Math.sin(t * .7) * .85; st.show(v); }      // gentle auto-scan until the visitor drags
    const dx = v * 68, pts = [[200,52],[200,168],[200 + dx * .18,212],[200 + dx,332]];
    D.beam.setAttribute("d", "M" + pts.map(p => p.join(" ")).join(" L"));
    set(D.spot, { cx:200 + dx, cy:332, r:3.5 + Math.sin(t * 8) });
    D.min = Math.min(D.min, 200 + dx); D.max = Math.max(D.max, 200 + dx); set(D.trace, { x1:D.min, x2:D.max });
    D.e.forEach((c, i) => { const [x, y] = GI.along(pts, ((t * .45) + i / D.e.length) % 1); set(c, { cx:x, cy:y }); });
    D.se.forEach((c, i) => { const u = ((t * .8) + i / 5) % 1, sx = 200 + dx; set(c, { cx:sx + (318 - sx) * u, cy:332 - Math.sin(u * Math.PI) * 46 - u * 20, opacity:(1 - u) * .8 }); });
  }
};
