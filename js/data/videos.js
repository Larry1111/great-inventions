/* ============================================================
   videos.js: the episode list. Add, remove or reorder here.

   Each episode:
     slug     page address, becomes #ep-<slug> (letters, numbers, dashes)
     f        field: "ph", "ee" or "cs"
     title    the question the episode answers
     patent   patent number as you want it shown
     pt       the patent's own title
     who      inventors
     yr       year issued
     youtube  YouTube video ID (the part after watch?v=). Leave "" until published.
     blurb    one or two sentences shown on the episode page
     qs       the chain of questions, in order
   ============================================================ */
window.GI = window.GI || {};

GI.VIDEOS = [
  { slug:"orbitrap", f:"ph", title:"How do you weigh a single molecule by making it orbit?",
    patent:"US 5,886,346", pt:"Mass spectrometer (Orbitrap)", who:"A. Makarov", yr:1999, youtube:"",
    blurb:"Ions trapped around a spindle-shaped electrode oscillate at a frequency set by their mass. Measure the frequency and you have weighed the molecule.",
    qs:["How do you weigh a molecule at all?","What if ions orbited a spindle-shaped electrode?","How does an oscillation frequency reveal mass?","Why does this give such sharp resolution?"] },

  { slug:"stm", f:"ph", title:"How can a needle see a single atom?",
    patent:"US 4,343,993", pt:"Scanning tunneling microscope", who:"G. Binnig, H. Rohrer", yr:1982, youtube:"",
    blurb:"A sharp tip held a few atoms away from a surface leaks a tiny tunneling current that changes enormously with distance. Scanning the tip maps the atoms.",
    qs:["Why can't light show you an atom?","What is quantum tunneling?","Why does the current change so fast with distance?","How do you hold a tip steady to a fraction of an atom?"] },

  { slug:"laser", f:"ph", title:"Why does laser light stay in a straight, single-color line?",
    patent:"US 2,929,922", pt:"Masers and maser communications system", who:"A. Schawlow, C. Townes", yr:1960, youtube:"",
    blurb:"Excited atoms between two mirrors are triggered to emit identical photons, which bounce back and forth and build into one coherent beam.",
    qs:["What is stimulated emission?","How do you get more atoms excited than relaxed?","Why put mirrors at both ends?","What makes this light different from a lamp's?"] },

  { slug:"cmos", f:"ee", title:"Why does your phone's chip barely use power while it waits?",
    patent:"US 3,356,858", pt:"Low stand-by power complementary field effect circuitry (CMOS)", who:"F. Wanlass", yr:1967, youtube:"",
    blurb:"Pairing an n-type and a p-type transistor means one is always off, so current only flows during the instant a gate switches.",
    qs:["Why did early logic burn power while idle?","What happens when you pair n-type and p-type transistors?","Why does current flow only during a switch?","How did this make battery devices possible?"] },

  { slug:"planar", f:"ee", title:"How did one flat layer of glass make chips printable?",
    patent:"US 2,981,877", pt:"Semiconductor device-and-lead structure", who:"R. Noyce", yr:1961, youtube:"",
    blurb:"A protective oxide layer lets metal wiring lie flat across the silicon surface, so a whole circuit can be made by printing layers instead of wiring parts by hand.",
    qs:["What problem did hand-attached wires leave?","How does a planar oxide protect a junction?","How do metal lines lie flat on silicon?","Why does this let you print circuits like a photograph?"] },

  { slug:"kilby-ic", f:"ee", title:"What if every part of a circuit came from one crystal?",
    patent:"US 3,138,743", pt:"Miniaturized electronic circuits", who:"J. Kilby", yr:1964, youtube:"",
    blurb:"Resistors, capacitors and transistors can all be formed in one piece of semiconductor, ending the need to build circuits from separate parts.",
    qs:["Why did circuits need so much hand wiring?","Can a resistor and a capacitor be made of semiconductor?","How do you isolate parts on one chip?","What was still missing?"] },

  { slug:"attention", f:"cs", title:"How does a model decide which words to pay attention to?",
    patent:"US 10,452,978", pt:"Attention-based sequence transduction neural networks", who:"A. Vaswani et al.", yr:2019, youtube:"",
    blurb:"Instead of reading one word at a time, every word compares itself with every other word and takes a weighted mix of what it finds relevant.",
    qs:["Why did older networks read one word at a time?","What does it mean for a word to attend?","What are queries, keys and values?","Why run many attention heads at once?","How does this turn into a chatbot?"] },

  { slug:"rsa", f:"cs", title:"How do two strangers share a secret in public?",
    patent:"US 4,405,829", pt:"Cryptographic communications system and method (RSA)", who:"R. Rivest, A. Shamir, L. Adleman", yr:1983, youtube:"",
    blurb:"Multiplying two large primes is easy and splitting the product is hard. That one-way gap lets anyone lock a message that only the key holder can open.",
    qs:["Why can't you just send the key?","What is a one-way function?","Why are big primes easy to multiply but hard to split?","How does a public key lock what only a private key opens?","What would break it?"] },

  { slug:"pagerank", f:"cs", title:"How did Google decide which page matters most?",
    patent:"US 6,285,999", pt:"Method for node ranking in a linked database (PageRank)", who:"L. Page", yr:2001, youtube:"",
    blurb:"A link is a vote, and votes from important pages count more. Solving that loop gives every page on the web a rank.",
    qs:["Why doesn't counting keywords work?","What if a link is a vote?","Why should some votes count more?","How do you solve a loop of votes?","What does a random surfer have to do with it?"] }
];
