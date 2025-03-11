
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/LoginForm";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session) {
          // Fetch user profile to get role
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          setProfile(data);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Redirect if already logged in
  if (!loading && session) {
    if (profile?.role === 'shopkeeper') {
      return <Navigate to="/shop-dashboard" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
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
