
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ShopDashboard from "./pages/ShopDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ShopSetup from "./pages/ShopSetup";
import NewOrder from "./pages/NewOrder";
import OrderDetail from "./pages/OrderDetail";
import { AuthGuard } from "./components/AuthGuard";
import { DashboardRedirect } from "./components/DashboardRedirect";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard-redirect" element={<DashboardRedirect />} />
              <Route 
                path="/dashboard" 
                element={
                  <AuthGuard requiredRole="user">
                    <Dashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/shop-dashboard" 
                element={
                  <AuthGuard requiredRole="shopkeeper">
                    <ShopDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin-dashboard" 
                element={
                  <AuthGuard requiredRole="admin">
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/shop-setup" 
                element={
                  <AuthGuard requiredRole="shopkeeper">
                    <ShopSetup />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/new-order" 
                element={
                  <AuthGuard requiredRole="user">
                    <NewOrder />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/order/:id" 
                element={
                  <AuthGuard>
                    <OrderDetail />
                  </AuthGuard>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
