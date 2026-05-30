import React from 'react';
import logo from '@/assets/query-genie-logo.png';

interface LogoLoaderProps {
  size?: number;
  showPercentage?: boolean;
}

export const LogoLoader: React.FC<LogoLoaderProps> = ({ 
  size = 120, 
  showPercentage = true 
}) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 20);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div 
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Background logo (grayscale/faded) */}
        <div className="absolute inset-0 opacity-20">
          <img 
            src={logo} 
            alt="Query Genie" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Animated filling logo */}
        <div 
          className="absolute inset-0 overflow-hidden transition-all duration-300 ease-out"
          style={{ 
            clipPath: `inset(${100 - progress}% 0 0 0)`,
          }}
        >
          <img 
            src={logo} 
            alt="Query Genie" 
            className="w-full h-full object-contain animate-pulse"
          />
        </div>

        {/* Glow effect */}
        <div 
          className="absolute inset-0 blur-xl opacity-30 transition-opacity duration-300"
          style={{ 
            background: `radial-gradient(circle, rgba(147, 51, 234, ${progress / 100}), transparent)`,
          }}
        />
      </div>

      {showPercentage && (
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-700 mb-2">
            {progress}%
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Loading...
          </div>
        </div>
      )}
    </div>
  );
};
