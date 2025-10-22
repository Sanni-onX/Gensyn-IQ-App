import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import * as htmlToImage from "html-to-image";
import GENSYN from "./assets/GENSYN.svg";

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
  const txt = (nameLike || "Gensyn chad").trim().replace(/^@/, "");
  const parts = txt.split(" ").filter(Boolean);
  const first = parts[0] || "Gensyn";
  const second = parts[1] || "IQ";
  const initials = (first[0] || "B") + (second[0] || q);
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

// GENSYN BLOGS

const GENSYN_ARTICLES = [
  {
    title: "The Gensyn Docs",
    url: "https://docs.gensyn.ai/",
    blurb:
      "Welcome to the official Gensyn docs. Here you'll find information on Gensyn, including how it works, what you can build with it, and how to get started today.",
  },
  {
    title: "The Gensyn Litepaper",
    url: "https://docs.gensyn.ai/litepaper",
    blurb: "",
  },
  {
    title: "Introducing RL Swarm's GenRL",
    url: "https://blog.gensyn.ai/introducing-rl-swarms-new-backend-genrl/",
    blurb: "Simplify and accelerate the creation of advanced RL environments.",
  },
  {
    title: "Introducing BlockAssist",
    url: "https://blog.gensyn.ai/introducing-blockassist/",
    blurb: "AI Minecraft assistant that learns from your in-game actions",
  },
  {
    title: "Introducing Judge",
    url: "https://blog.gensyn.ai/introducing-judge/",
    blurb:
      "Built on Verde, Judge ensures independent verification - eliminating opaque APIs",
  },
  {
    title: "GPT@Home",
    url: "https://blog.gensyn.ai/gpt-home-why-the-future-of-training-is-decentralized/",
    blurb:
      "Gensyn's decentralized infrastructure enables efficient training across edge devices at massive scale",
  },
];

// QUESTION BANK

