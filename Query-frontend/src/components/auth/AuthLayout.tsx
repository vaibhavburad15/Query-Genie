import { ReactNode } from 'react';
import Logo from '@/components/Logo';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-background to-brand-100/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Header for Mobile */}
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-4" />
          <h1 className="text-display text-foreground mb-2">{title}</h1>
          {subtitle && (
            <p className="text-body text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Auth Form Card */}
        <div className="glass-elevated rounded-2xl p-8 shadow-brand-lg">
          {children}
        </div>
      </div>
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-caption flex justify-center">
          Powered by Query Genie Team and Built for Professionals
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
