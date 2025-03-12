
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/LoginForm";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Login page: Checking for existing session");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Login page: Error getting session:", error);
          toast({
            variant: "destructive",
            title: "Session Error",
            description: "There was an error checking your login status",
          });
          setSession(null);
        } else {
          console.log("Login page: Session status:", data.session ? "Logged in" : "Not logged in");
          setSession(data.session);
        }
      } catch (error) {
        console.error("Login page: Error checking auth:", error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    
    // Set up auth listener to catch auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Login page: Auth state changed:", event, session ? "Has session" : "No session");
      setSession(session);
      
      if (event === 'SIGNED_IN') {
        console.log("Login page: User signed in, redirecting to dashboard-redirect");
        navigate('/dashboard-redirect');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, toast]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Checking authentication...</p>
      </div>
    );
  }

  // Redirect if already logged in
  if (session) {
    console.log("Login page: Already logged in, redirecting to dashboard-redirect");
    return <Navigate to="/dashboard-redirect" />;
  }

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
