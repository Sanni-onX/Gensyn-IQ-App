import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import * as htmlToImage from "html-to-image";
import BREVIS from "./assets/BREVIS.svg"; // or "./assets/brevis-logo.png"

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Try to fetch an image (CORS) and convert to data URL — used only for export
async function fetchToDataURL(url) {
  const res = await fetch(url, { mode: "cors", cache: "no-store" });
  if (!res.ok) throw new Error(`avatar fetch ${res.status}`);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => resolve(fr.result);
    fr.readAsDataURL(blob);
  });
}

// Data-URL SVG with user initials (never taints canvas)
function initialsDataUrl(nameLike) {
  const txt = (nameLike || "Brevis Learner").trim().replace(/^@/, "");
  const parts = txt.split(" ").filter(Boolean);
  const first = parts[0] || "Brevis";
  const second = parts[1] || "IQ";
  const initials = (first[0] || "B") + (second[0] || "Q");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>
    <rect width='100%' height='100%' rx='16' ry='16' fill='#111827'/>
    <text x='50%' y='56%' text-anchor='middle' font-size='40'
      font-family='Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif'
      fill='#a5b4fc'>${initials.toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Build a list of candidate avatar URLs for a handle.
// We try multiple providers because some endpoints may fail intermittently.
function avatarCandidates(handle) {
  if (!handle) return [];
  const h = encodeURIComponent(handle);
  return [
    // Unavatar supports both `x` and `twitter` in 2025; try both.
    `https://unavatar.io/x/${h}`,
    `https://unavatar.io/twitter/${h}`,
    // Generic provider inference:
    `https://unavatar.io/${h}`,
    // As a last network fallback, Unavatar's default GitHub ghost:
    `https://unavatar.io/github/ghost`,
  ];
}

// BREVIS BLOGS

const BREVIS_ARTICLES = [
  {
    title: "What is Brevis? — Start Here",
    url: "https://brevis.network/",
    blurb: "Official homepage: zk co-processor, PICO zkVM, coChain (AVS).",
  },
  {
    title: "The Brevis ZK Coprocessor v2",
    url: "https://blog.brevis.network/2025/01/08/the-brevis-zk-coprocessor-v2-unlocking-efficiency-and-expressiveness-in-intelligent-dapps/",
    blurb: "Unlocking Efficiency and Expressiveness in Intelligent dApps",
  },
  {
    title: "Introducing Pico",
    url: "https://blog.brevis.network/2025/02/11/introducing-pico-a-modular-and-performant-zkvm/",
    blurb: "The Modular and Performant zkVM",
  },
  {
    title: "Incentra",
    url: "https://blog.brevis.network/2025/06/30/incentra-launches-with-euler-campaigns-on-arbitrum-trustless-incentive-infrastructure-for-sustained-defi-growth/",
    blurb: "Trustless Incentive Infrastructure for Sustained DeFi Growth",
  },
  {
    title: "Pico-GPU",
    url: "https://blog.brevis.network/2025/06/27/announcing-pico-gpu-setting-a-new-zkvm-benchmark-with-gpu-acceleration/",
    blurb: "Built for Speed: Setting the New Standard",
  },
  {
    title: "Brevis Docs",
    url: "https://docs.brevis.network/",
    blurb: "Technical docs: architecture, PICO, SDKs, developer guides.",
  },
];

// QUESTION BANK

const QUESTION_BANK = [
  {
    q: "Brevis' core role is best described as:",
    choices: [
      "An L1 chain for NFTs",
      "A zk co-processor enabling data-rich, provable compute",
      "A centralized oracle provider",
      "A liquid staking token (LST)",
    ],
    answerIndex: 1,
  },
  {
    q: "What proving system does the zkCoprocessor v2 run on?",
    choices: [
      "SNARK only",
      "Hybrid prover (STARK + Plonk + Groth16)",
      "Pairings-only Groth16",
      "Bulletproofs",
    ],
    answerIndex: 1,
  },
  {
    q: "How does Brevis ZK Coprocessor v2 improve performance compared to v1?",
    choices: [
      "It doubles throughput at half the cost",
      "It reduces cost but keeps latency the same",
      "It only increases storage access",
      "It has ~10× higher throughput and lower latency at the same cost",
    ],
    answerIndex: 3,
  },
  {
    q: "When was the Brevis Alpha mainnet launched?",
    choices: ["July 2024", "September 2023", "October 2024", "January 2025"],
    answerIndex: 1,
  },
  {
    q: "What is Pico?",
    choices: [
      "The modular, high-efficiency zkVM",
      "A Layer 2 scaling solution",
      "The Brevis blockchain explorer",
      "A consensus algorithm for Brevis",
    ],
    answerIndex: 0,
  },
  {
    q: "Which architecture does Pico adopt to combine generality and speed?",
    choices: [
      "Glue-and-coprocessor architecture",
      "Monolithic zkEVM",
      "Pairings-only circuit",
      "Sharded consensus",
    ],
    answerIndex: 0,
  },
  {
    q: "What CPU performance claim does Pico make against other zkVMs?",
    choices: [
      "It is slower but more cost-efficient",
      "It’s the fastest on CPU, running ~70%–155% faster than the second-best",
      "It has the same speed as other zkVMs",
      "It is only optimized for GPUs",
    ],
    answerIndex: 1,
  },
  {
    q: "What are 'precompiles' in Pico’s context?",
    choices: [
      "Extra data compression for storage",
      "Specialized circuits that extend RISC-V to accelerate low-level ops",
      "A parallel proving backend",
      "An API for off-chain communication",
    ],
    answerIndex: 1,
  },
  {
    q: "What is Incentra?",
    choices: [
      "A custodial reward distribution service",
      "A blockchain consensus mechanism",
      "A trustless, transparent incentive infra built on Brevis",
      "A DeFi lending protocol",
    ],
    answerIndex: 2,
  },
  {
    q: "What does Incentra run on to keep costs low and proofs verifiable?",
    choices: [
      "Centralized servers",
      "Multi-signature wallets",
      "Brevis’s ZK stack",
      "A proof-of-stake blockchain",
    ],
    answerIndex: 2,
  },
  {
    q: "Is Incentra custodial?",
    choices: [
      "Yes, it holds user assets directly",
      "No, it is fully non-custodial",
      "Partially, only during campaign setup",
      "Only for institutional users",
    ],
    answerIndex: 1,
  },
  {
    q: "What is Pico-GPU?",
    choices: [
      "A zkVM optimized only for CPUs",
      "A GPU-accelerated version of the Pico zkVM",
      "A GPU like the RTX 5090",
      "An algorithm for GPUs zkVMs",
    ],
    answerIndex: 1,
  },
  {
    q: "How much faster does Pico-GPU run compared to Pico-CPU?",
    choices: [
      "2×–3× faster",
      "5×–8× faster",
      "10×–20× faster",
      "50× faster in all cases",
    ],
    answerIndex: 2,
  },
  {
    q: "Which real-world system is already using Pico-GPU and what does it prove?",
    choices: [
      "Uniswap v4, proving swap transactions",
      "Ethproofs, proving Ethereum block executions",
      "Arbitrum, proving L2 sequencer batches",
      "Polygon, proving zkRollup checkpoints",
    ],
    answerIndex: 1,
  },
  {
    q: "What is Brevis?",
    choices: [
      "The infinite compute layer",
      "The Pico layer",
      "The launchpad for zkps",
      "A DEX aggregator",
    ],
    answerIndex: 0,
  },
  {
    q: "Do developers need ZK expertise to use Brevis?",
    choices: [
      "Yes, they must write circuits manually",
      "No, the SDK abstracts ZK circuit complexity",
      "Only for advanced DeFi use cases",
      "Only if deploying on Ethereum",
    ],
    answerIndex: 1,
  },
  {
    q: "What does Brevis call its computation pipeline?",
    choices: ["zkSyncer", "zkPipeline", "zkCoprocessor", "zkChannel"],
    answerIndex: 2,
  },
  {
    q: "Give an example of a DeFi use case powered by Brevis.",
    choices: [
      "Running consensus algorithms",
      "Serving as a block explorer",
      "Providing custodial wallets",
      "Dynamic fees for DEXes like Uniswap v4 hooks",
    ],
    answerIndex: 3,
  },
  {
    q: "Which statement about coChain (AVS) is accurate?",
    choices: [
      "Every task must include a full ZK proof upfront",
      "Results are proposed and only require a ZK proof if challenged",
      "No one can challenge results",
      "It replaces all ZK proving with multisig",
    ],
    answerIndex: 1,
  },
  {
    q: "PICO in Brevis refers to:",
    choices: [
      "The official Brevis token",
      "A sequencer for rollups",
      "An optimizer for checking ZK proofs",
      "A high-performance zkVM mixing coprocessors with general zk",
    ],
    answerIndex: 3,
  },
  {
    q: "A good use case for Brevis is:",
    choices: [
      "Tracking whales wallet unsuspected",
      "Creating loyalty scores from a wallet's on-chain history",
      "Hosting anonymous wallet addresses",
      "Compressing zkProofs",
    ],
    answerIndex: 1,
  },
  {
    q: "Which statement about coChain (AVS) is accurate?",
    choices: [
      "Every task must include a full ZK proof upfront",
      "Results are proposed and only require a ZK proof if challenged",
      "No one can challenge results",
      "It replaces all ZK proving with multisig",
    ],
    answerIndex: 1,
  },
  {
    q: "Which capability is easier to support in Brevis' coChain model?",
    choices: [
      "GPU rendering",
      "TCP load balancing",
      "Proof of non-existence / completeness",
      "Image compression",
    ],
    answerIndex: 2,
  },
];

function sampleQuestions(arr, n) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

export default function BrevisIQApp() {
  // Steps: 0=home, 1=learn, 2=quiz, 3=result
  const [step, setStep] = useState(0);

  // Share card inputs
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Avatar URL candidates and current index (for on-screen display only)
  const candidates = useMemo(
    () => (handle ? avatarCandidates(handle) : []),
    [handle]
  );
  const [avatarIdx, setAvatarIdx] = useState(0);
  useEffect(() => {
    setAvatarIdx(0); // whenever handle changes, start from first candidate
  }, [handle]);

  // The URL shown in the card (no CORS fetch here)
  const displayAvatarSrc =
    candidates[avatarIdx] || "https://unavatar.io/github/ghost";

  // Export-only override (data URL) – null means show the normal <img> URL
  const [avatarOverride, setAvatarOverride] = useState(null);
  const exportAvatarSrc = avatarOverride || displayAvatarSrc;

  // Active quiz state
  const [quiz, setQuiz] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selections, setSelections] = useState([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [started, setStarted] = useState(false);

  // Scoring config
  const BASE_POINTS = 10;
  const TIME_BONUS_MAX = 20;
  const PER_Q_MAX = BASE_POINTS + TIME_BONUS_MAX;

  const timeBonusesRef = useRef([]);

  const maxScore = useMemo(() => quiz.length * PER_Q_MAX, [quiz.length]);

  const computedScore = useMemo(() => {
    let total = 0;
    for (let i = 0; i < selections.length; i++) {
      const sel = selections[i];
      const q = quiz[i];
      if (!q) continue;
      if (sel === q.answerIndex) {
        total += BASE_POINTS + (timeBonusesRef.current[i] || 0);
      }
    }
    return total;
  }, [selections, quiz]);

  const iq = useMemo(() => {
    if (maxScore <= 0) return 80;
    return 80 + Math.round((computedScore / maxScore) * 60);
  }, [computedScore, maxScore]);

  const cardRef = useRef(null);

  // Timer logic
  useEffect(() => {
    if (step !== 2 || !started) return;
    if (timeLeft <= 0) {
      onNext();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, step, started]);

  // Actions
  const startQuiz = () => {
    const picked = sampleQuestions(QUESTION_BANK, 10);
    setQuiz(picked);
    setSelections(Array(picked.length).fill(null));
    timeBonusesRef.current = Array(picked.length).fill(0);
    setCurrent(0);
    setTimeLeft(20);
    setStarted(true);
    setStep(2);
  };

  const onSelect = (choiceIdx) => {
    const nextSel = selections.slice();
    nextSel[current] = choiceIdx;
    setSelections(nextSel);

    const q = quiz[current];
    if (q && choiceIdx === q.answerIndex) {
      const bonus = Math.max(0, Math.min(TIME_BONUS_MAX, timeLeft));
      timeBonusesRef.current[current] = bonus;
    }

    onNext();
  };

  const onNext = () => {
    const next = current + 1;
    if (next >= quiz.length) {
      setStarted(false);
      setStep(3);
      return;
    }
    setCurrent(next);
    setTimeLeft(20);
  };

  const resetAll = () => {
    setStep(0);
    setHandle("");
    setDisplayName("");
    setQuiz([]);
    setSelections([]);
    setCurrent(0);
    setTimeLeft(20);
    setStarted(false);
    timeBonusesRef.current = [];
  };

  // Export card → PNG
  const handleDownload = async () => {
    if (!cardRef.current) return;

    const nameForFallback =
      displayName || (handle ? `@${handle}` : "Brevis Learner");

    // If we have a concrete remote URL (not initials), try to inline it.
    const remoteUrl = candidates[0] ? candidates[0] : displayAvatarSrc;

    try {
      const dataUrl = await fetchToDataURL(remoteUrl);
      setAvatarOverride(dataUrl);
      await new Promise((r) => setTimeout(r, 60)); // allow re-render
    } catch {
      // Fall back to initials for export
      setAvatarOverride(initialsDataUrl(nameForFallback));
      await new Promise((r) => setTimeout(r, 40));
    }

    try {
      const png = await htmlToImage.toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `Brevis-IQ-${handle || "anon"}.png`;
      link.href = png;
      link.click();
    } catch (e) {
      alert("Could not generate image. Try again.");
      console.error(e);
    } finally {
      // Revert to normal avatar display after export
      setAvatarOverride(null);
    }
  };

  return (
    // <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100">
    <div
  className="
    min-h-screen w-full text-slate-100
    bg-no-repeat bg-cover bg-center
    bg-[url('./assets/bgortrait.svg')]   // mobile default
    md:bg-[url('./assets/bgLandscape.svg')]  // swap on medium+ screens
  "
>  
    {/* Header */}
      <header className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 grid place-items-center overflow-hidden">
            <img
              src={BREVIS}
              alt="Brevis"
              className="h-full w-full object-cover rounded-full"
              onError={(e) => {
                // graceful fallback if the asset is missing:
                e.currentTarget.outerHTML = `<div class="text-lg font-semibold text-indigo-200">Bv</div>`;
              }}
            />
          </div>

          <h1 className="text-4xl md:text-2xl font-semibold tracking-tight">
            Learn Brevis
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm opacity-80">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
            Learn
          </span>
          <span>→</span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
            Quiz
          </span>
          <span>→</span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
            Share
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 pb-20">
        {/* Step 0: Home */}
        {step === 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 grid md:grid-cols-2 gap-8 items-center"
          >
            <div className="space-y-5">
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                Learn Brevis.{" "}
                <span className="text-indigo-300">Ace the quiz.</span> Get your
                Brevis IQ card.
              </h2>
              <p className="text-slate-300/90">
                Explore official Brevis articles inside the app, then take a
                quiz and get a Brevis IQ card. Your score is calculated with
                both correct answers and how fast you answer.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 transition font-semibold"
                >
                  Learn
                </button>
                <button
                  onClick={startQuiz}
                  className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition font-semibold text-left"
                >
                  Skip to Quiz
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl rounded-full" />
              <div className="relative p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <ul className="space-y-3 text-sm">
                  <li>• Official materials from Brevis site & blog</li>
                  <li>• 20-second timer per question</li>
                  <li>• Answer as fast as you can</li>
                </ul>
              </div>
            </div>
          </motion.section>
        )}

        {/* Step 1: Learn (articles) */}
        {step === 1 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-semibold">
                Read: Official Brevis Blogs
              </h3>
              <button
                onClick={startQuiz}
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-semibold"
              >
                I'm Ready → Quiz
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {BREVIS_ARTICLES.map((a, i) => (
                <div
                  key={i}
                  className="p-6 rounded-3xl border border-white/10 bg-white/5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold mb-1">{a.title}</h4>
                      <p className="text-slate-300/90 text-sm">{a.blurb}</p>
                    </div>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/20 hover:bg-white/20"
                    >
                      Open ↗
                    </a>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-white/10">
                    <iframe
                      src={a.url}
                      title={a.title}
                      className="w-full h-64 bg-black/50"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Step 2: Quiz */}
        {step === 2 && quiz.length > 0 && (
          <motion.section
            id="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 space-y-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-2xl font-semibold">Quiz</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  Question {current + 1} / {quiz.length}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  ⏱️ {timeLeft}s
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
              <p className="font-medium mb-3">
                Q{current + 1}. {quiz[current].q}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {quiz[current].choices.map((choice, cIdx) => (
                  <button
                    key={cIdx}
                    onClick={() => onSelect(cIdx)}
                    className="text-left p-4 rounded-xl border transition border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-sm text-slate-300/80">
              Pick an answer before the timer runs out.
            </div>
          </motion.section>
        )}

        {/* Step 3: Result + Share card */}
        {step === 3 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 space-y-6"
          >
            <h3 className="text-2xl font-semibold">Your Brevis IQ Card</h3>
            <div className="grid md:grid-cols-2 gap-6 items-start">
              {/* Inputs */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
                  <label className="block text-sm mb-1">
                    X (Twitter) handle — without @
                  </label>
                  <input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.trim())}
                    placeholder="Sanni_onX"
                    className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <label className="block text-sm mt-4 mb-1">
                    Display name (optional)
                  </label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Sanni"
                    className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-semibold"
                  >
                    Download PNG
                  </button>
                  <button
                    onClick={resetAll}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                  >
                    Restart
                  </button>
                </div>
                <p className="text-xl text-slate-400">
                  Share on X with #BrevisIQ #zk #gBrevis
                </p>
              </div>

              {/* Share card preview */}
              <div className="md:justify-self-end">
                <div
                  ref={cardRef} 
                  className="w-[480px] h-[270px] rounded-2xl p-4 bg-[url('./assets/Cardbg.svg')] bg-cover bg-center border border-white/10 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute -top-10 -right-6 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute -bottom-16 -left-8 h-48 w-48 rounded-full blur-3xl" />

                  <div className="flex items-center gap-3 relative">
                    {/* On-screen: try multiple providers; on-error, advance to next candidate.
                        During export: avatarOverride (data URL) temporarily replaces this src. */}
                    <img
                      src={exportAvatarSrc}
                      alt="avatar"
                      className="h-12 w-12 rounded-xl border border-white/20 object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => {
                        // If current candidate fails to load, try the next one
                        if (avatarIdx < candidates.length - 1) {
                          setAvatarIdx((i) => i + 1);
                        } else {
                          // All network candidates failed → show initials
                          setAvatarOverride(
                            initialsDataUrl(
                              displayName ||
                                (handle ? `@${handle}` : "Brevis Learner")
                            )
                          );
                        }
                      }}
                    />
                    <div>
                      <div className="text-xl text-white font-semibold leading-tight">
                        {displayName ||
                          (handle ? `@${handle}` : "Brevis Learner")}
                      </div>
                      <div className="text-xs text-white/70">
                        Brevis IQ Share Card
                      </div>
                    </div>
                    <div className="ml-auto text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/20">
                      gBrevis
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 p-3">
                      <div className="text-xs text-white/70">Score</div>
                      <div className="text-3xl font-bold">
                        {computedScore}/{maxScore}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 p-3">
                      <div className="text-xs text-white/70">Est. IQ</div>
                      <div className="text-4xl font-bold">{iq}</div>
                    </div>
                    <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 p-3">
                      <div className="text-xs text-white/70">Badge</div>
                      <div className="text-2xl font-bold">
                        {computedScore >= maxScore * 0.8
                          ? "Brevis Chad"
                          : computedScore >= maxScore * 0.5
                          ? "Brevis Rookie"
                          : "Brevis Noob"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 text-[10px] text-white/70">
                    • Brevis: The Infinite compute Layer • Powering smart,
                    verifiable applications with zero-knowledge proofs
                  </div>
                  {/* <div className="absolute bottom-3 right-4 text-[10px] text-white/60">
                    BrevisIQ
                  </div> */}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 pb-16 pt-8 text-center text-xs text-slate-400/80">
        With zk❤️ by {"Sanni"}
      </footer>
    </div>
  );
}
