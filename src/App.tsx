import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const AppDashboard = lazy(() => import("./pages/AppDashboard.tsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.tsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.tsx"));
const Index = lazy(() => import("./pages/Index.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const PublicPanel = lazy(() => import("./pages/PublicPanel.tsx"));
const PublicReview = lazy(() => import("./pages/PublicReview.tsx"));
const RecoverPassword = lazy(() => import("./pages/RecoverPassword.tsx"));
const RequestAccess = lazy(() => import("./pages/RequestAccess.tsx"));
const NewPassword = lazy(() => import("./pages/NewPassword.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<main className="min-h-screen bg-background" />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/recuperar-senha" element={<RecoverPassword />} />
            <Route path="/nova-senha" element={<NewPassword />} />
            <Route path="/solicitar-acesso" element={<RequestAccess />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/app" element={<AppDashboard />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/avaliar/:slug" element={<PublicReview />} />
            <Route path="/painel/:slug" element={<PublicPanel />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
