import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Trophy,
  Star,
  Volume2,
  VolumeX,
  RefreshCcw,
  TrendingUp,
  Zap,
  Keyboard,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";

/**
 * 修正後的低音譜音理定義：
 * 線(Line) 1-5: G2(90), B2(75), D3(60), F3(45), A3(30)
 * 間(Space) 1-4: A2(82.5), C3(67.5), E3(52.5), G3(37.5)
 * 上加一間: B3(22.5), 上加一線: C4(15)
 */
const BASS_NOTES = [
  { id: "G2", name: "G", solfege: "Sol", y: 90, frequency: 97.99, pianoIdx: 0 },
  {
    id: "A2",
    name: "A",
    solfege: "La",
    y: 82.5,
    frequency: 110.0,
    pianoIdx: 1,
  },
  { id: "B2", name: "B", solfege: "Si", y: 75, frequency: 123.47, pianoIdx: 2 },
  {
    id: "C3",
    name: "C",
    solfege: "Do",
    y: 67.5,
    frequency: 130.81,
    pianoIdx: 3,
  },
  { id: "D3", name: "D", solfege: "Re", y: 60, frequency: 146.83, pianoIdx: 4 },
  {
    id: "E3",
    name: "E",
    solfege: "Mi",
    y: 52.5,
    frequency: 164.81,
    pianoIdx: 5,
  },
  { id: "F3", name: "F", solfege: "Fa", y: 45, frequency: 174.61, pianoIdx: 6 },
  {
    id: "G3",
    name: "G",
    solfege: "Sol",
    y: 37.5,
    frequency: 196.0,
    pianoIdx: 7,
  },
  { id: "A3", name: "A", solfege: "La", y: 30, frequency: 220.0, pianoIdx: 8 },
  {
    id: "B3",
    name: "B",
    solfege: "Si",
    y: 22.5,
    frequency: 246.94,
    pianoIdx: 9,
  },
  {
    id: "C4",
    name: "C",
    solfege: "Do",
    y: 15,
    frequency: 261.63,
    ledger: true,
    pianoIdx: 10,
  },
];

const LEVELS = [
  {
    id: 1,
    name: "低音基石",
    desc: "基礎低音線 (G2 - C3)",
    notes: ["G2", "A2", "B2", "C3"],
    target: 8,
    color: "from-blue-500 to-cyan-600",
  },
  {
    id: 2,
    name: "深沉旋律",
    desc: "低音域擴展 (G2 - F3)",
    notes: ["G2", "A2", "B2", "C3", "D3", "E3", "F3"],
    target: 12,
    color: "from-indigo-500 to-blue-700",
  },
  {
    id: 3,
    name: "跨越中音",
    desc: "挑戰中央C (G3 - C4)",
    notes: ["G3", "A3", "B3", "C4"],
    target: 15,
    color: "from-teal-500 to-emerald-600",
  },
  {
    id: 4,
    name: "低音大師",
    desc: "全音域混合練習",
    notes: BASS_NOTES.map((n) => n.id),
    target: 20,
    color: "from-slate-700 to-slate-900",
  },
  {
    id: 5,
    name: "無限低音",
    desc: "大師級無盡模式",
    notes: BASS_NOTES.map((n) => n.id),
    target: Infinity,
    color: "from-red-600 to-rose-900",
  },
];

const BUTTONS = [
  { name: "C", solfege: "Do", color: "#ef4444", key: "c" },
  { name: "D", solfege: "Re", color: "#f97316", key: "d" },
  { name: "E", solfege: "Mi", color: "#eab308", key: "e" },
  { name: "F", solfege: "Fa", color: "#22c55e", key: "f" },
  { name: "G", solfege: "Sol", color: "#3b82f6", key: "g" },
  { name: "A", solfege: "La", color: "#6366f1", key: "a" },
  { name: "B", solfege: "Si", color: "#a855f7", key: "b" },
];

