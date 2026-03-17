import { type MutableRefObject, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react';
import { type PersistedBackgroundAudio, usePersistedBackgroundAudio } from './hooks/usePersistedBackgroundAudio';

type FontOption = {
  value: string;
  label: string;
};

type AnimationStyle = {
  id: string;
  label: string;
  mood: string;
  description: string;
  accent: string;
  secondary: string;
  tertiary: string;
  surface: string;
  background: string;
  shell: string;
};

type TextAnimationOption = {
  id: string;
  label: string;
  description: string;
};

type CountdownConfig = {
  font: string;
  messageSequence: string;
  minutes: number;
  styleId: string;
  textAnimation: string;
};

const CONFIG_STORAGE_KEY = 'countdown-config-v1';
const DEFAULT_DOCUMENT_TITLE = 'Countdown Lab';
const DEFAULT_MESSAGE_SEQUENCE = 'Welcome\nService Begins Soon\nPrepare Your Heart';

const durationPresets = [1, 5, 10, 15, 25, 45, 60, 90];

const fonts: FontOption[] = [
  { value: 'Rajdhani', label: 'Rajdhani' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono' },
  { value: 'Orbitron', label: 'Orbitron' },
  { value: 'Chakra Petch', label: 'Chakra Petch' },
  { value: 'Audiowide', label: 'Audiowide' },
  { value: 'Oxanium', label: 'Oxanium' },
  { value: 'Space Grotesk', label: 'Space Grotesk' },
  { value: 'Michroma', label: 'Michroma' },
  { value: 'Press Start 2P', label: 'Press Start 2P' },
  { value: 'Black Ops One', label: 'Black Ops One' },
];

const textAnimationOptions: TextAnimationOption[] = [
  { id: 'crossfade', label: 'Crossfade', description: 'Soft dissolve between phrases.' },
  { id: 'word-build', label: 'Word Build', description: 'Phrase lifts in with a gentle stagger.' },
  { id: 'halo-fade', label: 'Halo Fade', description: 'A soft bloom of light around the line.' },
  { id: 'gentle-drift', label: 'Gentle Drift', description: 'The phrase glides in with a quiet float.' },
  { id: 'glow-swap', label: 'Glow Swap', description: 'Current line dims while the next brightens.' },
  { id: 'vertical-lift', label: 'Vertical Lift', description: 'One message rises out and the next rises in.' },
];

const animationStyles: AnimationStyle[] = [
  {
    id: 'pulse-grid',
    label: 'Pulse Grid',
    mood: 'elastic neon beats',
    description: 'A responsive digital stage with buoyant pulse hits and halo blooms on every tick.',
    accent: '#86f6ff',
    secondary: '#7f5cff',
    tertiary: '#2fffd5',
    surface: 'rgba(5, 16, 38, 0.74)',
    background: 'radial-gradient(circle at 20% 20%, rgba(24, 128, 255, 0.26), transparent 36%), radial-gradient(circle at 80% 10%, rgba(127, 92, 255, 0.22), transparent 30%), linear-gradient(135deg, #020617 0%, #071124 52%, #02050f 100%)',
    shell: 'linear-gradient(145deg, rgba(6, 18, 41, 0.96), rgba(3, 8, 23, 0.92))',
  },
  {
    id: 'orbit-vault',
    label: 'Orbit Vault',
    mood: 'rotational vault flips',
    description: 'Digits arrive like rotating vault plates while orbital rings drift around the stage.',
    accent: '#f8ff9d',
    secondary: '#ff7c54',
    tertiary: '#ffd166',
    surface: 'rgba(38, 18, 11, 0.72)',
    background: 'radial-gradient(circle at 15% 18%, rgba(255, 209, 102, 0.16), transparent 28%), radial-gradient(circle at 85% 14%, rgba(255, 124, 84, 0.26), transparent 24%), linear-gradient(145deg, #12060a 0%, #221012 48%, #070b17 100%)',
    shell: 'linear-gradient(145deg, rgba(40, 16, 10, 0.96), rgba(7, 11, 23, 0.88))',
  },
  {
    id: 'glitch-scan',
    label: 'Glitch Scan',
    mood: 'scanline rifts',
    description: 'Aggressive skew transitions, drifting shards, and a noisy radar-glitch character.',
    accent: '#5bf6d4',
    secondary: '#ff5db1',
    tertiary: '#7cf7ff',
    surface: 'rgba(20, 10, 31, 0.72)',
    background: 'radial-gradient(circle at 18% 10%, rgba(255, 93, 177, 0.24), transparent 26%), radial-gradient(circle at 86% 18%, rgba(91, 246, 212, 0.18), transparent 24%), linear-gradient(140deg, #06050d 0%, #110d1f 48%, #08121f 100%)',
    shell: 'linear-gradient(145deg, rgba(16, 10, 26, 0.96), rgba(7, 18, 31, 0.92))',
  },
  {
    id: 'sanctuary-glow',
    label: 'Sanctuary Glow',
    mood: 'warm sanctuary light',
    description: 'A calm arch-lit stage with soft halo rings and gentle light rays behind the countdown.',
    accent: '#ffe7a6',
    secondary: '#f7b267',
    tertiary: '#fff4d0',
    surface: 'rgba(36, 22, 12, 0.72)',
    background: 'radial-gradient(circle at 20% 16%, rgba(255, 231, 166, 0.2), transparent 24%), radial-gradient(circle at 82% 12%, rgba(247, 178, 103, 0.16), transparent 22%), linear-gradient(150deg, #0a0707 0%, #1b120d 42%, #070911 100%)',
    shell: 'linear-gradient(145deg, rgba(34, 22, 12, 0.96), rgba(7, 9, 17, 0.9))',
  },
];

const DEFAULT_CONFIG: CountdownConfig = {
  font: fonts[0].value,
  messageSequence: DEFAULT_MESSAGE_SEQUENCE,
  minutes: 15,
  styleId: animationStyles[0].id,
  textAnimation: textAnimationOptions[0].id,
};

function clampMinutes(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_CONFIG.minutes;
  }

  return Math.min(999, Math.max(1, Math.round(value)));
}

function getAnimationStyle(styleId: string) {
  return animationStyles.find((style) => style.id === styleId) ?? animationStyles[0];
}

function getFontStyle(fontFamily: string) {
  return { fontFamily: `"${fontFamily}", sans-serif` };
}

function getDigitFontStyle(fontFamily: string) {
  return { fontFamily: `"${fontFamily}", "JetBrains Mono", monospace` };
}

function getClockFontTuning(fontFamily: string) {
  switch (fontFamily) {
    case 'Audiowide':
      return { letterSpacing: '0.02em', scale: 0.86, width: '6.2ch' };
    case 'Michroma':
      return { letterSpacing: '0.03em', scale: 0.88, width: '6.2ch' };
    case 'Press Start 2P':
      return { letterSpacing: '0.01em', scale: 0.74, width: '6.4ch' };
    case 'Black Ops One':
      return { letterSpacing: '0.04em', scale: 0.9, width: '6.2ch' };
    default:
      return { letterSpacing: null, scale: 1, width: '6.2ch' };
  }
}

function getClockTextStyle(fontFamily: string, accent: string, baseLetterSpacing: string) {
  const tuning = getClockFontTuning(fontFamily);

  return {
    ...getDigitFontStyle(fontFamily),
    color: '#f8fafc',
    display: 'inline-block',
    fontFeatureSettings: '"tnum" 1, "lnum" 1',
    fontVariantNumeric: 'tabular-nums lining-nums',
    letterSpacing: tuning.letterSpacing ?? baseLetterSpacing,
    lineHeight: 0.9,
    scale: tuning.scale,
    textAlign: 'center' as const,
    textShadow: `0 0 22px ${accent}66`,
    transformOrigin: 'center center',
    WebkitTextFillColor: '#f8fafc',
    width: tuning.width,
  };
}

function buildHostedFontUrl(fontFamily: string) {
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700;900&display=swap`;
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

function buildUrl(config: CountdownConfig, hasAudio: boolean) {
  const params = new URLSearchParams();
  params.set('minutes', String(config.minutes));
  params.set('font', config.font);
  params.set('style', config.styleId);

  const trimmedMessageSequence = config.messageSequence.trim();
  if (trimmedMessageSequence && trimmedMessageSequence !== DEFAULT_MESSAGE_SEQUENCE) {
    params.set('messages', trimmedMessageSequence);
  }

  if (config.textAnimation !== DEFAULT_CONFIG.textAnimation) {
    params.set('messageFx', config.textAnimation);
  }

  if (hasAudio) {
    params.set('sound', 'local-file');
  }

  return `${window.location.pathname}?${params.toString()}`;
}

function normalizeConfig(config: Partial<CountdownConfig> | null | undefined): CountdownConfig {
  const font = fonts.some((fontOption) => fontOption.value === config?.font) ? (config?.font as string) : DEFAULT_CONFIG.font;
  const styleId = animationStyles.some((style) => style.id === config?.styleId) ? (config?.styleId as string) : DEFAULT_CONFIG.styleId;
  const textAnimation = textAnimationOptions.some((option) => option.id === config?.textAnimation)
    ? (config?.textAnimation as string)
    : DEFAULT_CONFIG.textAnimation;
  const messageSequence = (config?.messageSequence ?? (config as { flyingText?: string } | null | undefined)?.flyingText)?.trim() || DEFAULT_MESSAGE_SEQUENCE;

  return {
    font,
    messageSequence,
    minutes: clampMinutes(Number(config?.minutes ?? DEFAULT_CONFIG.minutes)),
    styleId,
    textAnimation,
  };
}

function readPersistedConfig() {
  try {
    const rawConfig = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!rawConfig) {
      return null;
    }

    return normalizeConfig(JSON.parse(rawConfig) as Partial<CountdownConfig>);
  } catch {
    return null;
  }
}

function writePersistedConfig(config: CountdownConfig) {
  try {
    window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(normalizeConfig(config)));
  } catch {
    // Ignore storage quota and privacy mode failures; the app still works without config persistence.
  }
}

function parseSearch(search: string) {
  const params = new URLSearchParams(search);
  const config = normalizeConfig({
    font: params.get('font') ?? undefined,
    messageSequence: params.get('messages') ?? params.get('ambient') ?? undefined,
    minutes: Number(params.get('minutes') || DEFAULT_CONFIG.minutes),
    styleId: params.get('style') ?? undefined,
    textAnimation: params.get('messageFx') ?? undefined,
  });

  return {
    config,
    isTimerActive: params.has('minutes'),
  };
}

function resolveLocationState(search: string) {
  const parsedSearch = parseSearch(search);
  if (new URLSearchParams(search).toString()) {
    return parsedSearch;
  }

  return {
    config: readPersistedConfig() ?? parsedSearch.config,
    isTimerActive: false,
  };
}

function buildDocumentTitle(config: CountdownConfig, hasAudio: boolean, liveTime?: string) {
  const style = getAnimationStyle(config.styleId);
  const parts = ['Countdown'];

  if (liveTime) {
    parts.push(liveTime);
  } else {
    parts.push(`${config.minutes}m`);
  }

  parts.push(style.label);
  parts.push(config.font);

  if (hasAudio) {
    parts.push('local audio');
  }

  return `${parts.join(' · ')} | ${DEFAULT_DOCUMENT_TITLE}`;
}

function getMessageSequenceItems(rawValue: string) {
  return rawValue
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function animateMessageChange(element: HTMLDivElement, textAnimation: string, accent: string) {
  gsap.killTweensOf(element);
  gsap.set(element, { clearProps: 'transform,opacity,filter,textShadow' });

  switch (textAnimation) {
    case 'word-build':
      gsap.fromTo(
        element,
        { y: 14, opacity: 0.18, filter: 'blur(10px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.85, ease: 'power3.out' },
      );
      break;
    case 'halo-fade':
      gsap.fromTo(
        element,
        { opacity: 0.12, scale: 0.985, filter: 'blur(10px)', textShadow: `0 0 0 ${accent}` },
        { opacity: 1, scale: 1, filter: 'blur(0px)', textShadow: `0 0 34px ${accent}44`, duration: 0.9, ease: 'sine.out' },
      );
      break;
    case 'gentle-drift':
      gsap.fromTo(
        element,
        { opacity: 0, y: 18, x: -10, filter: 'blur(8px)' },
        { opacity: 1, y: 0, x: 0, filter: 'blur(0px)', duration: 0.86, ease: 'power2.out' },
      );
      break;
    case 'glow-swap':
      gsap.fromTo(
        element,
        { opacity: 0.16, scale: 1.03, filter: 'blur(6px)', textShadow: `0 0 0 ${accent}` },
        { opacity: 1, scale: 1, filter: 'blur(0px)', textShadow: `0 0 26px ${accent}66`, duration: 0.85, ease: 'sine.out' },
      );
      break;
    case 'vertical-lift':
      gsap.fromTo(
        element,
        { yPercent: 85, opacity: 0, filter: 'blur(8px)' },
        { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.78, ease: 'power4.out' },
      );
      break;
    default:
      gsap.fromTo(element, { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.82, ease: 'sine.out' });
      break;
  }
}

function renderCountdownFace(config: CountdownConfig, style: AnimationStyle, timeLeft: number) {
  const clock = formatClock(timeLeft);

  switch (style.id) {
    case 'orbit-vault':
      return (
        <div className="flex w-full justify-center">
          <div
            className="relative flex aspect-square w-full max-w-[36rem] items-center justify-center rounded-full border border-white/10"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08), rgba(255,255,255,0.02) 58%, rgba(0,0,0,0.12) 100%)',
              boxShadow: `inset 0 0 0 1px ${style.accent}22, 0 0 40px ${style.secondary}18`,
            }}
          >
            <div className="absolute inset-6 rounded-full border" style={{ borderColor: `${style.accent}33` }} />
            <div className="absolute inset-14 rounded-full border" style={{ borderColor: `${style.tertiary}22` }} />
            <div
              className="absolute left-1/2 top-5 h-14 w-1.5 -translate-x-1/2 rounded-full"
              style={{ background: style.accent, boxShadow: `0 0 18px ${style.accent}` }}
            />
            <div
              className="relative z-10 text-7xl leading-none sm:text-8xl lg:text-[8.8rem]"
              style={{
                ...getClockTextStyle(config.font, style.accent),
                fontWeight: 800,
                letterSpacing: '0.12em',
              }}
            >
              {clock}
            </div>
          </div>
        </div>
      );
    case 'glitch-scan':
      return (
        <div
          className="relative w-full overflow-hidden rounded-[1.8rem] border border-white/10 px-6 py-10 sm:px-10 sm:py-12"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 0 28px ${style.secondary}18`,
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'repeating-linear-gradient(180deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 10px)',
            }}
          />
          <div
            className="absolute inset-y-0 left-[14%] w-px"
            style={{ background: `linear-gradient(180deg, transparent, ${style.secondary}, transparent)` }}
          />
          <div className="relative z-10 text-center">
            <div
              className="relative z-10 text-center"
              style={{
                ...getClockTextStyle(config.font, style.accent),
                fontSize: 'clamp(4.75rem, 12vw, 10rem)',
                fontWeight: 900,
                letterSpacing: '0.1em',
                textShadow: `2px 0 0 ${style.secondary}55, -2px 0 0 ${style.accent}44, 0 0 20px ${style.accent}55`,
              }}
            >
              {clock}
            </div>
          </div>
        </div>
      );
    case 'sanctuary-glow':
      return (
        <div className="flex w-full justify-center">
          <div
            className="relative w-full max-w-[62rem] overflow-hidden rounded-[2rem] border border-white/10 px-6 py-10 sm:px-10 sm:py-12"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04) 44%, rgba(0,0,0,0.16) 100%)',
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 0 28px ${style.accent}16`,
            }}
          >
            <div
              className="absolute left-1/2 top-0 h-[72%] w-[52%] -translate-x-1/2 rounded-t-[16rem]"
              style={{
                background: `radial-gradient(circle at 50% 18%, ${style.tertiary}26, transparent 60%)`,
                filter: 'blur(12px)',
              }}
            />
            <div className="absolute inset-x-[18%] top-[12%] h-[44%] rounded-t-[12rem] border border-white/10" style={{ borderColor: `${style.accent}44` }} />
            <div className="absolute inset-x-[24%] top-[18%] h-[32%] rounded-t-[10rem] border" style={{ borderColor: `${style.secondary}33` }} />
            <div
              className="absolute left-1/2 top-[8%] h-[46%] w-px -translate-x-1/2"
              style={{ background: `linear-gradient(180deg, ${style.tertiary}88, transparent)` }}
            />
            <div
              className="absolute inset-x-[12%] top-0 h-[36%]"
              style={{
                background:
                  `linear-gradient(90deg, transparent 0%, ${style.accent}10 18%, ${style.tertiary}18 50%, ${style.accent}10 82%, transparent 100%)`,
                clipPath: 'polygon(48% 0%, 52% 0%, 100% 100%, 0% 100%)',
              }}
            />
            <div className="relative z-10 flex min-h-[20rem] items-center justify-center pt-10 sm:min-h-[24rem]">
              <div
                className="text-center text-8xl leading-none sm:text-[7rem] lg:text-[10rem]"
                style={{
                  ...getClockTextStyle(config.font, style.accent),
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  textShadow: `0 0 30px ${style.accent}44, 0 0 54px ${style.tertiary}18`,
                }}
              >
                {clock}
              </div>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div
          className="relative z-10 flex w-full flex-col items-center rounded-[1.8rem] border border-white/10 px-6 py-12 sm:px-12 sm:py-16"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 0 24px ${style.accent}18`,
          }}
        >
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div
            className="relative z-10 text-center text-8xl leading-none sm:text-[7rem] lg:text-[10rem]"
            style={{
              ...getClockTextStyle(config.font, style.accent),
              fontWeight: 800,
              letterSpacing: '0.1em',
            }}
          >
            {clock}
          </div>
        </div>
      );
  }
}