const QUESTION_BANK = [
  {
    q: "What is the main purpose of Gensyn’s Judge system?",
    choices: [
      "To train large-language models",
      "To generate synthetic training datasets",
      "To replace GPUs in model training",
      "To provide cryptographically verifiable AI evaluation at scale",
    ],
    answerIndex: 3,
  },
  {
    q: "The Judge system is built on top of which verification protocol?",
    choices: [
      "General Zero-Knowledge",
      "ONNX Standard",
      "Verde",
      "FLIP Consensus",
    ],
    answerIndex: 2,
  },
  {
    q: "Which of the following is not one of the listed components of Judge’s reproducible runtime?",
    choices: [
      "Deterministic CUDA kernels",
      "A proprietary compiler lowering ONNX to Torch",
      "A neural-network-based evaluator that silently updates",
      "Deterministic containers",
    ],
    answerIndex: 2,
  },
  {
    q: "In the reasoning task for Judge, how do models earn more payout?",
    choices: [
      "By placing bets earlier and being correct",
      "By training more epochs",
      "By using more GPU compute",
      "By submitting more candidate answers",
    ],
    answerIndex: 0,
  },
  {
    q: "Why is decentralized AI training necessary?",
    choices: [
      "GPU hardware is becoming obsolete",
      "Frontier model training costs are becoming too high for all but the big players",
      "Centralized labs have solved all major AI problems",
      "The internet has unlimited bandwidth everywhere",
    ],
    answerIndex: 1,
  },
  {
    q: "What game does BlockAssist operate in?",
    choices: ["Roblox", "Minecraft", "Fortnite", "Unreal Engine Sandbox"],
    answerIndex: 1,
  },
  {
    q: "BlockAssist is presented as a demo of which new paradigm?",
    choices: [
      "Federated learning",
      "Supervised learning at scale",
      "Assistance learning",
      "Unsupervised learning for games",
    ],
    answerIndex: 2,
  },
  {
    q: "What technique does BlockAssist use for inferring the human’s hidden goal?",
    choices: [
      "Q-learning only",
      "Monte-Carlo Tree Search (MCTS) with neural network prediction of human actions",
      "Genetic algorithms",
      "Rule-based heuristic tree",
    ],
    answerIndex: 1,
  },
  {
    q: "How does BlockAssist collect training data for itself?",
    choices: [
      "Manual annotation by humans",
      "Passive gameplay recording of the user’s actions",
      "Synthetic simulation with random play",
      "Crawling published gameplay videos",
    ],
    answerIndex: 1,
  },
  {
    q: "Why is BlockAssist notable in terms of compute participation?",
    choices: [
      "It requires a data centre only",
      "It uses closed proprietary hardware",
      "It only runs on GPUs",
      "It allows anyone to contribute gameplay data and compute",
    ],
    answerIndex: 3,
  },
  {
    q: "What problem does Verde aim to tackle?",
    choices: [
      "High cost of GPU hardware",
      "Verifying ML work done at scale",
      "Data privacy in federated learning",
      "Optimising model latency on edge devices",
    ],
    answerIndex: 1,
  },
  {
    q: "What does SAPO stand for?",
    choices: [
      "Swarm Assisted Policy Optimization",
      "Swarm sAmpling Policy Optimization",
      "Self-Adaptive Policy Optimization",
      "Scalable Assisted Policy Optimization",
    ],
    answerIndex: 1,
  },
  {
    q: "What is the key mechanism behind SAPO?",
    choices: [
      "Each node only uses its own rollouts",
      "Nodes train independently and then merge gradients",
      "Generates rollouts locally, share them with the swarm, and sample others’ rollouts",
      "A central server aggregates all rollouts",
    ],
    answerIndex: 2,
  },
  {
    q: "In experiments, how much improvement did SAPO-trained models show over isolated training?",
    choices: ["~50%", "~94%", "~10%", "No measurable improvement"],
    answerIndex: 1,
  },
  {
    q: "Why is SAPO important for heterogeneous environments?",
    choices: [
      "Enables nodes of varying capacity to share experience",
      "Requires identical hardware",
      "Works only with high-end servers",
      "Restricts training to centralised clusters",
    ],
    answerIndex: 0,
  },
  {
    q: "What does HDEE stand for?",
    choices: [
      "Heterogeneous Domain Expert Ensemble",
      "High-Density Deep Ensemble",
      "Hybrid Distributed Expert Ensemble",
      "Human-Driven Expert Ensemble",
    ],
    answerIndex: 0,
  },
  {
    q: "What traditional method did HDEE build on and extend?",
    choices: [
      "Federated averaging",
      "Branch Train Merge (BTM)",
      "Parameter sharing across experts",
      "Model distillation",
    ],
    answerIndex: 1,
  },
  {
    q: "What infrastructure model does Gensyn envision for AI training?",
    choices: [
      "A handful of hyperscale clouds",
      "A decentralized network of heterogeneous devices",
      "On-prem data centres only",
      "Single-vendor hardware",
    ],
    answerIndex: 1,
  },
  {
    q: "Why is decentralised training beneficial?",
    choices: [
      "Centralised labs have infinite budgets",
      "It uses fewer GPUs overall",
      "It allows more participants, lowers barriers, and utilises global compute",
      "It avoids model verification",
    ],
    answerIndex: 2,
  },
  {
    q: "In the Gensyn model, what is the role of the user’s device?",
    choices: [
      "Only to submit data",
      "To contribute compute data, and participating in the network",
      "To act as display only",
      "To run inference only",
    ],
    answerIndex: 1,
  },
  {
    q: "What does the Reproducible Runtime for Judge guarantee?",
    choices: [
      "Bitwise-exact reproducibility across devices",
      "Same output on same hardware only",
      "Approximate reproducibility",
      "Reproducibility only on the cloud",
    ],
    answerIndex: 0,
  },
  {
    q: "Which of the following is part of the Reproducible Runtime design?",
    choices: [
      "Randomised container execution",
      "Deterministic CUDA kernels",
      "Non-traceable model graphs",
      "Closed proprietary datasets",
    ],
    answerIndex: 1,
  },
  {
    q: "Why are many LLM-based judges unreliable?",
    choices: [
      "They always produce the same answer",
      "They rely on closed APIs, silent updates and are irreproducible",
      "They run only on CPUs",
      "They cannot evaluate reasoning",
    ],
    answerIndex: 1,
  },
  {
    q: "In BlockAssist, the AI assistant starts with only basic knowledge of game commands.",
    choices: ["True", "False"],
    answerIndex: 0,
  },
  {
    q: "Why is BlockAssist considered scalable compared to RLHF?",
    choices: [
      "It requires manual labeling",
      "It runs only in closed labs",
      "It captures preference data automatically during gameplay",
      "It needs massive GPU farms",
    ],
    answerIndex: 2,
  },
  {
    q: "What is GenRL?",
    choices: [
      "General Reinforcement Learning",
      "Genetic Reinforced Learning",
      "Generated RL",
      "Genuine Reinforcement Layers",
    ],
    answerIndex: 0,
  },
  {
    q: "Which module is not in the GenRL architecture?",
    choices: [
      "DataManager",
      "RewardManager",
      "GameManager",
      "CentralCoordinator",
    ],
    answerIndex: 3,
  },
  {
    q: "What kind of RL settings does GenRL target?",
    choices: [
      "Single-agent RL only",
      "Multi-agent, multi-stage RL with decentralized coordination",
      "Supervised classification tasks",
      "Offline RL only",
    ],
    answerIndex: 1,
  },
  {
    q: "What open-source library is GenRL integrated with?",
    choices: ["OpenAI Gym", "Reasoning Gym", "Unity ML-Agents", "GymRetro"],
    answerIndex: 1,
  },
  {
    q: "What role does the Ethereum Rollup play in Gensyn Testnet architecture?",
    choices: [
      "Used for model inference only",
      "Provides GPU hardware access",
      "Handles storage of logs",
      "Acts as custom blockchain coordination layer for ML tasks",
    ],
    answerIndex: 3,
  },
  {
    q: "Which participant roles are defined in the Gensyn protocol?",
    choices: [
      "Producers, Consumers, Validators, Auditors",
      "Submitters, Solvers, Verifiers, Whistleblowers",
      "Data Owners, Model Trainers, Evaluators, Brokers",
      "Developers, Nodes, Oracles, Miners",
    ],
    answerIndex: 1,
  },
  {
    q: "Which of these is listed as an application on the Gensyn Testnet?",
    choices: ["BlockAssist", "Judge", "RL Swarm", "All of the above"],
    answerIndex: 3,
  },
  {
    q: "What is the framework-defined progression for RL Swarm?",
    choices: [
      "Upload model → Wait for peers → Deploy",
      "DataManager initialises data → rollouts generated → rewards evaluated & policies updated",
      "Data collection → model freezing → inference only",
      "Training → evaluation → deployment → archive",
    ],
    answerIndex: 1,
  },
  {
    q: "What does the framework claim about device participation?",
    choices: [
      "Only data-centre GPUs can participate",
      "Any ML-capable device can supply compute",
      "Only smartphones targeted",
      "Only proprietary hardware allowed",
    ],
    answerIndex: 1,
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

export default function GensynIQApp() {
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
      displayName || (handle ? `@${handle}` : "Gensyn chad");

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
      link.download = `Gensyn-IQ-${handle || "anon"}.png`;
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
    bg-[url('./assets/GensynBgP.png')]   // mobile default
    md:bg-[url('./assets/GensynBg.png')]  // swap on medium+ screens
  "
    >
      {/* Header */}
      <header className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 grid place-items-center overflow-hidden">
            <img
              src={GENSYN}
              alt="Gensyn"
              className="h-9 w-9 object-cover rounded-full"
              onError={(e) => {
                // graceful fallback if the asset is missing:
                e.currentTarget.outerHTML = `<div class="text-lg font-semibold text-indigo-200">Bv</div>`;
              }}
            />
          </div>

          <h1 className="text-4xl md:text-2xl font-semibold tracking-tight">
            GENSYN QUIZ
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
                Learn about Gensyn.{" "}
                <span style={{ color: "#f3a99a" }}>Ace the quiz.</span> Get your
                Gensyn IQ card.
              </h2>
              <p className="text-slate-300/90">
                Explore official Gensyn blogs inside the app, then take a quiz
                and get a Gensyn IQ card. Your score is calculated with both
                correct answers and how fast you answer.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 transition font-semibold"
                  style={{ backgroundColor: "#f3a99a" }}
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
              <div
                className="absolute -inset-4 bg-indigo-500/20 blur-3xl rounded-full"
                style={{ backgroundColor: "rgba(243, 169, 154, 0.3)" }}
              />
              <div className="relative p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <ul className="space-y-3 text-sm">
                  <li>• Official materials from Gensyn site & blog</li>
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
                Read: Official Gensyn Blogs
              </h3>
              <button
                onClick={startQuiz}
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-semibold"
                style={{ backgroundColor: "#f3a99a" }}
              >
                I'm Ready → Quiz
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {GENSYN_ARTICLES.map((a, i) => (
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
                <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/10">
                  Question {current + 1} / {quiz.length}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/10">
                  ⏱️ {timeLeft}s
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/15 backdrop-blur-xs">
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
            <h3 className="text-2xl font-semibold">Your Gensyn IQ Card</h3>
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
                    style={{ backgroundColor: "#f3a99a" }}
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
                  Share on X with #GensynIQ #gSwarm
                </p>
              </div>

              {/* Share card preview */}
              <div className="md:justify-self-end">
                <div
                  ref={cardRef}
                  className="w-[480px] h-[270px] rounded-2xl p-4 bg-[url('./assets/GensynCard.png')] bg-cover bg-center border border-white/10 shadow-2xl relative overflow-hidden"
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
                                (handle ? `@${handle}` : "Gensyn chad")
                            )
                          );
                        }
                      }}
                    />
                    <div>
                      <div className="text-xl text-white font-semibold leading-tight">
                        {displayName || (handle ? `@${handle}` : "Gensyn chad")}
                      </div>
                      <div className="text-xs text-white/70">
                        Gensyn IQ Card
                      </div>
                    </div>
                    <div className="ml-auto text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/20">
                      gSwarm
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
                      <div className="text-xs text-white/">Est. IQ</div>
                      <div className="text-4xl font-bold">{iq}</div>
                    </div>
                    <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 p-3">
                      <div className="text-xs text-white/70">Badge</div>
                      <div className="text-2xl font-bold">
                        {computedScore >= maxScore * 0.8
                          ? "Swarm Wizard"
                          : computedScore >= maxScore * 0.5
                          ? "Swarm Rook"
                          : "Swarm bot"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 text-[10px] text-white/70">
                    • Building the decntralized network for Machine Intelligence
                    •
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 pb-16 pt-8 text-center text-xs text-white-400">
        With ❤️ by {"Sanni"}
      </footer>
    </div>
  );
}
