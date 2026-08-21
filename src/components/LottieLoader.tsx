import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LottieLoaderProps {
  message?: string;
  size?: number;
}

export const LottieLoader: React.FC<LottieLoaderProps> = ({ 
  message = "Loading database pipeline...", 
  size = 300 
}) => {
  // Configurable loader URL from env variable, or default beautiful Lottie animation
  const lottieUrl = import.meta.env.VITE_LOTTIE_LOADER_URL || "https://lottie.host/732f699d-b1e8-41d5-945e-fa6c53ffe915/qDdPWTzLL9.json";

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in zoom-in-95 duration-300">
      <div style={{ width: `${size}px`, height: `${size}px` }} className="flex items-center justify-center">
        <DotLottieReact
          src={lottieUrl}
          loop
          autoplay
        />
      </div>
      {message && (
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 animate-pulse mt-4 max-w-xs block">
          {message}
        </span>
      )}
    </div>
  );
};

export default LottieLoader;
