import React from "react";
import { LogoLoader } from "./logo-loader";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showPercentage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  showPercentage = true,
}) => {
  const sizeMap = {
    sm: 80,
    md: 120,
    lg: 160,
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-gray-50">
      <LogoLoader size={sizeMap[size]} showPercentage={showPercentage} />
    </div>
  );
};