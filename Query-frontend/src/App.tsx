import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DatabaseProvider } from "@/contexts/DatabaseContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "./pages/NotFound";

// ✅ Lazy load heavy pages for code splitting
const AuthPage = lazy(() => import("./pages/AuthPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const Index = lazy(() => import("./pages/Index"));
const CustomDashboard = lazy(() => import("./pages/Customdashboard"));

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Protected Routes - Require Authentication */}
    <Route path="/dashboard" element={
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner />}>
          <DashboardPage />
        </Suspense>
      </ProtectedRoute>
    } />

    {/* ✅ NEW: Custom Dashboard Route */}
    <Route path="/custom-dashboard" element={
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner />}>
          <CustomDashboard />
        </Suspense>
      </ProtectedRoute>
    } />

    {/* Public Routes - Redirect if authenticated */}
    <Route path="/auth" element={
      <PublicRoute>
        <Suspense fallback={<LoadingSpinner />}>
          <AuthPage />
        </Suspense>
      </PublicRoute>
    } />

    {/* Root - Landing Page */}
    <Route path="/" element={
      <Suspense fallback={<LoadingSpinner />}>
        <Index />
      </Suspense>
    } />

    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {/* ✅ ADD: DatabaseProvider wraps the entire app */}
          <DatabaseProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </TooltipProvider>
          </DatabaseProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;