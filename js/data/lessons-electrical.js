/* ============================================================
   lessons-electrical.js: lesson content for the Electrical
   engineering courses. Field reference: see lessons-physics.js.
   ============================================================ */
window.GI = window.GI || {};
GI.LESSONS = GI.LESSONS || {};

Object.assign(GI.LESSONS, {

  "tyranny-of-numbers": {
    short: "The integrated circuit",
    title: "Why couldn't engineers just build bigger circuits?",
    patent: { number: "US 3,138,743", title: "Miniaturized electronic circuits", who: "J. S. Kilby", year: 1964 },
    youtube: "",
    learn: [
      "Explain the \"tyranny of numbers\" in hand-built circuits",
      "Calculate how circuit reliability falls with the number of joints",
      "Describe Kilby's idea of forming every component in one crystal"
    ],
    interactive: "reliability",
    tryIt: "Start with 1,000 components and make each joint as reliable as you like. Then multiply the number of components by ten and watch what happens.",
    notes: [
      ["What was the \"tyranny of numbers\"?", [
        "In the 1950s every transistor, resistor and capacitor was a separate part, wired to the others with hand-soldered joints. A more capable circuit meant more parts and more joints, and every joint was another chance to fail."
      ]],
      ["How fast does reliability fall?", [
        "If each joint works with probability r and the circuit needs n of them, the whole circuit works with probability <code>r<sup>n</sup></code>. Even at r = 99.99%, a circuit with 10,000 joints works only about 37% of the time. Reliability falls exponentially with size, no matter how careful the assembly."
      ]],
      ["What did Kilby propose?", [
        "Make all the components out of the same piece of semiconductor: resistors from the material's own resistance, capacitors from p–n junctions, and transistors alongside them. Jack Kilby demonstrated a working germanium circuit built this way at Texas Instruments in September 1958."
      ]],
      ["What was still missing?", [
        "Kilby's first chips still connected their components with fine gold wires attached by hand. The next lesson shows how the planar process moved the wiring onto the chip itself."
      ]]
    ],
    takeaway: "Every hand-made joint multiplies the chance of failure; building all components in one crystal removed the joints between them."
  },

  "planar-process": {
    short: "The planar process",
    title: "How did chips become printable?",
    patent: { number: "US 2,981,877", title: "Semiconductor device-and-lead structure", who: "R. N. Noyce", year: 1961 },
    youtube: "",
    learn: [
      "Explain how an oxide layer lets wiring lie flat on a chip",
      "Describe the steps of photolithography",
      "Estimate the smallest feature a lithography tool can print"
    ],
    interactive: "litho",
    tryIt: "Pick each light source in turn and find the smallest half-pitch it can print. Then lower k₁ toward its limit of 0.25.",
    notes: [
      ["What did the planar process change?", [
        "Building on Jean Hoerni's planar process at Fairchild Semiconductor, Noyce's patent kept the silicon surface flat and covered by a layer of silicon dioxide. The oxide protects the p–n junctions underneath, and metal lines deposited on top of it reach the components through small openings. Wiring became one more layer of the chip instead of a tangle of hand-attached wires."
      ]],
      ["Why does a flat surface matter?", [
        "A flat, layered surface can be patterned with photolithography. Coat the wafer with a light-sensitive resist, expose it through a mask, develop away the exposed areas, then etch or deposit through the openings. Every component and wire on the chip is made at once, the way a photograph is printed from a negative."
      ]],
      ["How small can lithography print?", [
        "The smallest half-pitch a projection system can print is about <code>k<sub>1</sub> · λ / NA</code>. Shorter wavelengths and wider-aperture optics print finer lines.",
        "The industry moved from mercury lamps (436 and 365 nm) to excimer lasers (248 and 193 nm), added water between lens and wafer to push NA above 1, and since 2019 has used extreme ultraviolet light at 13.5 nm in volume production."
      ]],
      ["What is k₁?", [
        "A process factor that captures everything beyond the optics: the resist, the illumination shape, and tricks in the mask. Its physical limit for a single exposure is 0.25. Going smaller requires splitting one layer into several exposures."
      ]]
    ],
    takeaway: "Keeping the chip flat let wires and components be printed together, and printing resolution, k₁·λ/NA, has set the size of transistors ever since."
  },

  "mosfet": {
    short: "The MOSFET",
    title: "How does a voltage switch a transistor on?",
    patent: { number: "US 3,102,230", title: "Electric field controlled semiconductor device", who: "D. Kahng", year: 1963 },
    youtube: "",
    learn: [
      "Describe the structure of a MOSFET",
      "Explain the threshold voltage and the inversion layer",
      "Distinguish the cutoff, linear and saturation regions"
    ],
    interactive: "mosfet",
    tryIt: "Hold the gate below threshold and sweep the drain voltage: nothing flows. Raise the gate and watch the curve rise, then flatten into saturation.",
    notes: [
      ["What is a MOSFET?", [
        "A metal-oxide-semiconductor field-effect transistor: a gate electrode separated from the silicon by a thin insulating oxide, with source and drain regions on either side. Mohamed Atalla and Dawon Kahng demonstrated the first one at Bell Labs in 1959."
      ]],
      ["How does the gate turn it on?", [
        "In an n-channel device, a positive gate voltage attracts electrons to the silicon surface under the oxide. Above the threshold voltage <code>V<sub>th</sub></code> enough gather to form a thin conducting layer, the inversion layer, which connects source to drain."
      ]],
      ["How much current flows?", [
        "With a small drain voltage the channel acts like a resistor whose conductance grows with the gate voltage: the linear region. As <code>V<sub>DS</sub></code> rises to <code>V<sub>GS</sub> − V<sub>th</sub></code>, the channel pinches off near the drain and the current levels off: saturation, where <code>I<sub>D</sub> ≈ (k/2)(V<sub>GS</sub> − V<sub>th</sub>)<sup>2</sup></code>.",
        "The model uses this classic long-channel description. Modern short-channel transistors deviate from it, but the three regions remain."
      ]],
      ["Why did this matter for chips?", [
        "The oxide insulates the gate, so it draws essentially no steady current. The transistor is controlled by voltage alone, and it is simple and flat enough to print by the billion."
      ]]
    ],
    takeaway: "A gate voltage above threshold creates a conducting channel; below it, the switch is off and draws no gate current."
  },

  "cmos": {
    short: "CMOS logic",
    title: "Why does a phone chip barely use power while waiting?",
    patent: { number: "US 3,356,858", title: "Low stand-by power complementary field effect circuitry", who: "F. M. Wanlass", year: 1967 },
    youtube: "",
    learn: [
      "Explain how an n-channel and a p-channel transistor form an inverter",
      "Show why a CMOS inverter draws no current in either steady state",
      "Relate switching activity to power consumption"
    ],
    interactive: "cmos",
    tryIt: "Sweep the input from 0 to the supply voltage. Notice that current flows only while the input is in the middle, when both transistors are partly on.",
    notes: [
      ["What problem did Wanlass solve?", [
        "Early MOS logic used one type of transistor with a resistor or a load transistor above it. Whenever the output was low, current flowed straight from the supply to ground, even if nothing was changing. Chips burned power just sitting still."
      ]],
      ["What does pairing n and p transistors do?", [
        "In a CMOS inverter, a p-channel transistor connects the output to the supply and an n-channel transistor connects it to ground. The same input turns one on and the other off. With the input low, only the p-channel conducts and the output sits at the supply voltage; with the input high, only the n-channel conducts and the output sits at ground. Either way, there is no path from supply to ground."
      ]],
      ["When does current flow?", [
        "Only while switching. For a brief moment as the input passes through the middle, both transistors are partly on and a pulse of current flows straight through. The output's load capacitance also charges or discharges. Power becomes roughly <code>C · V<sup>2</sup> · f</code>, proportional to how often the circuit switches."
      ]],
      ["Why did CMOS win?", [
        "Near-zero standby power made digital watches and calculators practical, and later phones and laptops. Nearly every digital chip made today is CMOS. In very small modern transistors some current leaks even when they are off, which the simple model here leaves out."
      ]]
    ],
    takeaway: "With one transistor always off, a CMOS gate draws current only when it switches, so idle circuits use almost no power."
  }
});
