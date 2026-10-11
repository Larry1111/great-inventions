/* ============================================================
   lessons-computing.js: lesson content for the Computer science
   courses. Field reference: see lessons-physics.js.
   ============================================================ */
window.GI = window.GI || {};
GI.LESSONS = GI.LESSONS || {};

Object.assign(GI.LESSONS, {

  "one-way": {
    short: "One-way functions",
    title: "What makes a lock easy to close but hard to open?",
    patent: null, youtube: "",
    learn: [
      "Explain why public-key cryptography is needed",
      "Define a one-way function",
      "Estimate how factoring effort grows with the size of a number"
    ],
    interactive: "oneway",
    tryIt: "Slide the number of digits up to 617, the size of a standard RSA key, and compare the two curves. Then try factoring a 15-digit number yourself.",
    notes: [
      ["Why can't you just send the key?", [
        "Classic ciphers use one shared key to lock and unlock. If you send that key over the same channel as the message, anyone listening copies it too. Public-key cryptography solves this by making the lock public while the key that opens it stays private."
      ]],
      ["What is a one-way function?", [
        "A function that is easy to compute but hard to reverse. Multiplying two prime numbers is easy: even 300-digit primes multiply in microseconds. Recovering the primes from their product is factoring, and no known method on a classical computer does it efficiently for large numbers."
      ]],
      ["How hard is factoring?", [
        "The simplest method, trial division, tries every possible divisor up to <code>√n</code>, about <code>10<sup>d/2</sup></code> candidates for a d-digit number. Each extra pair of digits makes it ten times harder.",
        "Better algorithms such as the number field sieve are much faster but still grow faster than any polynomial. The 250-digit challenge number RSA-250 was factored in 2020 using about 2,700 core-years of computing. Standard 2048-bit keys, 617 digits long, remain far beyond reach."
      ]],
      ["What would break it?", [
        "A large quantum computer running Shor's algorithm could factor efficiently. That threat is why the U.S. National Institute of Standards and Technology published its first post-quantum cryptography standards in 2024."
      ]]
    ],
    takeaway: "Multiplying is easy and factoring is hard; that gap is what lets a lock be public while its key stays secret."
  },

  "rsa": {
    short: "RSA",
    title: "How do two strangers share a secret in public?",
    patent: { number: "US 4,405,829", title: "Cryptographic communications system and method", who: "R. L. Rivest, A. Shamir, L. M. Adleman", year: 1983 },
    youtube: "",
    learn: [
      "Build an RSA key pair from two primes",
      "Encrypt and decrypt with modular exponentiation",
      "Explain why recovering the private key requires factoring"
    ],
    interactive: "rsa",
    tryIt: "Encrypt a message with the classic example key (p = 61, q = 53, e = 17). Then pick your own primes and check that decryption always gives back the original number.",
    notes: [
      ["How is a key pair built?", [
        "Pick two primes p and q and multiply them to get n. Compute <code>φ(n) = (p − 1)(q − 1)</code>. Choose a public exponent e that shares no factor with φ(n), and find the private exponent d such that <code>e · d ≡ 1 (mod φ(n))</code>. Publish (n, e). Keep d secret."
      ]],
      ["How does encryption work?", [
        "Turn the message into a number m smaller than n and compute <code>c = m<sup>e</sup> mod n</code>. Anyone can do this, because it only uses the public key."
      ]],
      ["Why can only the owner decrypt?", [
        "Computing <code>c<sup>d</sup> mod n</code> returns the original m, by Euler's theorem. Finding d requires φ(n), finding φ(n) requires p and q, and finding p and q from n requires factoring, the one-way step from the previous lesson."
      ]],
      ["How does the same key sign messages?", [
        "Run it in reverse. The owner computes <code>s = m<sup>d</sup> mod n</code>, and anyone can check that <code>s<sup>e</sup> mod n = m</code>. Only the holder of d could have produced s.",
        "Real systems never encrypt raw numbers like this. They add random padding first, because textbook RSA leaks information. The model shows the bare mathematics."
      ]]
    ],
    takeaway: "RSA hides the private exponent behind a factoring problem: easy to use with the public key, impossible to invert without p and q."
  },

  "pagerank": {
    short: "PageRank",
    title: "How did Google decide which page matters most?",
    patent: { number: "US 6,285,999", title: "Method for node ranking in a linked database", who: "L. Page", year: 2001 },
    youtube: "",
    learn: [
      "Explain why links can measure importance",
      "Compute PageRank by repeated averaging",
      "Explain the random-surfer model and the damping factor"
    ],
    interactive: "pagerank",
    tryIt: "Remove every link into page C and see where its rank goes. Then lower the damping factor and watch the ranks even out.",
    notes: [
      ["Why not just count keywords?", [
        "A page can repeat a keyword endlessly, so a page's own content can't tell you whether it is any good. Something outside the page has to vouch for it."
      ]],
      ["What if a link is a vote?", [
        "A page that links to another is, in effect, endorsing it. But not all votes should count equally: a vote from an important page should count more, and a page that links to many others should split its vote among them."
      ]],
      ["How do you solve a loop of votes?", [
        "Each page's rank depends on the ranks of the pages linking to it, which depend on others in turn. Write it as <code>PR(i) = (1 − d)/N + d · Σ PR(j)/L(j)</code>, summing over pages j that link to i, where L(j) is the number of links leaving j. Start everyone equal and recompute until the numbers stop changing. This always converges."
      ]],
      ["What does a random surfer have to do with it?", [
        "PageRank equals the long-run share of time a surfer would spend on each page if, at every step, they follow a random link with probability d and jump to a random page otherwise. The jump keeps the surfer from getting stuck and guarantees one unique answer. The original paper used d = 0.85."
      ]]
    ],
    takeaway: "PageRank is where a random surfer spends their time: pages linked from important pages, without too many competing links, rank highest."
  },

  "attention": {
    short: "Attention",
    title: "How does a model decide which words to pay attention to?",
    patent: { number: "US 10,452,978", title: "Attention-based sequence transduction neural networks", who: "N. Shazeer, A. Vaswani, et al.", year: 2019 },
    youtube: "",
    learn: [
      "Describe queries, keys and values",
      "Compute attention weights with a softmax",
      "Explain why scores are scaled and why models use many heads"
    ],
    interactive: "attention",
    tryIt: "Point the query toward one word's key and lengthen it until nearly all the weight lands on that word. Then shorten it and watch the attention spread out.",
    notes: [
      ["Why did older networks struggle?", [
        "Recurrent networks read one word at a time and squeezed everything seen so far into a fixed-size memory. Connections between distant words faded, and reading step by step was slow to train because it couldn't be parallelized."
      ]],
      ["What does it mean for a word to attend?", [
        "Each word produces three vectors: a query (what it is looking for), a key (what it offers to others) and a value (what it passes on). The score between two words is the dot product of one's query with the other's key, divided by <code>√d</code>. A softmax turns the scores into weights that add up to 1, and the word's new representation is the weighted average of all the values."
      ]],
      ["Why divide by √d?", [
        "Dot products grow with the vector dimension d. Without scaling, the scores get so large that the softmax puts nearly all weight on one word, and training stalls. In the model, making the query longer has the same effect as large scores: sharper focus."
      ]],
      ["Why many heads?", [
        "A Transformer runs several attention operations in parallel, each with its own learned queries, keys and values, so different heads can track different relationships at once. Stacking attention layers with small feed-forward networks gives the Transformer, the architecture behind today's large language models."
      ]]
    ],
    takeaway: "Attention lets every word look at every other word at once and take a weighted mix of what it finds relevant."
  }
});
