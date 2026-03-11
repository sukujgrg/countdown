import { useEffect, useState } from 'react';

interface FlipDigitProps {
  digit: string;
  fontFamily?: string;
}

export function FlipDigit({ digit, fontFamily = 'Rajdhani' }: FlipDigitProps) {
  const [prevDigit, setPrevDigit] = useState(digit);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (digit !== prevDigit) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setPrevDigit(digit);
        setIsAnimating(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [digit, prevDigit]);

  return (
    <div className="relative w-24 h-32 md:w-32 md:h-44 perspective-1000">
      <div className="relative w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-slate-700/50 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="flex flex-col transition-transform duration-400 ease-in-out"
            style={{
              transform: isAnimating ? 'translateY(-50%)' : 'translateY(0)',
            }}
          >
            {/* Previous digit (visible) */}
            <div className="h-32 md:h-44 w-24 md:w-32 flex items-center justify-center">
              <span className="text-8xl md:text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-cyan-400 to-blue-500 tabular-nums leading-none drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]" style={{ fontFamily: `"${fontFamily}", sans-serif` }}>
                {prevDigit}
              </span>
            </div>
            {/* New digit (coming from below) */}
            <div className="h-32 md:h-44 w-24 md:w-32 flex items-center justify-center">
              <span className="text-8xl md:text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-cyan-400 to-blue-500 tabular-nums leading-none drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]" style={{ fontFamily: `"${fontFamily}", sans-serif` }}>
                {digit}
              </span>
            </div>
          </div>
        </div>
        
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>
        
        {/* Inner glow */}
        <div className="absolute inset-0 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] rounded-2xl pointer-events-none"></div>
      </div>
    </div>
  );
}
