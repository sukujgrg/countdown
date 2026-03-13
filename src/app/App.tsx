import { useState, useEffect, useRef } from 'react';
import { FlipDigit } from './components/FlipDigit';
import { type PersistedBackgroundAudio, usePersistedBackgroundAudio } from './hooks/usePersistedBackgroundAudio';

type FontOption = {
  value: string;
  label: string;
};

const presets = [
  { minutes: 1, label: '1 min' },
  { minutes: 2, label: '2 min' },
  { minutes: 5, label: '5 min' },
  { minutes: 10, label: '10 min' },
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 45, label: '45 min' },
  { minutes: 60, label: '60 min' },
];

const fonts: FontOption[] = [
  { value: 'Rajdhani', label: 'Rajdhani (default)' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono' },
  { value: 'Orbitron', label: 'Orbitron' },
  { value: 'Chakra Petch', label: 'Chakra Petch' },
  { value: 'Audiowide', label: 'Audiowide' },
  { value: 'Oxanium', label: 'Oxanium' },
  { value: 'Space Grotesk', label: 'Space Grotesk' },
  { value: 'Michroma', label: 'Michroma' },
  { value: 'Press Start 2P', label: 'Press Start 2P' },
  { value: 'Share Tech Mono', label: 'Share Tech Mono' },
  { value: 'Black Ops One', label: 'Black Ops One' },
  { value: 'Bungee', label: 'Bungee' },
];

const DEFAULT_FONT_FAMILY = fonts[0].value;
const DEFAULT_TITLE = 'COUNTDOWN';
const DEFAULT_DOCUMENT_TITLE = 'Countdown Timer';

function getFontStyle(fontFamily: string) {
  return { fontFamily: `"${fontFamily}", sans-serif` };
}

function buildDocumentTitle(title: string, minutes: number, font: string, hasAudio: boolean) {
  const parts = [title || DEFAULT_TITLE, `${minutes}m`, font];
  if (hasAudio) {
    parts.push('local audio');
  }

  return `${parts.join(' · ')} | ${DEFAULT_DOCUMENT_TITLE}`;
}

function buildHostedFontUrl(fontFamily: string) {
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700;900&display=swap`;
}

function useHostedFonts(fontFamilies: string[]) {
  const familiesKey = fontFamilies.filter(Boolean).join('|');

  useEffect(() => {
    const uniqueFamilies = [...new Set(familiesKey.split('|').filter(Boolean))];
    const createdLinks: HTMLLinkElement[] = [];

    uniqueFamilies.forEach((fontFamily) => {
      const selector = `link[data-countdown-font="${fontFamily}"]`;
      if (document.head.querySelector(selector)) {
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = buildHostedFontUrl(fontFamily);
      link.dataset.countdownFont = fontFamily;
      document.head.appendChild(link);
      createdLinks.push(link);
    });

    return () => {
      createdLinks.forEach((link) => {
        document.head.removeChild(link);
      });
    };
  }, [familiesKey]);
}

function buildUrl(minutes: number, font: string, title: string, useLocalSound: boolean) {
  const params = new URLSearchParams();
  params.set('minutes', String(minutes));
  params.set('font', font);
  if (title && title !== DEFAULT_TITLE) {
    params.set('title', title);
  }
  if (useLocalSound) {
    params.set('sound', 'local-file');
  }
  return `${window.location.pathname}?${params.toString()}`;
}

type LandingPageProps = {
  backgroundAudio: PersistedBackgroundAudio;
  onStart: (search: string) => void;
};

function LandingPage({ backgroundAudio, onStart }: LandingPageProps) {
  const [selectedMinutes, setSelectedMinutes] = useState(5);
  const [customMinutes, setCustomMinutes] = useState('');
  const [selectedFont, setSelectedFont] = useState(DEFAULT_FONT_FAMILY);
  const [selectedTitle, setSelectedTitle] = useState(DEFAULT_TITLE);
  const [isStarting, setIsStarting] = useState(false);
  const [isUpdatingAudio, setIsUpdatingAudio] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [launchError, setLaunchError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const minutes = customMinutes ? Number(customMinutes) : selectedMinutes;
  const launchUrl = buildUrl(minutes, selectedFont, selectedTitle.trim() || DEFAULT_TITLE, backgroundAudio.hasAudio);
  const uiFontStyle = getFontStyle(DEFAULT_FONT_FAMILY);

  useHostedFonts(fonts.map((font) => font.value));

  useEffect(() => {
    document.title = buildDocumentTitle(selectedTitle.trim() || DEFAULT_TITLE, minutes, selectedFont, backgroundAudio.hasAudio);
  }, [backgroundAudio.hasAudio, minutes, selectedFont, selectedTitle]);

  useEffect(() => {
    if (backgroundAudio.error) {
      setLaunchError(backgroundAudio.error);
    }
  }, [backgroundAudio.error]);

  const handleStart = async () => {
    if (isStarting) {
      return;
    }

    setLaunchError('');
    setIsStarting(true);

    try {
      if (backgroundAudio.hasAudio) {
        await backgroundAudio.playFromStart();
      } else {
        backgroundAudio.pause(true);
      }

      onStart(new URL(launchUrl, window.location.origin).search);
    } catch (error) {
      setLaunchError(error instanceof Error ? error.message : 'Unable to prepare the selected audio file.');
      setIsStarting(false);
    }
  };

  const handleAudioSelection = async (file: File | null) => {
    setLaunchError('');
    setCopyStatus('idle');
    setIsUpdatingAudio(true);

    try {
      if (file) {
        await backgroundAudio.replaceAudio(file);
      } else {
        await backgroundAudio.clearAudio();
      }
    } catch (error) {
      setLaunchError(error instanceof Error ? error.message : 'Unable to update the saved audio file.');
    } finally {
      setIsUpdatingAudio(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(launchUrl);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 m-auto w-[600px] h-[600px] border-2 border-cyan-500/20 rounded-full animate-spin-slow"></div>
        <div className="absolute inset-0 m-auto w-[800px] h-[800px] border-2 border-blue-500/15 rounded-full animate-spin-reverse"></div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-slow { animation: spin-slow 40s linear infinite; }
        .animate-spin-reverse { animation: spin-reverse 30s linear infinite; }
      `}</style>

      <div className="relative z-10 max-w-2xl w-full">
        {/* Title */}
        <h1
          className="text-5xl md:text-7xl mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500"
          style={{ ...uiFontStyle, fontWeight: 900 }}
        >
          {selectedTitle.trim() || DEFAULT_TITLE}
        </h1>
        <p className="text-cyan-400/50 text-center mb-12 text-sm tracking-widest uppercase" style={uiFontStyle}>
          Configure your timer
        </p>

        {/* Duration */}
        <div className="mb-10">
          <h2 className="text-cyan-400/80 text-xs uppercase tracking-widest mb-4" style={uiFontStyle}>Duration</h2>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {presets.map((p) => (
              <button
                key={p.minutes}
                onClick={() => { setSelectedMinutes(p.minutes); setCustomMinutes(''); }}
                className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                  !customMinutes && selectedMinutes === p.minutes
                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-cyan-400/30 hover:text-cyan-400/80'
                }`}
                style={uiFontStyle}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm" style={uiFontStyle}>or</span>
            <input
              type="number"
              min="1"
              max="999"
              placeholder="Custom minutes..."
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-cyan-300 text-sm placeholder-slate-600 outline-none focus:border-cyan-400/60 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)] transition-all"
              style={uiFontStyle}
            />
          </div>
        </div>

        {/* Title */}
        <div className="mb-10">
          <h2 className="text-cyan-400/80 text-xs uppercase tracking-widest mb-4" style={uiFontStyle}>Title</h2>
          <input
            type="text"
            maxLength={40}
            placeholder={DEFAULT_TITLE}
            value={selectedTitle}
            onChange={(e) => setSelectedTitle(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-cyan-300 text-sm placeholder-slate-600 outline-none focus:border-cyan-400/60 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)] transition-all"
            style={uiFontStyle}
          />
        </div>

        {/* Font */}
        <div className="mb-12">
          <h2 className="text-cyan-400/80 text-xs uppercase tracking-widest mb-4" style={uiFontStyle}>Font</h2>
          <div className="grid grid-cols-2 gap-3">
            {fonts.map((f) => (
              <button
                key={`${f.value}-${f.label}`}
                onClick={() => setSelectedFont(f.value)}
                className={`py-3 px-4 rounded-xl text-sm text-left transition-all border ${
                  selectedFont === f.value
                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-cyan-400/30 hover:text-cyan-400/80'
                }`}
                style={{ ...getFontStyle(f.value), fontWeight: 700 }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audio */}
        <div className="mb-12">
          <h2 className="text-cyan-400/80 text-xs uppercase tracking-widest mb-4" style={uiFontStyle}>Local Audio File</h2>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-4">
            <label className="block text-xs uppercase tracking-widest text-cyan-400/80 mb-3" style={uiFontStyle}>
              Choose Audio File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                void handleAudioSelection(file);
              }}
              className="hidden"
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-cyan-300 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/20"
                style={uiFontStyle}
              >
                {backgroundAudio.hasAudio ? 'Replace File' : 'Choose File'}
              </button>
              {backgroundAudio.hasAudio && (
                <button
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                    void handleAudioSelection(null);
                  }}
                  className="rounded-xl border border-slate-600/50 bg-slate-800/60 px-4 py-2 text-slate-300 transition-colors hover:border-slate-500/70 hover:bg-slate-700/70"
                  style={uiFontStyle}
                >
                  Remove File
                </button>
              )}
              <span className="text-sm text-slate-400" style={uiFontStyle}>
                {backgroundAudio.fileName ?? 'No file selected'}
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500" style={uiFontStyle}>
              {backgroundAudio.fileName ? `Selected: ${backgroundAudio.fileName}` : 'Optional. If selected, it will loop during the countdown and stop when the timer ends.'}
            </p>
          </div>
        </div>

        {/* Launch */}
        <button
          type="button"
          onClick={() => { void handleStart(); }}
          className="block w-full py-4 rounded-2xl text-center text-lg font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={uiFontStyle}
          disabled={isStarting || isUpdatingAudio || !backgroundAudio.isReady}
        >
          {!backgroundAudio.isReady ? 'LOADING AUDIO...' : isUpdatingAudio ? 'SAVING AUDIO...' : isStarting ? 'PREPARING...' : `START ${minutes} MINUTE${minutes !== 1 ? 'S' : ''} COUNTDOWN`}
        </button>
        {launchError && (
          <p className="mt-4 text-center text-sm text-rose-400" style={uiFontStyle}>
            {launchError}
          </p>
        )}

        {/* Preview URL */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <p className="max-w-full text-center text-xs leading-8 text-slate-600 break-all" style={{ fontFamily: 'monospace' }}>
            {launchUrl}
          </p>
          <button
            type="button"
            onClick={() => { void handleCopyUrl(); }}
            className="shrink-0 rounded-lg border border-slate-700/60 bg-slate-900/70 px-3 py-1 text-xs text-cyan-300 transition-colors hover:border-cyan-400/50 hover:bg-slate-800/80"
            style={uiFontStyle}
          >
            Copy URL
          </button>
        </div>
        {copyStatus !== 'idle' && (
          <p className={`mt-2 text-center text-xs ${copyStatus === 'copied' ? 'text-cyan-400/70' : 'text-rose-400'}`} style={uiFontStyle}>
            {copyStatus === 'copied' ? 'URL copied.' : 'Unable to copy URL.'}
          </p>
        )}
      </div>
    </div>
  );
}

type CountdownTimerProps = {
  backgroundAudio: PersistedBackgroundAudio;
  search: string;
  onNavigateHome: () => void;
};

function CountdownTimer({ backgroundAudio, search, onNavigateHome }: CountdownTimerProps) {
  const params = new URLSearchParams(search);
  const queryMinutes = params.get('minutes');
  const initialMinutes = queryMinutes ? Number(queryMinutes) : (Number((__COUNTDOWN_MINUTES__ as string)) || 5);
  const fontFamily = params.get('font') || DEFAULT_FONT_FAMILY;
  const title = params.get('title') || DEFAULT_TITLE;
  const hasLocalSound = params.get('sound') === 'local-file' && backgroundAudio.hasAudio;
  const fontStyle = getFontStyle(fontFamily);
  const uiFontStyle = getFontStyle(DEFAULT_FONT_FAMILY);
  const initialSeconds = initialMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useHostedFonts([DEFAULT_FONT_FAMILY, fontFamily]);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (!backgroundAudio.isReady) {
      return;
    }

    if (hasLocalSound && isActive && timeLeft > 0) {
      void backgroundAudio.ensurePlaying().catch(() => {
        // Ignore autoplay failures; the timer can continue without audio.
      });
      return;
    }

    backgroundAudio.pause(timeLeft === 0);
  }, [backgroundAudio, hasLocalSound, isActive, timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  useEffect(() => {
    document.title = buildDocumentTitle(title, initialMinutes, fontFamily, hasLocalSound);
  }, [fontFamily, hasLocalSound, initialMinutes, title]);

  const minuteTens = Math.floor(minutes / 10).toString();
  const minuteOnes = (minutes % 10).toString();
  const secondTens = Math.floor(seconds / 10).toString();
  const secondOnes = (seconds % 10).toString();

  const handleReset = () => {
    backgroundAudio.pause(true);
    setTimeLeft(initialSeconds);
    setIsActive(true);
  };

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        {/* Animated grid */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }}></div>

        {/* Rotating rings */}
        <div className="absolute inset-0 m-auto w-[600px] h-[600px] border-2 border-cyan-500/30 rounded-full animate-spin-slow"></div>
        <div className="absolute inset-0 m-auto w-[800px] h-[800px] border-2 border-blue-500/25 rounded-full animate-spin-reverse"></div>
        <div className="absolute inset-0 m-auto w-[1000px] h-[1000px] border-2 border-purple-500/20 rounded-full animate-spin-slow" style={{ animationDelay: '2s' }}></div>

        {/* Diagonal lines */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-slide-diagonal" style={{ left: '10%' }}></div>
          <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-slide-diagonal" style={{ left: '30%', animationDelay: '2s' }}></div>
          <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-purple-400 to-transparent animate-slide-diagonal" style={{ left: '50%', animationDelay: '4s' }}></div>
          <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-slide-diagonal" style={{ left: '70%', animationDelay: '1s' }}></div>
          <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-slide-diagonal" style={{ left: '90%', animationDelay: '3s' }}></div>
        </div>

        {/* Starfield effect */}
        <div className="absolute w-1 h-1 bg-white rounded-full top-[10%] left-[15%] animate-twinkle"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full top-[25%] left-[80%] animate-twinkle" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-[40%] left-[25%] animate-twinkle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full top-[60%] left-[70%] animate-twinkle" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-[75%] left-[40%] animate-twinkle" style={{ animationDelay: '2s' }}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full top-[85%] left-[60%] animate-twinkle" style={{ animationDelay: '2.5s' }}></div>
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-[15%] left-[45%] animate-twinkle" style={{ animationDelay: '3s' }}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full top-[50%] left-[85%] animate-twinkle" style={{ animationDelay: '0.8s' }}></div>

        {/* Floating particles */}
        <div className="absolute w-2 h-2 bg-cyan-400 rounded-full top-1/4 left-1/3 animate-float" style={{ animationDelay: '0s', animationDuration: '6s' }}></div>
        <div className="absolute w-1 h-1 bg-blue-400 rounded-full top-1/3 right-1/4 animate-float" style={{ animationDelay: '1s', animationDuration: '8s' }}></div>
        <div className="absolute w-1.5 h-1.5 bg-purple-400 rounded-full bottom-1/3 left-1/4 animate-float" style={{ animationDelay: '2s', animationDuration: '7s' }}></div>
        <div className="absolute w-2 h-2 bg-cyan-300 rounded-full top-2/3 right-1/3 animate-float" style={{ animationDelay: '3s', animationDuration: '9s' }}></div>
        <div className="absolute w-1 h-1 bg-blue-300 rounded-full bottom-1/4 right-1/2 animate-float" style={{ animationDelay: '4s', animationDuration: '5s' }}></div>
        <div className="absolute w-1.5 h-1.5 bg-purple-300 rounded-full top-1/2 left-1/5 animate-float" style={{ animationDelay: '5s', animationDuration: '10s' }}></div>
        <div className="absolute w-2 h-2 bg-cyan-400 rounded-full bottom-1/2 right-1/5 animate-float" style={{ animationDelay: '6s', animationDuration: '7s' }}></div>
        <div className="absolute w-1 h-1 bg-blue-400 rounded-full top-3/4 left-2/3 animate-float" style={{ animationDelay: '7s', animationDuration: '8s' }}></div>

        {/* Scanning lines */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan" style={{ top: '20%' }}></div>
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan" style={{ top: '60%', animationDelay: '3s' }}></div>
          <div className="absolute h-full w-px bg-gradient-to-b from-transparent via-purple-400 to-transparent animate-scan-horizontal" style={{ left: '30%' }}></div>
          <div className="absolute h-full w-px bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-scan-horizontal" style={{ left: '70%', animationDelay: '4s' }}></div>
        </div>

        {/* Corner accents */}
        <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-cyan-400/30 animate-pulse-slow"></div>
        <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-blue-400/30 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-purple-400/30 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-cyan-400/30 animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
      </div>

      <style>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          50% {
            transform: translateY(-100vh) translateX(30px);
            opacity: 0.7;
          }
        }

        @keyframes scan {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }

        @keyframes scan-horizontal {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(100vw);
            opacity: 0;
          }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes slide-diagonal {
          0% {
            transform: translateY(-100%) translateX(-50px);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(50px);
            opacity: 0;
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-scan {
          animation: scan 8s ease-in-out infinite;
        }

        .animate-scan-horizontal {
          animation: scan-horizontal 10s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 40s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 30s linear infinite;
        }

        .animate-slide-diagonal {
          animation: slide-diagonal 6s ease-in-out infinite;
        }

        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Back button */}
      <button
        type="button"
        onClick={() => {
          backgroundAudio.pause(true);
          onNavigateHome();
        }}
        className="absolute top-6 left-6 z-20 text-cyan-400/50 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2"
        style={uiFontStyle}
      >
        <span>&larr;</span> Back
      </button>

      <div className="text-center mb-16 relative z-10">
        <h1 className="text-5xl md:text-7xl mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]" style={{ ...fontStyle, fontWeight: 900 }}>
          {title}
        </h1>
      </div>

      <div className="flex flex-col items-center mb-16 relative z-10">
        {/* Digits row */}
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex gap-3">
            <FlipDigit digit={minuteTens} fontFamily={fontFamily} />
            <FlipDigit digit={minuteOnes} fontFamily={fontFamily} />
          </div>

          {/* Separator */}
          <div className="flex flex-col gap-4">
            <div className="w-3 h-3 md:w-4 md:h-4 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full shadow-lg shadow-cyan-400/50 animate-pulse"></div>
            <div className="w-3 h-3 md:w-4 md:h-4 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full shadow-lg shadow-cyan-400/50 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>

          <div className="flex gap-3">
            <FlipDigit digit={secondTens} fontFamily={fontFamily} />
            <FlipDigit digit={secondOnes} fontFamily={fontFamily} />
          </div>
        </div>

        {/* Labels row */}
        <div className="flex gap-4 md:gap-8 mt-3">
          <span className="text-xs md:text-sm text-cyan-400/60 uppercase tracking-widest w-[calc(2*6rem+0.75rem)] md:w-[calc(2*8rem+0.75rem)] text-center" style={fontStyle}>Minutes</span>
          <span className="text-xs md:text-sm text-cyan-400/60 uppercase tracking-widest w-[calc(2*6rem+0.75rem)] md:w-[calc(2*8rem+0.75rem)] text-center" style={fontStyle}>Seconds</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const backgroundAudio = usePersistedBackgroundAudio();
  const [search, setSearch] = useState(window.location.search);

  useEffect(() => {
    const handlePopState = () => {
      setSearch(window.location.search);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = (nextSearch: string) => {
    const url = `${window.location.pathname}${nextSearch}`;
    window.history.pushState({}, '', url);
    setSearch(nextSearch);
  };

  const navigateHome = () => {
    window.history.pushState({}, '', window.location.pathname);
    setSearch('');
  };

  const params = new URLSearchParams(search);
  const hasMinutes = params.has('minutes');

  return hasMinutes ? (
    <CountdownTimer backgroundAudio={backgroundAudio} search={search} onNavigateHome={navigateHome} />
  ) : (
    <LandingPage backgroundAudio={backgroundAudio} onStart={navigate} />
  );
}

export default App;
