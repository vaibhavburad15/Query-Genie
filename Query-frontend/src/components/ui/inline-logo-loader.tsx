import React from 'react';
import logo from '@/assets/query-genie-logo.png';

interface InlineLogoLoaderProps {
  size?: number;
  text?: string;
}

export const InlineLogoLoader: React.FC<InlineLogoLoaderProps> = ({ 
  size = 40,
  text = 'Loading...'
}) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0; // Loop animation
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div 
        className="relative flex-shrink-0"
        style={{ width: size, height: size }}
      >
        {/* Background logo */}
        <div className="absolute inset-0 opacity-15">
          <img 
            src={logo} 
            alt="Loading" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Animated filling logo */}
        <div 
          className="absolute inset-0 overflow-hidden transition-all duration-100 ease-linear"
          style={{ 
            clipPath: `inset(${100 - progress}% 0 0 0)`,
          }}
        >
          <img 
            src={logo} 
            alt="Loading" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {text && (
        <span className="text-sm text-gray-600 font-medium animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
};