export default function App() {
  const [currentNote, setCurrentNote] = useState(() => {
    const initialLevelNotes = BASS_NOTES.filter((n) =>
      LEVELS[0].notes.includes(n.id)
    );
    return initialLevelNotes[
      Math.floor(Math.random() * initialLevelNotes.length)
    ];
  });

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showPiano, setShowPiano] = useState(true);
  const [isFever, setIsFever] = useState(false);

  const audioContextRef = useRef(null);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  };

  const playTone = useCallback(
    (frequency, type = "correct") => {
      if (!soundEnabled) return;
      initAudio();
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === "correct") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(frequency, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(110, now); // 低沈錯誤音
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    },
    [soundEnabled]
  );

  const generateNote = useCallback(() => {
    const currentLevelData = LEVELS[level - 1];
    const availableNotes = BASS_NOTES.filter((n) =>
      currentLevelData.notes.includes(n.id)
    );
    let nextNote;
    do {
      nextNote =
        availableNotes[Math.floor(Math.random() * availableNotes.length)];
    } while (nextNote.id === currentNote.id && availableNotes.length > 1);

    setCurrentNote(nextNote);
    setFeedback(null);
  }, [currentNote, level]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const btn = BUTTONS.find((b) => b.key === key);
      if (btn) handleGuess(btn.name);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentNote, feedback, showLevelUp]);

  const handleGuess = (guessedName) => {
    if (feedback || showLevelUp) return;

    if (guessedName === currentNote.name) {
      playTone(currentNote.frequency, "correct");
      setFeedback("correct");

      const multiplier = isFever ? 2 : 1;
      setScore((s) => s + (10 + streak) * multiplier);

      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      if (newStreak >= 5) setIsFever(true);

      const currentLevelData = LEVELS[level - 1];
      if (
        levelProgress + 1 >= currentLevelData.target &&
        level < LEVELS.length
      ) {
        setTimeout(() => {
          setShowLevelUp(true);
          setLevel((l) => l + 1);
          setLevelProgress(0);
          setIsFever(false);
          setTimeout(() => {
            setShowLevelUp(false);
            generateNote();
          }, 1800);
        }, 400);
      } else {
        setLevelProgress((p) => p + 1);
        setTimeout(generateNote, 400);
      }
    } else {
      playTone(null, "wrong");
      setFeedback("wrong");
      setStreak(0);
      setIsFever(false);
      setTimeout(() => setFeedback(null), 600);
    }
  };

  const resetGame = () => {
    setScore(0);
    setStreak(0);
    setLevel(1);
    setLevelProgress(0);
    setIsFever(false);
    setShowLevelUp(false);
    generateNote();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 relative">
        {/* Header */}
        <div
          className={`p-6 flex justify-between items-center text-white transition-colors duration-500 bg-gradient-to-r ${
            LEVELS[level - 1].color
          }`}
        >
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Zap
                className={
                  isFever
                    ? "animate-bounce fill-yellow-300 text-yellow-300"
                    : ""
                }
              />
              低音譜挑戰
            </h1>
            <p className="text-[10px] opacity-90 uppercase tracking-[0.2em] font-bold italic">
              Bass Clef Mastery
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPiano(!showPiano)}
              className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
              title="鍵盤提示"
            >
              <Keyboard size={20} />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
              title="聲音開關"
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50/50 border-b border-slate-100">
          <div className="py-4 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Score
            </span>
            <span className="text-2xl font-black">{score}</span>
          </div>
          <div className="py-4 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Level
            </span>
            <span className="text-2xl font-black text-indigo-600">{level}</span>
          </div>
          <div className="py-4 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Streak
            </span>
            <span
              className={`text-2xl font-black transition-transform ${
                streak > 0 ? "text-orange-500 scale-110" : "text-slate-300"
              }`}
            >
              {streak}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="px-8 pt-6">
          <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
            <span>{LEVELS[level - 1].name}</span>
            <span>
              {LEVELS[level - 1].target === Infinity
                ? "MAX"
                : `${levelProgress}/${LEVELS[level - 1].target}`}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-700 bg-gradient-to-r ${
                LEVELS[level - 1].color
              }`}
              style={{
                width: `${
                  LEVELS[level - 1].target === Infinity
                    ? 100
                    : (levelProgress / LEVELS[level - 1].target) * 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Musical Stage */}
        <div className="p-8 flex flex-col items-center relative min-h-[300px]">
          {showLevelUp && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm animate-in fade-in duration-300">
              <Trophy
                size={64}
                className="text-yellow-400 mb-4 animate-bounce"
              />
              <h2 className="text-4xl font-black text-slate-800">LEVEL UP!</h2>
              <p className="text-indigo-600 font-bold text-lg">
                {LEVELS[level - 1].name}
              </p>
            </div>
          )}

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
            {feedback === "correct" && (
              <CheckCircle2
                size={120}
                className="text-green-500/20 animate-ping"
              />
            )}
            {feedback === "wrong" && (
              <XCircle size={120} className="text-red-500/20 animate-shake" />
            )}
          </div>

          <svg
            viewBox="0 0 300 150"
            className={`w-full max-w-md ${
              feedback === "wrong" ? "animate-shake" : ""
            }`}
          >
            {/* 五線譜基準線 (y=30, 45, 60, 75, 90) */}
            {[30, 45, 60, 75, 90].map((y) => (
              <line
                key={y}
                x1="40"
                y1={y}
                x2="260"
                y2={y}
                stroke="#475569"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ))}

            {/* 低音譜號 (F-Clef) 校準 */}
            {/* 兩圓點需夾住 F3 (第四線 y=45) */}
            <g transform="translate(45, 45)">
              <circle cx="0" cy="0" r="4.5" fill="#334155" />
              <path
                d="M0,0 C15,-18 38,0 32,35 C30,52 15,62 0,65"
                fill="none"
                stroke="#334155"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <circle cx="38" cy="-7.5" r="2.8" fill="#334155" />{" "}
              {/* 位於第三間上方 */}
              <circle cx="38" cy="7.5" r="2.8" fill="#334155" />{" "}
              {/* 位於第四間下方 */}
            </g>

            {/* 音符主體 */}
            {currentNote && (
              <g
                className={`transition-all duration-300 ${
                  feedback === "correct"
                    ? "opacity-0 scale-90 translate-x-4"
                    : "opacity-100 scale-100 translate-x-0"
                }`}
              >
                {/* 加線邏輯 (中央C y=15) */}
                {currentNote.ledger && currentNote.y <= 15 && (
                  <line
                    x1="135"
                    y1="15"
                    x2="165"
                    y2="15"
                    stroke="#334155"
                    strokeWidth="2.5"
                  />
                )}

                {/* 音符橢圓 */}
                <ellipse
                  cx="150"
                  cy={currentNote.y}
                  rx="9"
                  ry="7.5"
                  className={`transition-colors duration-300 ${
                    feedback === "correct"
                      ? "fill-green-500"
                      : feedback === "wrong"
                      ? "fill-red-500"
                      : "fill-slate-900"
                  }`}
                  transform={`rotate(-20 150 ${currentNote.y})`}
                />

                {/* 符桿 (y < 60 音符朝上, y >= 60 音符朝下) */}
                <line
                  x1={currentNote.y >= 60 ? 158 : 142}
                  y1={currentNote.y}
                  x2={currentNote.y >= 60 ? 158 : 142}
                  y2={
                    currentNote.y >= 60
                      ? currentNote.y - 45
                      : currentNote.y + 45
                  }
                  className={`transition-colors duration-300 ${
                    feedback === "correct"
                      ? "stroke-green-500"
                      : feedback === "wrong"
                      ? "stroke-red-500"
                      : "stroke-slate-900"
                  }`}
                  strokeWidth="2.5"
                />
              </g>
            )}
          </svg>

          {showPiano && currentNote && (
            <div className="mt-6 flex flex-col items-center animate-in slide-in-from-bottom duration-500">
              <div className="flex bg-slate-900 p-1.5 rounded-xl shadow-2xl border-2 border-slate-800">
                {Array.from({ length: 11 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-7 h-16 border-x border-slate-100 rounded-b-md transition-colors ${
                      currentNote.pianoIdx === i
                        ? "bg-indigo-400 shadow-[inset_0_0_15px_rgba(255,255,255,0.5)]"
                        : "bg-white"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-3 font-bold text-center tracking-widest flex items-center justify-center gap-1.5">
                <Info size={10} /> 已修正：低音譜音理與對位
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-12">
          <div className="grid grid-cols-7 gap-2.5">
            {BUTTONS.map((btn) => (
              <button
                key={btn.name}
                onClick={() => handleGuess(btn.name)}
                style={{ backgroundColor: btn.color }}
                className="relative flex flex-col items-center py-5 rounded-2xl text-white shadow-lg active:scale-90 transition-all hover:brightness-110"
              >
                <span className="text-2xl font-black">{btn.name}</span>
                <span className="text-[10px] font-bold opacity-80 uppercase mt-1">
                  {btn.solfege}
                </span>
                <span className="absolute -top-1.5 -right-1 text-[8px] bg-white text-slate-800 px-1.5 rounded-md font-black shadow-sm border uppercase">
                  {btn.key}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-10 flex justify-center items-center gap-8">
            <button
              onClick={resetGame}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-bold"
            >
              <RefreshCcw size={16} /> 重置進度
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />{" "}
              最高紀錄: {maxStreak}
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.15s ease-in-out infinite; }
      `,
        }}
      />
    </div>
  );
}
