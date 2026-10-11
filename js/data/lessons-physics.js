/* ============================================================
   lessons-physics.js: lesson content for the Physics courses.

   Each lesson:
     slug         page address, becomes #lesson-<slug>
     short        short name for lists and cards
     title        the question the lesson answers
     patent       { number, title, who, year } or null for a background lesson
     youtube      YouTube video ID (the part after watch?v=). Leave "" until published.
     learn        what the reader will be able to do afterwards
     interactive  which model to show (a file in js/interactives/)
     tryIt        one or two sentences telling the reader what to try
     notes        [question, [paragraphs]] pairs. Paragraphs may use <em>, <sub>, <sup>, <code>.
     takeaway     one-sentence summary
   ============================================================ */
window.GI = window.GI || {};
GI.LESSONS = GI.LESSONS || {};

Object.assign(GI.LESSONS, {

  "resolution-limit": {
    short: "The diffraction limit",
    title: "Why can't light see an atom?",
    patent: null, youtube: "",
    learn: [
      "Explain the diffraction limit of a microscope",
      "Compare the wavelength of light and of fast electrons with the size of an atom"
    ],
    interactive: "resolution",
    tryIt: "Push visible light to its limit with the shortest wavelength and the widest lens. Then switch to electrons and raise the voltage.",
    notes: [
      ["What limits a microscope?", [
        "Light spreads out as it passes through a lens opening. This is diffraction. Two points closer together than about <code>d = λ / (2·NA)</code> blur into a single spot, where λ is the wavelength and NA, the numerical aperture, measures how wide a cone of light the lens collects. Ernst Abbe worked this out in 1873.",
        "The best oil-immersion lenses reach NA ≈ 1.4. With visible light between 400 and 700 nm, that puts the limit at roughly 150 to 250 nanometers. Better glass cannot fix it, because the limit comes from the wave itself."
      ]],
      ["How small is an atom?", [
        "Atoms in a solid sit a few tenths of a nanometer apart. In a silicon crystal, neighboring atoms are 0.235 nm apart, about a thousand times smaller than what visible light can resolve."
      ]],
      ["Why do electrons help?", [
        "Electrons also behave as waves, with wavelength <code>λ = h / p</code> (de Broglie). Accelerate an electron through 100 kilovolts and its wavelength is about 3.7 picometers, roughly 60 times smaller than the spacing between silicon atoms. At these energies the electron moves at over half the speed of light, so the formula needs a relativistic correction, which the model includes.",
        "Electron lenses are far from perfect, so real microscopes don't reach the wavelength limit. Aberration-corrected electron microscopes resolve detail down to about 0.05 nm, enough to see individual atomic columns."
      ]]
    ],
    takeaway: "Resolution is set by wavelength. To see atoms you need a probe whose wavelength is smaller than an atom: fast electrons qualify, visible light never can."
  },

  "stm": {
    short: "Scanning tunneling microscope",
    title: "How can a needle see a single atom?",
    patent: { number: "US 4,343,993", title: "Scanning tunneling microscope", who: "G. Binnig, H. Rohrer", year: 1982 },
    youtube: "",
    learn: [
      "Explain quantum tunneling across a vacuum gap",
      "Estimate how fast tunneling current changes with distance",
      "Describe how scanning a tip turns current into an image"
    ],
    interactive: "tunneling",
    tryIt: "Change the gap by one ångström and watch the current. Then look at the line scan: the small bumps of the atoms show up as large swings in current.",
    notes: [
      ["What is quantum tunneling?", [
        "An electron inside a metal is held there by the work function φ, typically 4 to 5 electron-volts. Classically it cannot cross a vacuum gap at all. Quantum mechanically, its wavefunction leaks into the gap and decays exponentially, so if the gap is only a few ångströms wide, some electrons get through. Apply a small voltage across the gap and they form a measurable current."
      ]],
      ["Why is the current so sensitive to distance?", [
        "The current falls off as <code>I ∝ V · e<sup>−2κd</sup></code>, where d is the gap and <code>κ = √(2mφ) / ħ</code>. For a 4 eV work function, 2κ is about 2 per ångström, so every extra ångström of gap cuts the current by roughly a factor of 8.",
        "A change in height of a fraction of an atom therefore changes the current by a large, easily measured amount."
      ]],
      ["How does that become an image?", [
        "The STM scans a sharp metal tip across the surface using piezoelectric actuators, which can move it by fractions of an ångström. A feedback loop raises or lowers the tip to keep the current constant. The tip's height, recorded at each point, traces the surface atom by atom.",
        "Binnig and Rohrer, working at IBM Zurich, shared the 1986 Nobel Prize in Physics for the invention."
      ]],
      ["Why can a blunt-looking tip see single atoms?", [
        "Because current drops so steeply with distance, nearly all of it flows through whichever single atom sticks out furthest at the end of the tip. That one atom becomes the probe, so the microscope reaches atomic resolution even when the tip looks rounded under an optical microscope."
      ]]
    ],
    takeaway: "Tunneling current changes about tenfold per ångström, so a tip held at constant current traces the surface with atomic precision."
  },

  "thermal-light": {
    short: "Stimulated emission",
    title: "Why doesn't ordinary light amplify itself?",
    patent: null, youtube: "",
    learn: [
      "Describe absorption and stimulated emission",
      "Use the Boltzmann factor to compare upper and lower level populations",
      "Explain why a laser needs a population inversion"
    ],
    interactive: "boltzmann",
    tryIt: "Try to make the upper level more crowded than the lower one by raising the temperature. Then try a longer wavelength.",
    notes: [
      ["What is stimulated emission?", [
        "Einstein showed in 1917 that a photon passing an excited atom can trigger it to emit a second photon with the same frequency, direction and phase. One photon goes in, two identical photons come out. That is amplification.",
        "The opposite process, absorption, removes a photon by lifting an atom from the lower level to the upper one."
      ]],
      ["Which wins, emission or absorption?", [
        "For two levels with equal degeneracy, each atom in the upper level is as likely to be stimulated as each atom in the lower level is to absorb. So the net effect depends only on which level holds more atoms. Light grows if <code>N<sub>2</sub> &gt; N<sub>1</sub></code> and fades if <code>N<sub>2</sub> &lt; N<sub>1</sub></code>."
      ]],
      ["Why does nature favor the lower level?", [
        "In thermal equilibrium, populations follow the Boltzmann factor <code>N<sub>2</sub>/N<sub>1</sub> = e<sup>−ΔE/kT</sup></code>. A visible-light transition has ΔE ≈ 2 eV, while kT is only 0.026 eV at room temperature, so the upper level is essentially empty.",
        "The ratio gets closer to 1 as the temperature rises but never exceeds it. Heating a material can never make it amplify light."
      ]],
      ["So how does a laser get gain?", [
        "By pumping energy in from outside, with light, an electrical discharge or a current, faster than the atoms can relax. This drives the medium out of equilibrium into a population inversion, <code>N<sub>2</sub> &gt; N<sub>1</sub></code>. Practical lasers use three or four energy levels to make that inversion easier to hold."
      ]]
    ],
    takeaway: "Amplification needs more atoms in the upper level than the lower one, a state thermal equilibrium never produces, so every laser starts by pumping one into existence."
  },

  "laser-cavity": {
    short: "The laser cavity",
    title: "Why does laser light come out as one pure color?",
    patent: { number: "US 2,929,922", title: "Masers and maser communications system", who: "A. L. Schawlow, C. H. Townes", year: 1960 },
    youtube: "",
    learn: [
      "Explain the role of the two mirrors in a laser",
      "Calculate the mode spacing of a laser cavity",
      "Predict how many modes fall within the gain bandwidth"
    ],
    interactive: "cavity",
    tryIt: "Shorten the cavity until only one mode stays above the threshold line. Then switch to Nd:YAG and see how much shorter it would need to be.",
    notes: [
      ["What did the patent add?", [
        "A gain medium alone amplifies light weakly, in every direction. Schawlow and Townes proposed extending the microwave maser to optical wavelengths by placing the medium between two parallel mirrors facing each other. Light traveling along the axis passes through the gain medium again and again, so only that direction builds up into a strong beam.",
        "The first working laser, Theodore Maiman's ruby laser, followed in 1960."
      ]],
      ["Why only certain colors?", [
        "Between two mirrors, a wave must fit a whole number of half-wavelengths into the cavity length L. The allowed frequencies, called longitudinal modes, are evenly spaced by <code>Δν = c / 2L</code>. A 30 cm cavity gives modes 500 MHz apart."
      ]],
      ["Which modes actually lase?", [
        "Only those where the gain of the medium beats the losses. The gain curve has a finite width, about 1.5 GHz for a helium-neon laser, so the number of lasing modes is roughly the gain width divided by the mode spacing. A short enough cavity leaves just one mode, a single-frequency laser."
      ]],
      ["Why is the beam so narrow and coherent?", [
        "Light that isn't parallel to the axis walks off the mirrors after a few round trips, so only nearly parallel light survives. And because each new photon in a mode is a copy made by stimulated emission, the beam keeps a fixed phase over long distances."
      ]]
    ],
    takeaway: "The mirrors pick out a direction and a comb of allowed frequencies; the gain curve decides which teeth of that comb become laser light."
  },

  "magnetic-sector": {
    short: "Magnetic sector",
    title: "How does a magnet sort molecules by mass?",
    patent: null, youtube: "",
    learn: [
      "Explain why mass spectrometers measure mass-to-charge ratio",
      "Calculate an ion's radius in a magnetic field",
      "Describe how sweeping the field produces a spectrum"
    ],
    interactive: "sector",
    tryIt: "Find the field strength that brings m/z 100 onto the detector. Then change the mass and see which way you have to move the field.",
    notes: [
      ["Why turn molecules into ions?", [
        "Electric and magnetic fields only push on charged particles. A mass spectrometer first ionizes the molecules, then accelerates them through a voltage V, so each ion with charge z carries kinetic energy <code>zeV</code>."
      ]],
      ["What does the magnet do?", [
        "A magnetic field B bends a moving ion into a circle of radius <code>r = mv / (zeB)</code>. Combining this with the ion's energy gives <code>r = √(2mV / ze) / B</code>. Heavier ions, for the same charge, swing on wider circles."
      ]],
      ["How do you read a spectrum?", [
        "Put a narrow slit and a detector at a fixed radius. At any given field strength only one mass-to-charge ratio lands on it. Sweep the field and record the detector current against m/z: that is the mass spectrum.",
        "The instrument measures m/z, not mass alone. A doubly charged ion of mass 200 lands in the same place as a singly charged ion of mass 100."
      ]],
      ["What limits the resolution?", [
        "Ions leave the source with a small spread of energies and angles, which blurs their radii. Double-focusing instruments add an electric sector that corrects for the energy spread, and narrower slits sharpen the peaks at the cost of signal."
      ]]
    ],
    takeaway: "In a magnetic field an ion's radius grows with the square root of its mass-to-charge ratio, so a fixed detector picks out one m/z at a time."
  },

  "orbitrap": {
    short: "Orbitrap",
    title: "How do you weigh a molecule by making it orbit?",
    patent: { number: "US 5,886,346", title: "Mass spectrometer", who: "A. Makarov", year: 1999 },
    youtube: "",
    learn: [
      "Describe how ions move inside an Orbitrap",
      "Explain why the axial frequency depends only on m/z",
      "Explain why longer recording gives sharper peaks"
    ],
    interactive: "orbitrap",
    tryIt: "Set two ions 0.01 apart in m/z and shorten the recording time until their peaks merge. Then lengthen it until they separate again.",
    notes: [
      ["What is the Orbitrap?", [
        "A spindle-shaped central electrode inside a barrel-shaped outer electrode, with a carefully shaped electric field between them. The field pulls ions toward the spindle, so ions injected off-center orbit around it, while along the spindle's axis the field acts like a spring."
      ]],
      ["Why measure the axial oscillation?", [
        "Along the axis the restoring force is exactly proportional to distance, so ions oscillate with frequency <code>ω = √(k · ze / m)</code>. The frequency doesn't depend on the ion's energy or where it started, only on its mass-to-charge ratio. That makes it a very precise scale."
      ]],
      ["How is it detected?", [
        "The oscillating ions induce a tiny image current in the two halves of the outer electrode. The recorded signal contains every ion's frequency at once, and a Fourier transform separates them into a spectrum."
      ]],
      ["Why does longer recording give sharper peaks?", [
        "Two ions whose frequencies differ by Δf start in step and drift out of phase over about <code>1/Δf</code> seconds. To tell them apart you have to record at least that long. In general, a recording of length T resolves frequencies about <code>1/T</code> apart, so resolving power grows in proportion to acquisition time."
      ]]
    ],
    takeaway: "An Orbitrap turns mass into frequency. Measuring frequency longer measures mass more precisely."
  }
});
