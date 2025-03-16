
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/LoginForm";
import { Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data }) => {
      console.log("Login: Auth session check:", data.session ? "Session found" : "No session");
      setSession(data.session);
    });

    // Set up auth listener to catch auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Login: Auth state change:", event, session ? "Session exists" : "No session");
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Redirect if already logged in directly to appropriate dashboard
  if (session) {
    console.log("Login: User already logged in");
    // Check user metadata for role to redirect directly
    const userRole = session.user.user_metadata?.role;
    
    if (userRole === 'admin') {
      return <Navigate to="/admin-dashboard" />;
    } else if (userRole === 'shopkeeper') {
      return <Navigate to="/shop-dashboard" />;
    } else if (userRole === 'user') {
      return <Navigate to="/dashboard" />;
    }
    
    // Fallback to redirect component if role not determined
    return <Navigate to="/dashboard-redirect" />;
  }

  // If not logged in, display the login form
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to sign in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Button variant="link" className="p-0" asChild>
                  <Link to="/signup">Sign up</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
