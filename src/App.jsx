import { useEffect, useRef, useState } from "react";
import { Dices, RotateCcw, Sparkles } from "lucide-react";
import showLogo from "../4stjernersmiddag.jpeg";

const NAMES = [
  "Daniel",
  "Jonas",
  "Sebastian",
  "Emin",
  "Emil",
  "Sivert",
  "Sindre",
  "Kristian",
  "Kristoffer",
  "Krister",
  "Petter",
  "Jonathan",
  "Sander",
];

const WHEEL_COLORS = [
  "#086ab0",
  "#137fb8",
  "#06477d",
  "#168bc1",
  "#075895",
  "#dc414f",
  "#0a6da7",
  "#1a91c5",
  "#064f8b",
  "#1179ae",
  "#073c70",
  "#e44856",
  "#0c629b",
];

const FULL_TURN = Math.PI * 2;
const SEGMENT = FULL_TURN / NAMES.length;

function readHistory(storageKey) {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(stored)
      ? [...new Set(stored.filter((name) => NAMES.includes(name)))]
      : [];
  } catch {
    return [];
  }
}

function WheelPanel({ type, title, eyebrow, emptyMessage }) {
  const storageKey = `four-star-stroke-${type}-history`;
  const canvasRef = useRef(null);
  const rotationRef = useRef(0);
  const [history, setHistory] = useState(() => readHistory(storageKey));
  const [winner, setWinner] = useState(() => readHistory(storageKey)[0] || null);
  const [message, setMessage] = useState("");
  const [spinning, setSpinning] = useState(false);
  const remainingNames = NAMES.filter((name) => !history.includes(name));
  const complete = remainingNames.length === 0;
  const isHostWheel = type === "host";

  function drawWheel(rotation = rotationRef.current, drawnNames = history) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context) return;

    const center = canvas.width / 2;
    const radius = center - 13;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(center, center);
    context.rotate(rotation);

    NAMES.forEach((name, index) => {
      const start = -Math.PI / 2 + index * SEGMENT;
      const end = start + SEGMENT;
      const drawn = drawnNames.includes(name);

      context.beginPath();
      context.moveTo(0, 0);
      context.arc(0, 0, radius, start, end);
      context.closePath();
      context.fillStyle = drawn ? "#c8d6e2" : WHEEL_COLORS[index];
      context.fill();
      context.strokeStyle = "rgba(255, 255, 255, .92)";
      context.lineWidth = 3;
      context.stroke();

      context.save();
      context.rotate(start + SEGMENT / 2);
      context.translate(radius * 0.67, 0);
      context.rotate(Math.PI / 2);
      context.fillStyle = drawn ? "#72869a" : "#ffffff";
      context.font = "700 19px 'DM Sans', sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.shadowColor = "rgba(0, 0, 0, .18)";
      context.shadowBlur = 2;
      context.fillText(name, 0, 0, radius * 0.47);
      context.restore();
    });

    context.beginPath();
    context.arc(0, 0, radius, 0, FULL_TURN);
    context.strokeStyle = "#f5c936";
    context.lineWidth = 9;
    context.stroke();
    context.beginPath();
    context.roundRect(-31, -31, 62, 62, 12);
    context.fillStyle = "#ffffff";
    context.fill();
    context.strokeStyle = "#f5c936";
    context.lineWidth = 4;
    context.stroke();
    context.fillStyle = "#0872bd";
    [[-12, -12], [12, -12], [-12, 12], [12, 12]].forEach(([x, y]) => {
      context.beginPath();
      context.arc(x, y, 5, 0, FULL_TURN);
      context.fill();
    });
    context.restore();
  }

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(history));
    } catch {
      // The wheel still works when browser storage is unavailable.
    }
    drawWheel(rotationRef.current, history);
  }, [history, storageKey]);

  function spin() {
    if (spinning || complete) return;

    const selectedName = remainingNames[Math.floor(Math.random() * remainingNames.length)];
    const selectedIndex = NAMES.indexOf(selectedName);
    const startRotation = rotationRef.current;
    const turns = 7 + Math.floor(Math.random() * 3);
    const alignment =
      ((-(selectedIndex + 0.5) * SEGMENT - startRotation) % FULL_TURN + FULL_TURN) %
      FULL_TURN;
    const target = startRotation + turns * FULL_TURN + alignment;
    const duration = 4400;
    let startTime;

    setSpinning(true);
    setWinner(null);
    setMessage("Spenningen stiger rundt bordet.");

    function frame(now) {
      startTime ??= now;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 5);
      rotationRef.current = startRotation + (target - startRotation) * eased;
      drawWheel(rotationRef.current, history);

      if (progress < 1) {
        requestAnimationFrame(frame);
        return;
      }

      rotationRef.current = target % FULL_TURN;
      drawWheel(rotationRef.current, history);
      setWinner(selectedName);
      setHistory((current) => [selectedName, ...current]);
      setMessage(
        remainingNames.length > 1
          ? `${selectedName} ${isHostWheel ? "inviterer til middag" : "står for kveldens underholdning"}. ${remainingNames.length - 1} gjenstår.`
          : `Alle navn er trukket. ${selectedName} ble den siste!`,
      );
      setSpinning(false);
    }

    requestAnimationFrame(frame);
  }

  function reset() {
    if (spinning) return;
    rotationRef.current = 0;
    setHistory([]);
    setWinner(null);
    setMessage("");
    drawWheel(0, []);
  }

  const resultMessage = message || (winner ? `Sist trukket: ${winner}` : emptyMessage);

  return (
    <section className="wheel-panel overflow-hidden rounded-lg border border-blue-950/10 bg-white shadow-[0_18px_50px_rgba(14,62,106,0.08)]">
      <div className="flex items-start justify-between gap-4 border-b border-blue-950/10 px-5 py-5 sm:px-7">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#df4b58]">
            {eyebrow}
          </p>
          <h2 className="font-display text-xl font-bold leading-tight text-[#092f53] sm:text-2xl">
            {title}
          </h2>
        </div>
        <span className="shrink-0 rounded-full border border-[#0872bd]/15 bg-[#0872bd]/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#315b78]">
          {remainingNames.length} / {NAMES.length} igjen
        </span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.85fr)]">
        <div className="relative flex min-w-0 flex-col items-center justify-center bg-[#f4f9fd] px-4 py-5 sm:px-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,114,189,0.1),transparent_65%)]" />
          <div className="relative w-full max-w-[430px]">
            <canvas
              ref={canvasRef}
              width="700"
              height="700"
              role="img"
              aria-label={`${title}, ${remainingNames.length} tilgjengelige navn`}
              className="wheel-canvas block aspect-square w-full drop-shadow-[0_12px_15px_rgba(15,62,102,0.18)]"
            />
            <span className="wheel-pointer" aria-hidden="true" />
          </div>
          <div className="relative mt-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#728398]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f5c936]" />
            {remainingNames.length === NAMES.length
              ? "Alle navn er med i trekningen"
              : `${history.length} allerede trukket`}
          </div>
        </div>

        <div className="flex min-w-0 flex-col px-5 py-5 sm:px-7 lg:border-l lg:border-blue-950/10">
          <div className="mb-4 flex min-h-[22px] items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#df4b58]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#df4b58]/35" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#df4b58]" />
            </span>
            {isHostWheel ? "Neste middagsvert" : "Kveldens underholdning"}
          </div>

          <div className="min-h-[112px]">
            <p className="mb-1 text-xs font-medium text-[#718196]">
              {isHostWheel ? "Hvem inviterer?" : "Hvem lager showet?"}
            </p>
            <p
              aria-live="polite"
              className={`font-display text-[34px] font-bold leading-none tracking-tight sm:text-[40px] ${winner ? "text-[#0872bd]" : "text-[#aab8c7]"}`}
            >
              {winner || "Klar?"}
            </p>
            <p className="mt-2 min-h-5 text-xs leading-relaxed text-[#718196]">
              {resultMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={spin}
            disabled={spinning || complete}
            className="mt-3 flex min-h-12 w-full items-center justify-center gap-2.5 rounded-md border-b-[3px] border-[#064c87] bg-[#0872bd] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-[#168acb] active:translate-y-0 active:border-b-0 disabled:cursor-not-allowed disabled:border-[#60788d] disabled:bg-[#8298aa] disabled:opacity-80 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#f5c936]"
          >
            <Dices size={18} strokeWidth={2.2} aria-hidden="true" />
            {spinning
              ? "Hjulet snurrer"
              : complete
                ? "Alle er trukket"
                : winner
                  ? "Trekk neste"
                  : isHostWheel
                    ? "Trekk en vert"
                    : "Trekk en underholder"}
          </button>

          <div className="mt-2 flex min-h-8 items-center justify-between gap-3">
            <span className="text-[10px] text-[#8290a0]">Ingen gjentakelser i samme runde</span>
            <button
              type="button"
              onClick={reset}
              disabled={spinning || history.length === 0}
              aria-label={`Nullstill ${title.toLowerCase()}`}
              title="Nullstill runden"
              className="inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#315b78] transition hover:bg-[#0872bd]/7 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0872bd]"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Ny runde
            </button>
          </div>

          <div className="mt-auto border-t border-blue-950/10 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#315b78]">
                Trekninger
              </h3>
              <span className="text-[10px] tabular-nums text-[#8290a0]">
                {history.length} / {NAMES.length}
              </span>
            </div>
            <div className="max-h-[104px] overflow-y-auto pr-1">
              {history.length ? (
                history.map((name, index) => (
                  <div
                    key={name}
                    className="flex items-center justify-between border-b border-blue-950/5 py-1.5 text-xs last:border-0"
                  >
                    <span className="text-[#8290a0]">Runde {history.length - index}</span>
                    <span className="font-semibold text-[#315b78]">{name}</span>
                  </div>
                ))
              ) : (
                <p className="py-1 text-[11px] text-[#9aa7b5]">Ingen trekninger ennå</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-blue-950/10 bg-[#092f53] px-5 py-3 text-[10px] sm:px-7">
        <span className="mr-1 font-bold uppercase tracking-[0.17em] text-[#f5c936]">
          {isHostWheel ? "Rundt bordet" : "På scenen"}
        </span>
        {NAMES.map((name) => (
          <span
            key={name}
            className={`rounded-sm border px-1.5 py-1 transition-colors ${
              history.includes(name)
                ? "border-white/5 text-white/40 line-through"
                : "border-white/15 text-white/85"
            }`}
          >
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}

function App() {
  return (
    <div className="min-h-screen overflow-hidden">
      <header className="bg-[#48a8dc] text-white shadow-[inset_0_-1px_0_rgba(9,47,83,0.2)]">
        <div className="mx-auto flex h-[66px] max-w-[1360px] items-center justify-between px-5 sm:px-8">
          <a href="#top" className="flex items-center gap-2.5" aria-label="4-stjerners stroke">
            <img
              src={showLogo}
              alt="4-stjerners middag"
              className="h-[54px] w-[97px] object-contain drop-shadow-[0_6px_18px_rgba(9,47,83,0.22)] sm:h-[60px] sm:w-[108px]"
            />
          </a>
          <div className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/85 sm:flex">
            <Sparkles size={14} className="text-[#f5c936]" aria-hidden="true" />
            Middagslaget
          </div>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-[1360px] px-4 pb-12 sm:px-8">
        <section className="hero-shell relative isolate my-5 min-h-[320px] overflow-hidden rounded-[20px] border border-[#0b3d69]/10 bg-[#48a8dc] shadow-[0_22px_44px_rgba(17,76,120,0.12)] sm:my-7 sm:min-h-[335px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_24%),linear-gradient(120deg,rgba(11,61,105,0.06),transparent_40%)]" />
          <div className="relative flex min-h-[320px] flex-col items-start gap-3 px-5 py-5 sm:min-h-[335px] sm:flex-row sm:items-center sm:gap-5 sm:px-9">
            <div className="relative z-10 w-full min-w-0 sm:w-[44%] sm:shrink-0">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#f5c936]">
                Kveldens program <span className="px-1 text-white/45">/</span> 01
              </p>
              <h1 className="font-display text-[28px] font-bold leading-[1.04] tracking-tight text-white sm:text-[46px]">
                En vert. En scene.
                <br />
                To trekninger.
              </h1>
              <p className="mt-2 text-xs text-white/75 sm:text-sm">4-stjerners stroke</p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <span className="hero-badge">13 deltagere</span>
                <span className="hero-badge">2 roller</span>
                <span className="hero-badge">ingen gjentakelser</span>
              </div>
            </div>
            <div className="hero-logo-art relative mx-auto mt-3 w-[250px] max-w-[90%] shrink-0 sm:ml-auto sm:mt-0 sm:w-[52%] sm:max-w-[470px]" aria-hidden="true">
              <img src={showLogo} alt="" className="block h-auto w-full" />
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 572 349" preserveAspectRatio="none">
                <path
                  fill="#ce4437"
                  d="M250 147 C310 134 390 139 433 155 C454 163 464 178 464 195 C466 216 445 232 414 239 C397 243 380 245 367 246 C373 266 392 286 441 301 C401 296 372 280 354 261 C347 253 344 247 342 239 C307 248 268 245 237 235 C211 228 199 214 199 197 C198 175 217 157 250 147 Z"
                />
                <path id="stroke-logo-curve" d="M222 222 Q328 172 440 216" fill="none" />
                <text
                  fill="#f5f1d6"
                  fontFamily="Space Grotesk, sans-serif"
                  fontSize="48"
                  fontWeight="700"
                  letterSpacing="1"
                >
                  <textPath href="#stroke-logo-curve" startOffset="50%" textAnchor="middle">
                    STROKE
                  </textPath>
                </text>
              </svg>
            </div>
          </div>
        </section>

        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#df4b58]">
              Fordeling av kveldens oppgaver
            </p>
            <h2 className="font-display text-xl font-bold text-[#092f53] sm:text-2xl">
              Hvem tar hvilken rolle?
            </h2>
          </div>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8290a0] sm:block">
            To uavhengige trekninger
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <WheelPanel
            type="host"
            eyebrow="Rolle 01"
            title="Middagsvert"
            emptyMessage="Hjulet venter på deg"
          />
          <WheelPanel
            type="entertainment"
            eyebrow="Rolle 02"
            title="Kveldens underholdning"
            emptyMessage="Hvem tar scenen?"
          />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-blue-950/10 pt-5 text-[10px] uppercase tracking-[0.14em] text-[#8290a0]">
          <span className="text-[#536a7d]">God mat. Gode venner. En kveld å huske.</span>
          <span className="font-bold text-[#0f4b7d]">4-STJERNERS STROKE</span>
        </footer>
      </main>
    </div>
  );
}

export default App;