function setArrayRef<T>(collection: MutableRefObject<T[]>, index: number, node: T | null) {
  if (!node) {
    return;
  }

  collection.current[index] = node;
}

type ConfigureScreenProps = {
  backgroundAudio: PersistedBackgroundAudio;
  config: CountdownConfig;
  onChange: (nextConfig: CountdownConfig) => void;
  onStart: () => void;
};

function ConfigureScreen({ backgroundAudio, config, onChange, onStart }: ConfigureScreenProps) {
  const style = getAnimationStyle(config.styleId);
  const selectedTextAnimation = textAnimationOptions.find((option) => option.id === config.textAnimation) ?? textAnimationOptions[0];
  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const orbRefs = useRef<HTMLDivElement[]>([]);
  const beamRefs = useRef<HTMLDivElement[]>([]);
  const cardRefs = useRef<HTMLButtonElement[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isUpdatingAudio, setIsUpdatingAudio] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [launchError, setLaunchError] = useState('');
  const [customMinutes, setCustomMinutes] = useState(String(config.minutes));

  useHostedFonts(fonts.map((font) => font.value));

  const launchUrl = buildUrl(config, backgroundAudio.hasAudio);

  useEffect(() => {
    document.title = buildDocumentTitle(config, backgroundAudio.hasAudio);
  }, [backgroundAudio.hasAudio, config]);

  useEffect(() => {
    if (backgroundAudio.error) {
      setLaunchError(backgroundAudio.error);
    }
  }, [backgroundAudio.error]);

  useEffect(() => {
    setCustomMinutes(String(config.minutes));
  }, [config.minutes]);

  useEffect(() => {
    const context = gsap.context(() => {
      if (heroRef.current) {
        gsap.fromTo(heroRef.current.children, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out' });
      }

      gsap.fromTo(cardRefs.current, { y: 26, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.68, stagger: 0.08, ease: 'power3.out' });

      orbRefs.current.forEach((orb, index) => {
        gsap.to(orb, {
          x: index % 2 === 0 ? 42 : -32,
          y: index % 2 === 0 ? -28 : 22,
          scale: 1.12 + index * 0.08,
          duration: 5.4 + index,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      });

      beamRefs.current.forEach((beam, index) => {
        gsap.fromTo(
          beam,
          { opacity: 0.12, xPercent: index % 2 === 0 ? -12 : 10 },
          {
            opacity: 0.42,
            xPercent: index % 2 === 0 ? 12 : -8,
            duration: 4.2 + index * 0.6,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          },
        );
      });
    }, rootRef);

    return () => {
      context.revert();
    };
  }, []);

  useEffect(() => {
    if (!shellRef.current) {
      return;
    }

    gsap.killTweensOf(shellRef.current);
    gsap.set(shellRef.current, { boxShadow: `0 0 24px ${style.accent}10` });
    gsap.to(shellRef.current, {
      boxShadow: `0 0 90px ${style.accent}18`,
      duration: 2.8,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      overwrite: true,
    });

    return () => {
      if (shellRef.current) {
        gsap.killTweensOf(shellRef.current);
      }
    };
  }, [style.accent]);

  const handleMinutesUpdate = (value: number) => {
    onChange({
      ...config,
      minutes: clampMinutes(value),
    });
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

      onStart();
    } catch (error) {
      setLaunchError(error instanceof Error ? error.message : 'Unable to prepare the selected audio file.');
      setIsStarting(false);
    }
  };

  return (
    <div ref={rootRef} className="min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8" style={{ background: style.background }}>
      <div className="pointer-events-none absolute inset-0">
        {[0, 1, 2].map((index) => (
          <div
            key={`orb-${index}`}
            ref={(node) => setArrayRef(orbRefs, index, node)}
            className="absolute rounded-full blur-3xl"
            style={{
              background: index === 0 ? `${style.accent}33` : index === 1 ? `${style.secondary}2a` : `${style.tertiary}2a`,
              height: index === 0 ? 320 : 220,
              left: index === 0 ? '8%' : index === 1 ? '68%' : '42%',
              top: index === 0 ? '12%' : index === 1 ? '10%' : '70%',
              width: index === 0 ? 320 : 220,
            }}
          />
        ))}
        {[0, 1, 2].map((index) => (
          <div
            key={`beam-${index}`}
            ref={(node) => setArrayRef(beamRefs, index, node)}
            className="absolute h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${index === 0 ? style.accent : index === 1 ? style.secondary : style.tertiary}, transparent)`,
              left: '10%',
              top: `${24 + index * 22}%`,
              width: '80%',
            }}
          />
        ))}
      </div>

      <div
        ref={shellRef}
        className="relative mx-auto max-w-7xl rounded-[2rem] border border-white/10 p-6 sm:p-8"
        style={{ background: style.shell, backdropFilter: 'blur(24px)' }}
      >
        <div ref={heroRef} className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.6em] text-white/45" style={getFontStyle(DEFAULT_CONFIG.font)}>
              GSAP Native Countdown Lab
            </p>
            <h1
              className="text-5xl leading-none text-white sm:text-6xl lg:text-7xl"
              style={{ ...getFontStyle(config.font), textShadow: `0 0 32px ${style.accent}44`, fontWeight: 800 }}
            >
              Countdown
            </h1>
          </div>

          <div className="rounded-[1.6rem] border border-white/10 p-5" style={{ background: style.surface }}>
            <p className="mb-3 text-xs uppercase tracking-[0.45em] text-white/40" style={getFontStyle(DEFAULT_CONFIG.font)}>
              Active Motion Style
            </p>
            <h2 className="text-3xl text-white" style={{ ...getFontStyle(config.font), fontWeight: 700 }}>
              {style.label}
            </h2>
            <p className="mt-2 text-sm text-white/55" style={getFontStyle('Space Grotesk')}>
              {style.description}
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="space-y-6">
            <div className="grid gap-4">
              <div className="rounded-[1.5rem] border border-white/10 p-5" style={{ background: style.surface }}>
                <p className="mb-4 text-xs uppercase tracking-[0.35em] text-white/42" style={getFontStyle(DEFAULT_CONFIG.font)}>
                  Duration
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {durationPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleMinutesUpdate(preset)}
                      className={`rounded-2xl border px-3 py-3 text-sm transition-all ${config.minutes === preset ? 'text-slate-950' : 'text-white/74'}`}
                      style={{
                        ...getFontStyle(DEFAULT_CONFIG.font),
                        background: config.minutes === preset ? `linear-gradient(135deg, ${style.accent}, ${style.tertiary})` : 'rgba(255,255,255,0.04)',
                        borderColor: config.minutes === preset ? 'transparent' : 'rgba(255,255,255,0.08)',
                        fontWeight: 700,
                      }}
                    >
                      {preset}m
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={customMinutes}
                    onChange={(event) => {
                      setCustomMinutes(event.target.value);
                      const nextValue = Number(event.target.value);
                      if (Number.isFinite(nextValue) && nextValue > 0) {
                        handleMinutesUpdate(nextValue);
                      }
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    placeholder="Custom minutes"
                    style={getFontStyle('Space Grotesk')}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-[1.5rem] border border-white/10 p-5" style={{ background: style.surface }}>
                <p className="mb-4 text-xs uppercase tracking-[0.35em] text-white/42" style={getFontStyle(DEFAULT_CONFIG.font)}>
                  Message Sequence
                </p>
                <textarea
                  rows={7}
                  maxLength={180}
                  value={config.messageSequence}
                  placeholder={DEFAULT_MESSAGE_SEQUENCE}
                  onChange={(event) => onChange({ ...config, messageSequence: event.target.value })}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  style={getFontStyle('Space Grotesk')}
                />
                <p className="mt-3 text-sm text-white/50" style={getFontStyle('Space Grotesk')}>
                  Use short church-facing lines, one per line or comma-separated. Saved in the browser and restored across tabs.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 p-5" style={{ background: style.surface }}>
                <p className="mb-4 text-xs uppercase tracking-[0.35em] text-white/42" style={getFontStyle(DEFAULT_CONFIG.font)}>
                  Text Animation
                </p>
                <div className="flex flex-wrap gap-2">
                  {textAnimationOptions.map((option) => {
                    const isActive = option.id === config.textAnimation;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onChange({ ...config, textAnimation: option.id })}
                        className="rounded-full border px-3 py-2 text-xs transition-all"
                        style={{
                          ...getFontStyle(DEFAULT_CONFIG.font),
                          background: isActive ? `linear-gradient(135deg, ${style.accent}22, ${style.secondary}18)` : 'rgba(255,255,255,0.04)',
                          borderColor: isActive ? `${style.accent}88` : 'rgba(255,255,255,0.08)',
                          color: isActive ? '#ffffff' : 'rgba(255,255,255,0.72)',
                          fontWeight: 700,
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <div
                  className="mt-4 rounded-2xl border border-white/10 px-4 py-4"
                  style={{
                    background: `linear-gradient(135deg, ${style.accent}14, ${style.secondary}12)`,
                  }}
                >
                  <div className="text-sm text-white" style={{ ...getFontStyle(config.font), fontWeight: 700 }}>
                    {selectedTextAnimation.label}
                  </div>
                  <div className="mt-1 text-xs text-white/56" style={getFontStyle('Space Grotesk')}>
                    {selectedTextAnimation.description}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 p-5" style={{ background: style.surface }}>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/42" style={getFontStyle(DEFAULT_CONFIG.font)}>
                    Animation Styles
                  </p>
                  <p className="mt-2 text-sm text-white/55" style={getFontStyle('Space Grotesk')}>
                    Pick the visual language of the countdown stage itself.
                  </p>
                </div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/36" style={getFontStyle(DEFAULT_CONFIG.font)}>
                  100% GSAP
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {animationStyles.map((option, index) => {
                  const isActive = option.id === config.styleId;

                  return (
                    <button
                      key={option.id}
                      ref={(node) => setArrayRef(cardRefs, index, node)}
                      type="button"
                      onClick={() => onChange({ ...config, styleId: option.id })}
                      className="rounded-[1.35rem] border p-5 text-left transition-all"
                      style={{
                        background: option.shell,
                        borderColor: isActive ? `${option.accent}88` : 'rgba(255,255,255,0.08)',
                        boxShadow: isActive ? `0 0 40px ${option.accent}22` : 'none',
                      }}
                    >
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-2xl text-white" style={{ ...getFontStyle(config.font), fontWeight: 700 }}>
                            {option.label}
                          </h3>
                          <p className="mt-1 text-xs uppercase tracking-[0.28em] text-white/38" style={getFontStyle(DEFAULT_CONFIG.font)}>
                            {option.mood}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {[option.accent, option.secondary, option.tertiary].map((color) => (
                            <span key={color} className="h-3 w-7 rounded-full" style={{ background: color }} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-white/58" style={getFontStyle('Space Grotesk')}>
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 p-5" style={{ background: style.surface }}>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/42" style={getFontStyle(DEFAULT_CONFIG.font)}>
                    Typeface Engine
                  </p>
                  <p className="mt-2 text-sm text-white/55" style={getFontStyle('Space Grotesk')}>
                    The chosen font drives both the stage headline and the number glyphs.
                  </p>
                </div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/36" style={getFontStyle(DEFAULT_CONFIG.font)}>
                  hosted
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {fonts.map((font) => {
                  const isActive = font.value === config.font;

                  return (
                    <button
                      key={font.value}
                      type="button"
                      onClick={() => onChange({ ...config, font: font.value })}
                      className="rounded-2xl border px-4 py-3 text-left transition-all"
                      style={{
                        ...getFontStyle(font.value),
                        background: isActive ? `linear-gradient(135deg, ${style.accent}22, ${style.secondary}18)` : 'rgba(255,255,255,0.04)',
                        borderColor: isActive ? `${style.accent}88` : 'rgba(255,255,255,0.08)',
                        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.72)',
                        fontWeight: 700,
                      }}
                    >
                      {font.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[1.5rem] border border-white/10 p-5" style={{ background: style.surface }}>
              <p className="mb-4 text-xs uppercase tracking-[0.35em] text-white/42" style={getFontStyle(DEFAULT_CONFIG.font)}>
                Persisted Background Audio
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  void handleAudioSelection(file);
                }}
              />

              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/72" style={getFontStyle('Space Grotesk')}>
                    {backgroundAudio.fileName ?? 'No audio file selected'}
                  </p>
                  <p className="mt-2 text-xs text-white/42" style={getFontStyle(DEFAULT_CONFIG.font)}>
                    Stored in IndexedDB and restored on reload in the same browser profile.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl px-4 py-2 text-sm text-slate-950 transition-all"
                    style={{ ...getFontStyle(DEFAULT_CONFIG.font), background: `linear-gradient(135deg, ${style.accent}, ${style.tertiary})`, fontWeight: 700 }}
                  >
                    {backgroundAudio.hasAudio ? 'Replace Audio' : 'Choose Audio'}
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
                      className="rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm text-white/74 transition-all"
                      style={getFontStyle(DEFAULT_CONFIG.font)}
                    >
                      Remove Audio
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 p-5" style={{ background: style.surface }}>
              <p className="mb-4 text-xs uppercase tracking-[0.35em] text-white/42" style={getFontStyle(DEFAULT_CONFIG.font)}>
                Shareable Launch URL
              </p>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="break-all text-xs leading-7 text-white/56" style={{ fontFamily: 'monospace' }}>
                  {launchUrl}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    void handleCopyUrl();
                  }}
                  className="rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm text-white/78 transition-all"
                  style={getFontStyle(DEFAULT_CONFIG.font)}
                >
                  Copy URL
                </button>
                {copyStatus !== 'idle' && (
                  <p className={`text-xs ${copyStatus === 'copied' ? 'text-white/68' : 'text-rose-300'}`} style={getFontStyle(DEFAULT_CONFIG.font)}>
                    {copyStatus === 'copied' ? 'URL copied.' : 'Unable to copy URL.'}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 p-5" style={{ background: style.surface }}>
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.35em] text-white/42" style={getFontStyle(DEFAULT_CONFIG.font)}>
                  Launch Stage
                </p>
                <p className="mt-2 text-sm text-white/55" style={getFontStyle('Space Grotesk')}>
                  Duration, type system, motion profile, and audio restore into the live stage on start.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void handleStart();
                }}
                className="w-full rounded-[1.35rem] px-5 py-4 text-left text-slate-950 transition-all"
                style={{
                  ...getFontStyle(config.font),
                  background: `linear-gradient(135deg, ${style.accent}, ${style.secondary})`,
                  fontWeight: 800,
                }}
                disabled={isStarting || isUpdatingAudio || !backgroundAudio.isReady}
              >
                {!backgroundAudio.isReady
                  ? 'Loading audio system...'
                  : isUpdatingAudio
                    ? 'Saving audio...'
                    : isStarting
                      ? 'Preparing stage...'
                      : `Start ${config.minutes} minute sequence`}
              </button>
              {launchError && (
                <p className="mt-4 text-sm text-rose-300" style={getFontStyle('Space Grotesk')}>
                  {launchError}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

type CountdownStageProps = {
  backgroundAudio: PersistedBackgroundAudio;
  config: CountdownConfig;
  onBack: () => void;
};

function CountdownStage({ backgroundAudio, config, onBack }: CountdownStageProps) {
  const style = getAnimationStyle(config.styleId);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageShellRef = useRef<HTMLDivElement | null>(null);
  const backgroundOrbRefs = useRef<HTMLDivElement[]>([]);
  const backgroundBeamRefs = useRef<HTMLDivElement[]>([]);
  const cardGlowRef = useRef<HTMLDivElement | null>(null);
  const cardPatternRef = useRef<HTMLDivElement | null>(null);
  const cardOrbRefs = useRef<HTMLDivElement[]>([]);
  const cardBeamRefs = useRef<HTMLDivElement[]>([]);
  const messageRef = useRef<HTMLDivElement | null>(null);
  const messageWordRefs = useRef<HTMLSpanElement[]>([]);
  const [timeLeft, setTimeLeft] = useState(config.minutes * 60);
  const [isActive, setIsActive] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);

  const totalSeconds = config.minutes * 60;
  const messageItems = getMessageSequenceItems(config.messageSequence);
  const activeMessage = messageItems[messageIndex] ?? '';
  const messageWords = activeMessage.split(/\s+/).filter(Boolean);
  const messageAnimationKey = `${config.textAnimation}-${messageIndex}-${activeMessage}`;
  const isCountdownComplete = timeLeft === 0;

  useHostedFonts([config.font]);

  useEffect(() => {
    const context = gsap.context(() => {
      if (stageShellRef.current) {
        gsap.fromTo(stageShellRef.current, { y: 36, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out' });
        gsap.to(stageShellRef.current, {
          boxShadow: `0 0 120px ${style.accent}20`,
          duration: 2.6,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }

      backgroundOrbRefs.current.forEach((orb, index) => {
        gsap.to(orb, {
          x: index % 2 === 0 ? 38 : -30,
          y: index % 2 === 0 ? -22 : 26,
          scale: 1.08 + index * 0.06,
          duration: 6.2 + index,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      });

      backgroundBeamRefs.current.forEach((beam, index) => {
        gsap.fromTo(
          beam,
          { opacity: 0.08, xPercent: index % 2 === 0 ? -10 : 8 },
          {
            opacity: 0.28,
            xPercent: index % 2 === 0 ? 10 : -6,
            duration: 5 + index * 0.7,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          },
        );
      });

      cardOrbRefs.current.forEach((orb, index) => {
        gsap.to(orb, {
          x: index % 2 === 0 ? 22 : -18,
          y: index % 2 === 0 ? -14 : 18,
          scale: 1.1 + index * 0.04,
          duration: 5.4 + index * 0.6,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      });

      cardBeamRefs.current.forEach((beam, index) => {
        gsap.fromTo(
          beam,
          { opacity: 0.12, xPercent: index % 2 === 0 ? -6 : 6 },
          {
            opacity: 0.34,
            xPercent: index % 2 === 0 ? 6 : -4,
            duration: 4.6 + index * 0.5,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          },
        );
      });

      if (cardGlowRef.current) {
        gsap.to(cardGlowRef.current, {
          rotate: 360,
          duration: 24,
          ease: 'none',
          repeat: -1,
        });
        gsap.to(cardGlowRef.current, {
          scale: 1.08,
          duration: 7.2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }

      if (cardPatternRef.current) {
        gsap.fromTo(
          cardPatternRef.current,
          { backgroundPosition: '0% 0%, 100% 0%, 50% 0%' },
          {
            backgroundPosition: '100% 20%, 0% 100%, 50% 100%',
            duration: 14,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          },
        );
      }
    }, rootRef);

    return () => {
      context.revert();
    };
  }, [style.accent, style.id]);

  useEffect(() => {
    document.title = buildDocumentTitle(config, backgroundAudio.hasAudio, formatClock(timeLeft));
  }, [backgroundAudio.hasAudio, config, timeLeft]);

  useEffect(() => {
    if (!backgroundAudio.isReady) {
      return;
    }

    if (backgroundAudio.hasAudio && isActive && timeLeft > 0) {
      void backgroundAudio.ensurePlaying().catch(() => {
        // Ignore autoplay failures; the countdown can continue without audio.
      });
      return;
    }

    backgroundAudio.pause(timeLeft === 0);
  }, [backgroundAudio, isActive, timeLeft]);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((value) => value - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (messageItems.length <= 1 || !isActive || isCountdownComplete) {
      return;
    }

    const interval = window.setInterval(() => {
      setMessageIndex((value) => (value + 1) % messageItems.length);
    }, 3500);

    return () => {
      window.clearInterval(interval);
    };
  }, [config.messageSequence, isActive, isCountdownComplete, messageItems.length]);

  useEffect(() => {
    setMessageIndex(0);
  }, [config.messageSequence]);

  useEffect(() => {
    if (!messageRef.current || !activeMessage) {
      return;
    }

    animateMessageChange(messageRef.current, config.textAnimation, style.accent);

    if (config.textAnimation === 'word-build' && messageWordRefs.current.length > 0) {
      messageWordRefs.current = messageWordRefs.current.slice(0, messageWords.length);
      gsap.killTweensOf(messageWordRefs.current);
      gsap.fromTo(
        messageWordRefs.current,
        { y: 18, opacity: 0, filter: 'blur(10px)' },
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.55,
          ease: 'power3.out',
          stagger: 0.08,
        },
      );
    }
  }, [activeMessage, config.textAnimation, messageAnimationKey, messageWords.length, style.accent]);

  const handleReset = () => {
    backgroundAudio.pause(true);
    setMessageIndex(0);
    setTimeLeft(totalSeconds);
    setIsActive(true);
  };

  return (
    <div ref={rootRef} className="min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8" style={{ background: style.background }}>
      <div ref={stageShellRef} className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col rounded-[2rem] border border-white/10 p-4 sm:p-6" style={{ background: style.shell, backdropFilter: 'blur(24px)' }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
          {[0, 1].map((index) => (
            <div
              key={`stage-orb-${index}`}
              ref={(node) => setArrayRef(backgroundOrbRefs, index, node)}
              className="absolute rounded-full blur-3xl"
              style={{
                background: index === 0 ? `${style.accent}22` : `${style.secondary}18`,
                height: index === 0 ? 280 : 220,
                left: index === 0 ? '8%' : '72%',
                top: index === 0 ? '14%' : '62%',
                width: index === 0 ? 280 : 220,
              }}
            />
          ))}
          {[0, 1].map((index) => (
            <div
              key={`stage-beam-${index}`}
              ref={(node) => setArrayRef(backgroundBeamRefs, index, node)}
              className="absolute h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${index === 0 ? style.accent : style.tertiary}, transparent)`,
                left: '12%',
                top: `${24 + index * 42}%`,
                width: '76%',
              }}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              backgroundAudio.pause(true);
              onBack();
            }}
            aria-label="Reconfigure"
            title="Reconfigure"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/72 transition-all hover:border-white/20 hover:bg-white/10"
            style={getFontStyle(DEFAULT_CONFIG.font)}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsActive((value) => !value)}
              aria-label={isActive ? 'Pause' : 'Resume'}
              title={isActive ? 'Pause' : 'Resume'}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/78 transition-all hover:border-white/20 hover:bg-white/10"
              style={getFontStyle(DEFAULT_CONFIG.font)}
            >
              {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset"
              title="Reset"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/78 transition-all hover:border-white/20 hover:bg-white/10"
              style={getFontStyle(DEFAULT_CONFIG.font)}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-10 flex flex-1 items-center justify-center">
          <div className="relative w-full max-w-[68rem] overflow-visible">
            <div className="absolute inset-0 rounded-[2rem] bg-white/5 blur-2xl" />
            <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/10 p-4 sm:p-6" style={{ background: style.surface }}>
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
                <div
                  ref={cardPatternRef}
                  className="absolute inset-0 opacity-55"
                  style={{
                    backgroundImage: `radial-gradient(circle at 20% 22%, ${style.accent}30 0%, transparent 32%), radial-gradient(circle at 78% 68%, ${style.secondary}24 0%, transparent 30%), repeating-linear-gradient(135deg, transparent 0 22px, ${style.tertiary}12 22px 24px, transparent 24px 48px)`,
                    backgroundSize: '140% 140%, 140% 140%, 180px 180px',
                    mixBlendMode: 'screen',
                  }}
                />
                <div
                  ref={cardGlowRef}
                  className="absolute inset-[-18%] opacity-45"
                  style={{
                    background: `conic-gradient(from 0deg, transparent 0deg, ${style.accent}18 72deg, transparent 140deg, ${style.secondary}20 220deg, transparent 300deg, ${style.tertiary}18 360deg)`,
                    filter: 'blur(34px)',
                    mixBlendMode: 'screen',
                  }}
                />
                {[0, 1].map((index) => (
                  <div
                    key={`card-orb-${index}`}
                    ref={(node) => setArrayRef(cardOrbRefs, index, node)}
                    className="absolute rounded-full blur-3xl"
                    style={{
                      background: index === 0 ? `${style.accent}42` : `${style.tertiary}34`,
                      height: index === 0 ? 320 : 260,
                      left: index === 0 ? '10%' : '62%',
                      top: index === 0 ? '12%' : '50%',
                      width: index === 0 ? 320 : 260,
                    }}
                  />
                ))}
                {[0, 1, 2].map((index) => (
                  <div
                    key={`card-beam-${index}`}
                    ref={(node) => setArrayRef(cardBeamRefs, index, node)}
                    className="absolute h-[2px]"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${index === 1 ? style.secondary : style.accent}, transparent)`,
                      left: '10%',
                      top: `${28 + index * 18}%`,
                      width: '80%',
                    }}
                  />
                ))}
              </div>
              <div className="relative flex flex-col items-center gap-6">
                {renderCountdownFace(config, style, timeLeft)}
                {activeMessage && (
                  <div className="flex min-h-20 w-full items-center justify-center rounded-[1.4rem] border border-white/10 bg-white/4 px-6 py-4 sm:min-h-24">
                    <div
                      key={messageAnimationKey}
                      ref={messageRef}
                      className="text-center text-2xl text-white sm:text-3xl"
                      style={{
                        ...getFontStyle(config.font),
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textShadow: `0 0 18px ${style.accent}33`,
                      }}
                    >
                      {config.textAnimation === 'word-build'
                        ? messageWords.map((word, index) => (
                            <span
                              key={`${word}-${index}`}
                              ref={(node) => setArrayRef(messageWordRefs, index, node)}
                              className="inline-block whitespace-pre"
                            >
                              {index === 0 ? word : ` ${word}`}
                            </span>
                          ))
                        : activeMessage}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const backgroundAudio = usePersistedBackgroundAudio();
  const initialState = resolveLocationState(window.location.search);
  const [config, setConfig] = useState<CountdownConfig>(initialState.config);
  const [isTimerActive, setIsTimerActive] = useState(initialState.isTimerActive);

  useEffect(() => {
    const handlePopState = () => {
      const nextState = resolveLocationState(window.location.search);
      setConfig(nextState.config);
      setIsTimerActive(nextState.isTimerActive);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    writePersistedConfig(config);
  }, [config]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || event.key !== CONFIG_STORAGE_KEY) {
        return;
      }

      if (isTimerActive || new URLSearchParams(window.location.search).toString()) {
        return;
      }

      try {
        setConfig(event.newValue ? normalizeConfig(JSON.parse(event.newValue) as Partial<CountdownConfig>) : DEFAULT_CONFIG);
      } catch {
        setConfig(DEFAULT_CONFIG);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [isTimerActive]);

  const startCountdown = () => {
    const url = buildUrl(config, backgroundAudio.hasAudio);
    window.history.pushState({}, '', url);
    setIsTimerActive(true);
  };

  const returnToConfigure = () => {
    window.history.pushState({}, '', window.location.pathname);
    setIsTimerActive(false);
  };

  return isTimerActive ? (
    <CountdownStage
      key={`${config.minutes}-${config.font}-${config.styleId}-${config.messageSequence}-${config.textAnimation}`}
      backgroundAudio={backgroundAudio}
      config={config}
      onBack={returnToConfigure}
    />
  ) : (
    <ConfigureScreen backgroundAudio={backgroundAudio} config={config} onChange={setConfig} onStart={startCountdown} />
  );
}

export default App;
